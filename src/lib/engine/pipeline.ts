import {
  Finding,
  ReviewEngineResult,
  SubmissionChannel,
  SubmissionAudience,
} from '../types';
import { runDeterministicRules } from './rules-engine';
import { retrieveEvidence } from './retrieval';
import { runLLMJudge, LLMJudgeError } from './llm-judge';
import { verifyAndFilterFindings } from './verifier';
import { mockStore } from '../supabase/mock-store';
import { isSupabaseConfigured, supabaseServer } from '../supabase/server';

export interface RunPipelineOptions {
  content: string;
  versionId: string;
  channel?: SubmissionChannel;
  audience?: SubmissionAudience;
  organizationId: string;
  sessionId?: string;
  userId?: string;
}

/**
 * Master Hybrid Review Pipeline:
 * Deterministic Rules -> Semantic & Keyword Retrieval -> Gemini LLM Judge -> Strict Verifier -> Graceful Fallback
 */
export async function executeReviewPipeline(
  options: RunPipelineOptions
): Promise<ReviewEngineResult> {
  const startTime = Date.now();
  const {
    content,
    versionId,
    channel = 'blog',
    audience = 'developers',
    organizationId,
    sessionId = 'default-session',
    userId,
  } = options;

  // 1. Fetch Organization Knowledge Base
  let terms = mockStore.getTerminology();
  let clauses = mockStore.getClauses();
  let facts = mockStore.getFacts();

  if (isSupabaseConfigured && supabaseServer) {
    try {
      const [termsRes, clausesRes, factsRes] = await Promise.all([
        supabaseServer.from('terminology').select('*').eq('organization_id', organizationId),
        supabaseServer.from('guideline_clauses').select('*').eq('organization_id', organizationId),
        supabaseServer.from('approved_facts').select('*').eq('organization_id', organizationId),
      ]);

      if (termsRes.data) {
        terms = termsRes.data.map((t) => ({
          id: t.id,
          organizationId: t.organization_id,
          term: t.term,
          preferredTerm: t.preferred_term,
          isBanned: t.is_banned,
          caseSensitive: t.case_sensitive,
          reason: t.reason,
          clauseId: t.clause_id,
          createdAt: t.created_at,
        }));
      }

      if (clausesRes.data) {
        clauses = clausesRes.data.map((c) => ({
          id: c.id,
          organizationId: c.organization_id,
          category: c.category,
          title: c.title,
          summary: c.summary,
          fullText: c.full_text,
          severity: c.severity,
          createdAt: c.created_at,
        }));
      }

      if (factsRes.data) {
        facts = factsRes.data.map((f) => ({
          id: f.id,
          organizationId: f.organization_id,
          statement: f.statement,
          factValue: f.fact_value,
          effectiveDate: f.effective_date,
          expiryDate: f.expiry_date,
          sourceDoc: f.source_doc,
          createdAt: f.created_at,
        }));
      }
    } catch {
      // Fallback to mockStore
    }
  }

  // 2. Stage 1: Deterministic Rules Engine
  const ruleFindings = runDeterministicRules({
    content,
    versionId,
    channel,
    audience,
    terms,
    clauses,
  });

  // 3. Stage 2: Evidence Retrieval (Top clauses & facts matching draft)
  const evidence = retrieveEvidence(content, clauses, facts, 8, 6);

  let verifiedAiFindings: Finding[] = [];
  let isAiFallback = false;
  let fallbackReason: string | undefined;

  // 4. Stage 3 & 4: LLM Judge & Strict Verifier
  try {
    const judgeResponse = await runLLMJudge({
      content,
      channel,
      audience,
      evidenceClauses: evidence.clauses,
      evidenceFacts: evidence.facts,
      sessionId,
    });

    // Run Verifier
    const verification = verifyAndFilterFindings({
      draftContent: content,
      versionId,
      rawFindings: judgeResponse.findings,
      knownClauses: clauses,
      knownFacts: facts,
      ruleFindings,
    });

    verifiedAiFindings = verification.verifiedFindings;
  } catch (err: unknown) {
    isAiFallback = true;
    fallbackReason =
      err instanceof LLMJudgeError
        ? err.message
        : err instanceof Error
        ? err.message
        : 'AI check unavailable';
  }

  // 5. Merge findings and sort by character offset
  const allFindings = [...ruleFindings, ...verifiedAiFindings].sort(
    (a, b) => (a.spanStart || 0) - (b.spanStart || 0)
  );

  const durationMs = Date.now() - startTime;

  // 6. Audit Trail Logging
  mockStore.logEvent('engine.review_completed', 'submission_version', versionId, userId, {
    totalFindings: allFindings.length,
    ruleFindingsCount: ruleFindings.length,
    aiFindingsCount: verifiedAiFindings.length,
    isAiFallback,
    fallbackReason,
    durationMs,
  });

  return {
    findings: allFindings,
    isAiFallback,
    fallbackReason,
    processedInMs: durationMs,
  };
}
