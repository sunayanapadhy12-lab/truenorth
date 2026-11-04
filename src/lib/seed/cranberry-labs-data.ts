import {
  Organization,
  User,
  GuidelineClause,
  TerminologyItem,
  ApprovedFact,
  ColorPaletteItem,
} from '../types';

export const CRANBERRY_ORG: Organization = {
  id: 'a0000000-0000-0000-0000-000000000001',
  name: 'Cranberry Labs',
  slug: 'cranberry-labs',
  createdAt: '2026-01-01T00:00:00Z',
};

export const SEED_USERS: User[] = [
  {
    id: 'u0000000-0000-0000-0000-000000000001',
    organizationId: CRANBERRY_ORG.id,
    name: 'Sarah Chen',
    email: 'admin@cranberrylabs.io',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000002',
    organizationId: CRANBERRY_ORG.id,
    name: 'Alex Rivera',
    email: 'creator@cranberrylabs.io',
    role: 'creator',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000003',
    organizationId: CRANBERRY_ORG.id,
    name: 'Marcus Vance',
    email: 'manager@cranberrylabs.io',
    role: 'manager',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000004',
    organizationId: CRANBERRY_ORG.id,
    name: 'Dr. Elena Rostova',
    email: 'reviewer@cranberrylabs.io',
    role: 'reviewer',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    createdAt: '2026-01-03T00:00:00Z',
  },
];

