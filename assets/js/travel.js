// 여행 갤러리: assets/images/travel/index.json 기반 인스타그램식 정사각 그리드 +
// 같은 국가 폴더 사진을 좌우로 넘겨보는 라이트박스.
// 포스트 모달(modal.js), 아카이브(archive.js)와 동일한 상호작용 패턴
// (포커스 트랩 / ESC·backdrop 닫기 / 스크롤 락)을 이 파일 안에서 독립적으로 구현한다.
(function () {
  var grid = document.getElementById("travel-grid");
  var backdrop = document.getElementById("lightbox-backdrop");
  var dialog = document.getElementById("lightbox-dialog");
  var imageEl = document.getElementById("lightbox-image");
  var flagEl = document.getElementById("lightbox-flag");
  var countEl = document.getElementById("lightbox-count");
  var prevBtn = document.getElementById("lightbox-prev");
  var nextBtn = document.getElementById("lightbox-next");
  var closeBtn = document.getElementById("lightbox-close");

  if (!grid || !backdrop || !dialog) return;

  var manifest = [];
  var currentCountry = null;
  var currentIndex = 0;
  var lastFocusedEl = null;
  var closeTimer = null;
  var touchStartX = null;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function findEntry(country) {
    return manifest.filter(function (e) {
      return e.country === country;
    })[0];
  }

  // travel/index.json의 folder는 폴더명 그대로("Czech Republic"처럼 공백 포함
  // 가능)라 세그먼트를 encodeURIComponent로 인코딩해야 안전하다.
  function photoUrl(entry, filename) {
    return "assets/images/travel/" + encodeURIComponent(entry.folder) + "/" + encodeURIComponent(filename);
  }

  function buildCard(entry) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "travel-card";
    button.setAttribute("aria-label", entry.flag + " 사진 보기 (" + entry.photos.length + "장)");

    var img = document.createElement("img");
    img.className = "travel-card__image";
    img.src = photoUrl(entry, entry.cover);
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";

    var flag = document.createElement("span");
    flag.className = "travel-card__flag";
    flag.setAttribute("aria-hidden", "true");
    flag.textContent = entry.flag;

    button.appendChild(img);
    button.appendChild(flag);

    button.addEventListener("click", function () {
      openLightbox(entry.country, 0, button);
    });

    return button;
  }

  function renderGrid() {
    grid.innerHTML = "";
    manifest.forEach(function (entry) {
      grid.appendChild(buildCard(entry));
    });
  }

  function renderSlide() {
    var entry = findEntry(currentCountry);
    if (!entry) return;

    imageEl.src = photoUrl(entry, entry.photos[currentIndex]);
    imageEl.alt = entry.flag + " 여행 사진 " + (currentIndex + 1) + " / " + entry.photos.length;
    flagEl.textContent = entry.flag;
    countEl.textContent = currentIndex + 1 + " / " + entry.photos.length;

    var hasMultiple = entry.photos.length > 1;
    prevBtn.hidden = !hasMultiple;
    nextBtn.hidden = !hasMultiple;
  }

  function showPrev() {
    var entry = findEntry(currentCountry);
    if (!entry || entry.photos.length < 2) return;
    currentIndex = (currentIndex - 1 + entry.photos.length) % entry.photos.length;
    renderSlide();
  }

  function showNext() {
    var entry = findEntry(currentCountry);
    if (!entry || entry.photos.length < 2) return;
    currentIndex = (currentIndex + 1) % entry.photos.length;
    renderSlide();
  }

  function getFocusableEls() {
    var selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.slice
      .call(dialog.querySelectorAll(selector))
      .filter(function (el) {
        return !el.hidden;
      });
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrev();
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
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
    if (event.target === backdrop) closeLightbox();
  }

  function handleTouchStart(event) {
    touchStartX = event.changedTouches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (touchStartX === null) return;
    var delta = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;

    var threshold = 40;
    if (delta > threshold) showPrev();
    else if (delta < -threshold) showNext();
  }

  function openLightbox(country, index, triggerEl) {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    currentCountry = country;
    currentIndex = index || 0;
    lastFocusedEl = triggerEl || null;

    renderSlide();

    backdrop.removeAttribute("hidden");
    document.documentElement.classList.add("no-scroll");

    document.addEventListener("keydown", handleKeydown, true);
    backdrop.addEventListener("click", handleBackdropClick);
    dialog.addEventListener("touchstart", handleTouchStart, { passive: true });
    dialog.addEventListener("touchend", handleTouchEnd, { passive: true });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        backdrop.classList.add("is-open");
        dialog.focus();
      });
    });
  }

  function closeLightbox() {
    if (backdrop.hasAttribute("hidden")) return;

    backdrop.classList.remove("is-open");
    document.documentElement.classList.remove("no-scroll");

    document.removeEventListener("keydown", handleKeydown, true);
    backdrop.removeEventListener("click", handleBackdropClick);
    dialog.removeEventListener("touchstart", handleTouchStart);
    dialog.removeEventListener("touchend", handleTouchEnd);

    var duration = prefersReducedMotion() ? 0 : 200;
    closeTimer = window.setTimeout(function () {
      backdrop.setAttribute("hidden", "");
      if (lastFocusedEl) lastFocusedEl.focus();
      closeTimer = null;
    }, duration);
  }

  prevBtn.addEventListener("click", showPrev);
  nextBtn.addEventListener("click", showNext);
  closeBtn.addEventListener("click", closeLightbox);

  fetch("assets/images/travel/index.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      manifest = data;
      renderGrid();
    });
})();
