# 02 · Content bible (the only facts the site may use)

**Rule for the builder:** every fact, number, name and date on the site must come from this file. Do not invent, round up, extrapolate or "improve" any number. If a section needs a fact that is not here, ask Harsh (or take it from his own public repos and record it here first) instead of guessing. Items marked **(confirm)** must be confirmed by Harsh before launch.

Source: `D:\personal-workspace\linkdeln\linkedin\profile-2026-11-20.md` (built from his resume) and his decisions in [DECISIONS.md](../DECISIONS.md).

---

## Person
- **Name:** Harsh Thumar
- **City:** Ahmedabad, India
- **Education:** B.Tech IT, CHARUSAT, 2026
- **Now:** Founding Engineer at **CredPrism** (credit fintech), since May 2026
- **Before:** **DataSlush**: AI Data Engineer Intern (Aug 2025 – Apr 2026), then Associate AI Data Engineer (May – Jun 2026)
- **Earlier:** Web Developer at Peakenza Software Services (May – Jul 2024); Placement Coordinator, CHARUSAT placement cell (Dec 2024 – Jun 2026)
- **Interests:** multi-sport fan (cricket, basketball), reads novels
- **Links:**
  - LinkedIn: https://www.linkedin.com/in/harsh-thumar-357037251/
  - GitHub: https://github.com/HarshThumar
  - Email: harshthummar1000@gmail.com (the only email shown anywhere; never a CredPrism or DataSlush address)
