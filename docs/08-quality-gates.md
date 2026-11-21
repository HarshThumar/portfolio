# 08 · Quality gates

A task or milestone is "done" only when every gate that applies passes. `npm run check` runs the automated ones; the rest are review checklists.

## Automated (CI on every push)
| Gate | Tool | Fails when |
|---|---|---|
| Lint | ESLint | Any error, incl. `no-empty`, `no-console`, `max-lines` 300, `max-lines-per-function` 80 |
| Types | `tsc --noEmit` | Any error |
| Format | Prettier `--check` | Any unformatted file |
| Dead code | knip | Unused files, exports or dependencies |
| Duplication | jscpd | > 3% duplicated |
| Banned words | `scripts/check-copy.mjs` | Any word from the 06 banned list in `.astro`, `.json` content, alt text or meta; more than one em dash per page; `TODO`, `FIXME`, `lorem`, `placeholder`; any `[[COPY` or `[[NEEDS FACT` marker (on the release branch only) |
| Banned fonts/colours | `scripts/check-style.mjs` | A banned font family, `indigo`/`violet`/`purple` names, `backdrop-filter`, or a colour not in `tokens.css` |
| No forbidden names | `scripts/check-copy.mjs` | Any name from the local `.forbidden-names` file (or the `FORBIDDEN_NAMES` CI secret) anywhere in the repo (code, content, comments; commit messages via the commit-msg hook); "found a vulnerability"; "IETF contributor" |
| Facts | `scripts/check-facts.mjs` | A number in `grounds.json` that isn't in the content bible's list of allowed numbers |
| Dependencies | `scripts/check-deps.mjs` | `package.json` changed without a matching line in `DECISIONS.md` |
| Build | `astro build` | Any error |
| Asset budgets | `scripts/check-budgets.mjs` | Any limit in 05 exceeded (per ground, first payload, total) |
| Unit tests | Vitest (for pure logic: physics tuning helpers, timeline, cheers cap, facts generator) | Any failure |
| E2E | Playwright | The flows below fail |
| Visual regression | Playwright screenshots | A screenshot differs from the approved "golden" one beyond tolerance (goldens approved by Harsh) |
| Lighthouse | Lighthouse CI | Scorecard view < 95 in any category; 3D page Accessibility < 90 |

### E2E flows (Playwright)
1. Load `/` → the loading screen appears → "Walk out to bat" is visible and focusable.
2. Click it → the map appears → keyboard to Lord's → Enter → the ground loads and the URL is `/ground/lords/`.
3. Direct-load each `/ground/<slug>/`.
4. Open the info post panel → the source links are present and valid.
5. `/scorecard/` with JavaScript disabled shows every project.
6. Reduced motion: no camera fly-through.
7. No WebGL (simulated): redirected to the Scorecard view.
8. Cheer button with the Worker mocked down: no errors, the cached total shows.
9. Chat with the Worker mocked: the "rain stopped play" state.

## Review checklists (Claude at every checkpoint, Harsh signs)

### Truth
- [ ] Every number and claim matches [02-content-bible.md](02-content-bible.md).
- [ ] No mention of the earlier employer (see `.forbidden-names`); CredPrism and DataSlush named correctly.
- [ ] Nothing implies Harsh built the cricket computer-vision models.
- [ ] Tamarin wording: "rediscovered 3 published, already-fixed advisories"; "remote participant at IETF 127".
- [ ] Prince Upadhyay credited wherever the whitepaper appears.

### Anti-slop (from 06)
- [ ] The core test passes for every element on screen.
- [ ] No banned visual pattern, font, colour or component.
- [ ] Every word of copy is Harsh's or approved by him.
- [ ] Loading, empty and error states are designed.

### Feel
- [ ] The roller feels heavy and fun (Harsh drives it for 2 minutes).
- [ ] Every interaction has a sound; nothing is harsh or too loud; mute works.
- [ ] A first-time visitor knows what to do within 5 seconds.
- [ ] Night and day both look intentional.

### Performance (on the named mid-range Android + a laptop)
- [ ] ≥ 30 fps on the phone, 60 fps on the laptop, on every ground.
- [ ] First interactive load on throttled 4G: intro shows quickly, no blank screen.
- [ ] No memory growth after travelling through all ten grounds (assets disposed).

### Accessibility
- [ ] Keyboard-only run through the whole site.
- [ ] Screen reader reads the Scorecard view and every panel.
- [ ] Focus rings visible (leather red).
- [ ] Captions for voice-like sounds.

### Privacy and security
- [ ] No raw IPs stored; salted, rotating hash only.
- [ ] Worker rejects other origins; Turnstile verified server-side; rate limit and daily budget work.
- [ ] No secrets in the repo; Worker secrets in Cloudflare only.
- [ ] Personal git identity on every commit.
- [ ] Every third-party asset is in `docs/asset-licences.md`.