export const SEED_CLAUSES: GuidelineClause[] = [
  // Tone & Style
  {
    id: 'CL-TONE-01',
    organizationId: CRANBERRY_ORG.id,
    category: 'tone',
    title: 'Authoritative yet Accessible Tone',
    summary: 'Write with clarity, technical rigor, and zero patronizing language.',
    fullText:
      'Cranberry Labs communicates with direct, calm authority. Avoid academic pomposity as well as excessive slang. Treat the reader as an intelligent peer.',
    severity: 'warning',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-TONE-02',
    organizationId: CRANBERRY_ORG.id,
    category: 'tone',
    title: 'No Hyperbolic Hype or Buzzwords',
    summary: 'Do not use words like "revolutionary", "miracle", "game-changing", or "magical".',
    fullText:
      'All product descriptions must highlight concrete technical merits instead of emotive marketing buzzwords. Never characterize software features as revolutionary or game-changing.',
    severity: 'warning',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-TONE-03',
    organizationId: CRANBERRY_ORG.id,
    category: 'tone',
    title: 'Active Voice & Direct Phrasing',
    summary: 'Prefer active verbs over passive voice across all public communications.',
    fullText:
      'Lead with who does what. Say "CranberryPulse encrypts your payloads" rather than "Your payloads are encrypted by CranberryPulse".',
    severity: 'info',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-TONE-04',
    organizationId: CRANBERRY_ORG.id,
    category: 'tone',
    title: 'Empathetic Problem Solving',
    summary: 'Frame features around customer outcomes, pain relief, and reduced friction.',
    fullText:
      'Do not boast about architectural complexity for its own sake. State the developer challenge first, then demonstrate how our tooling simplifies their workflow.',
    severity: 'info',
    createdAt: '2026-01-05T00:00:00Z',
  },

  // Terminology & Naming
  {
    id: 'CL-TERM-01',
    organizationId: CRANBERRY_ORG.id,
    category: 'terminology',
    title: 'Official Product Name Casing',
    summary: 'Products must be strictly cased: CranberryCloud, CranberryPulse, CranberryVault.',
    fullText:
      'Never separate the compound word with spaces ("Cranberry Cloud") and never use all-caps or all-lowercase. Valid names: CranberryCloud, CranberryPulse, CranberryVault.',
    severity: 'critical',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-TERM-02',
    organizationId: CRANBERRY_ORG.id,
    category: 'terminology',
    title: 'Banned Legacy Product Names',
    summary: 'Deprecated names "BerryCore" and "Cranberry v1" must never appear in new assets.',
    fullText:
      'BerryCore was sunset in 2024. All references to legacy runtimes must refer to CranberryCloud Legacy Runtime or be omitted in public forward-facing copy.',
    severity: 'critical',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-TERM-03',
    organizationId: CRANBERRY_ORG.id,
    category: 'terminology',
    title: 'Inclusive Technical Terminology',
    summary: 'Use allowlist/denylist and primary/secondary instead of legacy discriminatory terms.',
    fullText:
      'In accordance with our engineering DEI standards, never use whitelist/blacklist or master/slave. Use allowlist/denylist and primary/replica.',
    severity: 'critical',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-TERM-04',
    organizationId: CRANBERRY_ORG.id,
    category: 'terminology',
    title: 'Industry Acronym Clarity',
    summary: 'Spell out acronyms on first mention in long-form content.',
    fullText:
      'In whitepapers, blogs, and press releases, spell out technical acronyms on first occurrence (e.g., "Role-Based Access Control (RBAC)"), followed by the abbreviation in parentheses.',
    severity: 'info',
    createdAt: '2026-01-05T00:00:00Z',
  },

  // Claims & Guarantees
  {
    id: 'CL-CLAIM-01',
    organizationId: CRANBERRY_ORG.id,
    category: 'claim',
    title: 'Absolute Performance & Security Claims Prohibited',
    summary: 'Never claim "100% secure", "unbreakable", "fastest", or "best-in-class".',
    fullText:
      'Absolute claims create legal liability and violate FTC truth-in-advertising guidelines. Never state that our platform is 100% secure, unhackable, or unconditionally the fastest without a verifiable dated benchmark.',
    severity: 'critical',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-CLAIM-02',
    organizationId: CRANBERRY_ORG.id,
    category: 'claim',
    title: 'Mandatory Benchmark Citations',
    summary: 'All speed, latency, and throughput claims must link to a dated internal benchmark or third-party audit.',
    fullText:
      'Any quantitative performance assertion (e.g., "42ms edge latency") must explicitly cite the methodology and date of testing.',
    severity: 'critical',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-CLAIM-03',
    organizationId: CRANBERRY_ORG.id,
    category: 'claim',
    title: 'Forward-Looking Statements Disclaimer',
    summary: 'Press releases, financial blogs, and roadmap announcements must carry our standard safe-harbor notice.',
    fullText:
      'Whenever unreleased product features or projected metrics are discussed, include the standard safe harbor disclaimer: "Statements regarding future product releases are forward-looking and subject to change without notice."',
    severity: 'critical',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-CLAIM-04',
    organizationId: CRANBERRY_ORG.id,
    category: 'claim',
    title: 'SLA & Uptime Phrasing Policy',
    summary: 'Describe SLA as "designed for 99.99% availability", never "guaranteed 100% uptime".',
    fullText:
      'Legal guarantees are defined strictly in the Master Services Agreement. Marketing content must phrase availability around architectural objectives (e.g., "engineered for 99.99% multi-region uptime").',
    severity: 'critical',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-CLAIM-05',
    organizationId: CRANBERRY_ORG.id,
    category: 'claim',
    title: 'Comparative Cost Savings Context',
    summary: 'Statements asserting savings (e.g. "Save 40%") must specify the comparison baseline.',
    fullText:
      'Do not say "save 50% on cloud compute" without stating: "compared to standard on-demand EC2 rates as of Q1 2026".',
    severity: 'warning',
    createdAt: '2026-01-05T00:00:00Z',
  },

  // Accessibility (A11y)
  {
    id: 'CL-A11Y-01',
    organizationId: CRANBERRY_ORG.id,
    category: 'accessibility',
    title: 'Descriptive Link Text (No "Click Here")',
    summary: 'Anchor text must describe the destination, never "click here" or "learn more".',
    fullText:
      'Screen-reader users browse links in isolation. Never publish "click here" or bare URLs. Use descriptive anchor text such as "Review the CranberryCloud API documentation".',
    severity: 'warning',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-A11Y-02',
    organizationId: CRANBERRY_ORG.id,
    category: 'accessibility',
    title: 'Alt-Text Mandate for Informative Images',
    summary: 'All diagrams, screenshots, and visual architecture graphs must include concise alt text.',
    fullText:
      'Graphics must contain functional alt text conveying the underlying technical flow. Decorative elements must be marked aria-hidden or have empty alt attributes.',
    severity: 'warning',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-A11Y-03',
    organizationId: CRANBERRY_ORG.id,
    category: 'accessibility',
    title: 'Reading Comprehension Target',
    summary: 'Public blog posts and customer guides should maintain a Grade 8 to 10 reading level.',
    fullText:
      'Keep sentences under 25 words where feasible. Break dense paragraphs into bulleted lists or subheadings to assist cognitive accessibility.',
    severity: 'info',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-A11Y-04',
    organizationId: CRANBERRY_ORG.id,
    category: 'accessibility',
    title: 'Color Independence in Status Indicators',
    summary: 'Do not use color as the sole indicator of health, status, or severity.',
    fullText:
      'Status indicators must pair color with icons or textual labels (e.g., green dot accompanied by "Operational", red badge accompanied by "Failed").',
    severity: 'warning',
    createdAt: '2026-01-05T00:00:00Z',
  },

  // Visual & Brand Assets
  {
    id: 'CL-VIS-01',
    organizationId: CRANBERRY_ORG.id,
    category: 'visual',
    title: 'Text Contrast Ratio (WCAG AA 4.5:1)',
    summary: 'All text on background colors must meet the 4.5:1 contrast requirement.',
    fullText:
      'Standard text must achieve at least 4.5:1 contrast ratio against its background. Large headlines (18pt+) must achieve at least 3.0:1.',
    severity: 'critical',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-VIS-02',
    organizationId: CRANBERRY_ORG.id,
    category: 'visual',
    title: 'Brand Palette Strict Usage',
    summary: 'Use official Cranberry Labs hex codes only. No arbitrary gradients or tinted reds.',
    fullText:
      'Primary UI and marketing elements must strictly use Cranberry Red (#be2e50) and Deep Wine (#721d33). Never apply unauthorized neon pinks or oranges.',
    severity: 'warning',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-VIS-03',
    organizationId: CRANBERRY_ORG.id,
    category: 'visual',
    title: 'Trademark and Registered Symbols',
    summary: 'Apply registered trademark symbol (®) on first mention of CranberryCloud®.',
    fullText:
      'In formal publications and legal press announcements, place ® immediately following the primary brand mark on its first prominent occurrence.',
    severity: 'info',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-VIS-04',
    organizationId: CRANBERRY_ORG.id,
    category: 'visual',
    title: 'Dark Mode Readability Standards',
    summary: 'Dark backgrounds must use Slate Dark (#0f172a), never pitch black (#000000).',
    fullText:
      'High contrast stark black strains eye endurance in developer tools. Background dark themes must render using slate-tinted charcoal palettes.',
    severity: 'info',
    createdAt: '2026-01-05T00:00:00Z',
  },

  // Compliance & Security
  {
    id: 'CL-COMP-01',
    organizationId: CRANBERRY_ORG.id,
    category: 'compliance',
    title: 'Standard Encryption Representation',
    summary: 'Specify exact cipher standards (AES-256-GCM, TLS 1.3), never "military-grade".',
    fullText:
      '"Military-grade" is an unsubstantiated colloquialism prohibited by legal. State the specific standard: "Encrypted at rest using AES-256 and in transit via TLS 1.3".',
    severity: 'critical',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-COMP-02',
    organizationId: CRANBERRY_ORG.id,
    category: 'compliance',
    title: 'SOC 2 & ISO Certification Representation',
    summary: 'Do not say "SOC 2 certified" (it is an attestation report), say "SOC 2 Type II compliant".',
    fullText:
      'AICPA guidelines mandate proper terminology: our organization holds a SOC 2 Type II attestation report. Do not claim SOC 2 is a certificate.',
    severity: 'critical',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-COMP-03',
    organizationId: CRANBERRY_ORG.id,
    category: 'compliance',
    title: 'Customer Logo & Case Study Authorization',
    summary: 'Never name enterprise clients or showcase logos without an executed mutual marketing addendum.',
    fullText:
      'Even if an enterprise customer is publicly visible, content teams must verify active PR sign-off with legal before publication.',
    severity: 'critical',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'CL-COMP-04',
    organizationId: CRANBERRY_ORG.id,
    category: 'compliance',
    title: 'Sub-Processor & Data Residency Transparency',
    summary: 'Disclose cloud regions explicitly when discussing customer data residency.',
    fullText:
      'Enterprise customers need precise jurisdictional certainty. Explicitly state AWS US-East (N. Virginia) and EU-Central (Frankfurt) when citing data centers.',
    severity: 'warning',
    createdAt: '2026-01-05T00:00:00Z',
  },
];

