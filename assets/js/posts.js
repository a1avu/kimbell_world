// posts/index.json + posts/*.md 를 읽어 카드 목록을 그리고,
// 카드 클릭 시 marked.js로 렌더링한 본문을 모달에 채운 뒤 해시 라우팅을 관리한다.
(function () {
  var HOME_CARD_COUNT = 5;

  var grid = document.getElementById("post-grid");
  if (!grid || !window.PostModal) return;

  var manifest = [];

  function findPost(slug) {
    return manifest.filter(function (p) {
      return p.slug === slug;
    })[0];
  }

  function stripFrontmatter(raw) {
    var match = raw.match(/^---\n[\s\S]*?\n---\n/);
    return match ? raw.slice(match[0].length) : raw;
  }

  function buildCard(post) {
    var article = document.createElement("article");
    article.className = "post-card scroll-frame";

    var link = document.createElement("a");
    link.className = "post-card__link";
    link.href = "#" + post.slug;

    var meta = document.createElement("div");
    meta.className = "post-card__meta";

    var category = document.createElement("span");
    category.className = "post-card__category";
    category.textContent = post.category;

    var date = document.createElement("span");
    date.className = "post-card__date";
    date.textContent = post.date.replace(/-/g, ".");

    meta.appendChild(category);
    meta.appendChild(date);

    var title = document.createElement("h3");
    title.className = "post-card__title";
    title.textContent = post.title;

    var excerpt = document.createElement("p");
    excerpt.className = "post-card__excerpt";
    excerpt.textContent = post.excerpt;

    var readingTime = document.createElement("span");
    readingTime.className = "post-card__reading-time";
    readingTime.textContent = post.readingTime + "분 분량";

    link.appendChild(meta);
    link.appendChild(title);
    link.appendChild(excerpt);
    link.appendChild(readingTime);
    article.appendChild(link);

    link.addEventListener("click", function (event) {
      event.preventDefault();
      showPost(post.slug, link, { pushHistory: true });
    });

    return article;
  }

  function renderCards(posts) {
    grid.innerHTML = "";
    posts.forEach(function (post) {
      grid.appendChild(buildCard(post));
    });
  }

  function showPost(slug, triggerEl, options) {
    var post = findPost(slug);
    if (!post) return;

    fetch("posts/" + slug + ".md")
      .then(function (res) {
        return res.text();
      })
      .then(function (raw) {
        var body = stripFrontmatter(raw);
        var html = marked.parse(body);
        window.PostModal.setContent(post, html);
        window.PostModal.open(triggerEl);
        if (options && options.pushHistory) {
          history.pushState({ slug: slug }, "", "#" + slug);
        }
      });
  }

  window.PostModal.backdrop.addEventListener("postmodal:closed", function () {
    if (location.hash) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  });

  window.addEventListener("popstate", function () {
    var slug = location.hash.replace(/^#/, "");
    if (slug && findPost(slug)) {
      if (!window.PostModal.isOpen()) {
        showPost(slug, null, { pushHistory: false });
      }
    } else if (window.PostModal.isOpen()) {
      window.PostModal.close();
    }
  });

  fetch("posts/index.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      manifest = data;
      renderCards(manifest.slice(0, HOME_CARD_COUNT));

      var initialSlug = location.hash.replace(/^#/, "");
      if (initialSlug && findPost(initialSlug)) {
        showPost(initialSlug, null, { pushHistory: false });
      }
    });
})();
