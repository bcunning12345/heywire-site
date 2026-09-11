// Minimal static server for the built site (dist/). No dependencies.
// Used by Railway (npm start). Locally, `npm run dev` is the better choice.
import http from "node:http";
import { createReadStream, statSync, existsSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve("dist");
const PORT = Number(process.env.PORT) || 3000;

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
    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400).end("Bad request");
      return;
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
