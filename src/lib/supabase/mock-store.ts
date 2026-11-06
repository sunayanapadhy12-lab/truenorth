import {
  CRANBERRY_ORG,
  SEED_USERS,
  SEED_CLAUSES,
  SEED_TERMINOLOGY,
  SEED_FACTS,
  SEED_PALETTE,
  SEED_SAMPLE_DRAFTS,
} from '../seed/cranberry-labs-data';
import {
  Organization,
  User,
  GuidelineClause,
  TerminologyItem,
  ApprovedFact,
  ColorPaletteItem,
  Submission,
  SubmissionVersion,
  Finding,
  Comment,
  AuditLog,
} from '../types';

interface StoreData {
  organization: Organization;
  users: User[];
  clauses: GuidelineClause[];
  terminology: TerminologyItem[];
  facts: ApprovedFact[];
  palette: ColorPaletteItem[];
  submissions: Submission[];
  versions: SubmissionVersion[];
  findings: Finding[];
  comments: Comment[];
  auditLogs: AuditLog[];
  aiCallsToday: number;
  aiCallsDay: string;
  sessionCallCounts: Record<string, { count: number; windowStart: number }>;
}

function getInitialStore(): StoreData {
  return {
    organization: { ...CRANBERRY_ORG },
    users: JSON.parse(JSON.stringify(SEED_USERS)),
    clauses: JSON.parse(JSON.stringify(SEED_CLAUSES)),
    terminology: JSON.parse(JSON.stringify(SEED_TERMINOLOGY)),
    facts: JSON.parse(JSON.stringify(SEED_FACTS)),
    palette: JSON.parse(JSON.stringify(SEED_PALETTE)),
    submissions: [],
    versions: [],
    findings: [],
    comments: [],
    auditLogs: [
      {
        id: 'audit-init-01',
        organizationId: CRANBERRY_ORG.id,
        userId: SEED_USERS[0].id,
        userName: SEED_USERS[0].name,
        userRole: SEED_USERS[0].role,
        action: 'system.initialized',
        resourceType: 'organization',
        resourceId: CRANBERRY_ORG.id,
        metadata: { info: 'Cranberry Labs brand governance database initialized' },
        createdAt: new Date().toISOString(),
      },
    ],
    aiCallsToday: 0,
    aiCallsDay: new Date().toISOString().split('T')[0],
    sessionCallCounts: {},
  };
}

class MockStore {
  private data: StoreData;

  constructor() {
    this.data = getInitialStore();
  }

  public resetToSeed() {
    this.data = getInitialStore();
    return true;
  }

  // Organization
  public getOrganization() {
    return this.data.organization;
  }

  // Users
  public getUsers() {
    return this.data.users;
  }

  public getUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByRole(role: string) {
    return this.data.users.find((u) => u.role === role);
  }

  // Clauses
  public getClauses() {
    return this.data.clauses;
  }

  public getClauseById(id: string) {
    return this.data.clauses.find((c) => c.id === id);
  }

  public addClause(clause: GuidelineClause) {
    this.data.clauses.push(clause);
    return clause;
  }