export const SEED_TERMINOLOGY: TerminologyItem[] = [
  {
    id: 't0000000-0000-0000-0000-000000000001',
    organizationId: CRANBERRY_ORG.id,
    term: '100% secure',
    preferredTerm: 'architected with defense-in-depth security',
    isBanned: true,
    caseSensitive: false,
    reason: 'Absolute security claims are legally indefensible and prohibited by FTC advertising standards.',
    clauseId: 'CL-CLAIM-01',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000002',
    organizationId: CRANBERRY_ORG.id,
    term: 'unbreakable',
    preferredTerm: 'fault-tolerant and highly resilient',
    isBanned: true,
    caseSensitive: false,
    reason: 'Hyperbolic guarantee prohibited under Cranberry claims governance policy.',
    clauseId: 'CL-CLAIM-01',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000003',
    organizationId: CRANBERRY_ORG.id,
    term: 'military-grade',
    preferredTerm: 'industry-standard AES-256 encryption',
    isBanned: true,
    caseSensitive: false,
    reason: 'Vague marketing buzzword prohibited; specify exact technical cryptographic standards.',
    clauseId: 'CL-COMP-01',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000004',
    organizationId: CRANBERRY_ORG.id,
    term: 'game-changing',
    preferredTerm: 'high-impact or workflow-accelerating',
    isBanned: true,
    caseSensitive: false,
    reason: 'Violates our anti-hype tone guideline (CL-TONE-02).',
    clauseId: 'CL-TONE-02',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000005',
    organizationId: CRANBERRY_ORG.id,
    term: 'click here',
    preferredTerm: 'descriptive destination anchor (e.g., "explore the deployment guide")',
    isBanned: true,
    caseSensitive: false,
    reason: 'Fails accessibility guidelines (WCAG AA). Screen readers cannot interpret context.',
    clauseId: 'CL-A11Y-01',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000006',
    organizationId: CRANBERRY_ORG.id,
    term: 'BerryCore',
    preferredTerm: 'CranberryCloud',
    isBanned: true,
    caseSensitive: false,
    reason: 'Deprecated legacy brand name sunset in 2024.',
    clauseId: 'CL-TERM-02',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000007',
    organizationId: CRANBERRY_ORG.id,
    term: 'Cranberry cloud',
    preferredTerm: 'CranberryCloud',
    isBanned: true,
    caseSensitive: true,
    reason: 'Improper casing. Must be CamelCase without space.',
    clauseId: 'CL-TERM-01',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000008',
    organizationId: CRANBERRY_ORG.id,
    term: 'cranberrycloud',
    preferredTerm: 'CranberryCloud',
    isBanned: true,
    caseSensitive: true,
    reason: 'Improper casing. Must be CamelCase.',
    clauseId: 'CL-TERM-01',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000009',
    organizationId: CRANBERRY_ORG.id,
    term: 'whitelist',
    preferredTerm: 'allowlist',
    isBanned: true,
    caseSensitive: false,
    reason: 'DEI inclusive language standard. Use allowlist.',
    clauseId: 'CL-TERM-03',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000010',
    organizationId: CRANBERRY_ORG.id,
    term: 'blacklist',
    preferredTerm: 'denylist',
    isBanned: true,
    caseSensitive: false,
    reason: 'DEI inclusive language standard. Use denylist.',
    clauseId: 'CL-TERM-03',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000011',
    organizationId: CRANBERRY_ORG.id,
    term: 'best-in-class',
    preferredTerm: 'top-rated in independent reviews',
    isBanned: true,
    caseSensitive: false,
    reason: 'Unsubstantiated superlative claim prohibited unless accompanied by named award citation.',
    clauseId: 'CL-CLAIM-01',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000012',
    organizationId: CRANBERRY_ORG.id,
    term: 'foolproof',
    preferredTerm: 'intuitive and streamlined',
    isBanned: true,
    caseSensitive: false,
    reason: 'Patronizing tone that violates our user-respect principle (CL-TONE-01).',
    clauseId: 'CL-TONE-01',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000013',
    organizationId: CRANBERRY_ORG.id,
    term: 'guaranteed 100% uptime',
    preferredTerm: 'engineered for 99.99% multi-region availability',
    isBanned: true,
    caseSensitive: false,
    reason: 'Legally false. SLAs commit to credits, not impossible perfection.',
    clauseId: 'CL-CLAIM-04',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000014',
    organizationId: CRANBERRY_ORG.id,
    term: 'cheap',
    preferredTerm: 'cost-effective or cost-efficient',
    isBanned: true,
    caseSensitive: false,
    reason: '"Cheap" connotes substandard engineering. Use "cost-effective".',
    clauseId: 'CL-TONE-01',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000015',
    organizationId: CRANBERRY_ORG.id,
    term: 'miracle',
    preferredTerm: 'breakthrough efficiency',
    isBanned: true,
    caseSensitive: false,
    reason: 'Violates tone guideline CL-TONE-02.',
    clauseId: 'CL-TONE-02',
    createdAt: '2026-01-05T00:00:00Z',
  },
];

