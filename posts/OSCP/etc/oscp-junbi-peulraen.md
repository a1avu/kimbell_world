---
slug: "oscp-junbi-peulraen"
title: "OSCP 준비 플랜"
date: 2026-07-21
category: "etc"
section: "OSCP"
tags: []
excerpt: "> **환경:** Windows PC + VMware Workstation Player + Kali Linux x86_64 > **규칙:** 주 6일 공부 / 일요일 고정 휴식…"
readingTime: 34
---

# (6/18 ~ 9/30)_일별 상세

> **환경:** Windows PC + VMware Workstation Player + Kali Linux x86_64  
> **규칙:** 주 6일 공부 / 일요일 고정 휴식 / 하루 최소 5~6시간  
> **방향:** HTB/PG 선행 → PEN-200 결제(7/16) → AD 집중 → 모의시험 2회 → 시험 응시  
> **참고:** [0xdf OSCP Cheatsheet](https://0xdf.gitlab.io/cheatsheets/offsec)

---

## 환경 세팅 체크리스트 (시작 전)

- [x] VMware Workstation Player 설치
- [x] Kali Linux x86_64 이미지 다운로드 및 VM 생성
- [x] VM 이미지 저장 경로 지정 (여유 드라이브에 저장 권장)
- [x] VPN(HTB/OffSec) 연결 확인
- [x] Obsidian 설치 및 폴더 구조 세팅
- [x] 폴더 구조: `/OSCP/boxes/`, `/OSCP/cheatsheets/`, `/OSCP/reports/ 이런 식으로 관리하고 cheatsheets에 박스 링크를 저장해놓고 바로 볼 수 있게 정리 ㄱㄱ [[옵시디언 정리법]]

---

## 완성해야 할 문서 목록

|문서|목표 완성 시점|
|---|---|
|`enumeration_checklist.md`|1주차|
|`web_checklist.md`|2주차|
|`smb_checklist.md`|2주차|
|`box_writeup_template.md`|1주차|
|`linux_privesc.md`|3주차 초안 → 8주차 완성|
|`windows_privesc.md`|4주차 초안 → 8주차 완성|
|`file_transfer.md`|8주차|
|`reverse_shell.md`|8주차|
|`active_directory.md`|9주차 초안 → 10주차 완성|
|`report_template.md`|9주차 시작 → 12주차 완성|

---

## 박스 풀이 템플릿 (매 박스마다 기록)

```
# Box: [이름] | [Linux/Windows/AD] | [Easy/Medium/Hard]
날짜:
소요시간:

## Open Ports

## Interesting Services

## Initial Foothold
벡터:
명령어:

## Privilege Escalation
벡터:
명령어:

## Rabbit Hole (막혔던 것)

## 다음 박스에서 써먹을 것

## 스크린샷 체크
- [ ] whoami
- [ ] ipconfig/ifconfig
- [ ] proof/local 파일
```

---

## Phase 1 — HTB/PG 선행 실습 (6/18 ~ 7/15)

> PEN-200 결제 전. HTB Linux Easy → Linux PrivEsc → Windows PrivEsc 순서.

---

### 1주차 (6/18 ~ 6/24) — 환경 세팅 + HTB Easy 입문

#### 6/18 (목)

- [x] VMware + Kali x86_64 세팅
- [x] HTB VPN 연결 확인
- [x] Obsidian 폴더 구조 세팅 ->
- [x] `box_writeup_template.md` 작성
- [x] 기본 도구 설치 확인: nmap, gobuster, ffuf, smbclient, enum4linux-ng, netcat, python3

#### 6/19 (금)

- [x] Nmap 스캔 옵션 정리 (`-sC -sV -p-` 등)
- [x] gobuster/ffuf 워드리스트 위치 확인 (`/usr/share/wordlists/`)
- [x] smbclient / enum4linux-ng 명령어 정리
- [x] `enumeration_checklist.md` 초안 작성

#### 6/20 (토)

- [x] **HTB: Networked** (Linux Easy) 풀이
- [ ] 풀이 후 0xdf writeup 비교
- [x] 박스 템플릿 작성

#### 6/21 (일) — 🔴 휴식

#### 6/22 (월)

- [x] **HTB: Markup** (Windows Very Easy) 풀이
- [x] 박스 템플릿 작성

#### 6/23 (화)

- [x] **HTB: Magic** (Linux Medium) 풀이
- [x] 박스 템플릿 작성
- [ ] IppSec 영상으로 풀이 비교

#### 6/24 (수)

- [ ] 이번 주 박스 3개 복기
- [ ] `enumeration_checklist.md` 보완
- [ ] `web_checklist.md` 초안 작성
- [ ] `smb_checklist.md` 초안 작성

**1주차 산출물**

- `enumeration_checklist.md`
- `web_checklist.md` (초안)
- `smb_checklist.md` (초안)
- `box_writeup_template.md`

---

### 2주차 (6/25 ~ 7/1) — HTB Linux Easy 추가 + 열거 루틴 완성

#### 6/25 (목)

- [x] **HTB: Busqueda** (Linux Easy) 풀이
- [x] 박스 템플릿 작성

#### 6/26 (금)

- [x] **HTB: Sau** (Linux Easy) 풀이
- [x] 박스 템플릿 작성

#### 6/27 (토)

- [x] **HTB: CozyHosting** (Linux Easy) 풀이
- [x] 박스 템플릿 작성

#### 6/28 (일) — 🔴 휴식

#### 6/29 (월)

- [x] **HTB: Soccer** (Linux Easy) 풀이
- [x] 박스 템플릿 작성

#### 6/30 (화)

- [x] **HTB: BoardLight** (Linux Easy) 풀이
- [x] 박스 템플릿 작성

#### 7/1 (수)

- [ ] 이번 주 박스 5개 복기
- [ ] Initial Foothold 방식 분류 정리 (파일업로드 / RCE / SQLi / LFI 등)
- [ ] `web_checklist.md` 완성
- [ ] `smb_checklist.md` 완성

**누적: 8개**

---

### 3주차 (7/2 ~ 7/8) — Linux PrivEsc 집중

#### 7/2 (목)

- [x] Linux PrivEsc 이론: `sudo -l`, SUID, Cron job 정리
- [x] **HTB: Help** (Linux Easy) 풀이 — PrivEsc 벡터 기록

#### 7/3 (금)

- [ ] Linux PrivEsc 이론: PATH hijacking, Capabilities, Writable directory 정리
	-> 아직 capabilities 쓰는 문제가 안나와서 안함
- [x] **HTB: Pandora** (Linux Easy) 풀이 — PrivEsc 벡터 기록

#### 7/4 (토)

- [x] linpeas 결과 해석 연습 (이전 박스에서 돌려보기)
- [x] **HTB: Usage** (Linux Easy) 풀이

#### 7/5 (일) — 🔴 휴식

#### 7/6 (월)

- [x] bash_history / config credential / env variable 정리
- [x] **HTB: Editorial** (Linux Easy) 풀이

#### 7/7 (화)

- [x] **HTB: UpDown** (Linux Medium) 풀이 — 처음 Medium 도전
- [x] 막히면 최대 3시간 버티고 힌트 확인

#### 7/8 (수)

- [ ] 이번 주 박스 복기
- [ ] `linux_privesc.md` Cheat Sheet 초안 완성
- [ ] 각 박스 PrivEsc 벡터 분류표 작성

**누적: 14개**

---

### 4주차 (7/9 ~ 7/15) — Windows PrivEsc + 결제 판단

#### 7/9 (목)

- [ ] Windows PrivEsc 이론: Service misconfiguration, Unquoted service path 정리
- [x] **HTB: Servmon** (Windows Easy) 풀이

#### 7/10 (금)

- [ ] Windows PrivEsc 이론: AlwaysInstallElevated, Saved credentials, Scheduled task 정리
- [x] **HTB: Access** (Windows Easy) 풀이

#### 7/11 (토)

- [ ] SeImpersonatePrivilege / Potato 계열 정리
- [ ] winPEAS 결과 해석 연습
- [x] **HTB: Jeeves** (Windows Medium) 풀이

#### 7/12 (일) — 🔴 휴식

#### 7/13 (월)

- [x] **HTB: Keeper** (Linux Easy) 풀이
- [ ] `windows_privesc.md` Cheat Sheet 초안 작성

#### 7/14 (화)

- [x] **HTB: Builder** (Linux Medium) 풀이
- [x] PG Practice 맛보기 1개

#### 7/15 (수) — 🔵 결제 판단일

- [ ] 이번 주 박스 복기
- [ ] **결제 판단 체크리스트**
    - [ ] HTB/PG 18~22개 이상 풀이
    - [ ] HTB Easy: 힌트 없이 초기 침투 가능
    - [ ] HTB Medium: 힌트 없이 2~3시간 혼자 진행 가능
    - [ ] Nmap → 열거 → 쉘 → PrivEsc 흐름이 자연스러움
    - [ ] 하루 5시간 이상 루틴 3주 유지
- [ ] 기준 통과 시 → 7/16 PEN-200 결제 진행

> ⚠️ 기준 미달이면 1~2주 HTB/PG 더 하고 결제. 개수보다 "Medium 초기 침투 자력 가능한가"가 핵심.

**누적: 20~22개**

---

## Phase 2 — PEN-200 공식 과정 (7/16 ~ 8/26)

> 7/16 PEN-200 결제 (90일 번들 → 10/14까지).  
> 아는 부분은 빠르게 넘기고, 모르는 부분만 노트화.

---

### 5주차 (7/16 ~ 7/22) — PEN-200 시작 + 정보수집

#### 7/16 (목)

- [ ] PEN-200 결제 및 환경 세팅
- [ ] 공식 PDF 다운로드, 폴더 구조 정리
- [ ] 정보수집 파트 시작 (passive recon)

#### 7/17 (금)

- [ ] 정보수집 파트 계속 (active recon, nmap deep dive)
- [ ] PEN-200 Lab 머신 1개

#### 7/18 (토)

- [ ] 취약점 스캐닝 파트
- [ ] PEN-200 Lab 머신 1개
- [x] **HTB: Broker** (Linux Easy) 풀이

#### 7/19 (일) — 🔴 휴식

#### 7/20 (월)

- [ ] 웹 기초 파트 시작
- [ ] PEN-200 Lab 머신 1개

#### 7/21 (화)

- [ ] 웹 기초 파트 계속
- [x] **HTB: Dog** (Linux Easy) 풀이

#### 7/22 (수)

- [ ] PEN-200 Lab 머신 1개
- [ ] 이번 주 학습 내용 노트 정리
- [ ] 기존 Cheat Sheet에 새 내용 추가

**누적: 25개 전후**

---

### 6주차 (7/23 ~ 7/29) — 웹 공격 집중

#### 7/23 (목)

- [ ] PEN-200 웹 공격 파트: Directory brute forcing, File upload bypass
- [x] **HTB: LinkVortex** (Linux Easy) 풀이

#### 7/24 (금)

- [ ] PEN-200 웹 공격 파트: Command injection, LFI/RFI
- [ ] PEN-200 Lab 웹 관련 머신 1개

#### 7/25 (토)

- [ ] PEN-200 웹 공격 파트: SQL injection, Web shell
- [ ] **HTB: Intentions** (Linux Hard) 풀이

#### 7/26 (일) — 🔴 휴식

#### 7/27 (월)

- [ ] Burp Suite 기본 사용법 정리
- [ ] Reverse shell 안정화 연습 (bash, python, php 등)
- [ ] PEN-200 Lab 1개

#### 7/28 (화)

- [ ] **HTB: Titanic** (Linux Easy) 풀이
- [ ] `web_checklist.md` 전면 보완

#### 7/29 (수)

- [ ] 이번 주 복기
    
- [ ] 웹 공격 흐름 정리
    
    > 페이지 확인 → 소스 확인 → robots.txt → 디렉터리 브루트포싱 → 기술스택 → 로그인/업로드/파라미터 → 취약점 → 쉘
    

**누적: 30개 전후**

---

### 7주차 (7/30 ~ 8/5) — Exploit 수정 + 패스워드 공격

#### 7/30 (목)

- [ ] searchsploit 활용법 정리
- [ ] GitHub exploit 분석 및 Python 수정 연습
- [ ] **HTB: Monitored** (Linux Medium) 풀이

#### 7/31 (금)

- [ ] Hydra 브루트포싱 정리
- [ ] PEN-200 패스워드 공격 파트
- [ ] PEN-200 Lab 1개

#### 8/1 (토)

- [ ] hashcat / john 크래킹 정리
- [ ] Password reuse / Credential hunting 정리
- [ ] **HTB: Expressway** (Linux Easy) 풀이

#### 8/2 (일) — 🔴 휴식

#### 8/3 (월)

- [ ] Exploit 수정 사례 2~3개 본인 노트로 정리
- [ ] PEN-200 Lab 1개

#### 8/4 (화)

- [ ] **HTB: Outbound** (Linux Easy — Assumed Breach) 풀이
- [ ] Assumed Breach 개념 정리

#### 8/5 (수)

- [ ] 이번 주 복기
- [ ] Exploit 수정 Cheat Sheet 추가

**누적: 36개 전후**

---

### 8주차 (8/6 ~ 8/12) — Linux/Windows PrivEsc 공식 정리 + 문서 완성

> ⚠️ 이번 주부터 모든 박스에서 스크린샷 필수 습관화

#### 8/6 (목)

- [ ] PEN-200 Linux PrivEsc 파트 진행
- [ ] `linux_privesc.md` 보완
- [ ] **HTB: Browsed** (Linux Medium) 풀이

#### 8/7 (금)

- [ ] PEN-200 Linux PrivEsc 파트 완료
- [ ] PEN-200 Lab 1개

#### 8/8 (토)

- [ ] PEN-200 Windows PrivEsc 파트 진행
- [ ] `windows_privesc.md` 보완
- [ ] **HTB: Heist** (Windows Easy) 풀이

#### 8/9 (일) — 🔴 휴식

#### 8/10 (월)

- [ ] PEN-200 Windows PrivEsc 파트 완료
- [ ] `file_transfer.md` 작성 (wget, curl, certutil, impacket-smbserver 등)
- [ ] `reverse_shell.md` 작성 (bash, python, php, powershell 등)

#### 8/11 (화)

- [ ] PEN-200 Lab 2개
- [ ] **HTB: StreamIO** (Windows Medium) 풀이

#### 8/12 (수)

- [ ] 이번 주 복기
- [ ] 4개 핵심 문서 최종화
    - [ ] `linux_privesc.md` ✅
    - [ ] `windows_privesc.md` ✅
    - [ ] `file_transfer.md` ✅
    - [ ] `reverse_shell.md` ✅

**스크린샷 필수 항목 (지금부터 습관화)**

- [ ] whoami
- [ ] ipconfig / ifconfig
- [ ] proof / local 파일
- [ ] exploit 성공 화면
- [ ] PrivEsc 근거 명령어 출력

**누적: 42개 전후**

---

### 9주차 (8/13 ~ 8/19) — AD 1차 집중 + 리포트 연습 시작

> ⚠️ 리포트 영어 작성 이번 주부터 시작. 박스 1개씩 영어로 써볼 것.

#### 8/13 (목)

- [ ] AD 기본 구조 이론: Domain / Forest / Trust / OU
- [ ] Domain user vs Local user 차이 정리
- [ ] SMB / LDAP / Kerberos 기초 정리

#### 8/14 (금)

- [ ] BloodHound + SharpHound 설치 및 사용법
- [ ] **HTB: Support** (Windows AD Easy) 풀이
- [ ] 박스 영어 리포트 작성 (첫 번째)

#### 8/15 (토)

- [ ] AS-REP Roasting 실습
- [ ] Kerberoasting 실습
- [ ] **HTB: Forest** (Windows AD Medium) 풀이

#### 8/16 (일) — 🔴 휴식

#### 8/17 (월)

- [ ] Password spraying 정리
- [ ] Pass-the-Hash 정리
- [ ] Lateral movement 기초 (psexec, wmiexec, smbexec)
- [ ] PEN-200 AD 파트 진행

#### 8/18 (화)

- [ ] **HTB: Sauna** (Windows AD Easy) 풀이
- [ ] PEN-200 AD 랩 1세트 시작
- [ ] 박스 영어 리포트 작성 (두 번째)

#### 8/19 (수)

- [ ] `active_directory.md` Cheat Sheet 초안 완성
- [ ] PEN-200 AD 랩 1세트 완료 목표
- [ ] AD 흐름 정리: 초기 침투 → 도메인 계정 획득 → BloodHound → 권한상승 경로 파악

**누적: 46개 전후**

---

### 10주차 (8/20 ~ 8/26) — 터널링/피벗 + AD 2차

#### 8/20 (목)

- [ ] SSH port forwarding (Local / Remote / Dynamic) 정리
- [ ] proxychains 설정 정리
- [ ] **HTB: Monteverde** (Windows AD Medium) 풀이

#### 8/21 (금)

- [ ] Chisel 사용법 실습
- [ ] Ligolo-ng 사용법 실습
- [ ] PEN-200 터널링 파트

#### 8/22 (토)

- [ ] 내부망 스캔 흐름 정리
- [ ] **HTB: Active** (Windows AD Medium) 풀이
- [ ] 박스 영어 리포트 작성

#### 8/23 (일) — 🔴 휴식

#### 8/24 (월)

- [ ] PEN-200 AD 랩 2세트
- [ ] **HTB: Cascade** (Windows AD Medium) 풀이

#### 8/25 (화)

- [ ] PG Practice 2개
- [ ] `active_directory.md` 최종화

#### 8/26 (수) — Phase 2 마무리 체크

- [ ] AD 체인 최소 2회 경험 ✅
- [ ] 터널링 명령어 정리 완료 ✅
- [ ] PEN-200 주요 파트 1회독 완료 ✅
- [ ] 리포트 영어 작성 3회 이상 경험 ✅

**누적: 52개 전후**

---

## Phase 3 — 실전 감각 + 모의시험 (8/27 ~ 9/23)

> 강의 비중 낮추고 박스 풀이 + AD + 리포트 집중.  
> AD 포함 박스 비중 30% 이상 유지.

---

### 11주차 (8/27 ~ 9/2) — OSCP-like 박스 집중 풀이

**박스별 시간 제한**

- Easy: 2~3시간 / Medium: 4~6시간
- 6시간 이상 막히면 writeup 일부 확인 (반드시 치트시트에 추가)

#### 8/27 (목)

- [ ] **HTB: Intelligence** (Windows AD Medium) 풀이

#### 8/28 (금)

- [ ] **HTB: Return** (Windows AD Easy) 풀이
- [ ] PG Practice 1개

#### 8/29 (토)

- [ ] **HTB: Blackfield** (Windows AD Hard) 풀이 — 어려우면 writeup 보면서 기법 학습

#### 8/30 (일) — 🔴 휴식

#### 8/31 (월)

- [ ] **HTB: Escape** (Windows AD Medium) 풀이
- [ ] PG Practice 1개

#### 9/1 (화)

- [ ] **HTB: Manager** (Windows AD Medium) 풀이

#### 9/2 (수)

- [ ] 이번 주 복기
- [ ] AD 공격 패턴 정리 (이번 주에서 새로 배운 것)
- [ ] PG Practice 1개

**누적: 59개 전후**

---

### 12주차 (9/3 ~ 9/9) — 모의환경 + 리포트 초안 완성

#### 9/3 (목)

- [ ] **HTB: Timelapse** (Windows AD Easy) 풀이
- [ ] 리포트 템플릿 초안 작성 시작

#### 9/4 (금)

- [ ] **HTB: Cicada** (Windows AD Easy) 풀이
- [ ] PG Practice 2개

#### 9/5 (토)

- [ ] **HTB: Administrator** (Windows AD Medium) 풀이
- [ ] 리포트 템플릿 초안 완성

#### 9/6 (일) — 🔴 휴식

#### 9/7 (월)

- [ ] OSCP A/B/C 또는 유사 모의환경 1세트 시작
- [ ] 스크린샷 전부 캡처하면서 진행

#### 9/8 (화)

- [ ] 모의환경 계속
- [ ] **HTB: Certified** (Windows AD Medium) 풀이

#### 9/9 (수)

- [ ] 모의환경 복기
- [ ] 리포트 한 번 써보기 (영어, 모의환경 기준)
- [ ] PG Practice 1개

**스크린샷 필수 확인**

- [ ] whoami / ipconfig·ifconfig / proof 파일 / exploit 성공 / PrivEsc 근거

**누적: 65개 전후**

---

### 13주차 (9/10 ~ 9/16) — 1차 24시간 모의시험

#### 9/10 (목)

- [ ] 약점 복습 (지난 주 막혔던 벡터 위주)
- [ ] **HTB: Fluffy** (Windows AD Medium) 풀이

#### 9/11 (금)

- [ ] 모의시험 준비
- [ ] Kali 환경 점검 (도구 동작 확인)
- [ ] 스크린샷 폴더 / 리포트 템플릿 준비
- [ ] 새 박스 풀이 금지

#### 9/12 (토) — 🔵 1차 24시간 모의시험 시작

- [ ] AD 세트 1개 + 독립 머신 3개
- [ ] 24시간 제한 엄수
- [ ] 모든 과정 스크린샷
- [ ] 막힌 구간 시간 기록

#### 9/13 (일) — 🔴 휴식 (모의시험 후 회복)

#### 9/14 (월)

- [ ] 모의시험 영어 리포트 작성 (24시간 내)
- [ ] 리포트 완성도 체크

#### 9/15 (화)

- [ ] 실패 원인 분석
- [ ] 시간 낭비 구간 정리
- [ ] 약점 목록 작성

#### 9/16 (수)

- [ ] 약점 집중 보완
- [ ] AD 약점이면 → AD 박스 1개 추가
- [ ] PrivEsc 약점이면 → 해당 벡터 재실습

> 목표는 합격이 아니라 **시간 낭비 구간 찾기**

---

### 14주차 (9/17 ~ 9/23) — 2차 모의시험 + 최종 약점 보완

#### 9/17 (목)

- [ ] 1차 모의시험 약점 보완 계속
- [ ] **HTB: Puppy** (Windows AD Medium) 풀이

#### 9/18 (금)

- [ ] **HTB: Voleur** (Windows AD Medium) 풀이
- [ ] Cheat Sheet 최종 보완

#### 9/19 (토) — 🔵 2차 24시간 모의시험 시작

- [ ] AD 세트 1개 + 독립 머신 3개
- [ ] 24시간 제한 엄수
- [ ] 1차 때 시간 낭비 구간 개선됐는지 확인

#### 9/20 (일) — 🔴 휴식

#### 9/21 (월)

- [ ] 2차 모의시험 영어 리포트 작성
- [ ] `report_template.md` 최종화

#### 9/22 (화)

- [ ] 2차 모의시험 복기
- [ ] 모든 Cheat Sheet 최종화
    - [ ] `enumeration_checklist.md` ✅
    - [ ] `web_checklist.md` ✅
    - [ ] `linux_privesc.md` ✅
    - [ ] `windows_privesc.md` ✅
    - [ ] `active_directory.md` ✅
    - [ ] `file_transfer.md` ✅
    - [ ] `reverse_shell.md` ✅

#### 9/23 (수) — 시험 응시 가능 기준 최종 확인

- [ ] Easy 박스 대부분 자력 풀이 가능
- [ ] Medium 최소 절반 이상 자력 진행 가능
- [ ] AD 체인 3회 이상 성공
- [ ] 24시간 모의시험에서 70점 이상
- [ ] 리포트 작성 흐름 익숙함

> ⚠️ AD가 여전히 불안하면 10월 초로 시험 미루기. PEN-200 기간(~10/14) 남아 있음.

---

## Phase 4 — 시험 응시 (9/24 ~ 9/30)

---

### 15주차 (9/24 ~ 9/30) — 시험 주간

#### 9/24 (목)

- [ ] Cheat Sheet 전체 읽기
- [ ] 자주 쓰는 명령어 재확인
- [ ] 리포트 템플릿 확인

#### 9/25 (금)

- [ ] 가벼운 복습만 (새 박스 금지)
- [ ] VPN / 스크린샷 도구 / 저장 폴더 점검
- [ ] Kali 업데이트 금지
- [ ] 새 도구 설치 금지

#### 9/26 (토) — 🔵 시험 응시 추천일 1

- [ ] 시험 시작 (오전 8~9시 추천)
- [ ] AD 세트 먼저 공략
- [ ] 모든 과정 실시간 스크린샷

#### 9/27 (일)

- [ ] 시험 중 or 리포트 작성 or 휴식

#### 9/28 (월) — 🔵 시험 응시 추천일 2 (또는 리포트 제출)

#### 9/29 (화)

- [ ] 예비 시험일 / 리포트 최종 검토

#### 9/30 (수)

- [ ] 리포트 제출
- [ ] 예비일

---

## 시험 당일 전략

1. **AD 세트 먼저** — 40점짜리. 여기서 막히면 합격선 70점 달성이 어려워짐
2. **시간 배분** — AD: 6~8시간 / 독립 머신 3개: 각 3~4시간
3. **막히면 다른 머신으로** — 같은 머신에 6시간 이상 쓰지 말 것
4. **스크린샷 실시간** — 나중에 기억 못함. 뚫릴 때마다 바로 캡처
5. **리포트 동시 작성** — 시험 끝나고 쓰면 기억 희미해짐. 메모해두기

---

## HTB 박스 리스트 전체 (출처: TJNull OSCP-like 리스트)

### Linux Boxes

|박스|난이도|완료|주차|
|---|---|---|---|
|Busqueda|Easy|[ ]|2주차|
|UpDown|Medium|[ ]|3주차|
|Sau|Easy|[ ]|2주차|
|Help|Easy|[ ]|3주차|
|Broker|Easy|[ ]|5주차|
|Intentions|Hard|[ ]|6주차|
|Soccer|Easy|[ ]|2주차|
|Keeper|Easy|[ ]|4주차|
|Monitored|Medium|[ ]|7주차|
|BoardLight|Easy|[ ]|2주차|
|Networked|Easy|[ ]|1주차|
|CozyHosting|Easy|[ ]|2주차|
|Editorial|Easy|[ ]|3주차|
|Magic|Medium|[ ]|1주차|
|Pandora|Easy|[ ]|3주차|
|Builder|Medium|[ ]|4주차|
|LinkVortex|Easy|[ ]|6주차|
|Dog|Easy|[ ]|5주차|
|Markup|Very Easy|[ ]|1주차|
|Usage|Easy|[ ]|3주차|
|Titanic|Easy|[ ]|6주차|
|Outbound|Easy (Assumed Breach)|[ ]|7주차|
|Editor|Easy|[ ]|여유|
|Expressway|Easy|[ ]|7주차|
|Browsed|Medium|[ ]|8주차|

### Windows Boxes

|박스|난이도|완료|주차|
|---|---|---|---|
|Escape|Medium|[ ]|11주차|
|Servmon|Easy|[ ]|4주차|
|StreamIO|Medium|[ ]|8주차|
|Blackfield|Hard|[ ]|11주차|
|Timelapse|Easy|[ ]|12주차|
|Return|Easy|[ ]|11주차|
|Access|Easy|[ ]|4주차|
|Jeeves|Medium|[ ]|4주차|
|Heist|Easy|[ ]|8주차|
|Mailing|Easy|[ ]|여유|
|Administrator|Medium|[ ]|12주차|

### Windows Active Directory Boxes

|박스|난이도|완료|주차|
|---|---|---|---|
|Active|Medium|[ ]|10주차|
|Forest|Medium|[ ]|9주차|
|Sauna|Easy|[ ]|9주차|
|Monteverde|Medium|[ ]|10주차|
|Support|Easy|[ ]|9주차|
|Intelligence|Medium|[ ]|11주차|
|Cascade|Medium|[ ]|10주차|
|Timelapse|Easy|[ ]|12주차|
|Escape|Medium|[ ]|11주차|
|Manager|Medium|[ ]|11주차|
|Blackfield|Hard|[ ]|11주차|
|Cicada|Easy|[ ]|12주차|
|Certified|Medium|[ ]|12주차|
|Administrator|Medium|[ ]|12주차|
|Fluffy|Medium|[ ]|13주차|
|Puppy|Medium|[ ]|14주차|
|Voleur|Medium|[ ]|14주차|
|Tombwatcher|Medium (Assumed Breach)|[ ]|여유|
|Signed|Medium (Assumed Breach)|[ ]|여유|
|Eighteen|Medium (Assumed Breach)|[ ]|여유|
|Fluffy|Medium|[ ]|여유|

### Post-OSCP (시험 후 도전)

|박스|분류|
|---|---|
|Mentor|Linux Hard|
|Absolute|Windows Hard|
|Outdated|Windows Hard|
|Atom|Windows Hard|
|APT|Windows Hard|
|Aero|Windows Hard|
|Cerberus|Windows/Linux Hard|
|Multimaster|Windows Hard|
|Cereal|Linux Hard|
|Quick|Linux Hard|
|Authority|Windows Hard|
|Clicker|Linux Hard|
|Rebound|Windows Hard|
|Mailing|Windows Hard|
|Vintage|Windows Hard|
|EscapeTwo|Windows AD|
|Rustykey|Windows (Timeroasting)|
|DarkZero|Windows (Assumed Breach)|

### ProLabs (Post-OSCP)

- Dante
- RastaLabs
- Zephyr
- Alchemy

---

## 주차별 요약

|주차|기간|핵심 목표|누적 박스|
|---|---|---|---|
|1주차|6/18~6/24|환경 세팅, HTB Easy 3개|3개|
|2주차|6/25~7/1|HTB Easy 5개, 열거 루틴|8개|
|3주차|7/2~7/8|Linux PrivEsc|14개|
|4주차|7/9~7/15|Windows PrivEsc, 결제 판단|22개|
|5주차|7/16~7/22|PEN-200 시작|27개|
|6주차|7/23~7/29|웹 공격 집중|31개|
|7주차|7/30~8/5|Exploit 수정, 패스워드 공격|36개|
|8주차|8/6~8/12|PrivEsc 공식 정리, 문서 완성|42개|
|9주차|8/13~8/19|**AD 1차 + 리포트 연습 시작**|46개|
|10주차|8/20~8/26|터널링, AD 2차|52개|
|11주차|8/27~9/2|OSCP-like 박스 대량 풀이|59개|
|12주차|9/3~9/9|모의환경, 리포트 초안|65개|
|13주차|9/10~9/16|**1차 24시간 모의시험**|—|
|14주차|9/17~9/23|**2차 모의시험, 약점 보완**|—|
|15주차|9/24~9/30|**시험 응시**|—|

|Linux|Windows|Active Directory and Networks|
|---|---|---|
|Sea|Markup|Active|
|Nibbles|Jerry|Forest|
|Solidstate|Netmon|Sauna|
|Poison|Servmon|Flight|
|Editor|Chatterbox|Return|
|Sunday|Jeeves|Blackfield|
|Keeper|Sniper|Cicada|
|Pilgrimage|Querier|TheFrizz (harder)|
|Cozyhosting|Giddy||
|Codify|Bounty|Assumed Breach Scenarios:|
|Tartarsauce|Artic|Administrator|
|Jarvis|Remote||
|Tabby|Buff||
|Connected|Love||
|Mentor|Secnotes|Priv Esc not in scope but good practice:|
|Devvortex|Access|Monteverde|
|Irked|Mailing|Escape|
|Popcorn|Heist|EscapeTwo (Assumed breach)|
|Bashed||Certified (Assumed breach)|
|Broker||Puppy (harder)|
|Silentium||Timelapse (harder)|
|==Networked==||Signed (Assumed breach)|
|UpDown|||
|Swagshop||ProLabs:|
|Nineveh||Dante|
|Pandora||Zephyr (harder)|
|OpenAdmin|||
|Precious||AWS (Not in the exam)|
|Busqueda||Epsilon|
|Monitored||Gobox|
|BoardLight||Bucket|
|Magic||Facts|
|Help|||
|Editorial|||
|Builder|||
|Linkvortex|||
|UnderPass|||
|Dog|||
|Cctv|||