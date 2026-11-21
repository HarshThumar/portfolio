# Instructions for the builder (Gemini)

You are building Harsh Thumar's portfolio: **"The Test Tour"**, a drivable 3D cricket world. Read these before writing any code, in this order:

1. [PLAN.md](PLAN.md): the index and the current milestone
2. [docs/01-vision.md](docs/01-vision.md)
3. [docs/02-content-bible.md](docs/02-content-bible.md): the only facts you may use
4. [docs/03-world-design.md](docs/03-world-design.md)
5. [docs/04-art-and-sound.md](docs/04-art-and-sound.md)
6. [docs/05-tech-architecture.md](docs/05-tech-architecture.md)
7. [docs/06-anti-slop.md](docs/06-anti-slop.md): **mandatory rules**
8. [docs/07-build-plan.md](docs/07-build-plan.md): your task list
9. [docs/08-quality-gates.md](docs/08-quality-gates.md)
10. [DECISIONS.md](DECISIONS.md)

## Hard rules
1. **Work one task at a time** from 07, in order. Don't start the next milestone until Harsh has signed off its checkpoint. You never sign off a checkpoint yourself; you log it as "ready for review".
2. **Never write final copy.** Use text from the content bible and `grounds.json`. If text is missing, insert `[[COPY: what's needed]]` and move on.
3. **Never invent facts or numbers.** If a fact is missing, insert `[[NEEDS FACT: ...]]`.
4. **Never mention the earlier employer named in `.forbidden-names`** (a local file, never committed), anywhere: code, content, comments, commit messages, file names. Its work is shown under CredPrism. `npm run check` and the commit-msg hook enforce this.
5. **Never add a dependency** that is not in 05 without asking Harsh. Before using any package, confirm it exists on npm and pin the exact version. Check APIs against the installed version's docs, not memory (three.js changes between releases).
6. **Follow 06 exactly.** No banned words, fonts, colours or components.
7. **No secrets in the repo.** Worker secrets live in Cloudflare.
8. **Git identity for this repo only:** `git config user.name "Harsh Thumar"` and `git config user.email "harshthummar1000@gmail.com"`. Never the CredPrism identity. Never push, publish or deploy to production without Harsh's explicit OK.
9. **No outward actions** (posting, emailing, creating public repos) without Harsh's explicit OK.
10. **Ask instead of guessing** when a task is ambiguous. Write the question in `progress/QUESTIONS.md` and stop.

## Definition of done (every task)
- `npm run check` passes (lint, types, dead code, duplication, banned words/fonts, facts, budgets, tests, build).
- A screenshot or short clip saved as `progress/<task-id>.png` or `.mp4`.
- One line added to `progress/LOG.md`: date, task id, what changed, anything Harsh should look at.
- The commit is small and its message says what and why (no AI filler, no emoji).

## Code style
- TypeScript, strict mode. `camelCase` for functions and variables, `PascalCase` for classes and types, `kebab-case` for file names.
- Small modules: ≤ 300 lines per file, ≤ 80 lines per function.
- No abstraction until it has three real uses. No managers, factories or base classes "for later".
- Comments explain *why*, never *what*. No TODO/FIXME left in commits.
- `game/` never imports from `site/` or Astro.
- All asset URLs go through `import.meta.env.BASE_URL`.
- Dispose three.js geometries, materials and textures when leaving a ground.
