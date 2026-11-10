# Third-Party Event Pipeline Estimator

An interactive, client-side forecasting tool that estimates the new pipeline a B2B team could generate by sponsoring a third-party industry conference. It combines sponsorship-footprint engagement assumptions with two years of historical Sumo Logic funnel conversion rates.

- **Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Lucide icons · pdf-lib
- **Hosting:** static files only. No backend, database, login or API keys.
- **Fonts:** Archivo, Inter and IBM Plex Mono (SIL Open Font License), loaded from Google Fonts

---

## 1. Run it locally

You need **Node.js 20.19+** (22 LTS recommended). Check with `node -v`.

```bash
cd event-pipeline-estimator
npm install        # first time only
npm run dev        # opens http://localhost:5173
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm test` | Runs the model tests (default = $1,088,000, every footprint, every activation, the cap, conversions, NaN/negative guards) |
| `npm run typecheck` | Strict TypeScript check |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves the production build locally |

---

## 2. Deploy publicly (free)

### Option A: Vercel (recommended)

1. Create a free account at [vercel.com](https://vercel.com) (sign in with GitHub).
2. Push this folder to a new GitHub repository:
   ```bash
   git init && git add . && git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/event-pipeline-estimator.git
   git push -u origin main
   ```
3. In Vercel: **Add New → Project → Import** the repository. Vercel reads `vercel.json` (framework **Vite**, build `npm run build`, output `dist`), so you can accept the defaults.
4. Click **Deploy**. You'll get a URL like `event-pipeline-estimator.vercel.app`.
5. Optional: **Settings → Domains** to add a custom domain such as `pipeline.yourname.com`.

No-GitHub alternative: `npm i -g vercel`, then run `vercel` (preview) and `vercel --prod` from this folder.

### Option B: Netlify

1. Create a free account at [netlify.com](https://netlify.com).
2. **Fastest:** run `npm run build`, then drag the `dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).
3. **With auto-deploys:** **Add new site → Import an existing project → GitHub**. `netlify.toml` sets the build command and publish folder.

### Any other static host

Run `npm run build` and upload the contents of `dist/`. Asset paths are relative (`base: './'`), so the build also works from a sub-folder such as `yoursite.com/tools/pipeline/`.

---

## 3. Update the calculator later

All model numbers and copy live in two files:

| To change… | Edit |
| --- | --- |
| Sponsorship base rates, activation uplifts, 25% cap, historical conversion defaults, default attendees / deal size | `src/lib/model.ts` |
| Methodology text, disclaimer, estimate note (used on the page **and** in the PDF / copied summary) | `src/lib/content.ts` |
| Hero copy | `src/components/Hero.tsx` |
| Colors and fonts | `@theme` block in `src/index.css` (plus the font `<link>` in `index.html`) |
| PDF layout | `src/lib/pdf.ts` |

After a change, run `npm test` (update the expected values in `tests/model.test.ts` if you changed a default on purpose), then commit and push. Vercel or Netlify will redeploy automatically.

---

## 4. Link or embed it from your portfolio

**Link (best experience):** a "Launch the estimator →" button to your deployed URL, opening in a new tab.

**Embed with an iframe:**

```html
<iframe
  src="https://event-pipeline-estimator.vercel.app"
  title="Third-Party Event Pipeline Estimator"
  style="width:100%; height:1100px; border:0;"
  loading="lazy"
></iframe>
```

Notes for embedding:
- The page is long, so give the iframe a generous height (or link out on mobile).
- PDF download works inside an iframe. **Copy to clipboard** needs the iframe to allow it: add `allow="clipboard-write"` to the iframe tag.
- Some site builders (Squarespace, Webflow, Framer, WordPress) have an "Embed / Custom code" block. Paste the snippet there.

---

## 5. How it works

```
Engagement rate     = footprint base + selected activation uplifts   (capped at 25%)
Engaged attendees   = attendees × engagement rate
MQLs                = engaged × engagement→MQL %
Sales meetings      = MQLs × MQL→meeting %
Opportunities       = meetings × meeting→opportunity %
New pipeline        = opportunities × average opportunity value
```

- One function, `calculateForecast()` in `src/lib/model.ts`, drives the results, the scenario table, the PDF and the copied summary, so they can never disagree.
- Intermediate values are kept at full precision. Counts are rounded only for display, which is why the default shows **22 opportunities** but **$1,088,000** (21.76 × $50,000) rather than $1,100,000.
- Inputs are sanitized (no negatives, no NaN/Infinity), conversion rates are clamped to 0–100%, attendees to 1–10,000,000 and deal size to $1B.

### Project structure

```
src/
  lib/model.ts          calculation engine + all assumptions
  lib/format.ts         currency / count / % formatting
  lib/content.ts        shared methodology & disclaimer copy
  lib/summary.ts        clipboard summary
  lib/pdf.ts            PDF export (pdf-lib, loaded on demand)
  hooks/useAnimatedNumber.ts
  components/           Hero, NumberField, SponsorshipSelector, ActivationToggles,
                        EngagementReadout, ConversionControl, Results,
                        ScenarioComparison, Methodology, LiveBar, SectionHeader
  App.tsx               state + layout
tests/model.test.ts     model tests (Node's built-in test runner)
```

### Accessibility

Native radio and checkbox inputs (full keyboard support, arrow keys in the footprint group), labelled fields and sliders, a skip link, visible focus rings, live-region announcements for the pipeline figure, copy/download/reset, and `prefers-reduced-motion` support.

---

*Sponsorship engagement rates and activation uplifts are illustrative planning assumptions, not validated coefficients. This tool is independently presented and is not officially endorsed by Sumo Logic.*
