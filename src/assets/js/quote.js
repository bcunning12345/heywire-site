// Say HEY quote form.
// Demo mode until `quoteEndpoint` is set in src/_data/site.json. When set, the form
// posts JSON to that URL (intended for the ethic-estimator API) and expects a JSON
// response of the shape { ok: true, quoteId?: string, message?: string }.
(function () {
  const form = document.getElementById("quote-form");
  if (!form) return;

  const endpoint = form.dataset.endpoint || "";
  const status = document.getElementById("quote-status");
  const done = document.getElementById("quote-done");
  const summary = document.getElementById("quote-summary");
  const submit = form.querySelector('button[type="submit"]');

  // Prefill from the home page quote card (?property=&service=&quantity=&location=)
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of params) {
    const el = form.elements[key];
    if (el && value) el.value = value;
  }

  const labelFor = (name) => {
    const el = form.elements[name];
    if (!el) return "";
    if (el.tagName === "SELECT") return el.options[el.selectedIndex]?.text || "";
    return el.value;
  };

  const setStatus = (text, kind) => {
    status.textContent = text;
    status.dataset.kind = kind || "";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form).entries());
    data.submittedAt = new Date().toISOString();
    data.source = "heywire.services";

    submit.disabled = true;
    setStatus("Pricing your job…", "busy");

    try {
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Request failed: " + res.status);
        const json = await res.json().catch(() => ({}));
        if (json && json.ok === false) throw new Error(json.message || "Quote could not be created.");
      } else {
        // Demo mode: simulate the round trip so the flow can be reviewed.
        await new Promise((r) => setTimeout(r, 900));
      }

      summary.innerHTML = [
        ["Property", labelFor("property")],
        ["Work", labelFor("service")],
        ["Count", labelFor("quantity")],
        ["Where", labelFor("location")],
        ["Timing", labelFor("timing")],
      ]
        .filter(([, v]) => v)
        .map(([k, v]) => `<div class="summary__row"><span>${k}</span><strong>${escapeHtml(v)}</strong></div>`)
        .join("");

      form.hidden = true;
      done.hidden = false;
      done.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setStatus("Something went wrong on our end. Call us at " + (form.dataset.phone || "the number below") + " and we will price it by hand.", "error");
      submit.disabled = false;
    }
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
})();