  public deleteClause(id: string) {
    const idx = this.data.clauses.findIndex((c) => c.id === id);
    if (idx !== -1) {
      this.data.clauses.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Terminology
  public getTerminology() {
    return this.data.terminology;
  }

  public addTerminology(item: TerminologyItem) {
    this.data.terminology.push(item);
    return item;
  }

  public deleteTerminology(id: string) {
    const idx = this.data.terminology.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.data.terminology.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Facts
  public getFacts() {
    return this.data.facts;
  }

  public getFactById(id: string) {
    return this.data.facts.find((f) => f.id === id);
  }

  public addFact(fact: ApprovedFact) {
    this.data.facts.push(fact);
    return fact;
  }

  public deleteFact(id: string) {
    const idx = this.data.facts.findIndex((f) => f.id === id);
    if (idx !== -1) {
      this.data.facts.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Palette
  public getPalette() {
    return this.data.palette;
  }

  public addPaletteItem(item: ColorPaletteItem) {
    this.data.palette.push(item);
    return item;
  }

  // Submissions
  public getSubmissions() {
    return this.data.submissions.map((sub) => {
      const versions = this.getVersionsBySubmissionId(sub.id);
      const currentVersion = versions[versions.length - 1];
      const creator = this.getUserById(sub.creatorId);
      return {
        ...sub,
        creatorName: creator?.name || 'Unknown',
        currentVersion,
      };
    });
  }

  public getSubmissionById(id: string) {
    const sub = this.data.submissions.find((s) => s.id === id);
    if (!sub) return null;
    const versions = this.getVersionsBySubmissionId(sub.id);
    const currentVersion = versions[versions.length - 1];
    const creator = this.getUserById(sub.creatorId);
    return {
      ...sub,
      creatorName: creator?.name || 'Unknown',
      currentVersion,
    };
  }

  public createSubmission(submission: Submission, initialContent: string, customVersionId?: string) {
    this.data.submissions.push(submission);

    const version: SubmissionVersion = {
      id: customVersionId || `ver-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      submissionId: submission.id,
      versionNumber: 1,
      content: initialContent,
      createdBy: submission.creatorId,
      createdByName: this.getUserById(submission.creatorId)?.name || 'Creator',
      createdAt: new Date().toISOString(),
    };
    this.data.versions.push(version);

    return { submission, version };
  }

  public updateSubmissionStatus(id: string, status: Submission['currentStatus'], isLocked = false) {
    const sub = this.data.submissions.find((s) => s.id === id);
    if (sub) {
      sub.currentStatus = status;
      sub.isLocked = isLocked;
      sub.updatedAt = new Date().toISOString();
      return sub;
    }
    return null;
  }

  // Versions
  public getVersionsBySubmissionId(submissionId: string) {
    return this.data.versions
      .filter((v) => v.submissionId === submissionId)
      .map((v) => ({
        ...v,
        findings: this.getFindingsByVersionId(v.id),
      }))
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }

  public getVersionById(id: string) {
    const v = this.data.versions.find((v) => v.id === id);
    if (!v) return null;
    return {
      ...v,
      findings: this.getFindingsByVersionId(v.id),
    };
  }

  public createNewVersion(submissionId: string, content: string, createdBy: string) {
    const currentVersions = this.data.versions.filter((v) => v.submissionId === submissionId);
    const nextVersionNum = currentVersions.length + 1;
    const user = this.getUserById(createdBy);

    const newVersion: SubmissionVersion = {
      id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      submissionId,
      versionNumber: nextVersionNum,
      content,
      createdBy,
      createdByName: user?.name || 'User',
      createdAt: new Date().toISOString(),
    };

    this.data.versions.push(newVersion);
    const sub = this.data.submissions.find((s) => s.id === submissionId);
    if (sub) {
      sub.updatedAt = new Date().toISOString();
    }
    return newVersion;
  }

  // Findings
  public getFindingsByVersionId(versionId: string) {
    return this.data.findings.filter((f) => f.versionId === versionId);
  }

  public setFindingsForVersion(versionId: string, findings: Finding[]) {
    // Replace findings for this version
    this.data.findings = this.data.findings.filter((f) => f.versionId !== versionId);
    this.data.findings.push(...findings);
    return findings;
  }

  public updateFinding(
    id: string,
    updates: Partial<Finding>,
    actionedBy: string,
    versionId?: string
  ) {
    const finding = this.data.findings.find(
      (f) => f.id === id && (!versionId || f.versionId === versionId)
    );
    if (finding) {
      Object.assign(finding, updates, {
        actionedBy,
        actionedAt: new Date().toISOString(),
      });
      return finding;
    }
    return null;
  }

  // Comments
  public getComments(submissionId: string) {
    return this.data.comments
      .filter((c) => c.submissionId === submissionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addComment(comment: Comment) {
    this.data.comments.push(comment);
    return comment;
  }

  // Audit Logs
  public getAuditLogs(limit = 100) {
    return [...this.data.auditLogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  public logEvent(
    action: string,
    resourceType: string,
    resourceId: string,
    userId?: string,
    metadata: Record<string, unknown> = {}
  ) {
    const user = userId ? this.getUserById(userId) : undefined;
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      organizationId: this.data.organization.id,
      userId,
      userName: user?.name,
      userRole: user?.role,
      action,
      resourceType,
      resourceId,
      metadata,
      createdAt: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    return log;
  }

  // Rate Limiting & Daily AI Call Caps
  public checkAndIncrementAiCall(sessionId: string, dailyCap = 100, sessionRateLimit = 10): { allowed: boolean; reason?: string } {
    const today = new Date().toISOString().split('T')[0];
    if (this.data.aiCallsDay !== today) {
      this.data.aiCallsDay = today;
      this.data.aiCallsToday = 0;
    }

    if (this.data.aiCallsToday >= dailyCap) {
      return {
        allowed: false,
        reason: `Global daily AI cap reached (${this.data.aiCallsToday}/${dailyCap} calls used today).`,
      };
    }

    // Session rate limit (sliding 1-minute window)
    const now = Date.now();
    const sessionData = this.data.sessionCallCounts[sessionId] || { count: 0, windowStart: now };
    if (now - sessionData.windowStart > 60000) {
      sessionData.count = 0;
      sessionData.windowStart = now;
    }

    if (sessionData.count >= sessionRateLimit) {
      return {
        allowed: false,
        reason: `Session rate limit exceeded (${sessionRateLimit} calls/min). Please wait a moment.`,
      };
    }

    sessionData.count += 1;
    this.data.sessionCallCounts[sessionId] = sessionData;
    this.data.aiCallsToday += 1;

    return { allowed: true };
  }
}

// Global singleton for Next.js dev server persistence across HMR
const globalForStore = globalThis as unknown as { __truenorth_store__?: MockStore };
export const mockStore = globalForStore.__truenorth_store__ ?? new MockStore();
if (process.env.NODE_ENV !== 'production') {
  globalForStore.__truenorth_store__ = mockStore;
}

