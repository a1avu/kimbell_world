---
slug: "tier-0"
title: "Tier-0"
date: 2026-04-27
category: "HTB"
tags: []
excerpt: "~~~bash nmap -sV -p 21 10.129.145.116 ~~~ -sV : 서비스 버전 보는 방법"
readingTime: 2
---

# FTP 버전 보는 방법

~~~bash
nmap -sV -p 21 10.129.145.116
~~~
-sV : 서비스 버전 보는 방법 

FTP로 할 수 있는 건:
- `ls` → 파일 목록
- `get` → 다운로드
- `put` → 업로드
- `cd` → 디렉토리 이동
- `mkdir`, `rm` → 권한 있으면 폴더 생성/삭제
요정도 밖에 없음
---
## SMB
Server Message Block
- 네트워크 파일 공유 프로토콜 , 주로 윈도우에서 파일 리소스 공유하는데 사용됨
 -p: 445
 ~~~bash
 smbclient -L 10.129.145.127 -N
 ~~~
 -L : 어떤 공유 폴더들이 있는지 목록만 보는 옵션
 -N : 패스워드 없이 접속
~~~bash
smbclient //10.129.145.127/<ShareName> -N
~~~
이런 식으로 접속할 수 있고 하나씩 접속해봐야 비밀번호 없이 들어갈 수 있는 앤지 아닌지 알 수 있음

---
## NMAP

~~~bash
sudo nmap -sSCV <IP> -p- --min-rate=1000
~~~
- `-sS` → SYN 스캔 (빠름, stealth)
- `-sC` → 기본 스크립트
- `-sV` → 버전 수집
- `-p-` → 전체 포트
- `--min-rate=1000` → 최소 1000패킷/초
- `-oA` → 결과 파일로 저장 (3가지 형식)

NMAP은 TCP SYN 보내서 돌아 오는 응답에 따라 다음과 같이 port의 open 여부를 판단
**open :** SYS/ACK을 응답으로 받은 경우
**closed :** RST를 응답으로 받은 경우
**filtered :** 응답을 받지 못한경우

----
## Redis
데이터를 메모리(RAM)에 저장하여 매우 빠른 속도를 자랑하는 오픈소스 **인메모리(In-Memory) NoSQL 데이터베이스**

~~~bash
redis-cli -h <ip> -p <port> info //정보 보여주는 명령
redis-cli -h <ip> -p <port>  
> keys * //현재 있는 키 목록 확인 가능 
> get <key> //해당 키의 대응되는 값 확인
~~~
