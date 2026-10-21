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
    el.appendChild(document.createTextNode("?"));
  };

  let i = Math.max(0, words.indexOf(el.textContent.trim().replace(/\?$/, "")));
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

// Service areas: ZIP → { status: "live" | "soon" | "waitlist", area }.
// Data comes from site.json (serviceAreas) via the #service-areas JSON block.
(function () {
  let areas = [];
  try { areas = JSON.parse(document.getElementById("service-areas")?.textContent || "[]"); } catch {}
  const inRange = (prefix, [lo, hi]) => prefix >= lo && prefix <= hi;
  window.heywireArea = function (zip) {
    const raw = String(zip || "").trim();
    if (!raw) return null;
    const m = raw.match(/^(\d{5})(?:-\d{4})?$/);
    if (!m) return { status: "outside", area: null }; // not a US ZIP: international or a typo
    const prefix = m[1].slice(0, 3);
    const area = areas.find((a) => (a.zipRanges || []).some((r) => inRange(prefix, r)));
    return area ? { status: area.status, area } : { status: "waitlist", area: null };
  };
  window.heywireAreaText = function (result) {
    if (!result) return "";
    if (result.status === "live") return "Live in " + result.area.name + ". Same-day quote.";
    if (result.status === "soon") return "Crews are onboarding in " + result.area.name + " now. Say HEY and you are first in line.";
    if (result.status === "outside") return "US ZIP codes only. HEYwire does not quote properties outside the United States.";
    return "Not there yet. Say HEY and we will put you first in line for your area.";
  };

  // Inline hint under any ZIP field.
  document.querySelectorAll("input[name=zip]").forEach((input) => {
    const hint = input.closest(".field")?.querySelector(".field__area");
    if (!hint) return;
    const update = () => {
      const r = window.heywireArea(input.value);
      hint.textContent = window.heywireAreaText(r);
      hint.dataset.status = r ? r.status : "";
      input.setCustomValidity(r && r.status === "outside" ? "HEYwire quotes US properties only. Enter a 5-digit US ZIP code." : "");
    };
    input.addEventListener("input", update);
    input.addEventListener("heywire:prefill", update);
    update();
  });
})();
