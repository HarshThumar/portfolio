# 05 · Tech architecture

Researched 20 Nov 2026 (versions read from the npm registry that day). **Before installing anything, re-check each version on npm.** Do not add any package that is not in this file without Harsh's approval.

## Stack

| Package | Version (20 Nov 2026) | Why |
|---|---|---|
| `astro` | 7.4.x | Static HTML pages (Scorecard view, ground pages), the 3D app as one island. Needs **Node ≥ 22.23.4** (Harsh has 22.18.0: upgrade first). No MDX in v1 (write-ups are out of scope). |
| `three` | 0.187.0 (pin exact) | 3D. Use `three/webgpu` + TSL; it falls back to WebGL2 automatically. Never mix WebGLRenderer-only addons with WebGPURenderer. |
| `@dimforge/rapier3d-compat` | 0.21.0 | Physics. The `-compat` build inlines its WASM, so no wasm plugin or MIME issues on GitHub Pages. |
| `howler` | 2.2.4 | Sound: sprites, unlock on click, mobile quirks, spatial panning |
| `gsap` | 3.15.x | Scripted sequences: the kit-to-ball opening, the hop-in dive, panel entrances |
| `@gltf-transform/cli` | 4.5.1 (dev) | Asset optimisation at build time |
| `typescript` | 5.x (dev) | Type feedback for the builder |
| `wrangler` | ≥ 4.36 (worker only) | Cloudflare Worker deploy; needed for the Rate Limiting binding |
| Dev quality tools | `eslint`, `prettier`, `knip`, `@playwright/test`, `@lhci/cli` | See [08-quality-gates.md](08-quality-gates.md) |

**Why vanilla three.js, not React Three Fiber:** a plain, explicit game loop is easier for an AI builder to get right and keeps React re-render problems out of the physics loop. Bruno Simon's 2025 portfolio uses the same approach (vanilla three.js, Rapier, Howler, GSAP, Vite). We learn from the structure; we copy no code or assets.

## Repository layout

```
d:\portfolio\
├── GEMINI.md                 builder instructions (read first)
├── PLAN.md                   index and milestones
├── DECISIONS.md              decision log
├── docs\                     this plan
├── site\                     Astro project (pages, styles, island mount)
│   ├── src\pages\            index.astro, scorecard.astro, ground\[slug].astro, 404.astro
│   ├── src\content\          grounds.json (single source for ground data)
│   ├── src\styles\           tokens.css (palette + type), paper.css
│   └── public\               fonts, OG images, favicon
├── game\                     framework-free TypeScript 3D app (no Astro imports)
│   ├── src\loop\             the ordered update stages
│   ├── src\world\            ground base, landmarks, crowd, scoreboard, weather, sky
│   ├── src\vehicle\          the roller
│   ├── src\interactions\     stumps, rope, info post, dog, rain, cheer
│   ├── src\audio\            Howler setup, sound registry, spatial mixing
│   ├── src\ui\               HUD, project panel, map (DOM, not WebGL)
│   └── src\debug\            Tweakpane-style panel behind ?debug (dev only)
├── assets-src\               Blender files, raw audio (not deployed)
├── assets\                   optimised GLB / KTX2 / audio output (deployed)
└── worker\                   Cloudflare Worker: chat + cheers
```

`grounds.json` is the single source of truth for every ground: slug, name, project id, landmark model, scoreboard values, panel text, links, sounds. Both the 3D app and the Scorecard view read it, so they can never disagree. Its content comes only from [02-content-bible.md](02-content-bible.md).

## The game loop
One `requestAnimationFrame` loop, stages in a fixed order (Bruno-style numbered stages):

```
0   time + inputs (keyboard, pointer, touch joystick)
10  vehicle input → forces
20  physics step (Rapier, fixed 60 Hz timestep, accumulator)
30  interpolate render transforms between physics steps
40  interactions (triggers: stumps, rope, info post, idle timer)
50  world updates (crowd wave, scoreboard flips, weather, sky time)
60  camera follow
70  audio (listener position, spatial sources, engine pitch)
80  render
90  UI sync (HUD, panel state), perf monitor
```
Each stage is a plain module with `update(state, dt)`. A single typed `state` object plus a tiny typed event emitter. No global singletons beyond that.

## Routing and pages (GitHub Pages friendly, no SPA tricks needed)
- Astro builds real static pages: `/`, `/scorecard/`, `/ground/<slug>/` (one per ground), `/404.html`.
- The 3D island mounts on `/` and `/ground/<slug>/` with `client:only`. Travel between grounds updates the URL with `history.pushState` and does not reload the 3D app.
- Every asset path uses `import.meta.env.BASE_URL`, never an absolute `/`.

