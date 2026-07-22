// Hero의 이메일 복사 버튼: 클립보드 복사 + 아이콘/툴팁 피드백.
// navigator.clipboard 사용 불가/실패 시 mailto: 링크로 폴백한다.
(function () {
  var btn = document.getElementById("email-copy-btn");
  if (!btn) return;

  var email = btn.dataset.email;
  var mailIcon = btn.querySelector('[data-icon="mail"]');
  var checkIcon = btn.querySelector('[data-icon="check"]');
  var tooltip = btn.querySelector(".social-links__tooltip");
  var resetTimer = null;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function showCopied() {
    if (resetTimer) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }

    mailIcon.style.display = "none";
    checkIcon.style.display = "block";
    btn.setAttribute("aria-label", "이메일 주소가 복사되었습니다");
    tooltip.textContent = "복사됨!";
    tooltip.classList.add("is-visible");
    if (prefersReducedMotion()) {
      tooltip.classList.add("is-instant");
    }

    resetTimer = setTimeout(function () {
      mailIcon.style.display = "";
      checkIcon.style.display = "";
      btn.setAttribute("aria-label", "이메일 주소 복사");
      tooltip.classList.remove("is-visible");
      tooltip.classList.remove("is-instant");
      tooltip.textContent = "";
      resetTimer = null;
    }, 2000);
  }

  function fallbackMailto() {
    window.location.href = "mailto:" + email;
  }

  btn.addEventListener("click", function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(showCopied, fallbackMailto);
    } else {
      fallbackMailto();
    }
  });
})();
