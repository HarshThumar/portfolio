# The Test Tour: Harsh Thumar's portfolio

A drivable 3D cricket world. You walk out to bat at the home ground in Ahmedabad, then tour famous grounds around the world; each ground is one project, explored by driving a groundsman's pitch roller. A plain "Scorecard view" carries everything for people in a hurry.

Plan written 20 Nov 2026. Builder: Gemini. Reviewer: Claude. Owner: Harsh.

## Read in this order
| # | File | What's in it |
|---|---|---|
| — | [GEMINI.md](GEMINI.md) | Rules for the builder |
| 1 | [docs/01-vision.md](docs/01-vision.md) | Concept, audience, goals, non-goals, success |
| 2 | [docs/02-content-bible.md](docs/02-content-bible.md) | Every fact the site may use, naming rules |
| 3 | [docs/03-world-design.md](docs/03-world-design.md) | Intro, map, the ground scene, the 10 grounds, HUD, cheers, chatbot, Scorecard view (no blog or write-ups in v1) |
| 4 | [docs/04-art-and-sound.md](docs/04-art-and-sound.md) | Palette, type, 3D style, UI style, motion, sound |
| 5 | [docs/05-tech-architecture.md](docs/05-tech-architecture.md) | Stack, repo layout, game loop, hosting, Worker, assets, budgets, accessibility |
| 6 | [docs/06-anti-slop.md](docs/06-anti-slop.md) | No-AI-slop rules and banned lists |
| 7 | [docs/07-build-plan.md](docs/07-build-plan.md) | Milestones M0–M7 with tasks and done-criteria |
| 8 | [docs/08-quality-gates.md](docs/08-quality-gates.md) | CI checks and review checklists |
| — | [DECISIONS.md](DECISIONS.md) | Decision log, rejected ideas, open questions |

## Milestones at a glance
| | Milestone | Weeks | Status |
|---|---|---|---|
| M0 | Foundations: tooling, CI, facts, font | 1 | not started |
| M1 | Vertical slice: Lord's, fully finished | 2–3 | not started |
| M2 | Walkout intro + tour map | 4 | not started |
| M3 | The other nine grounds + finale | 5–7 | not started |
| M4 | Scorecard view, 404 | 7 | not started |
| M5 | Worker: commentary box + cheers | 8 | not started |
| M6 | Polish and sound mix | 9 | not started |
| M7 | QA and launch | 9–10 | not started |

## The 10 grounds
Home: Narendra Modi Stadium (about + finale) · Lord's: mcp-auth-tamarin · Wankhede: credit-appraisal platform · Galle: content engine · The Oval: data lake · Sharjah: load-test fix · Eden Gardens: IPL Auction Arena (in development) · Newlands: GAIA agent · MCG: Agent-E · Dharamsala: live cricket product (backend, frontend, broadcast overlay, deployment).
