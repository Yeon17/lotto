-- Supabase SQL Editor에서 한 번 실행하세요.

create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists signups_created_at_idx on public.signups (created_at desc);
create index if not exists signups_email_idx on public.signups (email);

alter table public.signups enable row level security;

-- anon/authenticated 클라이언트 직접 접근 차단 (서버 service_role만 insert)
