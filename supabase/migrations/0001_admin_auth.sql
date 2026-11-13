create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  telegram_id bigint unique,
  password_hash text not null,
  is_active boolean not null default true,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists admin_login_challenges (
  id uuid primary key,
  admin_id uuid not null references admins(id) on delete cascade,
  code_hash text not null,
  attempts int not null default 0,
  used boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists admin_sessions (
  token_hash text primary key,
  admin_id uuid not null references admins(id) on delete cascade,
  method text not null,
  ip text,
  user_agent text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists admin_audit (
  id bigserial primary key,
  admin_id uuid references admins(id) on delete set null,
  action text not null,
  ip text,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;
alter table admin_login_challenges enable row level security;
alter table admin_sessions enable row level security;
alter table admin_audit enable row level security;
