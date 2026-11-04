-- TrueNorth Database Schema (Supabase PostgreSQL + pgvector)

-- Enable Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Enum Types
do $$ begin
  create type user_role as enum ('admin', 'creator', 'manager', 'reviewer');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type clause_category as enum (
    'tone', 'terminology', 'messaging', 'claim', 'accessibility', 'visual', 'compliance'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type submission_status as enum (
    'draft', 'in_review', 'changes_requested', 'approved', 'rejected'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type finding_origin as enum ('rule-based', 'ai-assisted');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type finding_status as enum ('open', 'accepted', 'edited', 'dismissed');
exception
  when duplicate_object then null;
end $$;

-- 1. Organizations
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  created_at timestamp with time zone default now()
);

-- 2. Users (Seeded demo users for Cranberry Labs)
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  email text unique not null,
  role user_role not null default 'creator',
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- 3. Guideline Clauses
create table if not exists guideline_clauses (
  id text primary key, -- e.g. "CL-TONE-01", "CL-CLAIM-03"
  organization_id uuid references organizations(id) on delete cascade not null,
  category clause_category not null,
  title text not null,
  summary text not null,
  full_text text not null,
  severity text not null check (severity in ('critical', 'warning', 'info')),
  embedding vector(768), -- Gemini text-embedding-004
  created_at timestamp with time zone default now()
);

-- 4. Terminology Dictionary
create table if not exists terminology (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  term text not null,
  preferred_term text,
  is_banned boolean default false,
  case_sensitive boolean default false,
  reason text not null,
  clause_id text references guideline_clauses(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- 5. Approved Facts & Numerical Claims
create table if not exists approved_facts (
  id text primary key, -- e.g. "FACT-PRICE-01", "FACT-STAT-04"
  organization_id uuid references organizations(id) on delete cascade not null,
  statement text not null,
  fact_value text not null,
  effective_date date not null,
  expiry_date date, -- null indicates ongoing validity
  source_doc text not null,
  embedding vector(768),
  created_at timestamp with time zone default now()
);

-- 6. Color Palettes
create table if not exists color_palettes (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  hex text not null,
  role text not null check (role in ('primary', 'secondary', 'accent', 'background', 'surface', 'text')),
  min_contrast_ratio numeric(3, 1) default 4.5,
  created_at timestamp with time zone default now()
);

-- 7. Submissions
create table if not exists submissions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  creator_id uuid references users(id) not null,
  title text not null,
  channel text not null,
  audience text not null,
  current_status submission_status default 'draft',
  is_locked boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 8. Submission Versions
create table if not exists submission_versions (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid references submissions(id) on delete cascade not null,
  version_number int not null,
  content text not null,
  created_by uuid references users(id) not null,
  created_at timestamp with time zone default now(),
  unique (submission_id, version_number)
);

-- 9. Findings
create table if not exists findings (
  id uuid primary key default uuid_generate_v4(),
  version_id uuid references submission_versions(id) on delete cascade not null,
  quoted_span text not null,
  span_start int,
  span_end int,
  category clause_category not null,
  source_id text not null,
  source_type text not null check (source_type in ('clause', 'fact', 'terminology')),
  reason text not null,
  severity text not null check (severity in ('critical', 'warning', 'info')),
  suggested_rewrite text,
  origin finding_origin not null,
  confidence numeric(3, 2) not null check (confidence >= 0 and confidence <= 1),
  status finding_status not null default 'open',
  dismiss_reason text,
  actioned_by uuid references users(id),
  actioned_at timestamp with time zone
);

-- 10. Comments
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid references submissions(id) on delete cascade not null,
  version_id uuid references submission_versions(id) on delete cascade,
  author_id uuid references users(id) not null,
  body text not null,
  created_at timestamp with time zone default now()
);

-- 11. Audit Logs
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references users(id),
  action text not null,
  resource_type text not null,
  resource_id text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- 12. Rate Limits & AI Usage Tracking
create table if not exists ai_usage_ledger (
  id uuid primary key default uuid_generate_v4(),
  day date not null default current_date,
  calls_count int not null default 1,
  tokens_count int not null default 0,
  unique (day)
);

-- Indexes
create index if not exists idx_clauses_org on guideline_clauses (organization_id);
create index if not exists idx_terms_org on terminology (organization_id);
create index if not exists idx_facts_org on approved_facts (organization_id);
create index if not exists idx_subs_org on submissions (organization_id);
create index if not exists idx_findings_version on findings (version_id, status);
create index if not exists idx_audit_org_created on audit_logs (organization_id, created_at desc);

-- Vector Indexes (ivfflat)
create index if not exists idx_clauses_embedding on guideline_clauses using ivfflat (embedding vector_cosine_ops) with (lists = 10);
create index if not exists idx_facts_embedding on approved_facts using ivfflat (embedding vector_cosine_ops) with (lists = 10);
