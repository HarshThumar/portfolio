# 07 · Build plan (milestones for the builder)

**Who does what**
- **Gemini (builder):** writes the code and Blender scripts, one task at a time, following [GEMINI.md](../GEMINI.md).
- **Exception (21 Nov 2026):** Claude builds M1B, the hub slice, because it sets the look and structure everything else copies.
- **Claude (reviewer):** reviews each milestone against [06-anti-slop.md](06-anti-slop.md) and [08-quality-gates.md](08-quality-gates.md) before it is marked done.
- **Harsh (owner):** writes and signs off all copy, signs off look, feel and sound at each checkpoint, makes every decision marked *Harsh decides*.

**How to work through it**
- Milestones run in order. Inside a milestone, tasks run in order unless marked *(parallel)*.
- Each task ends with: lint + typecheck + build + tests green, a screenshot or short clip in `progress/<task-id>.(png|mp4)`, and one line in `progress/LOG.md`.
- Every milestone ends with a **checkpoint**: Claude review, then Harsh sign-off. Nothing in the next milestone starts until the checkpoint passes.
- Estimates assume ~20 focused hours a week of builder time plus Harsh's reviews. Total about **8–9 weeks**.

---

## M0 · Foundations (week 1)
| Id | Task | Done when |
|---|---|---|
| M0.1 | Upgrade Node to ≥ 22.23.4. Install Blender (LTS) for the asset scripts. Install Gemini CLI. | `node -v` prints ≥ 22.23.4; Blender opens |
| M0.2 | `git init` in `d:\portfolio`, set the personal git identity **for this repo only**, create the private GitHub repo `HarshThumar/portfolio` (*Harsh decides* public or private until launch). | First commit is authored by the personal identity |
| M0.3 | Scaffold `site/` (Astro) and `game/` (TypeScript, three, Rapier compat, Howler, GSAP) with exact pinned versions from [05](05-tech-architecture.md). | `npm run dev` shows a blank page with a canvas |
| M0.4 | Quality tooling: ESLint (rules from 06), Prettier, knip, jscpd, the banned-words/fonts script, Playwright, Lighthouse CI, the asset budget script. One `npm run check` runs all. | `npm run check` passes on the empty project and fails when a banned word is added to a test file |
| M0.5 | GitHub Actions: `check` on every push; deploy to a **preview** Pages site (or a separate preview repo) on `main`. | A pushed commit appears at the preview URL |
| M0.6 | `site/src/content/grounds.json` filled from the content bible, with `[[COPY]]` / `[[NEEDS FACT]]` markers where Harsh must write. Facts file generator for the Worker. | JSON validates against a schema; every number matches 02 |
| M0.7 | Design tokens (`tokens.css`) with the palette; font trials page showing the 3 display-font candidates on a scoreboard, a map label and a panel. | **Harsh picks the display font** |

**Checkpoint M0:** tooling works, Harsh picked the font, `grounds.json` facts verified against 02.