export const SEED_FACTS: ApprovedFact[] = [
  // Pricing Facts
  {
    id: 'FACT-PRICE-01',
    organizationId: CRANBERRY_ORG.id,
    statement: 'Starter plan price per user',
    factValue: '$29/seat/month billed annually',
    effectiveDate: '2026-01-01',
    sourceDoc: 'Q1 2026 Master Pricing Schedule',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'FACT-PRICE-02',
    organizationId: CRANBERRY_ORG.id,
    statement: 'Enterprise plan baseline',
    factValue: '$499/month base + custom volume tiers',
    effectiveDate: '2026-01-01',
    sourceDoc: 'Q1 2026 Master Pricing Schedule',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'FACT-PRICE-03-EXPIRED',
    organizationId: CRANBERRY_ORG.id,
    statement: 'Legacy Starter plan price',
    factValue: '$19/seat/month',
    effectiveDate: '2023-01-01',
    expiryDate: '2025-12-31', // EXPIRED!
    sourceDoc: '2023 Legacy Price Matrix (Sunset)',
    createdAt: '2026-01-05T00:00:00Z',
  },

  // Operational & Scale Metrics
  {
    id: 'FACT-STAT-01',
    organizationId: CRANBERRY_ORG.id,
    statement: 'Daily API requests processed across CranberryCloud',
    factValue: '4.2 billion daily requests',
    effectiveDate: '2026-06-01',
    sourceDoc: 'Platform Reliability Report Q2 2026',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'FACT-STAT-02-EXPIRED',
    organizationId: CRANBERRY_ORG.id,
    statement: 'Outdated daily API request count',
    factValue: '1.5 billion daily requests',
    effectiveDate: '2024-01-01',
    expiryDate: '2025-12-31', // EXPIRED!
    sourceDoc: '2024 Annual Shareholder Letter',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'FACT-STAT-03',
    organizationId: CRANBERRY_ORG.id,
    statement: 'Enterprise customer count',
    factValue: '18,500 active organizations',
    effectiveDate: '2026-07-01',
    sourceDoc: 'Mid-Year 2026 Customer Census',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'FACT-STAT-04-EXPIRED',
    organizationId: CRANBERRY_ORG.id,
    statement: 'Outdated customer count',
    factValue: '10,000 active organizations',
    effectiveDate: '2024-06-01',
    expiryDate: '2025-12-31', // EXPIRED!
    sourceDoc: 'Series B Pitch Deck',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'FACT-STAT-05',
    organizationId: CRANBERRY_ORG.id,
    statement: 'Historical multi-region uptime SLA performance',
    factValue: '99.991% across rolling 12 months',
    effectiveDate: '2026-01-01',
    sourceDoc: 'Cranberry Trust Center SLA Audit',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'FACT-PERF-01',
    organizationId: CRANBERRY_ORG.id,
    statement: 'P95 Global edge latency',
    factValue: '42 milliseconds',
    effectiveDate: '2026-05-01',
    sourceDoc: 'Datadog Global Edge Benchmark May 2026',
    createdAt: '2026-01-05T00:00:00Z',
  },

  // Compliance Certifications
  {
    id: 'FACT-COMP-01',
    organizationId: CRANBERRY_ORG.id,
    statement: 'SOC 2 Type II attestation audit',
    factValue: 'Issued by Schellman & Company LLC on Nov 15, 2025',
    effectiveDate: '2025-11-15',
    expiryDate: '2026-11-15',
    sourceDoc: 'Schellman SOC 2 Type II Final Report',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'FACT-COMP-02',
    organizationId: CRANBERRY_ORG.id,
    statement: 'ISO/IEC 27001:2022 Registration',
    factValue: 'Certificate IS 782910 issued by BSI Group',
    effectiveDate: '2026-02-01',
    sourceDoc: 'BSI ISO 27001 Registration Directory',
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'FACT-COMP-03',
    organizationId: CRANBERRY_ORG.id,
    statement: 'Primary cloud data center regions',
    factValue: 'AWS us-east-1 (N. Virginia) and eu-central-1 (Frankfurt)',
    effectiveDate: '2025-01-01',
    sourceDoc: 'Infra Architecture Security Whitepaper v4.2',
    createdAt: '2026-01-05T00:00:00Z',
  },
];

