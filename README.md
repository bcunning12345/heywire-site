# HEYwire website

Marketing site for HEYwire, the low-voltage service brand of ETHIC Global LLC. Static site built with [Eleventy](https://www.11ty.dev/), no framework, no build step beyond templating. Deploys to any static host (Cloudflare Pages, Netlify, Vercel, GitHub Pages, or an S3 bucket).

## Run it

```bash
npm install
npm run dev        # http://localhost:8080 with live reload
npm run build      # writes the site to dist/
```

## Where things live

| Path | What it is |
|---|---|
| `src/_data/site.json` | All site-wide content: contact details, nav, services, steps, proof points, FAQ. Edit copy here first. |
| `src/*.njk` | One file per page: home, services, how-it-works, for-hotels, pricing, say-hey, 404. |
| `src/_includes/layouts/base.njk` | The HTML shell: head, header, footer, scripts. |
| `src/_includes/partials/` | Reusable blocks: header, footer, quote card, steps, proof band, CTA. |
| `src/_includes/svg/` | Inline logo and icon SVGs. |
| `src/assets/css/site.css` | All styles. Design tokens are at the top. |
| `src/assets/js/site.js` | Mobile nav. |
| `src/assets/js/quote.js` | The Say HEY form. Demo mode until an endpoint is set. |
| `src/assets/img/logo/` | The full logo asset set (SVG). |
| `src/assets/fonts/` | Archivo, self-hosted. |
| `brand/` | Brand sheet, application mockups, and the logo asset zip. |

## Content still to fill

Bracketed placeholders in `src/_data/site.json` and the pricing page:

- `region`, `phone`, `phoneHref`, `email`, `address`, `license`
- `turnstileSiteKey`: set to the real HEYwire site key (Cloudflare account brian@ethicglobal.com, widget "HEYwire site"). The matching secret key is in the local `.env` as `TURNSTILE_SECRET_KEY` and must be copied to the quote endpoint's environment.
- Pricing page: per-drop starting price, run-length threshold, lift height, warranty length
- Any claim you want to soften or confirm: same-day quote turnaround (next day for complex projects), 30-day price hold, callback within the hour, workmanship warranty

## Wiring the quote form to the estimator

`quote.js` posts the form as `multipart/form-data` to `site.quoteEndpoint` when it is set. Point it at an API route on the ethic-estimator app (for example `https://<estimator-host>/api/quotes`) that accepts these fields:

| Field | Value |
|---|---|
| `property` | One of `site.propertyTypes`, e.g. `Hotel or resort` |
| `service` | Service slug, e.g. `wifi` |
| `quantity` | Number as a string |
| `zip` | Property ZIP code (5 digits, optional +4) |
| `area` | `live`, `soon`, or `waitlist` (non-US input never submits), decided client-side from `site.serviceAreas` by ZIP prefix; `unknown` if the lookup failed. Re-check server-side. |
| `areaName` | Matching service area name, or empty |
| `timing` | One of the four timing options |
| `notes` | Free text |
| `asbuilt` | `yes` when the as-built drawings add-on is ticked, otherwise absent |
| `files` | Zero or more attached site plans / drawings (repeated field; up to 10 files, 25 MB total, enforced client-side) |
| `name`, `company`, `email`, `phone` | Contact |
| `submittedAt`, `source` | ISO-8601 timestamp and `getheywire.com` |

It should respond with JSON `{ "ok": true }` (optionally `quoteId` and `message`). Until then the form runs in demo mode: it validates, waits a moment, and shows the confirmation panel without sending anything.

Quotes are not automated on the customer side: the site promises a written price usually the same day, next day for complex projects. Keep that promise in mind if the estimator ever replies with a number directly.

The estimator will need CORS enabled for the site's origin.

## Service areas (geo-fencing the quote, not the site)

Every page is public everywhere. The property ZIP on the Say HEY form decides what happens next, using `serviceAreas` in `src/_data/site.json`:

```json
{ "slug": "phoenix", "name": "Greater Phoenix", "note": "Phoenix, Scottsdale, …", "status": "live", "zipRanges": [["850", "853"]] }
```

- `zipRanges` are inclusive ranges of 3-digit ZIP prefixes. A ZIP matches an area if its first three digits fall inside any range.
- Anything that is not a 5-digit US ZIP (a Canadian or UK postcode, say) is `outside`: the hint says US only, the field is marked invalid, and the form will not submit. International work is excluded on purpose.
- `status` is `live` (normal same-day quote) or `soon` (job accepted, "first in line" messaging). Any ZIP that matches no area is a `waitlist` lead: the form still submits, with `area=waitlist`, and the confirmation panel says we are not there yet.
- To open a metro: add an entry (or flip `soon` to `live`), commit, push. The "Where we're live" section on the home page, the sidebar on Say HEY, and the inline hint under every ZIP field all read from the same list.
- The estimator should treat the client-side `area` value as a hint and re-derive it from `zip` with the same list, since region will also drive labor rates and travel adders.

## Spam protection (Cloudflare Turnstile)

The Say HEY form carries a [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) widget. It is free, needs no Cloudflare hosting, and almost never shows a puzzle. Setup:

1. In the Cloudflare dashboard, **Turnstile → Add widget**. Hostnames: `getheywire.com`, `www.getheywire.com` (add `localhost` for local testing). Mode: Managed. You get a **site key** and a **secret key**.
2. Put the site key in `src/_data/site.json` as `turnstileSiteKey` (done: widget "HEYwire site", hostnames getheywire.com, www.getheywire.com, localhost). Cloudflare's public test key `1x00000000000000000000AA` renders the widget with a red "testing only" strip and always passes; useful when working on the form. Setting it to `""` removes the widget entirely.
3. The browser posts the token as the `cf-turnstile-response` field. The quote endpoint must verify it before trusting the submission: POST `secret` and `response` (plus the client IP as `remoteip`) to `https://challenges.cloudflare.com/turnstile/v0/siteverify` and reject the request unless the JSON reply has `"success": true`. Keep the secret key on the server only, never in this repo.

`quote.js` refuses to submit until the widget has produced a token, and resets the widget if the endpoint returns an error so the customer can try again.

## Brand rules in code

- Page background is bone (`--bone`), cards are white. Never the other way round.
- The four pair colors appear only in the logo's stripped end and the small inline stripe on the home page. No stripe across the top of pages.
- "Say HEY" is the label on every primary button.
- Type is Archivo only: Black for headlines, Regular for body, Medium for eyebrows and labels.
- The ™ is part of the logo artwork on every version, including the mark alone. Never remove it, and never type a separate ™ next to the logo.
