# 03 · World design

Everything a visitor sees, touches and hears. Facts come only from [02-content-bible.md](02-content-bible.md). Look and sound rules are in [04-art-and-sound.md](04-art-and-sound.md).

## The flow
(Changed 21 Nov 2026, Harsh: the home ground is the hub; the tour map is gone.)

```
[Opening: the kit becomes a ball]  →  [Hub: Narendra Modi Stadium, Ahmedabad]  ⇄  [Project ground × 9]
                                             │  drive to a ground model, hop in; drive out, hop back
          └──────── "Scorecard view" (plain page) is reachable from every screen ────────┘
```

URLs (each must be shareable and load directly):
- `/` opening → hub
- `/ground/<slug>/` a project ground, e.g. `/ground/lords/` (loads straight in, skips the opening)
- `/scorecard/` the plain, accessible page with everything

---

## Opening: the kit becomes a ball

Inspired by the *idea* of a world assembling itself (as in messenger.abeto.co), done our way, nothing copied.

| Time | What happens | Sound (only after the click) |
|---|---|---|
| 0 s | Cream screen. A small loading indicator: the **roller rolling along a crease line**, showing real progress. | none |
| loaded | Cricket kit floats in from every side, in the miniature style: bats, pads, gloves, a helmet, stumps and bails, a cap, a few balls. | — |
| +0.5–3 s | The pieces fly together and **snap into one giant red leather ball**, seam last. The seam stitches itself closed. | — |
| +3 s | The ball turns slowly. Under it: **HARSH THUMAR**, the one-line positioning from 02, and one button: **[[COPY: play button]]**. Small: sound on · Scorecard view. | — |
| click | The ball is **bowled**: it drops and pitches into the centre of the Ahmedabad pitch, the camera follows it down, and the visitor lands in the hub, sitting on the roller. ~2.5 s. | whoosh, leather-on-turf thud, crowd roar |

Rules:
- Skippable with any key or tap at any point. Returning visitors (localStorage, try/catch) skip straight to the button.
- `prefers-reduced-motion`: the ball is already formed; the click fades to the hub.
- No WebGL: go to `/scorecard/` with one line of explanation.
- The kit is generic equipment: no brand names, no logos, no team colours.

---

## The hub: Narendra Modi Stadium, Ahmedabad

The home ground is the one place the visitor always returns to. It is about Harsh and it holds the tour.

- **The bowl:** a faithful miniature of the real stadium (see [ground-references.md](ground-references.md)): orange lower tier, a white ring of corporate boxes, a tall blue upper tier with orange and yellow zig-zags, the white fabric roof with its LED ring on the inner edge and the lattice ring truss on top, and white V-shaped columns outside.
- **The centre pitch is "about me":** the giant scoreboard shows Harsh's name and links; a contact board stands by the pavilion end (LinkedIn, email).
- **The tour, inside the field:** around the outfield stand **nine small models of the project grounds**, each on a timber stand with a brass plaque (ground name, project title). Each model shows that ground's landmark: Lord's pavilion, the Oval gas holders, Galle fort, Table Mountain, and so on (table below).
- **Hopping in:** in front of each model is a mat. Drive onto it and the camera **dives into the model**; the visitor comes out full-size inside that ground. Leaving a ground (a "back to Ahmedabad" sign by its gate, or the HUD) reverses it: you rise out of the model in the hub.
- Visited models get a small red **VISITED** stamp on the plaque; a tour card counts "N / 9". All nine visited → the finale in the hub (standing ovation, fireworks, closing board with LinkedIn and email).
- A small **map button** in the HUD opens a plain 2D list of the nine grounds for quick travel and accessibility. It is not the main way around.

---

## The ground scene (shared base)

All grounds share **one stylised oval ground**. Each venue gets its **one iconic landmark** plus small dressing (sky, stand colour, signage text). This keeps the build buildable and the download small.

### The shared ground has
- An oval field with mowing stripes, a 22-yard pitch with creases, a boundary rope, sight screens, a small pavilion slot (replaced by the landmark where relevant).
- **A manual scoreboard** (big wooden board with painted numbers that flip over). It shows the project's real numbers. Example at Lord's: `CHECKS 376 · MODELS 9 · BUGS REDISCOVERED 3`.
- **Stumps** at both ends (knockable).
- **A crowd** in the stands (cheap, instanced low-poly figures or billboards). They react: a Mexican wave follows the roller when it drives along the boundary.
- **Boundary boards** that carry short lines of the project story, readable as you drive past (max ~6 words each).
- **An info post** (a small wooden sign with a bell) at the landmark. Driving into it rings the bell and opens the **project panel** (see below).

