create extension if not exists "uuid-ossp";

do $$ begin
  create type difficulty as enum ('E','M','H');
exception when duplicate_object then null; end $$;

do $$ begin
  create type q_status as enum ('locked','unlocked','solved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verdict as enum ('AC','WA','TLE','RE','CE','PE','JE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sub_status as enum ('queued','running','done','error');
exception when duplicate_object then null; end $$;

create table if not exists teams (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  pin_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists contests (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  cooldown_seconds int not null default 10,
  penalty_seconds int not null default 20,
  early_bonus_percent int not null default 20,
  created_at timestamptz not null default now()
);

create table if not exists team_contest (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id),
  contest_id uuid not null references contests(id),
  started_at timestamptz not null,
  total_score int not null default 0,
  total_time_ms bigint not null default 0,
  last_submission_at timestamptz,
  unique(team_id, contest_id)
);

create table if not exists questions (
  id uuid primary key default uuid_generate_v4(),
  contest_id uuid not null references contests(id),
  order_index int not null,
  title text not null,
  description text not null,
  input_format text not null,
  output_format text not null,
  difficulty difficulty not null,
  hint text not null,
  time_limit_ms int not null default 2000
);
create unique index if not exists ux_questions_contest_order on questions(contest_id, order_index);

create table if not exists test_cases (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references questions(id) on delete cascade,
  input_text text not null,
  output_text text not null,
  is_hidden boolean not null default true,
  weight int not null default 1,
  group_id int not null default 1
);

create table if not exists team_question_progress (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id),
  question_id uuid not null references questions(id),
  status q_status not null,
  unlocked_at timestamptz,
  solved_at timestamptz,
  attempts int not null default 0,
  time_spent_ms bigint not null default 0,
  hint_unlocked boolean not null default false,
  best_score int not null default 0,
  unique(team_id, question_id)
);

create table if not exists submissions (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id),
  question_id uuid not null references questions(id),
  language text not null,
  source_code text not null,
  created_at timestamptz not null default now(),
  status sub_status not null default 'queued',
  verdict verdict,
  score int not null default 0,
  time_ms int not null default 0,
  compilation_log text,
  exec_log text,
  test_results jsonb,
  assigned_testcase_ids uuid[]
);

create index if not exists idx_progress_team on team_question_progress(team_id);
create index if not exists idx_submissions_team on submissions(team_id, created_at desc);