- **One-line positioning:** "I build AI agents that play by the Laws." (Harsh chose this on 22 Nov 2026. "The Laws" is the cricket word for the rules, kept at Lord's; it points at agents that follow checked rules: the Tamarin models, the cited credit memo, the LLM that never writes a digit.)

## Naming rules
- Name **CredPrism** and **DataSlush** as employers.
- **Never mention the earlier employer** listed in the local `.forbidden-names` file (not committed, so the public repo never contains the name) anywhere (text, code comments, alt text, metadata, commit messages). Work done there is presented under CredPrism.
- Clients stay unnamed.
- **Never say** "found a vulnerability". Say "rediscovered 3 published, already-fixed advisories".
- **Never say** "IETF contributor". Say "remote participant at IETF 127".
- **Never claim** the cricket computer-vision models (YOLO ball detection, pose detection). Harsh built the **backend, the frontend, the live broadcast overlay and the deployment** for that product.
- **IPL Auction Arena is "in development".** Never describe the 10-agent auction as finished or run end to end.
- Company products: Harsh should check with his founders that public eval numbers for the credit auditor and the content engine are OK **(confirm)**.

---

## Projects (one per ground; ground mapping in [03-world-design.md](03-world-design.md))

### P1 · mcp-auth-tamarin: formal verification of MCP authorization
- Public repo: https://github.com/HarshThumar/mcp-auth-tamarin (MIT, CI green)
- Models MCP's authorization flow in the Tamarin prover.
- **9 protocol models, 376 lemma checks** run in CI. Topics: OAuth 2.1 + PKCE, audience binding, ID-JAG token exchange, UPI-style agent-payment mandates, confused deputy, token passthrough, scope step-up.
- Each weakened variant produces an attack trace; the fixed variant verifies.
- **Rediscovered 3 published, already-fixed MCP SDK advisories.**
  - GHSA-qx49-fqc8-xw99 (Python SDK): a malicious MCP server could receive OAuth credentials meant for the user's real authorization server.
  - GHSA-w4fh-qvv9-3v23 (Python SDK) and GHSA-rvq5-wwqv-78pq (TypeScript SDK): an MCP server accepted tokens issued for a different server (no audience check).
- The 9 models (from the repo README): 01 AS selection, 02 code and audience, 03 CIMD client binding, 04 ID-JAG enterprise token exchange, 05 agent payment mandate (UPI-style), 06 audience injection, 07 confused deputy at an MCP proxy, 08 token passthrough, 09 scope step-up.
- Started as his IETF 127 Hackathon project (remote participant, Nov 2026).
- Existing write-up site: https://harshthumar.github.io (co-authored with **Prince Upadhyay**; credit him wherever the whitepaper is mentioned).

### P2 · Citation-grounded credit-appraisal platform (CredPrism)
- Credit-underwriting software for Indian NBFCs (lenders).
- Gemini 2.5 Flash (Vertex AI) checks a borrower's bank statement, GST and bureau data against the lender's own credit-policy PDF.
- **30+ deterministic forensic checks** produce findings; the LLM must cite them, so **every claim in the credit memo traces back to a source cell**.
- Policy PDF → structured rules pipeline (Docling, sliding-window batching, Pydantic-validated output). Chunk-index grounding: PDF highlight lookups **3–5 s instead of 20–30 s**.
- Regulated-lending basics: row-level security per lender, AES-256-GCM encryption of personal data, hash-chained audit log, TOTP MFA, sandbox and live API keys, India-region LLM endpoint. **A human always makes the credit decision.**
- TypeScript SDK, analyst portal with source highlights, batch assessment, public status page. **580+ tests**, LLM PR-review step in CI.
- Also: a micro-LAP underwriting app with an NBFC partner. The lender's **46 business-type CAM Excel workbooks became 46 guided income playbooks** with golden tests. Server refuses personal data on every write.

### P3 · Compliant multilingual GenAI content engine (show under CredPrism)
- Creates posts and client messages for mutual-fund distributors in **4 languages and 7 formats**.
- **The LLM never writes a digit:** it emits fact placeholders, and code rejects any stray number, including Devanagari and Gujarati digits.
- LLM compliance reviewer: **100% of violations caught, 0 false positives on a 62-case test; 16/18 on an adversarial red-team set.**
- Spend ledger with a kill switch: about **₹2.9 per draft**.

### P4 · Mutual-fund data lake (show under CredPrism)
- **55 fund houses, 7.7M holdings, 8.6M NAV rows, 3.8M deal rows, from 63.8K source files.**
- **7 quality gates** and an atomic publish with rollback.

### P5 · Load test and fix (show under CredPrism)
- Load-tested with k6; the database collapsed at **~50 users**.
- Fixed it: **9x throughput, p95 latency from 27.5 s to 1.5 s.**

### P6 · IPL Auction Arena (in development)
- Status everywhere on the site: **in development**.
- Public repo: https://github.com/HarshThumar/ipl-auction-arena
- A rule-faithful auction engine that replays **all 1,019 lots of the 2022–26 IPL auctions exactly (0 rule violations, 106 tests)**.
- A **5,405-row bid-decision dataset**.
- In development: **10 LLM franchise agents** (Qwen with a shared LoRA adapter) that will bid against each other. Word it as being built, e.g. "10 AI franchise agents, in development".

### P7 · Zero-cost GAIA agent
- Live: https://huggingface.co/spaces/Harsh5764/zero-cost-gaia-agent
- LangGraph ReAct agent, **18/20 (90%) on the Hugging Face Agents Course GAIA Level 1 set, at $0 model cost** (gpt-oss-120b on Cloudflare Workers AI).
- **13 tools:** search, Python sandbox, vision, Whisper, chess via Stockfish. Repairs malformed tool calls; majority vote over 3 runs.

### P8 · Agent-E: multi-agent evaluator for NGO applications (DataSlush)
- CrewAI agents score each applicant per criterion with a written justification.
- RAG over PDF/DOCX submissions (ChromaDB). 5–10 minute async jobs on Cloud Run + Cloud Tasks, LangSmith tracing, OIDC-signed service calls.
- **Cut manual review time by about 70% across 3 program types.**

### P9 · Live cricket product: backend, frontend, broadcast overlay, deployment (DataSlush)
- Team project: an on-premise edge box that records IP cameras and detects deliveries live.
- **Harsh's part: the backend, the frontend, the live broadcast overlay, and the deployment.**
- Do not show or imply ball tracking, pose detection, the GPU fix or the highlights as his work.
- No numbers for this project.

### Smaller work (Scorecard view and "The Nets" only, no ground of their own)
- **Document AI for project finance (DataSlush):** Docling extraction with bounding boxes, LlamaIndex + pgvector per deal, cross-document conflict detection, 10+ generated document types with citations.
- **Conversational AI suite (DataSlush):** web chatbot, phone/web callbot in 3 languages, meeting bot that answers live in under a second.
- **Shopify → BigQuery pipeline (DataSlush):** Airbyte, Dataform, 15+ Looker Studio dashboards.
- **GroundBook:** sports-venue booking on Next.js, Supabase and Razorpay, with Gemini natural-language search; a row-locked Postgres function prevents double bookings. Live: https://booking-sable-iota.vercel.app
- **Community:** OWASP GenAI Agentic Security Initiative participant; follows the IETF OAuth and WIMSE working groups.

---

## Write-ups
**Out of scope for v1** (Harsh, 20 Nov). No blog, no match reports, no MDX posts. Don't build anything for them.

## Voice
Harsh's own voice: short, direct, casual, a bit of humour. Write like a person talking to a friend at a cricket match. All visible copy follows [06-anti-slop.md](06-anti-slop.md). The builder writes the copy in this voice; Harsh can change any line.
