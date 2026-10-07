# Deploying HEYwire

The site is static. Railway builds it from GitHub and serves `dist/` with `server.js`. Every push to `main` redeploys.

## First-time setup on Railway (about five minutes, dashboard only)

1. Sign in at https://railway.app with the same GitHub account that owns this repo.
2. **New Project → Deploy from GitHub repo** → pick `heywire-site`. Railway reads `railway.json`, runs `npm ci` and `npm run build`, then `npm start`.
3. Open the service → **Settings → Networking → Generate Domain**. You get a `*.up.railway.app` URL for previews and sharing.
4. No variables are required. Railway sets `PORT` itself.

## When it is time to go live

1. **Settings → Networking → Custom Domain** → add `getheywire.com` (and `www`). Railway shows the DNS records to create.
2. Update `url` in `src/_data/site.json` to the final domain and push.
3. Point the quote form at the estimator by setting `quoteEndpoint` in `src/_data/site.json` (see README).

## Holding page before launch

The coming-soon page lives at `/soon/` in every build. To put it up on the real domain before the full site launches:

1. In Railway, open the service → **Variables** → add `HOLDING` = `1`. The service restarts and every page request serves the holding page; assets keep working.
2. Point DNS at Railway (Networking → Custom Domain).
3. On launch day, delete the `HOLDING` variable. The full site is live at once, no redeploy needed.

**Reviewing the full site while the holding page is up.** Open `https://www.getheywire.com/?preview=heywire` once. That sets a cookie in that browser for 30 days, and every page then shows the full site for you only; everyone else still sees the holding page. To go back to seeing the holding page, open `/?preview=off`. The key is `PREVIEW_KEY` in Railway's variables if you want to change it from the default.

For any other host, `npm run build && node scripts/export-holding.mjs` writes `holding/heywire-holding.html`, a single file with the fonts and icon inlined. Upload it as `index.html` anywhere.

## Day to day

- Edit copy in `src/_data/site.json` or the page files, commit, push. Railway rebuilds in about a minute.
- Preview locally first with `npm run dev`.
- To test the production server locally: `npm run build && npm start`, then open http://localhost:3000.

## Notes

- `PATH_PREFIX` is only for hosting under a sub-path (for example GitHub Pages). Railway serves from the root, so leave it unset.
- The `brand/` folder is ignored by git on purpose so the brand PDFs and logo package stay out of the public repo.
