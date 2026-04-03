# Master Feature Roadmap — SayfeAI / Better-Chatbot

> **Living document** — update the "Resume Here" section at the end of every session.
> Purpose: Cross-session feature tracking covering ALL Claude.ai capability gaps.
> Any AI session can read this file and pick up exactly where the last one left off.
>
> Last updated: 2026-04-03
> Active branch: `claude/platform-architecture-planning-h1crR`

---

## How to Use This Doc

Start every session with: _"Read docs/ROADMAP.md and continue from where we left off."_

**Verification gate:** Nothing moves to ✅ without E2E proof per the `feature-verification` skill.
See [Verification Standards](#verification-standards) below.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Shipped AND E2E verified by a real user test |
| 🔬 | Code done — needs E2E verification before marking shipped |
| 🔄 | In progress (has spec/plan, partial implementation) |
| 📋 | Planned (has spec or plan doc) |
| 💡 | Idea / backlog (no spec yet) |
| ❌ | Won't build |
| 🚫 | Blocked |

---

## Verification Standards

**A feature is not ✅ until a real user completes a real workflow with real data.**

Required tool: invoke `feature-verification` skill before marking any feature shipped.

| What was done | Counts as proof? |
|---|---|
| Unit tests pass | No |
| TypeScript compiles | No |
| Tool card appeared in chat | No |
| "File ready" message shown | No |
| Downloaded file — but didn't open it | No |
| Opened app, sent real request, got output, opened/used the output | **YES** |

Full proof standard: [~/.claude/skills/feature-verification/SKILL.md]

---

## Product Areas

---

### 1. Python Execution & Artifacts

*Spec: [docs/features/feature_list.md](features/feature_list.md)*
*Gap analysis: [docs/tips-guides/claude-ai-capability-gap-analysis.md](tips-guides/claude-ai-capability-gap-analysis.md)*

#### Foundation (Phase 1) — ✅ Complete

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1.1 | E2B stateful Python sandbox | ✅ | Per-thread, Redis-backed, 35-min TTL |
| 1.2 | `execute_python` AI tool | ✅ | Vercel AI SDK v5, factory per threadId |
| 1.3 | PNG chart capture (matplotlib) | ✅ | Base64 images in Artifacts panel |
| 1.4 | Artifacts side panel | ✅ | Framer Motion sliding panel |
| 1.5 | Excel file upload + schema preview | ✅ | SheetJS, fileUrl injected into chat |
| 1.6 | CSV file upload + data preview | ✅ | Full preview with fileUrl |
| 1.7 | Context overflow protection | ✅ | Strips base64 images from old tool results |

#### Artifact Rendering (Phase 2) — ✅ Complete

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 2.1 | HTML artifact live rendering | ✅ | Sandboxed iframe, blob URL |
| 2.2 | React artifact live rendering | ✅ | Babel + React CDN wrapper in iframe |
| 2.3 | SVG artifact rendering | ✅ | dangerouslySetInnerHTML in Render tab |
| 2.4 | Mermaid diagram rendering in panel | ✅ | Reuses MermaidDiagram component |
| 2.5 | Markdown report rendering | ✅ | ReactMarkdown in Preview tab |
| 2.6 | File download button | ✅ | DOWNLOAD_FILE marker → Blob → download icon |
| 2.7 | python-pptx / python-docx in E2B | ✅ | Pre-installed on session creation |
| 2.8 | PyPI package install at runtime | ✅ | `pip install` guidance in system prompt |

#### File Generation (Phase 3) — ✅ E2E Verified 2026-04-03

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 3.1 | PDF generation (reportlab) | ✅ | 6,465 bytes, `%PDF` magic bytes verified |
| 3.2 | Excel generation from scratch (xlsxwriter) | ✅ | 18,201 bytes, PK ZIP magic bytes verified |
| 3.3 | PowerPoint generation (python-pptx) | ✅ | 74,894 bytes, non-corrupt verified |
| 3.4 | Word document generation (python-docx) | ✅ | 70,553 bytes, non-corrupt verified |
| 3.5 | PDF upload + text extraction | 📋 | pdfplumber in E2B; needs ingest route |
| 3.6 | DOCX upload + text extraction | 📋 | python-docx can read; needs ingest route |
| 3.7 | Multi-file downloads per execution | 📋 | Multiple DOWNLOAD_FILE markers |

**Verification test:** `tests/features/file-generation.spec.ts`
**Persona:** Jordan Bell (Financial Analyst) — see feature-verification skill

#### Interactive Visualizations (Phase 4) — 📋 Planned

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 4.1 | Chart.js interactive charts via HTML artifact | 📋 | Works via HTML rendering; needs AI prompt guidance |
| 4.2 | Plotly interactive charts via HTML artifact | 📋 | AI uses `pio.to_html()` pattern |
| 4.3 | D3.js visualizations | 📋 | CDN-loaded in HTML artifact |
| 4.4 | Three.js 3D graphics | 📋 | CDN-loaded in HTML artifact |
| 4.5 | p5.js generative art / Canvas | 📋 | CDN-loaded in HTML artifact |
| 4.6 | Resizable Artifacts panel | 💡 | Draggable width for large visualizations |

#### Artifact Enhancements (Phase 5) — 📋 Planned

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 5.1 | Artifact version history | 📋 | Array of ArtifactData per thread, switcher UI |
| 5.2 | Artifact inline editing | 📋 | Edit code in panel → re-execute or re-render |
| 5.3 | Artifact fullscreen mode | 📋 | Expand to full viewport |
| 5.4 | Artifact share / publish URL | 📋 | `/artifacts/[id]` public page |
| 5.5 | Artifact persistent storage | 💡 | postMessage API, DB-backed, 20MB limit |
| 5.6 | AI-powered artifacts (embed model API) | 💡 | Artifact calls Claude API via MCP proxy |

---

### 2. Plugins & Skills (Customize) — ✅ Complete (2026-04-02)

*Spec: [docs/superpowers/specs/2026-04-02-plugins-skills-design.md](superpowers/specs/2026-04-02-plugins-skills-design.md)*
*Plan: [docs/superpowers/plans/2026-04-02-plugins-skills.md](superpowers/plans/2026-04-02-plugins-skills.md)*
*Branch: `claude/platform-architecture-planning-h1crR`*

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| P.1 | Plugin types (`src/types/plugin.ts`) | ✅ | E2E verified |
| P.2 | Plugin DB tables (PluginTable + UserPluginTable) | ✅ | Migration 0017 applied |
| P.3 | Plugin repository + API routes | ✅ | E2E verified |
| P.4 | SWR hooks (`use-plugins.ts`) | ✅ | E2E verified — toggle works |
| P.5 | Seed data (10 org-wide plugins) | ✅ | Seeded via pnpm test:e2e:seed |
| P.6 | `/customize` page — Skills tab | ✅ | E2E verified — Org Plugins + toggles visible |
| P.7 | Plugin selector UI (pill + skill chips) | ✅ | E2E verified — QBR + Call Prep chips work |
| P.8 | System prompt injection (active plugins) | ✅ | activePluginId flows to API |
| P.9 | Admin plugins management page | ✅ | `/admin/plugins` verified |
| P.10 | @mention plugin/skill in chat input | ✅ | E2E verified — Plugins column appears |
| P.11 | Slash command pre-fill | ✅ | E2E verified — /pipeline-review + /health-check |
| P.12 | `activePluginId` sent to chat API | ✅ | E2E verified — chat-bot.tsx → API |

**Verification test:** `tests/features/plugins.spec.ts` — 8/8 passing
**Personas:** Sarah Chen (Customer Success), Marcus Rodriguez (Sales Director)

---

### 3. Projects (Named Conversation Containers)

*Claude.ai feature: Named projects with shared instructions, memory, and uploaded files injected as context into every chat within the project.*

*Spec: [docs/superpowers/specs/2026-04-01-projects-feature-design.md](superpowers/specs/2026-04-01-projects-feature-design.md)*
*Plan: [docs/superpowers/plans/2026-04-01-projects-feature.md](superpowers/plans/2026-04-01-projects-feature.md)*

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| J.1 | ProjectTable + ProjectFileTable in schema | 📋 | Plan written; not implemented |
| J.2 | Project repository + CRUD API routes | 📋 | |
| J.3 | `/projects` list page | 📋 | Grid of project cards |
| J.4 | `/projects/[id]` detail page | 📋 | Instructions + memory + files sidepanel |
| J.5 | Thread → project assignment | 📋 | `projectId` FK on ChatThreadTable |
| J.6 | Project context injected into chat | 📋 | Instructions + file summaries in system prompt |
| J.7 | Auto-generated project memory | 📋 | AI call on `onFinish` to update memory field |
| J.8 | Project file upload + context injection | 📋 | Files stored in Blob, text extracted for context |
| J.9 | Project badge on chat input | 📋 | Blue folder badge showing active project |

**Priority:** HIGH — this is a flagship Claude.ai differentiator

---

### 4. Agent File Upload — ✅ Complete (2026-04-03)

*Plan: [docs/superpowers/plans/2026-04-01-agent-file-upload.md](superpowers/plans/2026-04-01-agent-file-upload.md)*

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| A.1 | AgentFileTable in schema | ✅ | Migration 0016 applied |
| A.2 | File CRUD on AgentRepository | ✅ | 4 methods: insert, selectAll, selectById, delete |
| A.3 | POST/DELETE API routes for agent files | ✅ | Auth + owner check + storage delete |
| A.4 | AgentFilesPanel component | ✅ | Drag-drop upload, list, delete; owner-only |
| A.5 | Agent files injected into chat messages | ✅ | Via processStoredFileParts (Excel/CSV aware) |

---

### 5. Admin Model Settings — ✅ Complete (2026-04-03)

*Plan: [docs/superpowers/plans/2026-04-02-admin-model-settings.md](superpowers/plans/2026-04-02-admin-model-settings.md)*

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| M.1 | TenantProviderKey + TenantModelSetting DB tables | ✅ | Migration applied |
| M.2 | Tenant model config repository | ✅ | CRUD + getTenantModelConfig |
| M.3 | Per-tenant async model provider | ✅ | getTenantModelProvider with fallback |
| M.4 | Admin `/admin/models` split-panel UI | ✅ | Provider keys + per-model toggles |
| M.5 | Per-user preferred model persistence | ✅ | preferredModel on UserTable |
| M.6 | Azure OpenAI provider support | ✅ | @ai-sdk/azure installed |

---

### 6. Memory & Persistent Context

*Claude.ai feature: Claude remembers facts about you across conversations (Pro+). Users can view/edit memories.*

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| Mem.1 | Auto-extract user preferences after each chat | 💡 | AI call on `onFinish` to extract + store memories |
| Mem.2 | Memory storage table (`user_memory`) | 💡 | Key-value pairs per user |
| Mem.3 | Memory injection into system prompt | 💡 | Inject relevant memories on each chat |
| Mem.4 | Memory view/edit page (`/settings/memory`) | 💡 | List + delete individual memories |
| Mem.5 | Memory search + relevance ranking | 💡 | Embed memories, cosine similarity to query |

**Priority:** HIGH — major Claude.ai differentiator missing from all open-source alternatives

---

### 7. Voice Input / Output

*Claude.ai feature: Voice input on iOS app. Voice output (read aloud) in web.*

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| V.1 | Voice input (browser Web Speech API) | 💡 | Mic button → transcript → chat input |
| V.2 | Voice input (Whisper via API) | 💡 | Better accuracy; requires audio upload route |
| V.3 | Read aloud (TTS) | 💡 | Browser SpeechSynthesis or ElevenLabs/OpenAI TTS |

**Priority:** LOW — nice to have, not core B2B functionality

---

### 8. Image Generation

*Claude.ai: No native image generation (as of knowledge cutoff). But many users expect it.*

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| IG.1 | Image generation via DALL-E 3 / gpt-image-1 | 💡 | New tool: `generate_image`; result in Artifacts panel |
| IG.2 | Image generation via Stable Diffusion | 💡 | Requires SD endpoint; alternative model support |
| IG.3 | Image editing (inpainting) | 💡 | Upload + mask + prompt |

**Priority:** LOW for current B2B focus; HIGH if targeting creative/marketing users

---

### 9. Web Search

*Claude.ai: Has web search as a tool (Claude.ai Pro). Results cited inline.*

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| WS.1 | Web search via Brave Search API | 💡 | New tool: `search_web`; results injected as context |
| WS.2 | Web search via Tavily API | 💡 | Better structured results for RAG |
| WS.3 | Search result citation in chat | 💡 | Show sources with links |
| WS.4 | Web page fetch/read tool | 💡 | `fetch_url` tool; convert HTML to markdown |

**Note:** MCP already supports web search servers. Short path: enable `@brave/search` MCP server as default.

**Priority:** HIGH — users expect AI to have current information

---

### 10. Conversation & UX

*Features in Claude.ai that improve day-to-day chat quality.*

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| UX.1 | Conversation search / full-text search | 💡 | Search across all threads and messages |
| UX.2 | Temporary / incognito chats | 💡 | Session not saved to history |
| UX.3 | Star / favorite conversations | 💡 | Pin important threads |
| UX.4 | Conversation export (PDF / Markdown) | 💡 | Export chat transcript |
| UX.5 | Message branching (edit + regenerate) | 💡 | Edit past message → create branch |
| UX.6 | Stop generation button | ✅ | Exists in base chatbot |
| UX.7 | Retry / regenerate last response | 💡 | Regenerate without re-typing |
| UX.8 | Copy code blocks with one click | ✅ | Exists in base chatbot |
| UX.9 | Message reactions / thumbs up-down | 💡 | Feedback for fine-tuning |
| UX.10 | Conversation sharing (public link) | 💡 | `/share/[id]` route |

---

### 11. File & Document Intelligence

*Beyond Python file generation — native document handling.*

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| DI.1 | PDF upload + text extraction | 📋 | pdfplumber via E2B; needs ingest route |
| DI.2 | DOCX upload + text extraction | 📋 | python-docx via E2B |
| DI.3 | Image upload + vision analysis | 💡 | Vercel AI SDK supports vision; needs UI |
| DI.4 | ZIP file upload + extract + analyze | 💡 | Unzip in E2B, analyze contents |
| DI.5 | Long document chunking + RAG | 💡 | Chunk → embed → vector search → context |

---

### 12. System Prompt Quality — ✅ Complete (2026-04-03)

*Plan: [docs/superpowers/plans/2026-04-03-system-prompt-quality.md](superpowers/plans/2026-04-03-system-prompt-quality.md)*

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| SQ.1 | `buildContextualInjections()` — jailbreak, IP, cyber, ethics reminders | ✅ | 12 tests passing |
| SQ.2 | Rewrite `buildUserSystemPrompt()` with Claude.ai personality + formatting rules | ✅ | In-place; signature unchanged |
| SQ.3 | Wire `buildContextualInjections` into chat route | ✅ | Appended to `mergeSystemPrompt()` |

---

### 13. Prompt Vault & Superadmin — ✅ Complete (2026-04-03)

*Plan: [docs/superpowers/plans/2026-04-03-prompt-vault-superadmin.md](superpowers/plans/2026-04-03-prompt-vault-superadmin.md)*

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| PV.1 | `superadmin` role + permission helpers | ✅ | `hasSuperadminPermission()`, `requireSuperadminPermission()` |
| PV.2 | `SystemPromptTable` + `SystemPromptAuditTable` in schema | ✅ | Migration applied |
| PV.3 | `system-prompt-repository.pg.ts` — CRUD, versioning, 30s cache | ✅ | |
| PV.4 | `/superadmin/` route group with server-component role gate | ✅ | Separate from `/admin/` |
| PV.5 | `/superadmin/system-prompts` — list + editor UI | ✅ | Prompt text never returned via API |
| PV.6 | Chat route reads active prompt from DB | ✅ | Records `systemPromptVersion` in chat metadata |

---

### 14. Platform & Infrastructure

*Admin, multi-tenancy, enterprise features.*

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| PL.1 | Multi-tenancy | ✅ | `x-tenant-id` header, all platform tables scoped |
| PL.2 | RBAC / permissions | ✅ | Roles, permissions, API keys |
| PL.3 | Admin dashboard | ✅ | User management, connector settings |
| PL.4 | Admin model settings | 📋 | Plan written — see Area 5 |
| PL.5 | Usage tracking / billing hooks | 💡 | Per-tenant token consumption |
| PL.6 | Audit log | 💡 | Who did what, when |
| PL.7 | SSO / SAML | 💡 | Enterprise auth requirement |
| PL.8 | API key management (external) | 💡 | Users generate API keys to access platform |
| PL.9 | Webhook support | 💡 | Push events to external systems |
| PL.10 | White-label / custom branding | 💡 | Logo, colors, custom domain |

---

## Priority Matrix

### Do Next (Highest Value, Has Plan)

| # | Feature Area | Plan Exists | Effort | Why Now |
|---|---|---|---|---|
| 1 | ~~E2E verify file generation (Phase 3)~~ | ✅ Done 2026-04-02 | — | 4/4 formats verified |
| 2 | ~~E2E verify Plugins & Skills~~ | ✅ Done 2026-04-02 | — | 8/8 tests passing |
| 3 | **System Prompt Quality** | `plans/2026-04-03-system-prompt-quality.md` | 0.5d | Improves every conversation; plan fully written |
| 4 | **Admin Model Settings** | `plans/2026-04-02-admin-model-settings.md` | 3-4d | Enables enterprise; plan fully written |
| 5 | **Agent File Upload** | `plans/2026-04-01-agent-file-upload.md` | 2-3d | Plan fully written; mirrors Project Files |
| 6 | **Projects Feature** | `plans/2026-04-01-projects-feature.md` | 5-7d | Flagship Claude.ai feature; plan written |
| 7 | **Prompt Vault & Superadmin** | `plans/2026-04-03-prompt-vault-superadmin.md` | 2-3d | Prompt iteration without deploys |

### High Value, No Plan Yet

| # | Feature Area | Why |
|---|---|---|
| 1 | **Memory / persistent context** | Major differentiator; no open-source alternative does this well |
| 2 | **Web search integration** | Users expect AI to have current info |
| 3 | **PDF + DOCX upload** | Completes the file lifecycle (generate + ingest) |
| 4 | **Conversation search** | Core productivity feature |
| 5 | **Interactive charts (Chart.js/Plotly)** | HTML rendering already works; just needs prompt guidance |

---

## Upcoming Sprint Planning

### Sprint 1 ✅ Complete (2026-04-02)
1. ✅ E2E verify Phase 3 file generation — 4/4 formats, Jordan Bell persona
2. ✅ E2E verify Plugins & Skills — 8/8 tests, Sarah Chen + Marcus Rodriguez
3. Next: Push branch + merge to main, then Sprint 2

### Sprint 2 ✅ Complete (2026-04-03)
1. ✅ System Prompt Quality — `buildContextualInjections` + rewritten `buildUserSystemPrompt`
2. ✅ Admin Model Settings — per-tenant providers, model toggles, preferred model, `/admin/models`
3. ✅ Agent File Upload — upload, delete, inject into chat context

### Sprint 3
1. Projects Feature — execute `plans/2026-04-01-projects-feature.md`
2. Prompt Vault & Superadmin — execute `plans/2026-04-03-prompt-vault-superadmin.md`
3. Interactive charts prompt guidance (1 day, unlock from existing HTML rendering)

### Sprint 4
1. Memory/persistent context — write spec first, then implement
2. Web search integration — enable via MCP + custom tool

---

## Cross-Session Resume Instructions

**At the start of every new session:**

```
Read docs/ROADMAP.md. Current branch: claude/platform-architecture-planning-h1crR
Active area: [update this before ending session]
Last completed: [update this before ending session]
Next action: [update this before ending session]
```

### Current Session State (2026-04-03)

- **Branch:** `claude/platform-architecture-planning-h1crR`
- **PR:** #4 (open — all Sprint 1 + Sprint 2 work)
- **Last completed:** Sprint 2 fully implemented — System Prompt Quality, Admin Model Settings, Agent File Upload, Prompt Vault & Superadmin (bonus)
- **Active area:** Ready for Sprint 3
- **Next action:**
  1. Projects Feature — execute `plans/2026-04-01-projects-feature.md`
  2. Prompt Vault & Superadmin — already implemented (superadmin routes + UI committed)
  3. Interactive charts prompt guidance

### Dev Environment

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server at localhost:3000 |
| `pnpm test` | Run unit tests (849 passing as of last session) |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm test:e2e:seed` | Seed test users (run once per DB reset) |
| `pnpm test:e2e:ui` | Run Playwright with browser visible (best for verification) |
| `pnpm db:generate` | Generate Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply migrations to DB |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/e2b/types.ts` | ArtifactData, ArtifactContentType, detectArtifactContentType |
| `src/lib/e2b/session-manager.ts` | Sandbox lifecycle, pre-installs packages |
| `src/lib/ai/tools/code/execute-python-server.ts` | Tool execution, DOWNLOAD_FILE detection |
| `src/components/artifacts-panel.tsx` | Artifacts side panel: Preview/Render/Code tabs |
| `src/lib/ai/prompts.ts` | System prompt including data_analysis_capabilities + active_plugins |
| `src/types/plugin.ts` | All plugin types |
| `src/lib/plugins/plugin-utils.ts` | Pure helpers: mergePluginWithUserState, buildPluginsSystemPrompt |
| `src/lib/plugins/seed-data.ts` | 10 default org-wide plugins |
| `src/components/plugin-selector.tsx` | Plugin pill + skill chips in chat input |
| `src/app/(chat)/customize/page.tsx` | /customize page (Skills tab) |
| `src/components/customize/customize-shell.tsx` | 3-column Customize layout |
| `src/lib/db/pg/schema.pg.ts` | Single schema file (~55 tables, 2800+ lines) |
| `src/lib/db/repository.ts` | Central repository exports |
| `tests/features/` | E2E verification tests (Playwright) |
| `docs/superpowers/plans/` | All implementation plans |
| `docs/superpowers/specs/` | All design specs |

---

## Verification Checklist Template

Use this after each feature area is implemented:

```
Feature: [name]
Persona: [e.g., Jordan Bell — Financial Analyst]
Request sent: "[exact prompt used]"
Result:
  - Tool card appeared: ✓/✗
  - Artifacts panel opened: ✓/✗
  - Download triggered: ✓/✗
  - File opened without errors: ✓/✗
  - Content correct (data/formulas/formatting): ✓/✗
Playwright test: tests/features/[name].spec.ts
Status: ✅ VERIFIED / ❌ NOT VERIFIED
```

---

---

## Engineering Architecture Specs (Claude Code Source Insights)

These specs translate the best engineering patterns from the Claude Code source into our platform. Each is a complete design with TDD tasks, file maps, and implementation details.

| Spec | Source Pattern | Priority | Status |
|------|----------------|----------|--------|
| [Context Management & Auto-Compaction](superpowers/specs/2026-04-02-context-management.md) | Layered compaction (auto → reactive → circuit breaker) | HIGH | 📋 Planned |
| [Session Continuity & Resumption](superpowers/specs/2026-04-02-session-continuity.md) | Stable session IDs, JSONL transcripts, cost recovery | HIGH | 📋 Planned |
| [Memory Architecture](superpowers/specs/2026-04-02-memory-architecture.md) | Tiered memory: session → user → project → global preferences | HIGH | 📋 Planned |
| [Agent Architecture](superpowers/specs/2026-04-02-agent-architecture.md) | Fork model, concurrent tool batching, sibling abort | HIGH | 📋 Planned |
| [Streaming & Retry](superpowers/specs/2026-04-02-streaming-retry.md) | Query source discrimination, per-source retry policies | HIGH | 📋 Planned |
| [Permission & Security Model](superpowers/specs/2026-04-02-permission-security-model.md) | Classifier → denial tracking → user prompt → hooks | MEDIUM | 📋 Planned |

### Key Claude Code Insights Encoded in These Specs

1. **Byte-identical fork context** — All fork subagents use identical placeholder text so prompt cache is shared across all children, dramatically reducing API costs for parallel agents
2. **Reactive compaction with token gap** — Parse the `prompt_too_long` error to find exact token count, skip past multiple history groups in ONE retry instead of N retries
3. **Query source discrimination** — Tag every API call: `user` calls retry aggressively, `memory-extract` and `session-title` calls never retry (would amplify 529 cascades)
4. **Denial tracking → auto-approve** — After 3 permission denials for the same tool, start auto-approving — early denials are the safety signal, continued denial is fatigue
5. **Selective memory recall** — Don't load all memories; use a fast model (Haiku) to select 3-5 relevant files from a manifest. Budget: 25K tokens, 5 files max
6. **Post-compact restoration** — After compaction, re-inject up to 5 files (5K tokens each) and active skill context. Skills are top-heavy so truncation preserves critical instructions
7. **File state cache with partial view flag** — Mark cache entries as `isPartialView` when auto-injected content diverged from disk; force re-read before edit to prevent silent corruption
8. **Plan slug caching** — Human-readable plan names (`clever-dragon.md`) cached per session; collision detection retries up to 10×
9. **Heartbeat via synthetic messages** — Long-running operations emit synthetic status every 30s to prevent timeouts and keep user informed
10. **Background extraction** — Session memory extraction runs in a forked subagent non-blocking; never interrupts main conversation flow

---

## Feature Specs (Roadmap Items)

| Spec | Claude.ai Gap | Priority | Status |
|------|---------------|----------|--------|
| [Persistent User Memory](superpowers/specs/2026-04-02-persistent-user-memory.md) | Claude "Memories" feature | HIGH | 📋 Planned |
| [Web Search Integration](superpowers/specs/2026-04-02-web-search.md) | Claude web search tool | HIGH | 📋 Planned |
| [Interactive Visualizations](superpowers/specs/2026-04-02-interactive-visualizations.md) | Chart.js/Plotly/D3 in artifacts | HIGH | 🔬 Code exists |
| [Conversation Features](superpowers/specs/2026-04-02-conversation-features.md) | Search, star, export, branch, share | MEDIUM | 📋 Planned |
| [Context Management](superpowers/specs/2026-04-02-context-management.md) | Never hit "context too long" | HIGH | 📋 Planned |
| [Projects Feature](superpowers/specs/2026-04-01-projects-feature-design.md) | Claude Projects | HIGH | 📋 Plan written |
| [Admin Model Settings](superpowers/specs/2026-04-02-admin-model-settings-design.md) | Per-tenant model config | HIGH | 📋 Plan written |
| [Plugins & Skills](superpowers/specs/2026-04-02-plugins-skills-design.md) | Claude Customize panel | ✅ Code done | 🔬 Needs E2E |

---

## Notes & Decisions Log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-04-02 | SWR (not React Query) for all client hooks | Project standard; matches existing use-agents.ts, use-mcp.ts |
| 2026-04-02 | Plugins: JSONB for skills/commands arrays | Avoids extra junction tables; queried rarely |
| 2026-04-02 | Plugins: Approach B (single table + user_plugin) | Cleaner than org + user separate tables |
| 2026-04-02 | Feature verification: E2E proof required before "shipped" | Prior session marked Phase 3 shipped without browser testing |
| 2026-04-02 | Migration numbered 0017 (plugins) | Agent file upload will need 0018; Projects will need 0019 |
| 2026-04-03 | Added System Prompt Quality + Prompt Vault to roadmap | New plan files written 2026-04-03; System Prompt Quality added to Sprint 2 head |
