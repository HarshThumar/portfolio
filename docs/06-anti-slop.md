# 06 · No AI slop: rules and checks

"AI slop" is anything that makes a visitor think "a model made this without a person caring". This file turns that into rules the builder must follow and checks that fail the build. Researched 20 Nov 2026; sources at the bottom.

**The core test for every element:** does it feel like it came from somewhere specific, does it have a voice, and would anyone miss it if it were removed? If not, cut it or redo it.

**Process rule:** for any visible design decision (a panel, a button, a transition), first list the most obvious way to do it. That is the slop zone. Pick something more specific to this site (cricket, paper, the tour).

---

## 1. Visual and UI

| Slop sign | Rule |
|---|---|
| Blue/indigo/violet gradients, Tailwind default palette | Only the palette in [04-art-and-sound.md](04-art-and-sound.md). No `indigo-*`, `violet-*`, `purple-*`. No decorative gradients. |
| Inter, Roboto, Arial, Space Grotesk, system fonts | Only the fonts chosen in 04. Banned list below. |
| Centred hero + three equal cards | No three-equal-cards grid anywhere. Layouts have a clear primary element; secondary things are smaller. |
| Glassmorphism, backdrop-blur cards, neon on dark | Paper, ink and wood. No `backdrop-filter`. |
| Soft default shadows, `rounded-2xl` on everything | One radius (4 px) or sharp corners. Shadows only where a real light would cast one (paper lifted off a surface). |
| Bento grids | Not used. |
| Emoji icons, Lucide/Heroicons as the icon set, pill badges | Custom SVG icon set drawn for this site. No emoji in the UI. |
| Everything fades in with the same timing | One orchestrated sequence per moment; nothing animates "because". |
| Stock 3D blobs, gradient blob heroes, generic illustrations | Only our own 3D, our own drawings, real photos of Harsh (if used). |
| Missing loading/empty/error states | Designed states in the site's voice: loading = the roller; chat down = "Rain stopped play"; 404 = "Bowled". |
| Fake testimonials, logos, stats | Only facts from the content bible. Nothing else. |
| Generic meta and alt text | Unique meta description and OG image per page; alt text describes what's actually there. |

## 2. Copy (every visible word)

| Slop sign | Rule |
|---|---|
| Stock AI vocabulary | Banned word list below; CI greps for it. |
| "It's not X, it's Y" / "not just X but Y" | Never. Say Y. |
| Triplets of abstract nouns ("fast, scalable and secure") | Use one specific: a number, a tool, a before/after. |
| Puffery: "stands as", "serves as", "boasts", "pivotal" | Use "is" and "has". |
| Em dashes everywhere | Max one em dash per page. Use commas and full stops. |
| Exclamation marks | Only inside the cricket moments where a crowd would shout (HOWZAT!, SIX!). Never in descriptive copy. |
| "Passionate about…", "Hi, I'm X, a…", "In today's fast-paced world" | Banned. Start with something specific. |
| Generic headlines ("Building the future of AI") | A headline must contain a concrete thing: a number, a named tool, an outcome. Read it aloud: would Harsh say it to a friend? |
| Vague claims ("experts say", "industry-leading") | Name the source or cut it. |
| Hedging and filler | Short sentences. Take a position. |
| Copy that sounds like nobody | **The builder writes the final copy** (Harsh changed this rule on 22 Nov 2026): in Harsh's voice (see 02, "Voice"), using only facts from the content bible, and passing every rule on this page. No `[[COPY]]` markers are left on the site. Harsh can rewrite any line. |

## 3. 3D and WebGL

