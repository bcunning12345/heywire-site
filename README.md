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
- Pricing page: per-drop starting price, run-length threshold, lift height, warranty length
- Any claim you want to soften or confirm: quote turnaround, 30-day price hold, callback within the hour, workmanship warranty

## Wiring the quote form to the estimator

`quote.js` posts the form as JSON to `site.quoteEndpoint` when it is set. Point it at an API route on the ethic-estimator app (for example `https://<estimator-host>/api/quotes`) that accepts:

```json
{
  "property": "Hotel or resort",
  "service": "wifi",
  "quantity": "24",
  "location": "City, ST",
  "timing": "As soon as possible",
  "notes": "",
  "name": "", "company": "", "email": "", "phone": "",
  "submittedAt": "ISO-8601", "source": "getheywire.com"
}
```

and responds with `{ "ok": true }` (optionally `quoteId` and `message`). Until then the form runs in demo mode: it validates, waits a moment, and shows the confirmation panel without sending anything.

The estimator will need CORS enabled for the site's origin.

## Brand rules in code

- Page background is bone (`--bone`), cards are white. Never the other way round.
- The four pair colors appear only in the logo's stripped end and the small inline stripe on the home page. No stripe across the top of pages.
- "Say HEY" is the label on every primary button.
- Type is Archivo only: Black for headlines, Regular for body, Medium for eyebrows and labels.
- The ™ after "wire" is part of the logo artwork. Never remove it, and never type a separate ™ next to the logo.
