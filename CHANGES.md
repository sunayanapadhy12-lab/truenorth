# Architectural Evolution & Changes from Round 1 🔄

This document outlines the differences between the preliminary conceptual plan (Round 1) and the production-grade implementation (Round 2: The Build), detailing the engineering trade-offs made to maximize reliability, deployability, and judge velocity.

---

### 1. Unified Next.js App Router Architecture vs. Separate FastAPI Microservice
- **Round 1 Concept**: A distributed architecture featuring a Python FastAPI backend, a Celery/Redis task queue, a separate Next.js frontend, and a PostgreSQL database.
- **Round 2 Reality**: A consolidated single-repo **Next.js 14 App Router** application with native TypeScript API routes and serverless execution.
- **Why the Change**:
  - *Reliability & Solo-Developer Scope*: As a single developer building the complete application, running separate backend servers creates multiple failure points during hackathon judging (CORS header errors, microservice cold-starts, port conflicts, and dual deployment failures).
  - *Deployment Velocity*: Next.js API routes deploy seamlessly to Vercel in a single unified pipeline with atomic versioning, zero serialization overhead, and shared TypeScript domain interfaces across frontend and backend.

---

### 2. Zero-Config Local Mock Store with Supabase PostgreSQL Mirroring
- **Round 1 Concept**: Hard dependency on an active PostgreSQL database connection string before the server could boot.
- **Round 2 Reality**: Built an in-memory mock store pre-seeded with Cranberry Labs data that activates automatically when Supabase credentials are not provided. When Supabase environment variables are present, queries mirror seamlessly to Supabase with `pgvector`.
- **Why the Change**:
  - *Zero Friction for Judges*: A judge reviewing the codebase locally should not be forced to create a cloud database account, run migrations, or configure credentials just to inspect the core workflow.
  - *Never Crash Philosophy*: The app runs out-of-the-box in mock mode, displays an informative banner explaining state persistence, and provides an Admin "Reset Demo" button to restore pristine seed data at any time.

---

### 3. Post-Generation Verifier Gate as a Non-Negotiable Citation Standard
- **Round 1 Concept**: Relied on prompt engineering to request that the LLM provide accurate citations.
- **Round 2 Reality**: Implemented a strict deterministic post-generation **Citation Verifier** (`verifier.ts`) that programmatically validates every finding before it reaches the UI.
- **Why the Change**:
  - *Elimination of Hallucinations*: LLMs frequently paraphrase quotes or invent realistic-sounding source IDs (e.g. citing `CL-TONE-99` when only `CL-TONE-01` through `CL-TONE-04` exist).
  - *Hard Enforcement*: Our verifier checks `draftContent.indexOf(quoted_span) !== -1` and verifies that `source_id` exists in the organization's approved knowledge base. Any finding failing either check is permanently discarded. **No valid citation = no finding.**

---

### 4. Dynamic Highlight Offset Recomputation (`recomputeFindingOffsets`)
- **Round 1 Concept**: Drafts were treated as static documents where highlights were mapped once.
- **Round 2 Reality**: When a creator accepts a suggestion or applies a manual edit, text length changes (e.g. replacing a 15-character phrase with a 14-character rewrite). TrueNorth dynamically recalculates `spanStart` and `spanEnd` for all downstream findings and increments the submission version to $N+1$.
- **Why the Change**: Without real-time offset delta calculation, accepting a single suggestion causes all remaining inline highlights to drift out of alignment, breaking the UI.

---

### 5. 1-Click Persona Simulator vs. Traditional Signup & Login Screens
- **Round 1 Concept**: Traditional email/password signup flow with email verification.
- **Round 2 Reality**: Replaced login gating with a prominent 1-click **Persona Switcher** in the navigation header, backed by seeded Cranberry Labs employees (Sarah Chen [Admin], Alex Rivera [Creator], Marcus Vance [Manager], Dr. Elena Rostova [Reviewer]).
- **Why the Change**: A login screen or empty dashboard scores zero points. Hackathon judges have limited time and need to experience the core compliance review workflow end-to-end within 60 seconds of opening the deployment.

---

### 6. Dual-Mode Retrieval (Semantic Vectors + Keyword Category Boosting)
- **Round 1 Concept**: Pure vector search requiring external embedding calls for every query sentence.
- **Round 2 Reality**: Hybrid retrieval combining sentence tokenization, domain category boosting (claims, compliance, metrics), and graceful keyword overlap fallback when API embeddings are offline.
- **Why the Change**: Prevents the application from stalling or failing if the embedding API is rate-limited, ensuring that relevant clauses and approved facts are consistently surfaced.

