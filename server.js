// Minimal static server for the built site (dist/). No dependencies.
// Used by Railway (npm start). Locally, `npm run dev` is the better choice.
import http from "node:http";
import { createReadStream, statSync, existsSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve("dist");
const PORT = Number(process.env.PORT) || 3000;

// HOLDING=1 serves the coming-soon page for every page request until launch.
// Static assets keep serving so the holding page can load fonts and icons.
const HOLDING = /^(1|true|yes)$/i.test(process.env.HOLDING || "");

// Preview bypass while holding: visiting /?preview=<PREVIEW_KEY> sets a cookie so that
// browser sees the full site; /?preview=off clears it. Everyone else keeps the holding page.
const PREVIEW_KEY = process.env.PREVIEW_KEY || "heywire";
const COOKIE = "hw_preview";

function hasPreviewCookie(req) {
  const raw = req.headers.cookie || "";
  return raw.split(";").some((c) => c.trim() === `${COOKIE}=${PREVIEW_KEY}`);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

// Long cache for fingerprint-free static assets is risky; keep it modest.
const cacheFor = (ext) => (ext === ".html" ? "no-cache" : "public, max-age=3600");

function send(res, status, filePath) {
  const ext = extname(filePath).toLowerCase();
  res.writeHead(status, {
    "Content-Type": TYPES[ext] || "application/octet-stream",
    "Cache-Control": cacheFor(ext),
    "X-Content-Type-Options": "nosniff",
  });
  createReadStream(filePath).pipe(res);
}

http
  .createServer((req, res) => {
    let urlPath, params;
    try {
      const u = new URL(req.url, "http://localhost");
      urlPath = decodeURIComponent(u.pathname);
      params = u.searchParams;
    } catch {
      res.writeHead(400).end("Bad request");
      return;
    }

    // Preview cookie set/clear, then redirect to the same path without the query.
    const preview = params.get("preview");
    if (preview !== null) {
      const cookie = preview === PREVIEW_KEY
        ? `${COOKIE}=${PREVIEW_KEY}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax; Secure`
        : `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`;
      res.writeHead(302, { "Set-Cookie": cookie, Location: urlPath, "Cache-Control": "no-store" }).end();
      return;
    }

    // Holding mode: anything that is not a static asset gets the coming-soon page,
    // unless this browser carries the preview cookie.
    if (HOLDING && !hasPreviewCookie(req) && !urlPath.startsWith("/assets/") && urlPath !== "/favicon.ico") {
      const holding = join(ROOT, "soon", "index.html");
      if (existsSync(holding)) {
        send(res, 200, holding);
        return;
      }
    }

    // Resolve inside dist only.
    let filePath = normalize(join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    // Directory → index.html; extensionless → try the folder form.
    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      if (!urlPath.endsWith("/")) {
        res.writeHead(301, { Location: urlPath + "/" }).end();
        return;
      }
      filePath = join(filePath, "index.html");
    } else if (!existsSync(filePath) && !extname(filePath)) {
      const asDir = join(filePath, "index.html");
      if (existsSync(asDir)) {
        res.writeHead(301, { Location: urlPath + "/" }).end();
        return;
      }
    }

    if (existsSync(filePath) && statSync(filePath).isFile()) {
      send(res, 200, filePath);
      return;
    }

    const notFound = join(ROOT, "404.html");
    if (existsSync(notFound)) send(res, 404, notFound);
    else res.writeHead(404).end("Not found");
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`heywire-site serving ${ROOT} on port ${PORT}`);
  });
