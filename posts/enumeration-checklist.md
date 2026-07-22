---
slug: "enumeration-checklist"
title: "enumeration_checklist"
date: 2026-07-15
category: "치트시트"
section: "OSCP"
tags: []
excerpt: "**Step 2 - 전체 포트** nmap -p- --min-rate 5000 {IP} -oN allports.txt"
readingTime: 5
---

### 1. 포트 스캔
#### - 기본 순서
~~~ bash
**Step 1 - 빠른 스캔**
nmap -sV -sC -T4 {IP} -oN initial.txt

**Step 2 - 전체 포트**
nmap -p- --min-rate 5000 {IP} -oN allports.txt

**Step 3 - 새로 나온 포트 깊게**
nmap -p {새포트} -sV -sC {IP}
~~~
##### - 특수 상황
위에서 찾은 열린 포트가 특별한 녀석이 없어 보일 때 확인
**참고**: [[pandora]]  ,   [[enumeration_checklist#4. snmp]]
~~~ bash
**UDP**
nmap -sU --top-ports 20 {IP}

**SMB 취약점**
nmap -p 445 --script smb-vuln* {IP}
 
**웹 열거**  ->  근데 gobuster/ffuf 쓰는게 더 빠름
nmap --script http-enum {IP}

**포트 filtered일 때**
nmap -sS {IP}
~~~
##### - 옵션 정리
-sV       서비스 버전 확인
-sC       기본 스크립트 실행
-T4       속도 (1~5)
-p-       전체 포트
--min-rate 5000   초당 최소 패킷수
-oN       결과 파일 저장

---
### 2. 워드리스트 경로
`dir` 결과에서 디렉토리 나오면 거기서 한 번 더 돌리기
~~~bash
# gobuster에서 쓸 때
gobuster dir -u http://target.com -w <wordlist path>

# ffuf에서 쓸 때
ffuf -u http://target.com/FUZZ -w <wordlist path>
~~~
**헤더 추가**
`-H "헤더이름: 값"`

**디렉터리 브루트포싱**
/usr/share/seclists/Discovery/Web-Content/common.txt
/usr/share/seclists/Discovery/Web-Content/combined_directories.txt
/usr/share/seclists/Discovery/Web-Content/combined_words.txt

**서브도메인/vhost**
/usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt

[[_BoardLight]] : --append-domain 붙여야함

**파라미터 퍼징**
/usr/share/seclists/Discovery/Web-Content/burp-parameter-names.txt

**패스워드**
/usr/share/seclists/Passwords/Common-Credentials/10k-most-common.txt


헤더 같은거 넣고 싶을 때
~~~
gobuster dir -u http://target.com -w wordlist.txt \
-c "session=abc123" \
-H "Authorization: Bearer token"
~~~



---
## 3. SMB (445)

-> [[smb_checklist]] ㄱㄱ

---
## 4. snmp

네트워크 장비의 성능과 핵심 기능의 현 상태/ 기능 정보 수집, 관리, 저장할 수 있는 프로토콜
```shell
snmpwalk -c public -v2c {domain or ip}
```
 
이쁘게 출력하는 방법
```shell
#중요 정보만 뽑기
snmpwalk -v2c -c public <IP> | grep -iE "pass|user|login|cred|key|secret|token|admin|root|cmd|exec|run|install|home|tmp|-u|-p"

# 시스템 정보
snmpwalk -v2c -c public <IP> 1.3.6.1.2.1.1

# 실행 중인 프로세스
snmpwalk -v2c -c public <IP> 1.3.6.1.2.1.25.4.2

# 설치된 소프트웨어
snmpwalk -v2c -c public <IP> 1.3.6.1.2.1.25.6.3

# 네트워크 인터페이스
snmpwalk -v2c -c public <IP> 1.3.6.1.2.1.2.2

# 열린 포트
snmpwalk -v2c -c public <IP> 1.3.6.1.2.1.6.13
```

---
## 5. FTP
```sh
ftp <ip>
#id, passwd 입력

#anonymous 있다면
ftp <ip>
id: anonymous
pw: anonymous

# FTP 바이너리 모드 필수
ftp> binary
ftp> get <파일>

```
-> 안에 있는 단서들로 탐정놀이 ㄱㄱ
### 참고
- [[servMon]] : ftp 단서들로 탐정놀이
- [[Access]] : ftp로 들어있는 내용 열어보기
---