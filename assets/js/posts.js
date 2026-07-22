// posts/index.json + posts/*.md 를 읽어 카드 목록을 그리고,
// 카드 클릭 시 marked.js로 렌더링한 본문을 모달에 채운 뒤 해시 라우팅을 관리한다.
(function () {
  var HOME_CARD_COUNT = 6;

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

  // Obsidian 위키링크([[...]], ![[...]])는 posts/ 안에 실제 링크 대상이나
  // 이미지 파일이 없어 그대로 두면 브래킷이 텍스트로 노출된다. 내부 링크
  // 기능을 새로 만들지 않고, 코드 블록(```/~~~) 안은 건드리지 않은 채
  // 브래킷만 벗겨 일반 텍스트로 보이게 한다.
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

  // posts/index.json의 path는 posts/ 기준 상대 경로(예: "OSCP/리눅스/dog.md").
  // 한글/공백이 섞인 폴더명이 있어 세그먼트별로 encodeURIComponent 필요.
  function postUrl(post) {
    return "posts/" + post.path.split("/").map(encodeURIComponent).join("/");
  }

  function showPost(slug, triggerEl, options) {
    var post = findPost(slug);
    if (!post) return;

    fetch(postUrl(post))
      .then(function (res) {
        return res.text();
      })
      .then(function (raw) {
        var body = cleanWikilinks(stripFrontmatter(raw));
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