export const SEED_PALETTE: ColorPaletteItem[] = [
  {
    id: 'pal-01',
    organizationId: CRANBERRY_ORG.id,
    name: 'Cranberry Red',
    hex: '#be2e50',
    role: 'primary',
    minContrastRatio: 4.5,
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'pal-02',
    organizationId: CRANBERRY_ORG.id,
    name: 'Deep Wine',
    hex: '#721d33',
    role: 'primary',
    minContrastRatio: 7.0,
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'pal-03',
    organizationId: CRANBERRY_ORG.id,
    name: 'Slate Dark',
    hex: '#0f172a',
    role: 'text',
    minContrastRatio: 12.0,
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'pal-04',
    organizationId: CRANBERRY_ORG.id,
    name: 'Off White Canvas',
    hex: '#f8fafc',
    role: 'background',
    minContrastRatio: 1.0,
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'pal-05',
    organizationId: CRANBERRY_ORG.id,
    name: 'Coral Accent',
    hex: '#e5798e',
    role: 'accent',
    minContrastRatio: 3.2,
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'pal-06',
    organizationId: CRANBERRY_ORG.id,
    name: 'Card Surface',
    hex: '#ffffff',
    role: 'surface',
    minContrastRatio: 1.0,
    createdAt: '2026-01-05T00:00:00Z',
  },
];

