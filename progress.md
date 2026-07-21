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
