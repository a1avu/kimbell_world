# 작업 진행 기록

> 이 파일은 작업이 끝날 때마다 갱신됩니다. 최상단 "전체 요약"은 모든 작업이 끝난 뒤 마지막에 정리합니다.

---

## 작업 로그

### 완료: 1. 아카이브(퀘스트 로그) 구현

**변경 파일**
- `index.html`: nav의 "아카이브" 링크를 `#/archive`로 연결(`id="nav-archive-link"`),
  아카이브 backdrop/dialog 마크업 추가, `archive.js` 스크립트 태그 추가
- `assets/js/archive.js` (신규): 아카이브 전체 로직
- `assets/css/style.css`: `.archive*` 스타일 섹션 추가 (기존 규칙은 수정하지 않고 append)

**판단 근거**
- 기존 포스트 모달(`assets/js/modal.js`, `posts.js`)은 전혀 수정하지 않았습니다.
  "재사용"은 동일한 상호작용 패턴(포커스 트랩 / ESC·backdrop 닫기 / 스크롤 락)을
  의미한다고 해석해, `archive.js`에 동일 패턴을 독립적으로 재구현했습니다. 두 시스템이
  같은 전역 클래스(`no-scroll`)를 쓰지만 동시에 열리지 않도록 `openArchive()`에서
  `PostModal.isOpen()`이면 먼저 닫도록 처리했습니다. 이렇게 하면 `posts.js`의 기존
  해시 라우팅(`#slug`)과 아카이브의 해시 라우팅(`#/archive`, `#/archive/slug`)이
  서로 다른 패턴이라 충돌하지 않습니다.
- 시각적으로는 "두루마리 스타일"과의 일관성을 위해 모달과 동일한
  `scroll-modal.png` 테두리 이미지를 재사용했습니다. 마크다운 렌더링 스타일
  (`modal__body ...`)은 기존 규칙을 건드리지 않기 위해 `archive__detail-body`에
  별도로 복제했습니다 (약간의 CSS 중복은 있지만 기존 스타일 손상 위험 회피).
- 카테고리 그룹은 네이티브 `<details>/<summary>`로 구현 — 별도 JS 없이 키보드/접근성
  기본 동작(Enter/Space 토글) 확보.
- 목록 항목은 `<a href="#/archive/slug">`로 구현해 실제 permalink 역할도 겸함.
- 모바일 1단 패널 전환은 `#archive-dialog`(둘러싸는 dialog 엘리먼트)에
  `data-mobile-view="list|detail"` 속성을 두고 CSS로 제어.

**버그 수정 (테스트 중 발견)**
- 최초 구현에서 모바일 "뒤로가기" 버튼이 계속 안 보이는 문제 발견 → 원인은
  `data-mobile-view`를 `#archive-body`(리스트/디테일 패널의 부모)에 설정했는데,
  `.archive__back` 버튼은 `archive__titlebar`의 자식이라 `archive__body`의
  하위 요소가 아니었음 (형제 관계). CSS 하위 선택자가 매칭되지 않아 버튼이 항상
  `hidden` 상태로 남아 있었음. `data-mobile-view` 속성을 상위 `#archive-dialog`로
  옮기고 CSS 선택자를 `.archive[data-mobile-view=...]`로 수정해 해결.

**테스트 결과 (로컬 서버 + 브라우저 자동화)**
- 데스크톱(1400px+): 2단 패널 정상, 검색 필터링, 카테고리 그룹 접기/펼치기 확인
- 태블릿(768px, iframe으로 뷰포트 강제): 2단 패널 유지 확인
- 모바일(390px, iframe으로 뷰포트 강제): 1단 패널(목록→상세 전환), 뒤로가기
  버튼 노출/동작 확인
- 키보드 전용: 카드 focus → ArrowUp/ArrowDown으로 항목 간 이동, Enter로 선택,
  Escape로 닫힘 + 포커스가 트리거 요소(아카이브 nav 링크)로 정확히 복귀 확인