| Slop sign | Rule |
|---|---|
| Default lighting, `MeshStandardMaterial` + one light on primitives | Baked lighting in a lightmap, palette texture, custom TSL materials where needed. |
| Untextured boxes and spheres | Every visible object is modelled. Primitives only as invisible colliders. |
| Many materials → many draw calls | One palette material for most of the scene; check draw calls with the in-app perf monitor. |
| Uncompressed GLBs, huge downloads | The asset pipeline in 05; budgets enforced in CI. |
| Floaty physics, cars that feel weightless | The roller is tuned by hand in the debug panel until it feels heavy. Harsh signs off the feel. |
| Janky camera | Smoothed follow with look-ahead; no snapping. |
| Silent 3D | Every interaction has a sound (04). |
| 3D as a backdrop | The 3D is the interface: placement teaches what's interactive (e.g. the roller starts facing the info post). |
| Loading screen that shows a half-built scene | Don't render until required assets are ready. |

## 4. Code

| Slop sign | Rule |
|---|---|
| Hallucinated packages or APIs | No new dependency without Harsh's OK. Check the package exists on npm and pin the exact version. Check the API against the installed version's docs (three.js changes between releases). |
| Dead code, unused exports and files | `knip` in CI fails on unused files, exports and dependencies. |
| Copy-paste duplication | `jscpd` in CI, threshold 3%. |
| Over-abstraction (factories, managers, base classes for one use) | No abstraction until there are 3 real uses. |
| Giant files | ESLint `max-lines` 300 per file, `max-lines-per-function` 80. |
| Narrating comments ("// This function adds…"), TODO/FIXME left behind | Comments explain *why* only. CI greps for `TODO`, `FIXME`, `lorem`, `placeholder`. |
| Empty catches, swallowed errors, console spam | ESLint `no-empty`, `no-console` (except a tagged debug logger). |
| Inconsistent naming | One convention: `camelCase` functions/vars, `PascalCase` classes/types, `kebab-case` files. |
| Giant PRs | One task = one small commit/PR with a screenshot or clip. |
| "Done" without proof | A task is done only when lint, typecheck, build, tests and the budget check pass, and a screenshot/clip is attached. |

---

## Banned lists (CI enforces the words and fonts)

**Words and phrases (case-insensitive, in any visible copy, alt text, meta):**
delve, tapestry, pivotal, underscore, showcase, intricate, testament, leverage, seamless, seamlessly, robust, elevate, unlock, harness, realm, unleash, supercharge, game-changer, game changer, cutting-edge, state-of-the-art, revolutionize, empower, synergy, journey (as a metaphor), passionate about, in today's fast-paced world, stands as, serves as, boasts, discover how, unlock the power of, dive into, deep dive, look no further, whether you're, it's not just, not just … but

**Fonts:** Inter, Roboto, Arial, Helvetica (as the visible font), Open Sans, Lato, Poppins, Montserrat, Space Grotesk, Bebas Neue, system-ui stacks as the visible font

**Colours/patterns:** Tailwind indigo/violet/purple scales, blue-to-purple gradients, gradient blobs, glassmorphism/backdrop-blur, neon on dark, soft default shadows, uniform large radii, bento grids, three equal feature cards, centred-everything layouts

**Components/libraries:** shadcn default styling, Lucide/Heroicons as the main set, emoji icons, pill badges, carousels of logos, fake testimonials, lorem ipsum, unrequested npm packages, default-lit untextured primitives, uncompressed GLBs

## Human-made techniques we use on purpose
1. A decisive type pairing with one unusual display face.
2. Hand-drawn elements (plaques, stamps, icons), ideally Harsh's own handwriting for the plaque labels.
3. Harsh's own voice in every line of copy, signed off by him.
4. Deliberate variation in scale and spacing.
5. Authored detail: our own sounds, easter eggs, physics, designed loading/error states.

## Sources
- Wikipedia: Signs of AI writing: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
- Anthropic: Improving frontend design through skills: https://claude.com/blog/improving-frontend-design-through-skills
- Spot the slop (UI designer's guide): https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c
- Built with AI: trust signals 2026: https://www.utsubo.com/blog/built-with-ai-trust-signals-2026
- 5 code smells only AI creates: https://dev.to/bzprchny/5-code-smells-only-ai-creates-and-how-to-detect-them-1e3l
- How a portfolio got 400,000 visitors (Bruno Simon): https://usepastel.com/blog/how-a-design-portfolio-got-the-attention-of-400-000-visitors
