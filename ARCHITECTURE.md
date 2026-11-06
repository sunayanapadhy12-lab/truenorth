# TrueNorth Architecture & Technical Blueprint 📐

TrueNorth is a pre-publication brand governance web application engineered for the Inkloom AI Hackathon (Round 2: The Build). This document details the system topology, sequential review engine, PostgreSQL data model, and architectural decisions.

---

## 1. System Topology & Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (Next.js App Router)"]
        Landing["Landing Page (1-Click Demo)"]
        PersonaBar["Role Switcher (Cookie Session)"]
        AdminUI["Brand Knowledge Hub (/admin/knowledge)"]
        SubmitUI["Submission Portal & Sample Loader (/submit)"]
        ReviewUI["Split Review Screen (/submissions/[id])"]
        ApprovalUI["Approvals Gateway (/approvals)"]
        InsightsUI["Insights Analytics (/insights)"]
        DisclosureUI["AI Transparency (/ai-disclosure)"]
    end

    subgraph Server ["Serverless Backend (Next.js API Routes + RBAC)"]
        AuthRBAC["RBAC & Org Scoping Middleware"]
        DocParser["Doc Parser (pdf-parse / mammoth)"]
        PipelineRunner["Master Pipeline Controller"]
        KnowledgeAPI["Knowledge Management APIs"]
        SubmissionAPI["Submission & Versioning Controller"]
    end

    subgraph Engine ["Hybrid Governance Review Engine (Sequential)"]
        RulesEngine["1. Deterministic Rules (Terms, Casing, Superlatives, Disclaimers)"]
        Retrieval["2. Semantic & Keyword Retrieval (Sentence Tokenizer + Category Boost)"]
        LLMJudge["3. Gemini LLM Judge (gemini-2.5-flash, Structured JSON, Isolated Prompt)"]
        Verifier["4. Strict Verifier (Zero Hallucination Filter: Verbatim & Known Source ID)"]
        Fallback["5. Safe Fallback Gate (Graceful Degrade if AI Offline / Cap Hit)"]
    end

    subgraph Storage ["Data Layer (Supabase PostgreSQL + pgvector)"]
        DBOrgs["organizations"]
        DBUsers["users (Admin, Creator, Manager, Reviewer)"]
        DBClauses["guideline_clauses (pgvector 768)"]
        DBTerms["terminology"]
        DBFacts["approved_facts (pgvector 768)"]
        DBPalette["color_palettes"]
        DBSubmissions["submissions & submission_versions"]
        DBFindings["findings (Status, Confidence, Dismiss Reason)"]
        DBComments["comments"]
        DBAudit["audit_logs"]
    end

    PersonaBar --> AuthRBAC
    SubmitUI --> DocParser
    DocParser --> SubmissionAPI
    SubmissionAPI --> PipelineRunner
    PipelineRunner --> RulesEngine
    RulesEngine --> Retrieval
    Retrieval --> LLMJudge
    LLMJudge --> Verifier
    LLMJudge -.->|Timeout / Daily Cap / Error| Fallback
    Verifier --> DBFindings
    Fallback --> DBFindings
    ReviewUI --> SubmissionAPI
    ApprovalUI --> SubmissionAPI
    SubmissionAPI --> Storage
    KnowledgeAPI --> Storage
```

---

## 2. The Hybrid Review Pipeline (Sequential Execution)

TrueNorth rejects monolithic LLM evaluation in favor of a 5-stage sequential pipeline where deterministic constraints always take precedence:

```mermaid
sequenceDiagram
    autonumber
    actor Creator as Creator (Alex Rivera)
    participant API as Next.js API Route (/api/submissions)
    participant Rules as Deterministic Rules Engine
    participant Retrieval as Evidence Retrieval
    participant Gemini as Google Gemini API (gemini-2.5-flash)
    participant Verifier as Strict Citation Verifier
    participant DB as Supabase PostgreSQL

    Creator->>API: Submit Draft Text or Document (PDF/DOCX)
    API->>Rules: Run deterministic checks (banned terms, casing, superlatives, disclaimers)
    Rules-->>API: Rule-based findings (confidence: 1.0)

    API->>Retrieval: Tokenize sentences & score against 25 clauses + 12 facts
    Retrieval-->>API: Top candidate clauses & approved facts

    alt Gemini API Key Available & Under Daily Cap
        API->>Gemini: Invoke LLM Judge with Untrusted Draft + Retrieved Evidence
        Note over Gemini: 10s Timeout | Structured JSON Output | Prompt Injection Defense
        Gemini-->>API: Raw LLM findings (quoted_span, category, source_id, reason)
        API->>Verifier: Validate verbatim span & knowledge-base source ID
        Note over Verifier: Discard any finding whose quoted span is not literally in draft<br/>Discard any finding whose source_id is not in knowledge base
        Verifier-->>API: Verified AI-assisted findings (confidence: 0.85-0.95)
    else Fallback Triggered (No Key / Timeout / Rate Limit Exceeded)
        API->>API: Trigger Fallback Gate: Set isAiFallback=true
        Note over API: Review continues smoothly on rule findings with warning banner
    end

    API->>DB: Persist Version 1 + All Verified Findings + Audit Log
    API-->>Creator: Return Submission ID & Redirect to Review Screen