- 직접 URL 진입(`#/archive`, `#/archive/{slug}`) 및 새로고침 정상 동작 확인
- 브라우저 뒤로/앞으로가기: 아카이브 닫힘 ↔ 열림 ↔ 선택된 글 전환까지 정상 확인
- 콘솔 에러 없음
- `prefers-reduced-motion`: 코드 레벨에서 모달과 동일하게 `matchMedia` 체크로
  트랜지션 duration을 0으로 처리 (실제 OS 설정 토글 테스트는 진행하지 않음 —
  아래 "확인 필요" 참고)

**확인 필요**
- `prefers-reduced-motion: reduce`를 실제로 활성화한 상태에서의 수동 확인은
  이번 세션에서 하지 못했습니다 (코드는 모달과 동일한 패턴이라 정상 동작할
  것으로 예상하지만 실제 OS 설정 토글 테스트는 아님).
- 카테고리 그룹 "미분류(34)"처럼 그룹이 큰 경우 접기 UX는 확인했지만, 그룹이
  아주 많아졌을 때(카테고리 10개 이상) 좌측 리스트 스크롤 UX는 추가 검증 없음.

---

### 완료: 2. 카테고리 자동 정리

**방법**: 34개 포스트 전부의 frontmatter(제목, `Box:` 헤더 유무)와 본문 앞부분을
직접 읽고 분류한 뒤, `posts/*.md`의 `category:` 필드와 `posts/index.json`의
`category` 필드를 스크립트로 일괄 반영했습니다 (수작업 오타 방지를 위해
매핑 테이블 기반 스크립트 사용, 매핑 자체는 사람이 내용을 읽고 판단).

**분류 근거**
- **HTB (20개)**: `access, boardlight, broker, builder, busqueda, cozyhosting,
  dog, editor, help, jeeves, keeper, magic, markup, networked, pandora, sau,
  servmon, soccer, updown, usage` — 전부 본문에 `#### Box: 이름 | OS | 난이도`
  형식의 HTB 머신 풀이 헤더가 있어 명확하게 판별.
- **웹 해킹 (3개)**: `blind-sqli-script`(Blind SQLi 자동화), `file-transfer`
  (웹쉘 업로드용 매직바이트/특수문자 우회), `web-checklist`(웹 정찰 체크리스트).
- **암호학 (1개)**: `hash` — 해시 식별 기준 + hashcat 사용법.
- **네트워크 (2개)**: `enumeration-checklist`(nmap/포트/SNMP 위주 정찰),
  `smb-checklist`(SMB 프로토콜 열거).
- **시스템 해킹 (신규 카테고리, 3개)**: `linux-privesc`, `windows-privesc`,
  `reverse-shell` — 기존 4개 카테고리(웹 해킹/HTB/암호학/네트워크) 중 어디에도
  깔끔히 들어가지 않는 OS 레벨 권한상승·쉘 획득 기법 모음이라 최소한으로 새
  카테고리를 추가했습니다. 세 파일 모두 "박스 하나에 종속되지 않는 범용
  post-exploitation 기법"이라는 공통점이 있어 하나의 카테고리로 묶는 것이
  기존 톤(주제별 체크리스트)과 가장 일관된다고 판단했습니다.

**미분류로 남긴 5개 (애매함)**
- `db`: PostgreSQL 클라이언트 명령어 모음 — 웹/네트워크/암호학/시스템 중
  하나로 단정하기 애매함 (DB 피벗팅은 여러 카테고리에 걸침).
- `tools`: searchsploit, hydra, ssh 터널링, mdbtools/readpst, KeePass 크랙,
  puttygen 등 성격이 다른 도구 모음이라 단일 카테고리로 묶기 부적절.
- `jigjeob-chigi-gwichanheun-myeongryeongeo`: HTB VPN 접속 명령어 한 줄짜리
  메모 — 보안 기술 콘텐츠라기보다 개인 유틸리티 메모.
- `obsidieon-jeongribeob`: Obsidian 폴더 구조 정리법 — 보안 콘텐츠가 아닌
  메타 노트.
- `oscp-junbi-peulraen`: OSCP 학습 일정표 — 기술 콘텐츠가 아닌 개인 계획 노트.

이 5개는 사용자가 직접 판단해서 분류하거나 별도 카테고리(예: "메모"/"스터디
플랜")를 만들지 결정하는 것이 나을 것 같아 임의로 카테고리를 부여하지
않았습니다.
