// Say HEY quote form.
// Demo mode until `quoteEndpoint` is set in src/_data/site.json. When set, the form
// posts multipart/form-data to that URL (intended for the ethic-estimator API): every
// field by name, plus any attached site plans under `files`. It expects a JSON
// response of the shape { ok: true, quoteId?: string, message?: string }.
(function () {
  const form = document.getElementById("quote-form");
  if (!form) return;

  const endpoint = form.dataset.endpoint || "";
  const status = document.getElementById("quote-status");
  const done = document.getElementById("quote-done");
  const summary = document.getElementById("quote-summary");
  const submit = form.querySelector('button[type="submit"]');

  // ---- attachments (site plans / drawings) ----
  const MAX_FILES = 10;
  const MAX_BYTES = 25 * 1024 * 1024;
  const fileInput = document.getElementById("quote-files");
  const fileList = document.getElementById("file-list");
  const dropzone = fileInput ? fileInput.closest(".dropzone") : null;
  let files = [];

  const fmtSize = (n) => (n >= 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");

  const renderFiles = () => {
    if (!fileList) return;
    fileList.innerHTML = files
      .map((f, i) => `<li class="file-list__item"><span class="file-list__name">${escapeHtml(f.name)}</span><span class="file-list__size">${fmtSize(f.size)}</span><button type="button" class="file-list__remove" data-index="${i}" aria-label="Remove ${escapeHtml(f.name)}">&times;</button></li>`)
      .join("");
    if (dropzone) dropzone.classList.toggle("has-files", files.length > 0);
  };

  const addFiles = (incoming) => {
    const next = [...files];
    let total = next.reduce((s, f) => s + f.size, 0);
    for (const f of incoming) {
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
      if (next.length >= MAX_FILES) { setStatus(`Up to ${MAX_FILES} files per HEY. Zip the rest or send them by email.`, "error"); break; }
      if (total + f.size > MAX_BYTES) { setStatus("That pushes the attachments past 25 MB. Drop a file or email the big ones.", "error"); continue; }
      next.push(f); total += f.size;
    }
    files = next;
    renderFiles();
  };

  if (fileInput) {
    fileInput.addEventListener("change", () => { addFiles(Array.from(fileInput.files || [])); fileInput.value = ""; });
    fileList.addEventListener("click", (e) => {
      const btn = e.target.closest(".file-list__remove");
      if (!btn) return;
      files.splice(Number(btn.dataset.index), 1);
      renderFiles();
      setStatus("", "");
    });
    ["dragenter", "dragover"].forEach((t) => dropzone.addEventListener(t, (e) => { e.preventDefault(); dropzone.classList.add("is-over"); }));
    ["dragleave", "drop"].forEach((t) => dropzone.addEventListener(t, (e) => { e.preventDefault(); dropzone.classList.remove("is-over"); }));
    dropzone.addEventListener("drop", (e) => addFiles(Array.from(e.dataTransfer?.files || [])));
  }

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

    const body = new FormData(form);

    // Cloudflare Turnstile: the widget adds a hidden cf-turnstile-response field once
    // the check passes. The endpoint must verify that token server-side (see README).
    if (form.querySelector(".cf-turnstile") && !body.get("cf-turnstile-response")) {
      setStatus("One more thing: finish the quick human check above, then Say HEY.", "error");
      return;
    }

    body.delete("files");
    files.forEach((f) => body.append("files", f, f.name));
    body.set("submittedAt", new Date().toISOString());
    body.set("source", "getheywire.com");

    submit.disabled = true;
    setStatus("Sending your job…", "busy");

    try {
      if (endpoint) {
        const res = await fetch(endpoint, { method: "POST", body });
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
        ["As-builts", form.elements.asbuilt && form.elements.asbuilt.checked ? "Added" : ""],
        ["Attached", files.length ? files.length + (files.length === 1 ? " file" : " files") : ""],
      ]
        .filter(([, v]) => v)
        .map(([k, v]) => `<div class="summary__row"><span>${k}</span><strong>${escapeHtml(v)}</strong></div>`)
        .join("");

      form.hidden = true;
      done.hidden = false;
      done.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setStatus("Something went wrong on our end. Email " + (form.dataset.contact || "us") + " and we will price it by hand.", "error");
      submit.disabled = false;
      if (window.turnstile) window.turnstile.reset();
    }
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
})();
