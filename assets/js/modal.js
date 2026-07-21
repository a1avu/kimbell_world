// 포스트 모달: 열기/닫기, 포커스 트랩, 스크롤 잠금
// 콘텐츠 소스(하드코딩 vs posts/ 데이터)와 무관한 모달 자체의 동작만 담당한다.
// posts.js가 window.PostModal.setContent()로 내용을 채운 뒤 open()을 호출한다.
(function () {
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

  function enhanceCodeBlocks() {
    var blocks = Array.prototype.slice.call(bodyEl.querySelectorAll("pre > code"));
    blocks.forEach(function (codeEl) {
      var pre = codeEl.parentElement;
      var match = codeEl.className.match(/language-(\S+)/);
      var lang = match ? match[1] : "";

      var wrapper = document.createElement("div");
      wrapper.className = "code-block";
      pre.parentElement.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      if (lang) {
        var label = document.createElement("div");
        label.className = "code-block__lang";
        label.textContent = lang;
        wrapper.insertBefore(label, pre);
      }
    });
  }

  function setContent(meta, bodyHtml) {
    categoryEl.textContent = meta.category || "";
    titleEl.textContent = meta.title || "";
    openPageEl.href = "#" + meta.slug;
    bodyEl.innerHTML = bodyHtml;
    enhanceCodeBlocks();
    bodyEl.scrollTop = 0;
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

  function openModal(triggerEl) {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    lastFocusedEl = triggerEl || null;

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

    backdrop.dispatchEvent(new CustomEvent("postmodal:closed"));

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

  closeBtn.addEventListener("click", closeModal);

  window.PostModal = {
    setContent: setContent,
    open: openModal,
    close: closeModal,
    isOpen: function () {
      return !backdrop.hasAttribute("hidden");
    },
    backdrop: backdrop,
  };
})();
