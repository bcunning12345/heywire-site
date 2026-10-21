// Site-wide behavior: mobile navigation toggle.
(function () {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // Close the menu when the viewport grows past the mobile breakpoint.
  const mq = window.matchMedia("(min-width: 900px)");
  mq.addEventListener("change", (e) => { if (e.matches) setOpen(false); });
})();

// Home page headline: cycles the thing that needs wiring.
(function () {
  const el = document.querySelector(".rotator[data-rotate]");
  if (!el) return;
  const words = el.dataset.rotate.split("|").map((w) => w.trim()).filter(Boolean);
  if (words.length < 2) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let i = words.indexOf(el.textContent.trim());
  const HOLD = 2200, OUT = 240;

  const tick = () => {
    if (document.hidden) return;
    el.classList.add("is-out");
    setTimeout(() => {
      i = (i + 1) % words.length;
      el.textContent = words[i];
      el.classList.remove("is-out");
      el.classList.add("is-in");
      void el.offsetWidth; // restart the transition from the "in" start state
      el.classList.remove("is-in");
    }, OUT);
  };
  setInterval(tick, HOLD);
})();