## Hosting
- **Site:** GitHub Pages via GitHub Actions (checkout → setup-node → `npm ci` → build → `configure-pages` → `upload-pages-artifact` → `deploy-pages`). Pages source set to "GitHub Actions".
- **Open decision:** `harshthumar.github.io` already hosts the Tamarin research site (with Prince Upadhyay). Default plan: the new portfolio becomes the user site at `/`, and the research site moves to `/research/` with its URLs redirected. Harsh decides before M7 (see [DECISIONS.md](../DECISIONS.md)).
- Limits: site ≤ 1 GB, soft 100 GB/month bandwidth, deploy timeout 10 min. Pages sets its own cache headers; rely on Vite's hashed file names.
- Personal git identity per repo: `Harsh Thumar <harshthummar1000@gmail.com>`. Never the CredPrism identity.

## Cloudflare Worker (`worker/`)
One Worker, two routes.

### `POST /chat` (the commentary box)
- Model: `@cf/google/gemma-4-26b-a4b-it` (primary), `@cf/meta/llama-3.1-8b-instruct-fp8` (fallback). Pin the IDs in config; the catalogue changes.
- System prompt = a compact facts file generated from `grounds.json` + the content bible (≤ 20 KB). Rules in the prompt: answer only from these facts, cite the ground or source link for each fact, say "I don't know, email Harsh" otherwise, never speak as Harsh, short answers, no markdown headings.
- `max_tokens` capped (~300), history capped at the last 4 turns.
- Abuse control: Origin allowlist + `Vary: Origin` (a speed bump only), **Turnstile** (invisible) token checked server-side before the first message, the Rate Limiting binding (e.g. 10 requests / 60 s per visitor key), and a daily neuron budget counted in the Durable Object. Over budget → the commentary box says "Rain stopped play. The commentator is back tomorrow."
- Free tier: 10,000 neurons/day, resets 00:00 UTC.

### `GET /cheers`, `POST /cheers` (the cheer button)
- One **Durable Object** (SQLite) holds the total and per-visitor counts keyed by a salted hash (salt rotates daily; no raw IPs stored).
- Cap 6 per visitor per day. Returns `{ total, mine }`.
- KV is not used for the counter (eventual consistency loses increments).
- The page caches the total for 30–60 s and animates optimistic increments.

### CORS
Answer `OPTIONS`; return `Access-Control-Allow-Origin` with the exact allowed origin (`https://harshthumar.github.io`, plus a custom domain later), never `*`.

## Asset pipeline
```
Blender (.blend in assets-src/) → export GLB → gltf-transform optimize (dedup, prune, weld, quantize)
   → meshopt geometry compression → KTX2 textures (ETC1S colour, UASTC normals) → assets/
```
- `npm run assets` runs the pipeline; output is committed or built in CI (decide in M0).
- Meshopt over Draco (faster decode, no extra decoder download).
- Each asset row goes into `docs/asset-licences.md` (file, source, licence, URL). Allowed sources: our own work, Kenney (CC0), others only after checking the licence (CC-BY needs a credits page).

## Performance budgets (hard limits checked in CI)

| Metric | Budget |
|---|---|
| First interactive payload (intro + map) | ≤ 3 MB (hard max 5 MB) |
| Each ground (GLB + textures + sounds) | ≤ 3 MB, lazy-loaded on travel |
| Total site | ≤ 25 MB |
| Triangles on screen | ≤ 250k |
| Draw calls | ≤ 120 (aim 80) |
| Textures | ≤ 1024 px on mobile; 2048 only for the palette/lightmap atlases |
| Physics bodies | ≤ 300, sleeping enabled |
| Frame rate | 60 fps desktop; ≥ 30 fps on a mid-range Android (test device: name it in M0) |
| Pixel ratio | capped at 1.5 on mobile, dynamic resolution if fps drops |
| Scorecard view | Lighthouse ≥ 95 on Performance, Accessibility, Best Practices, SEO |

Loading order: HTML loading screen (instant) → intro scene → on the click: Rapier WASM, audio, map → ground assets on travel, with the next likely ground prefetched while idle.

## Accessibility and fallbacks
- WebGL2/WebGPU detection; no support or a very weak device → `/scorecard/` with a friendly line.
- "Skip to Scorecard view" link is the first focusable element on every page.
- Keyboard: WASD/arrows drive, Space honks, Esc opens the menu, Tab reaches every HUD control, Enter in the map list travels.
- `prefers-reduced-motion`: no camera fly-throughs or shake, fewer particles, instant transitions.
- The canvas has an `aria-label`; all canvas information exists as text on the Scorecard view and in the project panel (DOM).
- Captions: every voice-like sound (HOWZAT, the commentator) has a text equivalent.
- Day/night computed with `Intl.DateTimeFormat` and `timeZone: 'Asia/Kolkata'`, with a manual override.

## Analytics
None in v1, or a privacy-friendly cookieless option only if Harsh asks. No Google Analytics.
