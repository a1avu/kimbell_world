---
slug: "obsidieon-jeongribeob"
title: "옵시디언 정리법"
date: 2026-06-18
category: "미분류"
tags: []
excerpt: "--- 파일 명으로 링크 거는게 대부분임 **ex)** ~~~ [[OSCP/cheatsheets/linux_privesc.md]] ~~~"
readingTime: 3
---

~~~
OSCP/
├── 00_cheatsheets/
│   ├── enumeration_checklist.md   ← 포트별 열거 명령어 모음
│   ├── web_checklist.md           ← 웹 공격 흐름 + 벡터별 페이로드
│   ├── smb_checklist.md           ← SMB 열거 명령어 + 익명접근 흐름
│   ├── linux_privesc.md           ← Linux 권한상승 벡터별 명령어
│   ├── windows_privesc.md         ← Windows 권한상승 벡터별 명령어
│   ├── active_directory.md        ← AD 공격 흐름 + BloodHound/Kerberoasting/PTH
│   ├── file_transfer.md           ← 상황별 파일 전송 명령어
│   └── reverse_shell.md           ← OS별 리버스쉘 페이로드 + nc 리스너
│
├── 01_boxes/
│   ├── linux/
│   │   └── Busqueda.md        ← 박스 풀이 기록 (Ports/Foothold/PrivEsc/Rabbit Hole)
│   │
│   ├── windows/
│   │   └── Servmon.md         ← 동일 템플릿
│   │
│   └── AD/
│       └── Forest.md          ← 풀이 기록 + 도메인 구조/BloodHound 경로 추가
│      
│
├── 02_theory/
│   ├── linux_privesc_theory.md    ← 각 벡터 동작 원리 (왜 되는지)
│   ├── windows_privesc_theory.md  ← Windows 권한/토큰/서비스 개념
│   ├── AD_theory.md               ← Kerberos 흐름, TGT/TGS, NTLM vs Kerberos
│   └── web_attacks.md             ← SQLi/LFI/SSRF/XXE 원리 + 우회 기법
│
├── 03_reports/
│   ├── report_template.md    ← 영어 리포트 템플릿 (Summary/Findings/PoC/Remediation)
│   ├── mock_exam_1.md        ← 1차 모의시험 리포트 + 막힌 구간 분석
│   └── mock_exam_2.md        ← 2차 모의시험 리포트 + 1차 대비 개선점
│
└── 04_progress/
    └── oscp_plan_detailed.md      ← 일별 플랜 + 박스 체크리스트
~~~

---
파일 명으로 링크 거는게 대부분임
**ex)**
~~~
[[OSCP/cheatsheets/linux_privesc.md]]
~~~
