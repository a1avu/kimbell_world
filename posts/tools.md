---
slug: "tools"
title: "tools"
date: 2026-07-15
category: "치트시트"
tags: []
excerpt: "searchsploit -m <익스플로잇 경로> ```"
readingTime: 2
---

## searchsploit
익스플로잇 검색하고 싶을 때
```sh
searchsploit <프로그램>

searchsploit -m <익스플로잇 경로>
```

---
## hydra

~~~sh
#ssh일때
hydra -l <user> -P <텍스트파일> <IP> ssh

#ftp 일 때
hydra -L <user> -p <pw> <IP> ssh
~~~

-l(user), -p(passwd) 각각 모르는경우 그니까 텍스트 파일 가져다가 써야하는 경우엔 대문자로 써야함 (전체 경로)
-L, -P 이되면 각각 무슨 값이 들어가는지 안다는 뜻임

**텍스트 파일로 쓰기 좋은 파일들 위치**
- `user`: /usr/share/seclists/Usernames/top-usernames-shortlist.txt
- `pw`:  /usr/share/wordlists/rockyou.txt

---
## ssh 터널링

```sh
#로컬로 접속을 위한 로컬 ssh 터널링
ssh -L <로컬포트>:<원격지 내부 IP>:<원격지 내부 포트> <유저명>@<타겟 IP>
```

---
## 파일 읽기 도구

```bash
mdbtools   # .mdb Access DB
readpst    # .pst Outlook 이메일
```

---
## KeePass 크랙 파이프라인
```sh
  keepass2john file.kdbx > hash.txt
  
  # 주의: 앞에 "파일명:" 있으면 반드시 지우고 실행
  hashcat -m 13400 hash.txt /usr/share/wordlists/rockyou.txt
  
  # 이미 한번 성공했면 이걸로 확인
  hashcat -m 13400 hash.txt /usr/share/wordlists/rockyou.txt --show
```

---
# putty와 openssh는 암호키 양식이 다르다

맞춰줘야함 

```
puttygen secret.ppk -O private-openssh -o id_rsa
```

**참고**
- [[keeper]] : .ppk 형식인 파일들이 있음 그런걸 openssh 형식으로 바꿔주는거임