// 포스트 모달: 열기/닫기, 포커스 트랩, 스크롤 잠금
(function () {
  var POSTS = {
    "sql-injection-first-gate": {
      category: "웹 해킹",
      title: "SQL 인젝션으로 여는 첫 번째 관문",
      paragraphs: [
        "로그인 폼의 아이디 입력란에 작은따옴표 하나를 넣었을 뿐인데, 서버는 원래라면 절대 보여주면 안 될 오류 메시지를 그대로 돌려주었습니다. 그 순간부터 이 관문은 단순한 로그인 화면이 아니게 되었습니다.",
        "블라인드 SQLi는 화면에 결과가 직접 드러나지 않기 때문에, 참과 거짓을 구분하는 조건문을 하나씩 쌓아가며 데이터베이스의 응답 시간이나 반환 여부로 정보를 추론해야 합니다. 느리지만 확실한 방법입니다.",
        "실습 환경에서는 페이로드를 자동화하기 전에 반드시 수동으로 몇 차례 검증해, 애플리케이션이 어떤 조건에서 다르게 반응하는지 먼저 파악했습니다. 방어 쪽에서는 파라미터화된 쿼리와 최소 권한 원칙만으로도 이 관문 자체가 열리지 않습니다.",
      ],
      code: "' OR '1'='1' -- \n' UNION SELECT username, password FROM users -- ",
    },
    "linux-privesc-forgotten-cronjob": {
      category: "Hack The Box",
      title: "리눅스 권한 상승, 잊혀진 크론잡의 흔적",
      paragraphs: [
        "일반 사용자 셸을 잡은 뒤 가장 먼저 한 일은 SUID 비트가 걸린 바이너리와 예약 작업을 훑어보는 것이었습니다. 대부분은 평범했지만, 크론탭 한 줄이 눈에 걸렸습니다.",
        "루트 권한으로 5분마다 실행되는 스크립트가 있었고, 그 스크립트는 일반 사용자도 쓰기 권한을 가진 디렉터리를 참조하고 있었습니다. 스크립트 자체를 바꿀 순 없어도, 그 안에서 불러오는 파일은 얼마든지 대체할 수 있었습니다.",
        "열쇠는 늘 사소한 설정 파일에 숨어 있습니다. 권한 상승 경로를 찾을 때는 화려한 취약점보다 이런 오래되고 잊혀진 자동화 스크립트부터 의심하는 습관이 더 자주 통했습니다.",
      ],
      code: "$ crontab -l\n*/5 * * * * root /opt/backup/sync.sh\n\n$ ls -la /opt/backup/\ndrwxrwxrwx 2 root root 4096 sync.sh",
    },
    "classical-cipher-roots": {
      category: "암호학",
      title: "고전 암호에서 배우는 현대 공격의 뿌리",
      paragraphs: [
        "비즈네르 암호는 몇 세기 동안 '해독 불가능한 암호'로 불렸지만, 결국 반복되는 키 길이를 추정하는 순간부터 무너지기 시작합니다. 카시스키 테스트로 키 길이의 후보를 좁히는 과정이 그 시작점입니다.",
        "키 길이를 알아내고 나면, 암호문을 그 길이만큼 나눈 각 열은 사실상 단순한 시저 암호와 같아집니다. 여기서부터는 알파벳 등장 빈도를 비교하는 빈도 분석만으로도 충분히 복원할 수 있습니다.",
        "오래된 문제일수록 기본기가 드러납니다. 현대의 키 재사용 취약점이나 스트림 암호 공격도 결국은 '반복되는 패턴을 어떻게 찾아내는가'라는 같은 질문에서 출발합니다.",
      ],
      code: "def frequency_analysis(ciphertext):\n    counts = {}\n    for ch in ciphertext:\n        if ch.isalpha():\n            counts[ch] = counts.get(ch, 0) + 1\n    return sorted(counts.items(), key=lambda x: -x[1])",
    },
    "packet-intrusion-clues": {
      category: "네트워크",
      title: "패킷 속에 숨은 침입의 단서",
      paragraphs: [
        "Wireshark로 캡처한 몇 시간 분량의 트래픽 중에서, 유독 한 호스트가 짧은 간격으로 DNS 쿼리를 반복하는 패턴이 눈에 띄었습니다. 정상적인 서비스라면 나올 수 없는 리듬이었습니다.",
        "쿼리 도메인을 자세히 보니 무작위처럼 보이는 서브도메인이 계속 바뀌고 있었고, 이는 DNS 터널링을 의심할 만한 전형적인 신호였습니다. 필터를 좁혀 해당 호스트의 트래픽만 따로 모았습니다.",
        "작은 이상 패턴 하나가 전체 시나리오를 바꿔놓았습니다. 로그 전체를 훑기보다, 이렇게 통계적으로 튀는 지점을 먼저 찾아내는 접근이 훨씬 빠른 결론으로 이어졌습니다.",
      ],
      code: "$ tshark -r capture.pcapng -Y \"dns\" -T fields -e ip.src -e dns.qry.name\n192.168.1.42  4f8a2c1e.example-cdn.net\n192.168.1.42  9b7710dd.example-cdn.net",
    },
  };

  var backdrop = document.getElementById("modal-backdrop");
  var dialog = document.getElementById("post-modal");
  var categoryEl = document.getElementById("modal-category");
  var titleEl = document.getElementById("modal-title");
  var bodyEl = document.getElementById("modal-body");
  var openPageEl = document.getElementById("modal-open-page");
  var closeBtn = document.getElementById("modal-close");

  if (!backdrop || !dialog) return;

  var lastFocusedEl = null;
  var closeTimer = null;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function renderBody(post) {
    bodyEl.innerHTML = "";

    post.paragraphs.forEach(function (text) {
      var p = document.createElement("p");
      p.textContent = text;
      bodyEl.appendChild(p);
    });

    if (post.code) {
      var pre = document.createElement("pre");
      var code = document.createElement("code");
      code.textContent = post.code;
      pre.appendChild(code);
      bodyEl.appendChild(pre);
    }
  }

  function getFocusableEls() {
    var selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.slice.call(dialog.querySelectorAll(selector));
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;

    var focusable = getFocusableEls();
    if (focusable.length === 0) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleBackdropClick(event) {
    if (event.target === backdrop) {
      closeModal();
    }
  }

  function openModal(postId, triggerEl) {
    var post = POSTS[postId];
    if (!post) return;

    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    lastFocusedEl = triggerEl || null;

    categoryEl.textContent = post.category;
    titleEl.textContent = post.title;
    renderBody(post);

    backdrop.removeAttribute("hidden");
    document.documentElement.classList.add("no-scroll");

    document.addEventListener("keydown", handleKeydown, true);
    backdrop.addEventListener("click", handleBackdropClick);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        backdrop.classList.add("is-open");
        dialog.focus();
      });
    });
  }

  function closeModal() {
    if (backdrop.hasAttribute("hidden")) return;

    backdrop.classList.remove("is-open");
    document.documentElement.classList.remove("no-scroll");

    document.removeEventListener("keydown", handleKeydown, true);
    backdrop.removeEventListener("click", handleBackdropClick);

    var duration = prefersReducedMotion() ? 0 : 200;
    closeTimer = window.setTimeout(function () {
      backdrop.setAttribute("hidden", "");
      if (lastFocusedEl) {
        lastFocusedEl.focus();
      }
      closeTimer = null;
    }, duration);
  }

  document.querySelectorAll(".post-card__link[data-post-id]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      openModal(link.getAttribute("data-post-id"), link);
    });
  });

  closeBtn.addEventListener("click", closeModal);
})();
