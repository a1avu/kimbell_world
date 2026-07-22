---
slug: "webhacking-kr"
title: "webhacking.kr"
date: 2026-01-08
category: "웹해킹"
section: "wargame"
tags: []
excerpt: "ul이랑 pw.input_pwd.value랑 비교해서 같으면 ?510 * pw.input_pwd.value 로 리다이렉션 시킴 -> 이때 입력값 문자열이면 NAN임"
readingTime: 10
---

## **old-14**
ul = 18 * 30 = 510을 해
문자열로 받고 있으니까 이거 정수형으로 변환시켜봐

ul이랑 pw.input_pwd.value랑 비교해서 같으면
?510 * pw.input_pwd.value 로 리다이렉션 시킴
 -> 이때 입력값 문자열이면 NAN임

근데 입력받는건 다 문자열로 받잖아 그럼 이걸 어째야할까
1. <script>parseInt(540,10);</script>
-> 얘도 사실 value로 했을땐  텍스트 값일 뿐임
2. 내가 리다이렉션 하는 곳으로 그냥 가버리기 (이건 근데 안될듯 함)
3. 코드 직접 수정 -> 얘가 되네
![](assets/images/posts/Pasted%20image%2020251229173145.png)
그래서 540을 넣어줌.

알고 보니까 그냥 입력창에 540입력해도 됐음 == 은 느슨한 비교라 브라우저 단에서 알아서 형변환을 해준다고 함

---
## **old-17**

뭔가 정석 풀이는 아닌거 같은데 unlock 값을 콘솔에서 찍어주고 그쪽으로 리다이렉션 해버림

---
## **old-16**
리다이렉션을 String.fromCharCode(cd).php에 한다길래 
124의 charcode를 찾아보니 | 라고 함 그래서 |.php 로 리다이렉션 시켜줬더니 성공함... 
-> keydown이니까 입력해줘도 됨 shift + \ 이걸 key를 받는다는거니까 ㅇㅇ

---
## **old-06** (base64)

파이썬 코드 작성 base64 20번 인코딩 id pw 각 문자열을 특정 문자열로 대체함


---
## **old-18**(sqli filter bypass)

no text에있는 번호를 가져다가 
id는 게스트고 no는 1일때 guest를 출력함 그리고 해당 no를 가져와서 필터링을 걸치고 만약에 저 중에 하나의 텍스트가 있으면 no hack을 출력 이때 id가 admin이면 solve가 나옴

"/   | \/ | \( | \) | \| | & | select | from |0x /i"

공백, \ , (, ), |, &, select, from, 0x 이거 들어가면 필터링
\i에 의해서 대소문자 구분 없이 처리

+로 해볼까 싶음
;sel%0aect+id+fro%0am+chall18+where+id='admin'+and+no=2;
select id from chall18 where id='guest' and no=5+union+sel%0aect+id+fro%0am+chall18+where+id='admin'+and+no=2

union이고 뭐고 fetcharray는 첫번째 행 1개만 가져옴 그럼 앞에 쿼리가 아예 출력 안되고 뒤에 쿼리만이 출력되게[] 해야함

근데 이게 아니라 더 쉽게 그냥 or을 사용하면 됨
그냥 2%09or%09no='2'
이렇게 하면 
select id from chall18 where id='guest' and no='2' or no='2'
이렇게 되니까 

**중요:** 원인이 
( id='guest' and no='2' ) or no='2'
sql에서 and가 우선 순위가 더 높아서 앞에껀 거짓이 되고 OR로 인해서 id가 뭐든지 no=2 인것은 다 출력 한다.

url에 직접 입력해야되는 이유는 input창에 입력하면 한번 더 url 인코딩 되기 때문임.

---
## **old-24**

```PHP
extract($_SERVER);
extract($_COOKIE);

$_server[Remote_addr]
```

이러면 그냥 여기서 remote_addr 같이 키값이랑 각각의 배열값들이 쭉 매칭됨
```PHP
$_SERVER = [
  'REMOTE_ADDR' => '127.0.0.1',
  'HTTP_USER_AGENT' => 'Mozilla/5.0',
  'REQUEST_METHOD' => 'GET',
  ...
];
```

대충 이런 식으로 매칭되능거
```php
$ip = htmlspecialchars($REMOTE_ADDR);
```
   이거 보면 xss 방지 됨 
  &, <, >, "", '' 애네 필터링이 됨

보니까 extract()에 취약점이 있음
extract 함수에 사용자의 입력($_GET, $_POST, $_FILE)와 같은 신뢰할 수 없는 데이터가 사용되면 다른 변수를 변조하여 공격에 사용될 수 있다고 함