## M1 · Lord's prototype (done, superseded)
Built by Gemini, reviewed and fixed by Claude on 21 Nov 2026 (game loop, physics, roller driving, Lord's scene, panel, sound, crowd, day/night). Harsh's verdict on the preview: it works but looks "bogus and too simple". Two decisions followed (see DECISIONS.md): the **Ahmedabad hub** replaces the tour map, and the art direction becomes the **handmade miniature** (docs/04). The code is kept and becomes the base for everything below.

## M1B · Hub slice: Ahmedabad + one hop-in (Claude builds this; it sets the template)
The point: prove the new look and the hub on one real path (hub → Lord's → hub) before building anything wide.
| Id | Task | Done when |
|---|---|---|
| M1B.1 | Scene system: a hub scene and ground scenes that load and dispose cleanly; the roller and HUD carry over; URL follows the scene. | Hub → ground → hub 20 times with no memory growth |
| M1B.2 | Miniature look, step 1 (code): soft real-time sun shadow for nearby objects, sky gradient with haze, warm grade, higher camera, textured grass and pitch. | Before/after screenshots; Harsh says it no longer looks "bogus" |
| M1B.3 | Ahmedabad bowl: round multi-tier stadium, roof ring with floodlights, stairways and seat rows, players' gate, sight screens, boundary boards, scoreboard (name and links). | Recognisable as the Ahmedabad stadium silhouette |
| M1B.4 | Real crowd: little people (head, arms, 3–4 poses), shader-animated, Mexican wave. | ≥ 2,000 people at 60 fps desktop |
| M1B.5 | Ground models: nine timber stands with plaques around the outfield; Lord's gets its pavilion model, the rest a simple ground model until M3. | Plaques read the ground and project title from grounds.json |
| M1B.6 | Hop-in: drive onto a mat, camera dives into the model, the ground loads full size; leaving reverses it. Reduced motion: crossfade. | Feels like one continuous world; URL becomes /ground/lords/ |
| M1B.7 | Blender pipeline for hero models (bowl pieces, Lord's pavilion, roller, people): scripts in `assets-src/`, baked AO/lightmaps, GLB + meshopt + KTX2. | One baked model in the scene within budget |

**Checkpoint M1B:** Harsh drives hub → Lord's → hub on the preview and signs off the look and feel.

## M2 · The opening and travel polish (Gemini, following the M1B template)
| Id | Task | Done when |
|---|---|---|
| M2.1 | Loading screen (the roller on a crease) with real progress. | Visible within 100 ms of first paint |
| M2.2 | Kit models: bat, pad, glove, helmet, stumps, bails, cap, ball (generic, no brands). | Each reads at a glance |
| M2.3 | The opening: kit flies together into the giant ball, seam stitches, name + positioning + play button; skippable; returning visitors skip. | Matches the timing table in 03 |
| M2.4 | The bowl-in: the ball is bowled into the Ahmedabad pitch, camera follows, the hub takes over. Reduced motion: fade. | No visible cut between opening and hub |
| M2.5 | Map list (HUD), VISITED stamps on plaques, tour card "N / 9". | Keyboard navigable; travel updates the URL |
| M2.6 | Routing: `/ground/<slug>/` loads straight into that ground; back/forward work. | Every ground URL works as a direct link |

**Checkpoint M2:** Harsh watches a first-time visitor (a friend) use it without help. Note every moment they hesitate.

## M3 · The other eight grounds and the finale
One task per ground: full-size scene (landmark, dressing, ambience, scoreboard, panel, its special moment from 03) and its miniature model for the hub. Order: Wankhede → Eden Gardens → The Oval → Galle → Sharjah → Newlands → MCG → Dharamsala.
| Id | Task | Done when (each ground) |
|---|---|---|
| M3.1–M3.8 | Ground *N* | Landmark recognisable; special moment works; ≤ 3 MB for the ground; numbers match 02; clip saved |
| M3.9 | Finale in the hub: all nine visited → standing ovation, fireworks, closing board with LinkedIn and email | Triggers once; tour card persists in localStorage (try/catch) |
| M3.10 | Shared easter eggs: rain delay, dog, honk wave, Spidercam view | Each works on every ground |

**Checkpoint M3:** review in batches of three grounds, so problems are caught early.

## M4 · Scorecard view and 404 (week 7, parallel with M3)
| Id | Task | Done when |
|---|---|---|
| M4.1 | `/scorecard/`: printed-scorecard design, every project from `grounds.json`, contact (LinkedIn + harshthummar1000@gmail.com), no JS required | Lighthouse ≥ 95 in all four categories |
| M4.2 | 404 "Bowled" page; OG images per page; meta descriptions | Each page has a unique OG image and description |
| M4.3 | Disclaimer footer on every page | Present everywhere |

## M5 · Worker: commentary box and cheers (week 8)
| Id | Task | Done when |
|---|---|---|
| M5.1 | Worker scaffold with wrangler, Origin allowlist, CORS, Turnstile verification | Rejects other origins |
| M5.2 | `/cheers` with a Durable Object, per-visitor cap of 6 with a salted, daily-rotating hash | Concurrent increments never lost (test) |
| M5.3 | Cheer button UI: confetti in the stands, 6 escalating sounds, "OVER!" on the 6th | Works with the Worker down (shows the cached total, no errors) |
| M5.4 | `/chat` with the facts file, model + fallback, rate limit, daily budget, "rain stopped play" state | A 30-question test set: answers only from facts, cites sources, refuses the rest |
| M5.5 | Commentary box UI: the glass box in the home ground + HUD mic; notepad-style panel | Keyboard and screen-reader usable |

## M6 · Polish and sound mix (week 9)
- A full sound mix pass (levels, variants, spatial falloff), on laptop speakers and on cheap earphones.
- A motion pass: every transition timed by hand.
- Copy pass: Harsh reads every visible word aloud; anything he wouldn't say gets rewritten by him.
- Mobile pass on the named test device.

## M7 · QA and launch (week 9–10)
- Run everything in [08-quality-gates.md](08-quality-gates.md) and fix what fails.
- *Harsh decides* the domain plan: replace `harshthumar.github.io` (move the research site to `/research/` with redirects) or use a project path.
- Deploy to production. Smoke-test every URL.
- Launch content: a 20-second screen recording, the LinkedIn launch post (Harsh writes it; Claude can review it).

---

## Biggest risks
| Risk | Mitigation |
|---|---|
| **3D modelling** of ten landmarks is the slowest part, and AI builders are weakest at it. | Procedural geometry and Blender Python scripts for simple shapes (bowls, stands, gas holders, fort walls); the vertical slice proves the method on Lord's first. *Harsh decides* whether to commission a 3D artist for the hardest landmarks if the slice shows the scripts aren't good enough. |
| The roller doesn't feel fun | It's tuned in M1 before anything else is built. |
| Mobile performance | Budgets enforced in CI from M0; test on a real mid-range phone every milestone. |
| Slop creeping in | The builder doesn't write copy; CI bans words and fonts; Claude reviews every milestone. |
| Workers AI model or limits change | Model IDs pinned in config with a fallback; the chat fails gracefully. |
| Harsh's time while recovering | Every milestone ends in something usable; the Scorecard view alone could launch if needed. |
