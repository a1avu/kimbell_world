// 아카이브(퀘스트 로그): posts/index.json 기반 좌/우 2단 패널.
// 포스트 모달(modal.js)과는 별개의 오버레이이며, 같은 상호작용 패턴
// (포커스 트랩 / ESC·backdrop 닫기 / 스크롤 락)을 이 파일 안에서 독립적으로 구현한다.
// 라우팅: #/archive, #/archive/{slug}
(function () {
  var backdrop = document.getElementById("archive-backdrop");
  var dialog = document.getElementById("archive-dialog");
  var listEl = document.getElementById("archive-list");
  var searchInput = document.getElementById("archive-search");
  var detailEl = document.getElementById("archive-detail");
  var backBtn = document.getElementById("archive-back");
  var closeBtn = document.getElementById("archive-close");
  var navLink = document.getElementById("nav-archive-link");

  if (!backdrop || !dialog || !window.marked) return;

  var manifest = [];
  var currentSlug = null;
  var lastFocusedEl = null;
  var closeTimer = null;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function stripFrontmatter(raw) {
    var match = raw.match(/^---\n[\s\S]*?\n---\n/);
    return match ? raw.slice(match[0].length) : raw;
  }

  // posts.js와 동일한 위키링크 정리 로직 (코드 블록 내부는 보존, 브래킷만 제거).
  function stripWikilinkSyntax(line) {
    line = line.replace(/!\[\[([^\]]+)\]\]/g, function (match, inner) {
      return inner.split("|")[0];
    });
    line = line.replace(/\[\[([^\]]+)\]\]/g, function (match, inner) {
      var parts = inner.split("|");
      return parts[parts.length - 1];
    });
    return line;
  }

  function cleanWikilinks(markdown) {
    var inFence = false;
    var fenceMarker = null;
    return markdown
      .split("\n")
      .map(function (line) {
        var fenceMatch = line.match(/^\s*(```|~~~)/);
        if (fenceMatch) {
          if (!inFence) {
            inFence = true;
            fenceMarker = fenceMatch[1];
          } else if (fenceMatch[1] === fenceMarker) {
            inFence = false;
            fenceMarker = null;
          }
          return line;
        }
        return inFence ? line : stripWikilinkSyntax(line);
      })
      .join("\n");
  }

  function findPost(slug) {
    return manifest.filter(function (p) {
      return p.slug === slug;
    })[0];
  }

  // 아카이브 좌측 목록의 고정 계층 구조. 실제 Obsidian vault 폴더 트리를
  // 그대로 반영한다: category만 있으면 섹션 바로 아래 카테고리(하위 폴더
  // 없이 파일이 직접 있는 폴더)로, group + categories가 있으면 그 이름의
  // 중간 폴더 하나를 펼쳐 그 안의 하위 폴더(카테고리)들을 중첩해서 보여준다.
  // "0개여도 항상 보여줄" 카테고리(AD)도 이 구조에 그대로 포함한다.
  // 이 목록에 없는 카테고리/섹션이 데이터에 나타나면 각 레벨 끝에 자동으로 붙는다.
  var SECTION_ORDER = ["OSCP", "wargame"];
  var SECTION_STRUCTURE = {
    OSCP: [
      { category: "00_cheatsheets" },
      { group: "01_boxes", categories: ["AD", "linux", "windows"] },
      { category: "etc" },
    ],
    wargame: [
      { category: "DH" },
      { group: "시스템해킹", categories: ["dreamhack", "HTB", "시스템해킹"] },
      { group: "웹해킹", categories: ["portswigger", "웹해킹"] },
    ],
  };

  function groupByCategory(posts) {
    var map = {};
    var order = [];
    posts.forEach(function (post) {
      var cat = post.category || "미분류";
      if (!map[cat]) {
        map[cat] = [];
        order.push(cat);
      }
      map[cat].push(post);
    });
    return { map: map, order: order };
  }

  // SECTION_STRUCTURE 순서대로 카테고리/그룹 항목을 만들고, 구조에 없는
  // 새 카테고리는 섹션 맨 끝에 그대로 덧붙인다(숨기지 않음).
  function buildSectionItems(secPosts, structure, includeEmptyCategories) {
    var byCat = groupByCategory(secPosts);
    var usedCats = {};
    var items = [];

    structure.forEach(function (slot) {
      if (slot.category) {
        usedCats[slot.category] = true;
        var posts = byCat.map[slot.category] || [];
        if (posts.length === 0 && !includeEmptyCategories) return;
        items.push({ type: "category", category: slot.category, posts: posts });
      } else if (slot.group) {
        var subItems = [];
        slot.categories.forEach(function (cat) {
          usedCats[cat] = true;
          var posts = byCat.map[cat] || [];
          if (posts.length === 0 && !includeEmptyCategories) return;
          subItems.push({ category: cat, posts: posts });
        });
        if (subItems.length === 0) return;
        var totalCount = subItems.reduce(function (sum, g) {
          return sum + g.posts.length;
        }, 0);
        items.push({ type: "group", group: slot.group, categories: subItems, count: totalCount });
      }
    });

    byCat.order.forEach(function (cat) {
      if (usedCats[cat]) return;
      items.push({ type: "category", category: cat, posts: byCat.map[cat] });
    });

    return items;
  }

  // includeEmptyCategories: 기본 목록(검색 안 하는 상태)에서만 true로 넘겨서
  // AD처럼 글이 0개인 카테고리도 계속 보이게 한다. 검색 중에는 false로 넘겨서
  // 매칭 안 되는 카테고리는 그냥 사라지게 한다.
  function groupBySection(posts, includeEmptyCategories) {
    var bySection = {};
    var sectionOrder = [];

    posts.forEach(function (post) {
      var sec = post.section || "미분류";
      if (!bySection[sec]) {
        bySection[sec] = [];
        sectionOrder.push(sec);
      }
      bySection[sec].push(post);
    });

    var allSections = SECTION_ORDER.concat(
      sectionOrder.filter(function (s) {
        return SECTION_ORDER.indexOf(s) === -1;
      })
    );

    var result = [];
    allSections.forEach(function (sec) {
      var secPosts = bySection[sec] || [];
      if (secPosts.length === 0 && !includeEmptyCategories) return;

      var structure = SECTION_STRUCTURE[sec] || [];
      var items = buildSectionItems(secPosts, structure, includeEmptyCategories);
      if (items.length === 0) return;

      result.push({ section: sec, posts: secPosts, items: items });
    });

    return result;
  }

  function markActiveEntry() {
    var entries = Array.prototype.slice.call(listEl.querySelectorAll(".archive__entry"));
    entries.forEach(function (entry) {
      var isActive = entry.dataset.slug === currentSlug;
      entry.classList.toggle("is-active", isActive);
      if (isActive) {
        entry.setAttribute("aria-current", "true");
      } else {
        entry.removeAttribute("aria-current");
      }
    });
  }

  function buildCategoryGroup(group) {
    var details = document.createElement("details");
    details.className = "archive__group";
    details.open = true;

    var summary = document.createElement("summary");
    summary.className = "archive__group-summary";
    summary.textContent = group.category + " (" + group.posts.length + ")";
    details.appendChild(summary);

    var ul = document.createElement("ul");
    ul.className = "archive__group-list";

    group.posts.forEach(function (post) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.className = "archive__entry";
      a.href = "#/archive/" + post.slug;
      a.dataset.slug = post.slug;

      var titleSpan = document.createElement("span");
      titleSpan.className = "archive__entry-title";
      titleSpan.textContent = post.title;

      var dateSpan = document.createElement("span");
      dateSpan.className = "archive__entry-date";
      dateSpan.textContent = post.date.replace(/-/g, ".");

      a.appendChild(titleSpan);
      a.appendChild(dateSpan);

      a.addEventListener("click", function (event) {
        event.preventDefault();
        selectPost(post.slug, { pushHistory: true });
      });

      li.appendChild(a);
      ul.appendChild(li);
    });

    details.appendChild(ul);
    return details;
  }

  // 중간 폴더(예: "01_boxes", "시스템해킹") 하나를 감싸서 그 안의 하위
  // 카테고리들을 중첩 렌더링한다. .archive__section(섹션)과 .archive__group
  // (카테고리) 사이의 시각적 계층으로 별도 스타일을 쓴다.
  function buildGroupWrapper(item) {
    var details = document.createElement("details");
    details.className = "archive__subsection";
    details.open = true;

    var summary = document.createElement("summary");
    summary.className = "archive__subsection-summary";
    summary.textContent = item.group + " (" + item.count + ")";
    details.appendChild(summary);

    var body = document.createElement("div");
    body.className = "archive__subsection-body";
    item.categories.forEach(function (g) {
      body.appendChild(buildCategoryGroup(g));
    });
    details.appendChild(body);

    return details;
  }

  function buildList(posts, options) {
    listEl.innerHTML = "";
    var includeEmptyCategories = !(options && options.isFiltered);
    var sections = groupBySection(posts, includeEmptyCategories);

    if (sections.length === 0) {
      var empty = document.createElement("p");
      empty.className = "archive__list-empty";
      empty.textContent = "일치하는 기록이 없습니다.";
      listEl.appendChild(empty);
      return;
    }

    sections.forEach(function (sectionGroup) {
      var sectionDetails = document.createElement("details");
      sectionDetails.className = "archive__section";
      sectionDetails.open = true;

      var sectionSummary = document.createElement("summary");
      sectionSummary.className = "archive__section-summary";
      sectionSummary.textContent =
        sectionGroup.section + " (" + sectionGroup.posts.length + ")";
      sectionDetails.appendChild(sectionSummary);

      var sectionBody = document.createElement("div");
      sectionBody.className = "archive__section-body";

      sectionGroup.items.forEach(function (item) {
        if (item.type === "group") {
          sectionBody.appendChild(buildGroupWrapper(item));
        } else {
          sectionBody.appendChild(buildCategoryGroup(item));
        }
      });

      sectionDetails.appendChild(sectionBody);
      listEl.appendChild(sectionDetails);
    });

    markActiveEntry();
  }

  function filterList(query) {
    var q = query.trim().toLowerCase();
    if (!q) {
      buildList(manifest);
      return;
    }
    var filtered = manifest.filter(function (post) {
      return (
        post.title.toLowerCase().indexOf(q) !== -1 ||
        (post.category || "").toLowerCase().indexOf(q) !== -1 ||
        (post.group || "").toLowerCase().indexOf(q) !== -1 ||
        (post.excerpt || "").toLowerCase().indexOf(q) !== -1
      );
    });
    buildList(filtered, { isFiltered: true });
  }

  function renderEmptyDetail() {
    detailEl.innerHTML = '<p class="archive__empty">탐험할 기록을 선택하세요</p>';
  }

  function enhanceCodeBlocks(container) {
    var blocks = Array.prototype.slice.call(container.querySelectorAll("pre > code"));
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

  function renderDetail(post) {
    detailEl.innerHTML = '<p class="archive__loading">불러오는 중...</p>';
    fetch("posts/" + post.slug + ".md")
      .then(function (res) {
        return res.text();
      })
      .then(function (raw) {
        if (currentSlug !== post.slug) return;
        var html = marked.parse(cleanWikilinks(stripFrontmatter(raw)));
        var wrapper = document.createElement("div");

        var meta = document.createElement("div");
        meta.className = "archive__detail-meta";
        var catSpan = document.createElement("span");
        catSpan.className = "archive__detail-category";
        catSpan.textContent = post.category || "미분류";
        var dateSpan = document.createElement("span");
        dateSpan.className = "archive__detail-date";
        dateSpan.textContent = post.date.replace(/-/g, ".");
        meta.appendChild(catSpan);
        meta.appendChild(dateSpan);

        var title = document.createElement("h3");
        title.className = "archive__detail-title";
        title.textContent = post.title;

        var bodyWrap = document.createElement("div");
        bodyWrap.className = "archive__detail-body";
        bodyWrap.innerHTML = html;

        wrapper.appendChild(meta);
        wrapper.appendChild(title);
        wrapper.appendChild(bodyWrap);

        detailEl.innerHTML = "";
        detailEl.appendChild(wrapper);
        enhanceCodeBlocks(detailEl);
        detailEl.scrollTop = 0;
      });
  }

  function selectPost(slug, options) {
    var post = findPost(slug);
    if (!post) return;
    currentSlug = slug;
    dialog.setAttribute("data-mobile-view", "detail");
    markActiveEntry();
    renderDetail(post);
    if (options && options.pushHistory) {
      history.pushState({ archive: slug }, "", "#/archive/" + slug);
    }
  }

  function clearSelection(options) {
    currentSlug = null;
    dialog.setAttribute("data-mobile-view", "list");
    renderEmptyDetail();
    markActiveEntry();
    if (options && options.pushHistory) {
      history.pushState({ archive: true }, "", "#/archive");
    }
  }

  // --- 열기/닫기, 포커스 트랩, 스크롤 락 (모달과 동일한 동작 패턴) ---

  function getFocusableEls() {
    var selector = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.slice.call(dialog.querySelectorAll(selector)).filter(function (el) {
      return el.offsetParent !== null;
    });
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeArchive();
      return;
    }

    if (event.key === "Tab") {
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
      return;
    }

    if (event.target === searchInput) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      var entries = Array.prototype.slice
        .call(listEl.querySelectorAll(".archive__entry"))
        .filter(function (el) {
          return el.offsetParent !== null;
        });
      if (entries.length === 0) return;

      var idx = entries.indexOf(document.activeElement);
      var nextIdx;
      if (idx === -1) {
        nextIdx = 0;
      } else if (event.key === "ArrowDown") {
        nextIdx = (idx + 1) % entries.length;
      } else {
        nextIdx = (idx - 1 + entries.length) % entries.length;
      }
      entries[nextIdx].focus();
      event.preventDefault();
    }
  }

  function handleBackdropClick(event) {
    if (event.target === backdrop) {
      closeArchive();
    }
  }

  function openArchive(triggerEl) {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    if (window.PostModal && window.PostModal.isOpen()) {
      window.PostModal.close();
    }

    lastFocusedEl = triggerEl || document.activeElement;

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

  function closeArchive(options) {
    if (backdrop.hasAttribute("hidden")) return;

    backdrop.classList.remove("is-open");
    document.documentElement.classList.remove("no-scroll");

    document.removeEventListener("keydown", handleKeydown, true);
    backdrop.removeEventListener("click", handleBackdropClick);

    var duration = prefersReducedMotion() ? 0 : 200;
    closeTimer = window.setTimeout(function () {
      backdrop.setAttribute("hidden", "");
      if (lastFocusedEl) lastFocusedEl.focus();
      closeTimer = null;
    }, duration);

    var shouldPush = !options || options.pushHistory !== false;
    if (shouldPush && location.hash.indexOf("#/archive") === 0) {
      history.pushState(null, "", location.pathname + location.search);
    }
  }

  function isOpen() {
    return !backdrop.hasAttribute("hidden");
  }

  function parseHash() {
    var match = location.hash.match(/^#\/archive(?:\/(.+))?$/);
    if (!match) return null;
    return { slug: match[1] ? decodeURIComponent(match[1]) : null };
  }

  function applyRoute() {
    var route = parseHash();
    if (!route) {
      if (isOpen()) closeArchive({ pushHistory: false });
      return;
    }

    if (!isOpen()) {
      openArchive(navLink);
    }

    if (route.slug && findPost(route.slug)) {
      selectPost(route.slug, { pushHistory: false });
    } else {
      clearSelection({ pushHistory: false });
    }
  }

  if (navLink) {
    navLink.addEventListener("click", function (event) {
      event.preventDefault();
      openArchive(navLink);
      clearSelection({ pushHistory: false });
      history.pushState({ archive: true }, "", "#/archive");
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", function () { closeArchive(); });
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      clearSelection({ pushHistory: true });
    });
  }
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      filterList(searchInput.value);
    });
  }

  window.addEventListener("popstate", applyRoute);

  fetch("posts/index.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      manifest = data;
      buildList(manifest);
      applyRoute();
    });
})();