export interface SampleDraft {
  id: string;
  title: string;
  channel: 'blog' | 'social' | 'email' | 'press_release' | 'website';
  audience: 'developers' | 'enterprise' | 'general_public';
  description: string;
  intendedIssues: string[];
  content: string;
}

export const SEED_SAMPLE_DRAFTS: SampleDraft[] = [
  {
    id: 'draft-product-launch',
    title: 'Introducing the New Cranberry cloud Runtime',
    channel: 'blog',
    audience: 'developers',
    description: 'Product launch blog post with superlatives, bad casing, and banned claims.',
    intendedIssues: [
      'Bad casing: "Cranberry cloud" (should be "CranberryCloud")',
      'Absolute claims: "fastest and 100% secure in the galaxy"',
      'Prohibited buzzword: "game-changing"',
      'Accessibility violation: "click here to get started"',
      'Vague security claim: "military-grade encryption"',
    ],
    content: `Today, we are thrilled to unveil our game-changing update: the new Cranberry cloud runtime!

Our engineers have built what is unconditionally the fastest and 100% secure in the galaxy cloud infrastructure for modern web applications. Powered by military-grade encryption, your data is completely unbreakable against any malicious attack.

We have eliminated all latency bottlenecks. If you want to experience the magic for yourself, click here to get started right now. We guarantee you will never experience downtime again!`,
  },
  {
    id: 'draft-press-release',
    title: 'Cranberry Labs Announces Q3 Momentum & Enterprise Expansion',
    channel: 'press_release',
    audience: 'enterprise',
    description: 'Corporate press release with outdated pricing, expired metrics, and missing safe harbor.',
    intendedIssues: [
      'Outdated fact: Cites legacy $19/seat/month pricing instead of approved $29/seat/month',
      'Expired customer statistic: Cites 10,000 organizations instead of updated 18,500',
      'Missing disclaimer: Discusses unreleased features without forward-looking statement',
      'Banned terminology: Uses "whitelist" instead of "allowlist"',
      'Improper SOC 2 wording: Claims "SOC 2 certified" instead of "SOC 2 Type II compliant"',
    ],
    content: `SAN FRANCISCO, CA — Cranberry Labs, the leader in automated brand governance, today announced record third-quarter growth, now powering over 10,000 active organizations worldwide.

To accelerate enterprise adoption, Cranberry Labs continues to offer its acclaimed Starter tier for just $19/seat/month, giving engineering teams unmatched governance capabilities at a cheap price.

Furthermore, Cranberry Labs is officially SOC 2 certified, ensuring complete protection for all IP addresses configured on our enterprise whitelist. In Q4, we will launch automated multi-agent governance pipelines that will double developer productivity.`,
  },
  {
    id: 'draft-social-announcement',
    title: 'LinkedIn: Farewell to Legacy Systems',
    channel: 'social',
    audience: 'general_public',
    description: 'Social post with legacy brand names, improper SLA claims, and condescending tone.',
    intendedIssues: [
      'Banned legacy name: References deprecated "BerryCore"',
      'False uptime claim: Claims "guaranteed 100% uptime"',
      'Tone violation: "foolproof" is condescending to users',
      'Superlative claim: "best-in-class"',
    ],
    content: `Still running your critical workloads on BerryCore? It's time to upgrade!

With our foolproof configuration wizard, anyone on your team can migrate in 5 minutes flat. Enjoy guaranteed 100% uptime backed by our best-in-class multi-region mesh. Say goodbye to outages forever!`,
  },
];
