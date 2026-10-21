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

  // Each entry is "a camera", "an access point", or "digital signage" (no article).
  // The article stays in the headline color; only the thing itself is violet.
  const split = (phrase) => {
    const m = phrase.match(/^(an?)\s+(.+)$/i);
    return m ? [m[1] + " ", m[2]] : ["", phrase];
  };
  const render = (phrase) => {
    const [article, word] = split(phrase);
    el.innerHTML = "";
    if (article) { const a = document.createElement("span"); a.className = "rotator__a"; a.textContent = article; el.appendChild(a); }
    const w = document.createElement("span"); w.className = "rotator__w"; w.textContent = word; el.appendChild(w);
  };

  let i = Math.max(0, words.indexOf(el.textContent.trim()));
  const HOLD = 2200, OUT = 240;

  const tick = () => {
    if (document.hidden) return;
    el.classList.add("is-out");
    setTimeout(() => {
      i = (i + 1) % words.length;
      render(words[i]);
      el.classList.remove("is-out");
      el.classList.add("is-in");
      void el.offsetWidth; // restart the transition from the "in" start state
      el.classList.remove("is-in");
    }, OUT);
  };
  setInterval(tick, HOLD);
})();