### The pitch roller (the visitor's vehicle)
- A heavy, slow, chunky groundsman's roller with a small seat. Original design.
- Controls: WASD / arrow keys on desktop; on touch, a virtual joystick bottom-left plus a "honk" button. Click or tap anywhere on the ground also drives there (for people who don't want to steer).
- Feel: heavy. Slow acceleration, a little drift, it bumps over the rope. It leaves a faint flattened stripe on the grass that fades out.
- Sound: a low diesel rumble whose pitch follows speed, grass crunch, a squeaky brake, a honk (an old bicycle-style horn).

### The project panel
A paper "scorecard" slides up from the bottom (not a modal over a dark overlay). It has:
1. The project name, and the ground name.
2. Two or three plain sentences: what it is and why it matters, in Harsh's voice.
3. The numbers, each with a **source link** (repo, CI run, live demo, or "company project, numbers from internal tests").
4. Links: repo / live demo (where one exists).
5. "Next ground →" and "Back to Ahmedabad".

### Shared interactions and easter eggs
| Trigger | Result |
|---|---|
| Roller hits the stumps | Stumps cartwheel with real physics, bails fly. A big **HOWZAT!** appeal from the crowd. |
| Roller crosses the boundary rope at speed | Fireworks over the stand, "SIX!" on the scoreboard, crowd roar. |
| Drive along the boundary | Mexican wave follows the roller. |
| Idle for 25 s | Rain starts: the covers come on, sound changes to rain, sky darkens. Moving again stops it after a few seconds. |
| Rare (about 1 in 5 visits to a ground) | A dog runs onto the field; drive near it and it runs off. |
| Honk | The nearest section of crowd waves. |
| Spidercam button | Toggles an overhead camera view. |

### Day and night
The sky follows **real Ahmedabad time** (Asia/Kolkata): day from 06:30 to 18:30, a short golden hour around sunset, floodlights on at night. A small toggle lets the visitor force day or night (this is the site's light/dark mode).

---

## The grounds

Ten grounds. Ground names and building shapes are tributes. **Each ground must be recognisable as the real one** (Harsh, 21 Nov 2026): its stand layout and proportions, roof forms, seating colours and signature landmarks follow reference photos, collected per ground in [ground-references.md](ground-references.md). The miniature style stays (clean modelled shapes, no photo textures). **No official logos** of BCCI, ICC, IPL, any team or any ground authority. No sponsor signage, no real players, no team kits, no copied photos (photos are references only, never shipped). The footer of every page carries: "Unofficial fan tribute. Not affiliated with or endorsed by BCCI, ICC, IPL or any stadium."

| # | Ground | Landmark to model | Project | Why it fits (use this line on the plaque or panel) | Scoreboard |
|---|---|---|---|---|---|
| 0 | **Narendra Modi Stadium, Ahmedabad** (home) | The huge bowl and its ring of floodlights | **Home:** intro, about Harsh, finale, contact | "The world's biggest cricket stadium, in my own city." | `HOME · AHMEDABAD` |
| 1 | **Lord's, London** | The Victorian pavilion with its balcony; an honours board in the Long Room | **P1 mcp-auth-tamarin** | Lord's keeps the Laws of Cricket. This project checks the rules AI agents follow. | `CHECKS 376 · MODELS 9 · REDISCOVERED 3` |
| 2 | **Wankhede, Mumbai** | The curved roof canopy, sea breeze, city skyline | **P2 credit-appraisal platform** | Mumbai is India's money capital. This is software for lenders. | `CHECKS 30+ · TESTS 580+ · HIGHLIGHTS 3–5 s` |
| 3 | **Galle, Sri Lanka** | The Dutch fort wall along the ground, the clock tower, the sea | **P3 content engine** | A fort wall guards the ground. Here code guards every number. | `CAUGHT 100% · FALSE ALARMS 0 · LANGUAGES 4` |
| 4 | **The Oval, London** | The Victorian gas holders (giant round storage frames) | **P4 data lake** | The Oval has giant storage tanks. This project stores 8.6M rows. | `NAV ROWS 8.6M · HOLDINGS 7.7M · GATES 7` |
| 5 | **Sharjah** | Desert, sand blowing in; the stadium's low stands | **P5 load test and fix** | Sachin's "Desert Storm" innings, 1998. This system survived a storm of users. | `THROUGHPUT 9x · p95 27.5 s → 1.5 s` |
| 6 | **Eden Gardens, Kolkata** | Huge packed stands; the loudest crowd | **P6 IPL Auction Arena (in development)** | The loudest crowd in cricket, for an auction full of drama. | `LOTS 1,019 · TESTS 106 · IN DEVELOPMENT` |
| 7 | **Newlands, Cape Town** | Table Mountain behind the ground | **P7 GAIA agent** | A summit reached at zero cost. | `SCORE 18/20 · TOOLS 13 · COST $0` |
| 8 | **MCG, Melbourne** | The vast multi-tier bowl, light towers | **P8 Agent-E** | The biggest crowd to judge. Agents that review every applicant. | `REVIEW TIME −70% · PROGRAMS 3` |
| 9 | **Dharamsala** | Snow-capped Himalayan peaks right behind the stands | **P9 live cricket product: backend, frontend, broadcast overlay, deployment** | The ground nearest the mountains; software running on a box at the edge. | `BACKEND · FRONTEND · OVERLAY · DEPLOYED` |

### Ground-specific moments (one each, small, delightful)
- **Lord's:** the honours board in the Long Room fills in, name by name, with the 9 model names. Three lines are painted in red: the 3 rediscovered advisories. Click one for a one-line plain-English story.
- **Wankhede:** a stack of paper credit memos on the pitch. Drive near one and lines on it light up and connect to "source cells" on a big ledger board. This shows the "every claim cites its source" rule with no words needed.
- **Galle:** stray digits (7, ٣, ३, ૭) fly towards the fort wall and bounce off it with a clink. Shows the "LLM never writes a digit" idea.
- **The Oval:** the gas holders fill up like progress bars as rows load: NAV, holdings, deals. The 7 quality gates are 7 turnstiles the data passes through.
- **Sharjah:** a sandstorm rolls in when you arrive (the load). The scoreboard's p95 number drops from 27.5 s to 1.5 s as the storm clears.
- **Eden Gardens:** 10 franchise "paddles" (generic colours, no team names or logos) pop up in the stands and bid on a lot; the hammer falls with a gavel sound. A painted "WORK IN PROGRESS" board and a half-built stand with scaffolding make the "in development" status part of the scene.
- **Newlands:** a small flag on Table Mountain; drive up the ramp and plant it for "18/20".
- **MCG:** 3 judges' tables on the outfield (one per program type) score paper applications with stamps.
- **Dharamsala:** a small edge box on a tripod by the boundary with a status light; a cable runs to the big screen. When the roller passes, a **live broadcast overlay** (a lower-third score graphic) slides onto the big screen, the part he built. Shows the app, overlay and deployment, not computer vision.
- **Home (finale):** visiting all 10 triggers a standing ovation and fireworks, then the closing panel: LinkedIn and email.

---

## Always-on UI (HUD)
Minimal, small, in the corners, hand-drawn style:
- Top-left: back to map · ground name.
- Top-right: mute · day/night · Scorecard view.
- Bottom-right: **cheer button** (see below) · LinkedIn.
- Bottom-left (touch only): joystick.

## The cheer button (the "like" button)
Inspired by Josh Comeau's capped like button, but our own design:
- Each click adds one **cheer**. A small burst of paper confetti in the stands, and a crowd cheer sound that gets bigger with each click.
- Cap: **6 cheers per visitor**, one over. The 6th click plays a full "over completed" roar and the scoreboard shows "OVER!".
- A shared total shows site-wide: "12,408 cheers".
- Stored in the Cloudflare Worker (per-visitor cap by a salted hash of IP, no cookies needed). Details in [05-tech-architecture.md](05-tech-architecture.md).

## The commentary box (the chatbot)
- A real place in the home ground: a glass commentary box high in the stand. Drive to its staircase (or click the mic icon in the HUD) to open it.
- UI: a paper notepad with a microphone, not a chat-bubble widget.
- It answers questions about Harsh **only from the content bible**, in plain language, and links the ground or source for each fact. If it doesn't know, it says so and offers the email.
- It never pretends to be Harsh. It is "the commentator".
- Runs on the Cloudflare Worker (Workers AI), rate limited.

## The Scorecard view (`/scorecard`)
The plain, fast, accessible version of the whole site, and the one recruiters will use.
- Styled like a printed Test scorecard: cream paper, ruled lines, a serif heading font.
- Sections: about, each project (same text, numbers and sources as the panels), contact.
- No WebGL. Works without JavaScript. Fully keyboard and screen-reader friendly.
- Linked from every screen and from the intro.

## 404
A broken stump and one line: **"Bowled. This page is out."** plus a link back to the Ahmedabad hub.