자 그럼 어떻게 해야할까
```php
 extract($_SERVER);
 extract($_COOKIE);
```
이걸 보면 server를 부르고 cookie를 부름. cookie를 extract 시키면 그냥 온전히 쿠키 이름,값만 가져옴.
그럼 cookie에서 REMOTE_ADDR을 조작해보면 어떨까 싶은데,,,,
오 된다.
필터링 우회만 하면 될거 같음.
0.0.0.0
192.168.0.1 안됨

필터링 되는거에 null 넣어봤는데 필터링은 안되는데 풀리진 않음
1%0027%00.0%00.0%00.1
```php
if ($ip=="127.0.0.1")
```
이건 문자열 전체 바이트가 동일해야 true가 됨

전체를 더블 인코딩해볼까
이것도 안됨
Remote_addr에는 필터링 안돼있는데 흠,,,

병신아 제발 정신차려라
공백으로만 바꾼다잖아 ㅅㅂ

11227127... -> 이러면 127. 까지 나옴
00.12.00.12.1 -> 이러면0.0.1나옴
11227127...00.12.00.12.1

---
## **old-10**
코드에 1600이라고 하면 Pwned 안됨 왜냐!
onclick되고 px +1 이 된 다음에 if로 이게 1600인지를 확인함 굳이 적을 필요 없을듯

---
## **old-39**  sqli bypass
15글자가 제한돼 있음 -> 얜 걍 코드에서 고치면 돼

\\\ -> 이 두개는 아예 지움
' -> ''로 바꿈 singlequote 2개

내가 입력한 문자열에 0~14까지만 잘라서 사용

쿼리에서 id는 14글자 보다 작아야해
result[0]이 1일 때, 플래그를 보여줘

' or 1=1 --
↓
''or 1=1--
어차피 15글자에서 자름
그러면 마지막에 '로 끝나게 해서 작은 따옴표 한개를 지울 수 있지 않나?
 ->   아니 그냥 공백 14개에 ' 이거 하면 끝남
              '

sql에서 공백은 몇칸이든 하나의 공백으로 취급한다고 함!
![](assets/images/posts/Pasted%20image%2020260106150455.png)

---
## **old-54**

코드 재귀적으로 answer 쭉쭉 실행하면서 가다가 마지막에 공백에 도착하면 ? 출력후 종료

콘솔창에 js 부분 집어넣고 원하는 부분을 수정할 수 있음 그래서 필요없는 코드 삭제,
원하는 부분 수정

그리고 webhacking.kr에 Auth에다가 플래그 집어넣을 수 있음
FLAG{a7981201c48d0ece288afd01ca43c55b}
![](assets/images/posts/Pasted%20image%2020260106161340.png)'

---
## **old-27**

필터링 돼 있는 애들
/# | select | \( |   | limit | = | 0x -> 대소문자 없이
```mysql
select id from chall27 where id='guest' and no=2%09or%09no%09like%091%09)
```

이게 잘못된 쿼린가?

```mysql
select id from chall27 where id='guest' and no=2)%09or%09no%09like%092%09--%09
```
됐다 그니까 원래 코드에
```php
"select id from chall27 where id='guest' and no=({$_GET['no']})"))
```
이런 식으로 쿼리가 짜여 있는데 
```php
  $r=mysqli_fetch_array(mysqli_query($db,"select id from chall27 where id='guest' and no=({$_GET['no']})")) or die("query error");
```
내가 이 코드가 궁금한데 이거 뒤에 or die("") 이부분은 앞에꺼가 실패하면 뒤에꺼 하라는거
일단 열려있는 괄호를 닫고 뒤에 쪽은 전부 주석처리 하는 식으로 가면 될 듯함.

![](assets/images/posts/Pasted%20image%2020260106165729.png)

---
**old-14**
뭐가 필터링 된건지 찾아보자 일단
script
img
src
alert
보니까 반복문 돌아가면서 지우진 않고 슬슬 연속된 문자열 있으면 지우는것 같음 근데 하나라도 다르면 바로 꺼버리는듯?

그럼 드림핵 lv3 xss bypass 할때 했던거처럼 띄어쓰기까지는 얘도 알아먹을거임 ㅇㅇ

<s c r i p t>a\u006C\u0065\u0072t(1)</s c r i p t>
이번엔 alert 우회를 해야할 듯 함 아까처럼 유니코드 인코딩 하면 될것 같음
a\u006C\u0065\u0072t(1)

음,, 되진 않고 
![](assets/images/posts/Pasted%20image%2020260108150708.png)
![](assets/images/posts/Pasted%20image%2020260108150724.png)
마지막에 s다음 글자를 싹 지워버리네 뭐지

보니까 내가 적은걸 해석안학 그냥 문자열 그대로 띄워 버림 -> 이럼 get방식으로 그냥 냅다 넣어버리는게 맞는거 같은데 ,,,, 

<s%00c%00r%00i%00p%00t>a%00l%00e%00r%00t(1)</s%00c%00r%00i%00p%00t>
성공~
이런걸 null byte injection이라고 한다고 함