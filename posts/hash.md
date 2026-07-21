---
slug: "hash"
title: "HASH"
date: 2026-07-15
category: "미분류"
tags: []
excerpt: "-> 얘도 cve가 있을때가 있음 -> ex) [[keeper]] 덤프와 합쳐진 kdbx ## 1. 문자열 길이와 형태 (가장 일반적인 판별 기준)"
readingTime: 2
---


-> 얘도 cve가 있을때가 있음  -> ex) [[keeper]] 덤프와 합쳐진 kdbx
## 1. 문자열 길이와 형태 (가장 일반적인 판별 기준)

출력된 텍스트의 글자 수와 사용된 문자(16진수: 0-9, a-f)를 통해 주로 사용되는 해시인지 파악 가능.
- **8자리:** CRC32
- **16자리:** MySQL 3.x, 오라클(Oracle 10g)
- **32자리:** MD5, MD4, NTLM (가장 흔하게 사용됨)
- **40자리:** SHA-1
- **64자리:** SHA-256
- **128자리:** SHA-512

## 2. 특정 접두사 및 특수 문자 포함 여부

비밀번호 해시의 경우, 해시 문자열 내에 특정 기호나 식별 접두사(Prefix)가 포함되어 있어 알고리즘을 즉시 확인할 수 있는 경우
- **`$2a$`, `$2b$`, `$2y$`:** bcrypt (주로 웹 애플리케이션에서 사용)
- **`$argon2i$`, `$argon2id$`:** Argon2 (최신 보안 환경)
- **`$1$`:** MD5-crypt
- **`$5$`:** SHA-256-crypt
- **`$6$`:** SHA-512-crypt
- **`$P$`, `$H$`:** WordPress (PHP 기반)
- **`$S$`:** Drupal

---
# hashcat 사용법

해시 크래킹 툴
~~~shell
hashcat -a [attack_mode] -m [hash_type] [hash_file] [wordlist_or_mask]

#예시
hashcat -m 3200 -a 0 '$2a$10$SpKYdHLB0FOaT7n3x72wtuS0yR8uqqbNNpIPjUb2MZib3H9kVO8dm' /usr/share/wordlists/rockyou.txt
~~~

**-a**  
- 0: 사전대입
- 3: 무차별대입
**-m**
- **-m 0:** MD5
- **-m 100:** SHA1
- **-m 1000:** NTLM (Windows passwords)
- **-m 1800:** sha512crypt (Linux /etc/shadow)
- **-m 3200:** bcrypt  -> $2a$10