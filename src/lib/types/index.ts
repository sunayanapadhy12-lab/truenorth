// TrueNorth Core Domain Types

export type UserRole = 'admin' | 'creator' | 'manager' | 'reviewer';

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export type ClauseCategory =
  | 'tone'
  | 'terminology'
  | 'messaging'
  | 'claim'
  | 'accessibility'
  | 'visual'
  | 'compliance';

export type Severity = 'critical' | 'warning' | 'info';

export interface GuidelineClause {
  id: string; // e.g. "CL-TONE-01"
  organizationId: string;
  category: ClauseCategory;
  title: string;
  summary: string;
  fullText: string;
  severity: Severity;
  embedding?: number[];
  createdAt: string;
}

export interface TerminologyItem {
  id: string;
  organizationId: string;
  term: string;
  preferredTerm?: string;
  isBanned: boolean;
  caseSensitive: boolean;
  reason: string;
  clauseId?: string;
  createdAt: string;
}

export interface ApprovedFact {
  id: string; // e.g. "FACT-PRICE-01"
  organizationId: string;
  statement: string;
  factValue: string;
  effectiveDate: string; // YYYY-MM-DD
  expiryDate?: string;    // YYYY-MM-DD or null
  sourceDoc: string;
  embedding?: number[];
  createdAt: string;
}

export type PaletteRole = 'primary' | 'secondary' | 'accent' | 'background' | 'surface' | 'text';

export interface ColorPaletteItem {
  id: string;
  organizationId: string;
  name: string;
  hex: string;
  role: PaletteRole;
  minContrastRatio: number;
  createdAt: string;
}

export type SubmissionChannel = 'blog' | 'social' | 'email' | 'press_release' | 'website';
export type SubmissionAudience = 'developers' | 'enterprise' | 'general_public';
export type SubmissionStatus = 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  organizationId: string;
  creatorId: string;
  creatorName?: string;
  title: string;
  channel: SubmissionChannel;
  audience: SubmissionAudience;
  currentStatus: SubmissionStatus;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  currentVersion?: SubmissionVersion;
}

export interface SubmissionVersion {
  id: string;
  submissionId: string;
  versionNumber: number;
  content: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  findings?: Finding[];
}

export type FindingOrigin = 'rule-based' | 'ai-assisted';
export type FindingStatus = 'open' | 'accepted' | 'edited' | 'dismissed';
export type FindingSourceType = 'clause' | 'fact' | 'terminology';

export interface Finding {
  id: string;
  versionId: string;
  quotedSpan: string;
  spanStart?: number;
  spanEnd?: number;
  category: ClauseCategory;
  sourceId: string;
  sourceType: FindingSourceType;
  reason: string;
  severity: Severity;
  suggestedRewrite?: string;
  origin: FindingOrigin;
  confidence: number; // 0.0 - 1.0
  status: FindingStatus;
  dismissReason?: string;
  actionedBy?: string;
  actionedAt?: string;
}

export interface Comment {
  id: string;
  submissionId: string;
  versionId?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  body: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  userName?: string;
  userRole?: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface ReviewEngineResult {
  findings: Finding[];
  isAiFallback: boolean;
  fallbackReason?: string;
  processedInMs: number;
}

