---
slug: "credential"
title: "credential"
date: 2026-07-31
category: "치트시트"
section: "OSCP"
tags: []
excerpt: "**1. Dockerfile / docker-compose.yml** 아까처럼 실제 배포 경로, 컨테이너 구성, 볼륨 마운트, 환경변수 주입 방식이 다 드러남. `COPY`,…"
readingTime: 4
---

# .git

**1. Dockerfile / docker-compose.yml**  
아까처럼 실제 배포 경로, 컨테이너 구성, 볼륨 마운트, 환경변수 주입 방식이 다 드러남. `COPY`, `ENV`, `ARG` 줄이 핵심.

**2. `.env.example` / `.env.sample` / `.env.default`**  
진짜 `.env`는 보통 `.gitignore`에 있어서 안 잡히지만, `.example`류는 "어떤 변수가 필요한지" 스키마를 그대로 보여줌. 값은 비어있어도 변수명 자체가 정찰에 도움됨.

**3. `docker-compose.yml` / `docker-compose.override.yml`**  
서비스 간 연결(DB 호스트, 포트), 환경변수로 주입되는 크레덴셜, 볼륨 경로가 다 있음.

**4. CI/CD 설정 파일**  
`.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile` — 배포 스크립트 안에 시크릿 참조나 배포 경로, 심하면 하드코딩된 토큰이 그대로 있는 경우도 있음.

**5. `package.json` / `requirements.txt` 등 의존성 파일**  
정확한 버전 확인용. CVE 매칭에 직결됨 (지금 Ghost 5.58처럼).

**6. `README.md` / `CONTRIBUTING.md` / `SECURITY.md`**  
개발자가 실수로 내부 인프라 정보나 관리자 연락처, 테스트 계정 안내를 남겨두는 경우 있음.

**7. `git log`의 최근 커밋 / staged 변경사항**  
아까 확인했던 것처럼 `git status`, `git diff --cached`로 **"이 박스를 위해 새로 추가/수정된 파일"**을 바로 찾을 수 있음. 이게 사실 제일 확실한 단서임 — 원본 Ghost repo와 다른 부분이 곧 "이 박스만의 커스텀 설정"이니까.

**8. `docker-entrypoint.sh` / `entry.sh` / `wait-for-it.sh`**  
컨테이너 시작 스크립트. 환경변수를 어떻게 읽어서 설정 파일에 주입하는지, DB 초기화 로직이 있는지 확인 가능.

**9. `nginx.conf` / `apache 관련 vhost 파일`**  
프록시 설정, 내부 포트, 다른 서비스로의 라우팅 정보.

---
# webshell 일 때

1. **config credential** ⭐ 제일 중요
   - 중요 시스템(웹앱 등)의 conf 파일 위치부터 찾기
   - 이름에 config 들어간 파일 다 뒤지기
   - ex) [[editor]] → `/etc/xwiki/hibernate.cfg.xml`에서 DB 비번 발견
   - `grep -riE "password|secret|token" /etc /var/www 2>/dev/null`

2. **bash_history**
   - `cat ~/.bash_history` / `cat /home/*/.bash_history`
   - 이전 유저가 명령어에 비번 박아둔 거 찾기

3. **env variable**
   - `env` /  `cat /proc/self/environ | tr '\0' '\n'`


---
# scan_cred.py
크레덴셜 자동 스캔 및 가장 적절해보이는거 까지 알려줌
-

```
    python3 cred_scan.py <디렉토리> [--ext py,js,json,env,...]
```
-> 심지어 .git 보이면 알아서 git log도 봄

**참고**
[[linkvortex]] : 여기에 넣어놈
