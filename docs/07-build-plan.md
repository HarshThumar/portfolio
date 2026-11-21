# 07 · Build plan (milestones for the builder)

**Who does what**
- **Gemini (builder):** writes the code and Blender scripts, one task at a time, following [GEMINI.md](../GEMINI.md).
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

## M1 · Vertical slice: one ground, fully finished (weeks 2–3)
The point: prove the whole feel on **one** ground (Lord's) before building ten.
| Id | Task | Done when |
|---|---|---|
| M1.1 | Game loop skeleton with the numbered stages; fixed-step Rapier with interpolation; debug panel behind `?debug`. | Debug panel shows fps, draw calls, triangles, bodies |
| M1.2 | Shared ground base: oval field with mowing stripes, pitch, creases, rope, sight screens, stands shell. Procedural in code or Blender script, palette texture. | Screenshot matches the art direction; ≤ 60 draw calls |
| M1.3 | The roller: model, Rapier body, heavy tuning, camera follow with look-ahead, keyboard + touch joystick + click-to-drive. | **Harsh drives it and says it feels heavy and fun** |
| M1.4 | Stumps (knockable), boundary rope (SIX trigger), info post (bell + panel). | All three work, with sounds |
| M1.5 | Lord's landmark: pavilion silhouette + Long Room honours board moment. | Recognisable as Lord's to someone who knows cricket, with no logos |
| M1.6 | Manual scoreboard with flipping numbers from `grounds.json`. | Numbers match 02 |
| M1.7 | Project panel (DOM, paper style) for P1, with source links. | Keyboard and screen reader can read it |
| M1.8 | Sound pass for the slice: roller, cricket sounds, UI, ambience; Howler unlock on first click; global mute. | Nothing plays before a click; mute persists |
| M1.9 | Crowd (instanced, shader-animated) + Mexican wave following the roller. | Holds 60 fps desktop with the crowd on |
| M1.10 | Day/night by Ahmedabad time + manual toggle; floodlights at night. | Both look intentional, not "dark mode" |

**Checkpoint M1 (the big one):** a 30-second clip of Lord's. Claude runs the anti-slop review; Harsh signs off feel, look and sound. If the slice doesn't feel great, fix it here. Do not start M2 until it does.

## M2 · The walkout intro and the tour map (week 4)
| Id | Task | Done when |
|---|---|---|
| M2.1 | HTML loading screen (the roller on the crease) with real progress. | Visible within 100 ms of first paint |
| M2.2 | Intro scene: home stadium at night, floodlights one by one, name on the big screen, "Walk out to bat" button, Scorecard link. | Matches the timing table in 03 |
| M2.3 | The walkout sequence (tunnel → grass → up to the map), skippable, reduced-motion version. | Skippable with any key; reduced motion fades |
| M2.4 | Tour map: hand-drawn paper map, ground stamps, red route, bus/plane travel animation, VISITED stamps, tour card. | Keyboard navigable; travel updates the URL |
| M2.5 | Routing: `/ground/<slug>/` pages load straight into that ground; back/forward work. | Every ground URL works as a direct link |

**Checkpoint M2:** Harsh watches a first-time visitor (a friend) use it without help. Note every moment they hesitate.

## M3 · The other nine grounds (weeks 5–7)
One task per ground: landmark, dressing, ambience, scoreboard values, panel, and its one special moment from 03. Build in this order (most important first): Home (Narendra Modi) → Wankhede → Eden Gardens → The Oval → Galle → Sharjah → Newlands → MCG → Dharamsala.
| Id | Task | Done when (each ground) |
|---|---|---|
| M3.1–M3.9 | Ground *N* | Landmark recognisable; special moment works; ≤ 3 MB for the ground; numbers match 02; clip saved |
| M3.10 | Finale: all 10 visited → standing ovation, fireworks, closing panel with LinkedIn and email | Triggers once; tour card persists in localStorage (try/catch) |
| M3.11 | Shared easter eggs: rain delay, dog, honk wave, Spidercam view | Each works on every ground |

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
