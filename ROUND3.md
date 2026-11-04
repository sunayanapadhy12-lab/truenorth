# Round 3 Design Specifications & Clean Extension Points 🚀

As specified in the Round 2 guidelines, the following three advanced features were intentionally deferred from the immediate build to keep moving parts minimal and the core workflow rock solid. The database schema, audit event architecture, and domain types have been cleanly prepared to support these capabilities without schema migrations.

---

## 1. Evaluation Harness (Citation-Validity Rate & Flag Precision)

### Purpose
To quantitatively measure and benchmark review engine accuracy across different LLM models (`gemini-2.5-flash`, `gemini-1.5-pro`, etc.) using a curated evaluation test set.

### Prepared Architecture & Metrics
- **Dataset Structure**: A collection of 100+ annotated pre-publication drafts with ground-truth labels:
  ```typescript
  interface LabeledBenchmarkDraft {
    id: string;
    content: string;
    channel: SubmissionChannel;
    groundTruthViolations: {
      expectedSpan: string;
      expectedCategory: ClauseCategory;
      expectedSourceId: string;
      expectedSeverity: Severity;
    }[];
  }
  ```
- **Target Metrics**:
  1. **Citation-Validity Rate (CVR)**:
     $$\text{CVR} = \frac{\text{Verified Citations with Matching Ground Truth}}{\text{Total Flagged Findings}} \times 100$$
     *TrueNorth's strict verifier guarantees that 100% of emitted findings match a real knowledge base record; this metric measures whether it cited the exact intended rule.*
  2. **Span Precision & Recall**:
     Measuring character IoU (Intersection over Union) between predicted `quotedSpan` offsets and ground truth spans.
  3. **Hallucination Elimination Ratio**:
     Tracking the percentage of raw LLM outputs caught and discarded by `verifier.ts`.

---

## 2. Guideline-Gap Detection (Creator Feedback Loops)

### Purpose
To identify ambiguous, overly rigid, or outdated brand guidelines by analyzing repeated creator dismissals and reviewer disagreements.

### Prepared Architecture & Data Pipeline
- **Existing Prepared Schema Fields**:
  - `findings.dismiss_reason` (Text, required whenever a creator dismisses an issue).
  - `audit_logs.action = 'finding.dismissed'` (Records author, timestamp, source ID, and rationale).
  - `audit_logs.action = 'approval.changes_requested'` (Records reviewer dispute comments).
- **Proposed Pipeline**:
  ```
  [Audit Log Stream] ──► Filter 'finding.dismissed' ──► Group by source_id
                                                               │
  [LLM Clustering & Gap Synthesis] ◄───────────────────────────┘
         │
         ▼
  Identified Pattern: Clause CL-TONE-02 ("No hype buzzwords")
  Dismissal Rationale: "Word 'game-changing' needed for executive keynote quote"
         │
         ▼
  Actionable Recommendation for Sarah Chen (Admin):
  "Consider amending CL-TONE-02 to exempt direct executive quotes in press releases."
  ```

---

## 3. Risk-Based Reviewer Triage

### Purpose
To automatically score and rank pending submissions in the Approvals queue by corporate legal exposure and claim severity.

### Prepared Architecture & Scoring Formula
- **Existing Prepared Schema Fields**:
  - `findings.severity` (`critical`, `warning`, `info`).
  - `findings.category` (`claim`, `compliance`, `terminology`, etc.).
  - `findings.confidence` (Float 0.0 - 1.0).
  - `submissions.channel` (`press_release` carrying higher regulatory risk than `internal_blog`).
- **Scoring Algorithm**:
  $$\text{Risk Score} = \sum_{f \in \text{Open Findings}} \Big( w_{\text{severity}}(f) \times w_{\text{category}}(f) \times f.\text{confidence} \Big) \times M_{\text{channel}}$$
  Where:
  - $w_{\text{severity}}(\text{critical}) = 10, \; w_{\text{severity}}(\text{warning}) = 3, \; w_{\text{severity}}(\text{info}) = 1$
  - $w_{\text{category}}(\text{claim}) = 2.5, \; w_{\text{category}}(\text{compliance}) = 2.0, \; w_{\text{category}}(\text{tone}) = 1.0$
  - $M_{\text{channel}}(\text{press\_release}) = 2.0, \; M_{\text{channel}}(\text{website}) = 1.5, \; M_{\text{channel}}(\text{blog}) = 1.0$
- **Triage Queue Routing**:
  - **High Risk (Score $\ge$ 50)**: Escalated directly to Dr. Elena Rostova (Legal Reviewer) with high-priority SLA.
  - **Moderate Risk (Score 15–49)**: Routed to Marcus Vance (Manager).
  - **Low Risk (Score $<$ 15)**: Eligible for one-click creator fast-track approval once all rule-based rewrites are accepted.