```

### Pipeline Detail
1. **Deterministic Rules Engine (`rules-engine.ts`)**:
   - Executes case-sensitive and case-insensitive keyword searches with word-boundary awareness.
   - Enforces official CamelCase naming (`CranberryCloud`, `CranberryPulse`).
   - Flags superlative and absolute claim patterns ("fastest", "100% secure", "unbreakable", "guaranteed 100% uptime").
   - Automatically detects missing forward-looking safe harbor disclaimers in `press_release` and `blog` channels.
2. **Semantic & Keyword Retrieval (`retrieval.ts`)**:
   - Tokenizes draft into individual sentences.
   - Evaluates token overlap against the organization's 25 guideline clauses and 12 approved facts.
   - Applies domain category boosts for claim/uptime statements, pricing numbers, and acronyms.
3. **Gemini LLM Judge (`llm-judge.ts`)**:
   - Calls `@google/genai` with model `gemini-2.5-flash`.
   - Constrained by a strict system prompt and structured JSON schema output.
   - Draft text is wrapped in `<UNTRUSTED_DRAFT_CONTENT>` tags with explicit directives forbidding execution of user instructions.
   - Guarded by a 10-second timeout and per-session rate limits + global daily call caps.
4. **Strict Citation Verifier (`verifier.ts`)**:
   - **Check 1 (Verbatim Check)**: Verifies that `quoted_span` exists literally in the draft content (`draftContent.indexOf(quoted_span) !== -1`). Hallucinated quotes are discarded immediately.
   - **Check 2 (Source Check)**: Verifies that `source_id` exists in the organization's registered guideline clauses or approved facts. Fabricated citations are discarded immediately.
   - **Check 3 (Deduplication)**: If an AI finding overlaps an existing rule-based finding, the rule-based finding takes precedence.
5. **Safe Fallback Gate**:
   - If the Gemini API key is missing, rate-limited, or times out, the app gracefully returns deterministic rule findings and activates the banner: *"AI check unavailable, rule-based results only"*. The application never crashes.

---

## 3. Data Model (Entity-Relationship Diagram)

```mermaid
erDiagram
    organizations ||--o{ users : "has"
    organizations ||--o{ guideline_clauses : "defines"
    organizations ||--o{ terminology : "maintains"
    organizations ||--o{ approved_facts : "approves"
    organizations ||--o{ color_palettes : "owns"
    organizations ||--o{ submissions : "contains"
    organizations ||--o{ audit_logs : "records"

    users ||--o{ submissions : "creates"
    users ||--o{ submission_versions : "authors"
    users ||--o{ comments : "writes"

    guideline_clauses ||--o{ terminology : "cites"

    submissions ||--|{ submission_versions : "tracks"
    submissions ||--o{ comments : "receives"

    submission_versions ||--o{ findings : "contains"
    submission_versions ||--o{ comments : "references"
```

---

## 4. Key Architectural Decisions & Trade-Offs

### A. Next.js App Router API Routes vs. Separate FastAPI Microservice
- **Round 1 Concept**: Separate FastAPI Python backend with Celery workers.
- **Round 2 Reality**: A single Next.js TypeScript application deploying simultaneously to Vercel and Supabase.
- **Why**: Eliminates CORS misconfigurations, removes cross-server authentication synchronization, guarantees atomic deployments, and makes it trivial for a single developer or judge to run the entire project locally with a single `npm run dev`.

### B. In-Memory Mock Store with Live Supabase Mirror
- **Problem**: Judges inspecting hackathon repositories frequently test without creating accounts or setting up third-party database connections.
- **Decision**: Implemented an in-memory mock store pre-seeded with Cranberry Labs data that satisfies all CRUD and review queries. When Supabase environment variables are provided, queries mirror seamlessly to PostgreSQL with pgvector. A persistent warning banner indicates Mock Mode vs Supabase.

### C. Zero-Drift Offset Recomputation (`recomputeFindingOffsets`)
- **Problem**: When a creator accepts a suggestion that changes the length of a phrase (e.g. replacing a 15-character phrase with a 14-character rewrite), all subsequent character offsets drift, breaking inline highlights for remaining issues.
- **Solution**: Developed a deterministic offset transformer that calculates `offsetDelta = newSpan.length - oldSpan.length` and shifts all downstream finding spans (`spanStart`, `spanEnd`) when Version $N+1$ is generated.

### D. Server-Enforced RBAC Gating on Legal Claims
- **Problem**: Client-side disabled buttons can be bypassed via direct API calls.
- **Solution**: Server route `/api/submissions/[id]/approval` inspects the version's findings. If any finding has `category === 'claim'` or `source_type === 'fact'`, the server rejects approvals unless `user.role === 'reviewer'`. Standard marketing copy can be approved by `manager`.

