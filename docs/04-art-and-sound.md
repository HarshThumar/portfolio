# 04 · Art direction and sound

The goal is "a hand-made cricket toy in an old touring-team poster", not "a tech demo". Every choice below exists to make the site feel authored by a person. Read with [06-anti-slop.md](06-anti-slop.md).

## Palette (CSS variables and 3D palette texture use the same values)

| Token | Hex | Use |
|---|---|---|
| `--cream` | `#F3EAD3` | Paper, kits, the scorecard background |
| `--ink` | `#1E1B16` | Text, outlines, hand-drawn lines |
| `--outfield` | `#4E7A3A` | Grass (main stripe) |
| `--outfield-2` | `#5C8A45` | Grass (alternate mowing stripe) |
| `--pitch` | `#C9B27C` | The 22-yard strip, sand |
| `--willow` | `#D8B87A` | Bats, wooden boards, the roller seat |
| `--timber` | `#6B4A2B` | Pavilions, scoreboard frames, honours boards |
| `--leather` | `#A3271F` | **The one accent.** The red ball, stamps on the ground plaques, links, focus rings |
| `--night` | `#0E1A24` | Night sky |
| `--flood` | `#FFF6DA` | Floodlight glow |

Rules:
- `--leather` red is the only accent colour. Use it sparingly: the ball, stamps, the active link, the route. Never as a large background.
- No gradients as decoration. Real light (sky, floodlights) may produce gradients in the 3D scene; UI does not.
- Night mode is not "invert to dark grey". It is the same scene under floodlights: `--night` sky, `--flood` light, the cream UI paper stays cream with a slight warm shadow.

## Type
- **Display:** a vintage sports serif or slab with real character (not Bebas Neue, which every sports site uses). Candidates to try, in order: *Playfair Display SC*, *Alfa Slab One*, *Abril Fatface* for headlines; pick one after seeing it on the scoreboard and map. Harsh picks the final one.
- **Body:** a bookish serif for the Scorecard view, e.g. *Source Serif 4* or *Newsreader*.
- **Numbers:** scoreboard numbers are painted shapes, not a font. On HTML pages use the display face with tabular figures.
- **Hand-written notes** (map labels, stamps): a real hand-drawn SVG set made for this site, or Harsh's own handwriting scanned. Not a "handwriting" Google Font.
- Banned fonts: Inter, Roboto, Arial, Open Sans, Lato, Poppins, Montserrat, Space Grotesk, Bebas Neue, system-ui stacks as the visible font.
- Scale: big contrast. The ground name on a panel is ~3x the body size. Use weights at the extremes (400 vs 800+), nothing in between for headlines.

## 3D style: a handmade miniature
(Changed 21 Nov 2026 after the first slice looked "bogus and too simple".)

The whole world is **a beautifully made tabletop model of a cricket ground**, the kind a collector builds: soft light, rounded edges, little painted people. Simple shapes are fine; *careless* shapes are not. Not photoreal (that reads as a cheap mobile game in a browser).

What makes it read as crafted, in order of impact:
0. **The real ground, recognisably.** A miniature of *that* stadium, not a generic one: its real stand layout, roof, seat colours and landmarks, taken from reference photos (docs/ground-references.md). A visitor who has been there should know it at a glance.
1. **Real light, baked.** Soft sun shadows and ambient occlusion (the soft darkening where things meet) baked into lightmaps in Blender. One real-time light only for the roller and moving things. Without this everything looks pasted on.
2. **Modelled, not primitive.** Every object is modelled in Blender (by script or by hand): bevelled edges, trims, railings, windows, steps, seats. No raw boxes or cylinders on screen.
3. **A real crowd.** Little people with heads and arms, 3–4 poses, a few body shapes, muted palette clothing; animated in a shader (bob, wave, Mexican wave). Not sticks.
4. **Sky and atmosphere.** A soft gradient sky with a few clouds, light haze, and a low city silhouette behind the bowl; at night, floodlight glow.
5. **Grass and pitch with texture.** Mowing stripes, slight colour noise, a worn crease area, a sheen on the pitch.
6. **The cricket things that make it a ground.** Sight screens, floodlight towers, boundary boards (no sponsors), the scoreboard, covers, groundstaff, umpires, the players' gate.
7. **Miniature camera feel.** Slightly high camera, a gentle tilt-shift blur at the top and bottom of the screen, warm colour grade.

Technical rules:
- One shared **palette texture** plus baked lightmaps; few materials, few draw calls.
- A subtle ink outline on the hero pieces (landmarks, roller) ties the 3D to the paper UI.
- Small imperfections on purpose: uneven boundary boards, worn patches, hand-painted scoreboards.
- No real players, no logos, no sponsors, no team kits.

## UI style
- Paper, not glass. Panels look like printed scorecards, tour tickets and luggage tags: cream paper, ink rules, a little paper grain, sharp corners or one small radius (4 px) used everywhere.
- Icons: a small custom SVG set drawn for this site (mute, map, day/night, cheer, mic, LinkedIn mark from the official brand kit). No icon library as the main set.
- Buttons look stamped or printed. Pressed state shifts 1–2 px down, no soft drop shadows.
- Josh Comeau-style micro-interactions, made our own:
  - **"Boop"** on HUD icons: a quick spring wiggle on hover (respect reduced motion).
  - **Cheer button**: capped at 6, confetti in the stands, a cheer that grows per click.
  - **Sparkle-like twinkle** on the scoreboard numbers when they flip.
  - **Sound on interaction**, with a global mute.

## Motion
- One orchestrated sequence per moment (the kit becoming a ball, hopping into a ground, opening a panel). Not "everything fades in".
- Spring physics for UI (panels, stamps). Ease curves tuned by hand.
- The camera follows the roller with a soft lag and a slight look-ahead in the drive direction. No shake except on a stump hit (and none with reduced motion).

## Sound design
Sound is half the experience. Every sound is short, recorded or synthesised for this site (or CC0 with a licence entry), mixed so nothing is harsh.

| Group | Sounds |
|---|---|
| Ambience | Distant crowd murmur (day), floodlight hum (night), wind at Dharamsala, sea at Galle and Wankhede, sand wind at Sharjah, rain (rain delay) |
| Roller | Diesel rumble (pitch follows speed), grass crunch, gravel on the pitch, brake squeak, honk |
| Cricket | Leather on willow "tock", stumps clattering, bails, an appeal "HOWZAT", polite Test applause, a big roar for SIX |
| UI | Paper slide, stamp thunk, scoreboard number flip, pencil scratch, bell on the info post, gavel at Eden |
| Cheer button | 6 escalating cheer variants; the 6th is an "over completed" roar |

Rules:
- Nothing plays before the first click (the play button in the opening).
- Global mute in the HUD; remember the choice per visitor (localStorage, wrapped in try/catch).
- Random variants (2–4 per sound) and slight pitch randomisation so repeats don't sound robotic.
- Spatial: ground sounds pan and fade with distance from the roller.
- Master volume is gentle. No sound louder than the crowd roar.
- Keep a `docs/asset-licences.md` ledger row for every sound and model not made by us.

## Reference board (look at, don't copy)
- Old cricket-tour posters and vintage Test scorecards (paper, ink, red stamps).
- Bruno Simon's portfolio: the idea of a drivable world and how placement teaches you what's interactive.
- Josh Comeau's site: warmth, micro-interactions, sound with a mute.
- Lord's honours boards, the Oval gas holders, Galle fort, Table Mountain: silhouettes only.
