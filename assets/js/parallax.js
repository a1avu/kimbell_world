// 히어로 배경 3레이어(sky/palace-dragon/traveler-cliff) 스크롤 패럴랙스
(function () {
  var hero = document.getElementById("hero");
  if (!hero) return;

  var sky = hero.querySelector(".hero__layer--sky");
  var palace = hero.querySelector(".hero__layer--palace");
  var traveler = hero.querySelector(".hero__layer--traveler");
  if (!sky || !palace || !traveler) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var ticking = false;

  function update() {
    ticking = false;

    var heroHeight = hero.offsetHeight || 1;
    var top = hero.getBoundingClientRect().top;
    var progress = Math.min(1, Math.max(0, -top / heroHeight));

    sky.style.transform = "translateY(" + (-progress * heroHeight * 0.12) + "px)";

    var palaceY = -progress * heroHeight * 0.22;
    var palaceScale = 1 + progress * 0.15;
    palace.style.transform = "translateY(" + palaceY + "px) scale(" + palaceScale + ")";

    var travelerY = progress * heroHeight * 1.1;
    var travelerOpacity = Math.max(0, 1 - progress * 1.6);
    traveler.style.transform = "translateY(" + travelerY + "px)";
    traveler.style.opacity = String(travelerOpacity);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
