# TrueNorth Feature Checklist & Status 📋

| Capability / Workflow | Scored Hackathon Requirement | Status | Verification & Location |
| :--- | :--- | :---: | :--- |
| **Zero-Friction Persona Switcher** | 1-click switcher (Admin, Creator, Manager, Reviewer) without login | ✅ **Done** | [`src/components/RoleSwitcher.tsx`](./src/components/RoleSwitcher.tsx), sets cookie session read by server |
| **Cranberry Labs Seed Data** | 25 clauses, 15+ terms, 12+ facts (with expired ones), palette, 3 sample drafts | ✅ **Done** | [`src/lib/seed/cranberry-labs-data.ts`](./src/lib/seed/cranberry-labs-data.ts) |
| **1-Click Sample Draft Loader** | Button on submit page loading realistic drafts with intended violations | ✅ **Done** | [`src/components/SampleDraftLoader.tsx`](./src/components/SampleDraftLoader.tsx) |
| **Brand Knowledge Hub (Admin)** | Split guidelines into clause records with IDs; terms; facts; palette | ✅ **Done** | [`src/app/admin/knowledge/page.tsx`](./src/app/admin/knowledge/page.tsx) |
| **Document Parser & Extraction** | Upload PDF, DOCX, MD, TXT with 5MB limit and friendly errors | ✅ **Done** | [`src/lib/parser/file-extractor.ts`](./src/lib/parser/file-extractor.ts) |
| **Clause Splitting Engine** | Auto-split headings/numbers into clauses with categories and severities | ✅ **Done** | [`src/lib/parser/clause-splitter.ts`](./src/lib/parser/clause-splitter.ts) |
| **Deterministic Rules Engine** | Banned/preferred terms, product casing, required channel disclaimers, superlatives | ✅ **Done** | [`src/lib/engine/rules-engine.ts`](./src/lib/engine/rules-engine.ts) |
| **Sentence-Level Retrieval** | Keyword & semantic retrieval matching draft sentences to clauses & facts | ✅ **Done** | [`src/lib/engine/retrieval.ts`](./src/lib/engine/retrieval.ts) |
| **Gemini LLM Judge** | Structured JSON output, isolated prompt injection defense, 10s timeout, daily cap | ✅ **Done** | [`src/lib/engine/llm-judge.ts`](./src/lib/engine/llm-judge.ts) |
| **Strict Citation Verifier** | Discard unquoted spans or invalid source IDs; confidence score; origin tagging | ✅ **Done** | [`src/lib/engine/verifier.ts`](./src/lib/engine/verifier.ts) |
| **Safe Fallback Gate** | Graceful degrade to rules when AI offline/timed out; persistent banner; zero crash | ✅ **Done** | [`src/lib/engine/pipeline.ts`](./src/lib/engine/pipeline.ts) |
| **Creator Review Split View** | Draft with inline highlights; side panel with findings & source links | ✅ **Done** | [`src/app/submissions/[id]/page.tsx`](./src/app/submissions/[id]/page.tsx) |
| **Accept Suggestion Action** | Replaces text inline, creates Version $N+1$, recomputes remaining highlight offsets | ✅ **Done** | [`src/app/api/submissions/[id]/action/route.ts`](./src/app/api/submissions/[id]/action/route.ts) |
| **Manual Edit Action** | Custom replacement text, creates Version $N+1$, recomputes offsets | ✅ **Done** | [`src/app/api/submissions/[id]/action/route.ts`](./src/app/api/submissions/[id]/action/route.ts) |
| **Dismiss with Reason** | Mandatory audit rationale required to dismiss any flagged finding | ✅ **Done** | Stored in `findings.dismiss_reason`, logged to audit |
| **Visual Version Diff Viewer** | Word-level diff viewer comparing Version $N$ vs $N-1$ | ✅ **Done** | [`src/components/DiffViewer.tsx`](./src/components/DiffViewer.tsx) |
| **Human Approval Workflow** | Approve, Request Changes, Reject; versions permanently locked upon approval | ✅ **Done** | [`src/app/approvals/page.tsx`](./src/app/approvals/page.tsx) |
| **Claim-Sensitive Role Gating** | Claim/fact violations strictly require Reviewer role; enforced on server | ✅ **Done** | [`src/app/api/submissions/[id]/approval/route.ts`](./src/app/api/submissions/[id]/approval/route.ts) |
| **Threaded Comments** | Comments attributed to user name and role per submission version | ✅ **Done** | [`src/app/api/submissions/[id]/comments/route.ts`](./src/app/api/submissions/[id]/comments/route.ts) |
| **Audit Trail Stream** | Log submissions, engine runs, actions, comments, and approvals | ✅ **Done** | [`src/app/api/audit/route.ts`](./src/app/api/audit/route.ts) |
| **AI Transparency Page** | Discloses external services, transmitted data, prompt defense, and live audit log | ✅ **Done** | [`src/app/ai-disclosure/page.tsx`](./src/app/ai-disclosure/page.tsx) |
| **Executive Insights** | Findings by category, top 5 frequent issues, most-dismissed clauses (plain counts) | ✅ **Done** | [`src/app/insights/page.tsx`](./src/app/insights/page.tsx) |
| **Reset Demo Button** | Admin-only button to restore pristine Cranberry Labs seed data | ✅ **Done** | [`src/app/api/admin/reset-demo/route.ts`](./src/app/api/admin/reset-demo/route.ts) |
| **Automated Unit Tests** | Tests for rules engine, clause splitting, verifier, RBAC, and insights | ✅ **Done** | 32 passing tests in `src/tests/` |
| **Image Asset Checks** | Palette, contrast, and missing alt-text checks on images | 🟡 **Stretch** | Documented extension; text & document workflow prioritized |
| **Evaluation Harness** | Citation-validity rate & flag precision on labelled test set | 🔵 **Round 3** | Extension point prepared; see `ROUND3.md` |
| **Guideline-Gap Detection** | Detect repeated dismissals & suggest policy updates | 🔵 **Round 3** | Fields `dismiss_reason` & `events` ready; see `ROUND3.md` |
| **Risk-Based Reviewer Triage** | Rank submissions by severity and claim risk | 🔵 **Round 3** | Prepared in schema; see `ROUND3.md` |

