# TrueNorth 🧭
### Pre-Publication Brand Governance Grounded in Verified Truth

> Built for the **Inkloom AI Hackathon (Round 2: The Build)**.  
> Single-developer project engineered with **Google Antigravity**.

---

## ⚡ 60-Second Judge Quickstart (Zero Friction)

TrueNorth is architected for immediate evaluation. A judge opens the deployed app with **no signup, no email verification, and no setup**.

1. **Open the App**: Navigate to [`http://localhost:3000`](http://localhost:3000) (or your deployed Vercel link).
2. **Switch Personas Instantly**: Click the **Persona Switcher** pill in the top-right header to switch roles with a single click:
   - 🧑‍💻 **Alex Rivera (Creator)**: Default persona for submitting copy and resolving findings.
   - 👔 **Marcus Vance (Manager)**: Approves standard copy, comments, and reviews diffs.
   - ⚖️ **Dr. Elena Rostova (Reviewer - Legal)**: Sole authority permitted to sign off on claim/fact violations.
   - 🛡️ **Sarah Chen (Admin)**: Manages brand rules, terminology, facts, and resets demo data.
3. **Run the Core Workflow**:
   - Go to [**Submit Draft**](/submit).
   - Click **Sample 1: Technical Blog Launch** (or Sample 2 / Sample 3).
   - Click **Run Brand Governance Review**.
   - Inspect the **Interactive Highlighted Copy** on the left and the **Findings Panel** on the right.
   - Click **Accept Suggestion** on an issue: notice that an immutable **Version 2** is created and highlight offsets are recalculated in real time.
   - Click **Dismiss** on an issue: notice that a non-empty audit rationale is strictly required.
   - Go to [**Approvals**](/approvals): attempt to approve a claim-sensitive draft as **Manager** (notice the server RBAC blocks it), then switch to **Reviewer** to sign off and permanently lock the version!
   - Visit [**Brand Knowledge**](/admin/knowledge) to inspect the 25 pre-seeded clauses, terminology dictionary, and approved facts.
   - Visit [**AI Transparency**](/ai-disclosure) to inspect data boundaries and real-time audit logs.

---

## 🎯 What TrueNorth Does

TrueNorth solves the enterprise brand risk problem before content is published:
- **The Problem**: Marketing and engineering teams publish blog posts, press releases, and social announcements that inadvertently violate FTC advertising standards, contain outdated pricing or metrics, breach trademark casing, or use deprecated branding.
- **The Solution**: A multi-stage hybrid engine that evaluates draft content against an organization's approved guidelines, terminology, and approved facts.
- **The Hard Guarantee**: Every single finding must cite an exact, verified source ID from the organization's knowledge base and quote an exact verbatim substring from the draft. **No valid citation = no finding.**

---

## 🏗️ Technical Architecture & Pipeline

TrueNorth uses a sequential hybrid pipeline:

```
[Draft Copy In]
       │
       ▼
1. Deterministic Rules Engine (Banned terms, CamelCase product casing, superlatives, channel disclaimers)
       │
       ▼
2. Semantic & Keyword Retrieval (Sentence tokenization, pgvector embeddings + category boosting)
       │
       ▼
3. Gemini LLM Judge (Structured JSON output, prompt injection defense, 10s timeout, daily cap)
       │
       ▼
4. Strict Citation Verifier (Zero-hallucination gate: discards unquoted spans & invalid citation IDs)
       │
       ▼
5. Graceful Fallback Gate (If Gemini API is offline/timed out, degrades to rule results with a banner)
       │
       ▼
[Verified Findings Out] ──► Creator Review Screen (Highlights, Diffs, Accept/Edit/Dismiss, Versions)
                         └──► Human Approval Gateway (Role-gated sign-off & permanent version lock)
```

For complete architectural specifications, see [**ARCHITECTURE.md**](./ARCHITECTURE.md).

---

## 🛠️ Tech Stack & Libraries

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript).
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Cranberry brand design system.
- **AI & Embeddings**: Official Google Gen AI SDK [`@google/genai`](https://www.npmjs.com/package/@google/genai) (`gemini-2.5-flash`, `text-embedding-004`).
- **Database**: [Supabase PostgreSQL](https://supabase.com/) with `pgvector` extension + zero-config in-memory mock fallback for local dev.
- **Document Parsing**: [`pdf-parse`](https://www.npmjs.com/package/pdf-parse) for PDF text extraction, [`mammoth`](https://www.npmjs.com/package/mammoth) for DOCX extraction.
- **Diffing**: [`diff`](https://www.npmjs.com/package/diff) for word-level version comparisons.
- **Icons**: [`lucide-react`](https://lucide.react.dev/).
- **Testing**: [`vitest`](https://vitest.dev/) (32 unit tests passing).

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory (based on `.env.example`):

```bash
# Gemini AI Configuration
# (App gracefully falls back to deterministic rule-based mode if omitted)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Supabase PostgreSQL Configuration
# (App runs in zero-config local mock mode if omitted)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Cost & Abuse Protection Caps
GEMINI_DAILY_CALL_CAP=100
SESSION_RATE_LIMIT_PER_MINUTE=10

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Local Development Setup

1. **Clone & Install Dependencies**:
   ```bash
   git clone <repo-url> truenorth
   cd truenorth
   npm install
   ```

2. **Run Unit Tests**:
   ```bash
   npm test
   ```
   *Runs 32 unit tests covering rules engine, clause splitting, citation verifier, and RBAC.*

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Zero-Config Local Run**:
   TrueNorth includes an in-memory mock store pre-seeded with Cranberry Labs data (25 clauses, 15 terms, 12 facts, 6 palette tokens, and 4 users). You can run and test the complete workflow locally even without Supabase or Gemini keys configured!

---

## ☁️ Deployment Guide (Vercel + Supabase)

### Step 1: Provision Supabase Database
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the complete contents of [`supabase/schema.sql`](./supabase/schema.sql). This sets up `pgvector`, all 12 tables, enums, foreign keys, and indexes.
4. Copy your **Project URL**, **Anon Key**, and **Service Role Key** from *Project Settings -> API*.

### Step 2: Deploy to Vercel
1. Push your repository to GitHub.
2. In [Vercel](https://vercel.com/), click **New Project** and import the `truenorth` repository.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key.
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `GEMINI_MODEL`: `gemini-2.5-flash`.
   - `GEMINI_DAILY_CALL_CAP`: `100`.
   - `SESSION_RATE_LIMIT_PER_MINUTE`: `10`.
4. Click **Deploy**. Vercel will build and deploy the production application.

---

## 📢 Transparent Disclosure

- **Hackathon Round**: Inkloom AI Hackathon (Round 2: The Build).
- **Solo Developer**: CS student building the entire stack in Google Antigravity.
- **AI Coding Tools Disclosure**: Antigravity was used as an agentic pair programmer to scaffold components, write TypeScript types, and author unit tests under continuous human engineering direction.
- **AI Use in App**: Google Gemini API is utilized exclusively as a structured compliance judge, strictly bounded by retrieved evidence, prompt-injection defense isolation, and verified by a post-generation citation filter.

