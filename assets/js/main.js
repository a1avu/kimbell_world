// 모바일 내비게이션 메뉴 토글
(function () {
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("nav-menu");

  if (!toggle || !menu) return;

  toggle.addEventListener("click", function () {
    var isOpen = menu.getAttribute("data-state") === "open";
    menu.setAttribute("data-state", isOpen ? "closed" : "open");
    toggle.setAttribute("aria-expanded", String(!isOpen));
  });

  menu.addEventListener("click", function (event) {
    if (event.target.tagName === "A" && window.innerWidth < 768) {
      menu.setAttribute("data-state", "closed");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
})();
