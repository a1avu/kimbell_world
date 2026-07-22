// marked.js 전역 설정: 렌더링되는 <img>에 loading="lazy" 자동 부여.
// posts.js/archive.js는 이 설정이 이미 적용된 marked.parse()를 그대로 호출한다.
(function () {
  if (!window.marked || !window.marked.use) return;

  function escapeAttr(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  marked.use({
    renderer: {
      image(token) {
        var out =
          '<img src="' + escapeAttr(token.href) + '" alt="' + escapeAttr(token.text) + '" loading="lazy"';
        if (token.title) out += ' title="' + escapeAttr(token.title) + '"';
        out += ">";
        return out;
      },
    },
  });
})();
