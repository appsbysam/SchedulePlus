-- Power Up-only quote foundation. Run after reviewing existing tenant/user policies.
-- Not applied automatically. Do not deploy client writes until tenant membership is verified.
create table if not exists public.powerup_quote_items_catalog (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 description text not null default '',
 unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.powerup_quotes (
 id uuid primary key default gen_random_uuid(),
 quote_number text unique not null,
 created_by uuid not null references auth.users(id),
 customer_name text not null,
 customer_email text,
 customer_phone text,
 site_address text,
 status text not null default 'draft' check (status in ('draft','sent','accepted','declined','expired')),
 notes text not null default '',
 valid_until date,
 gst_included boolean not null default true,
 job_id uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.powerup_quote_lines (
 id uuid primary key default gen_random_uuid(),
 quote_id uuid not null references public.powerup_quotes(id) on delete cascade,
 description text not null,
 quantity numeric(12,3) not null default 1 check (quantity > 0),
 unit_price numeric(12,2) not null check (unit_price >= 0),
 sort_order integer not null default 0
);
-- Explicit deny until tenant-scoped RLS policies are written against the existing membership model.
alter table public.powerup_quote_items_catalog enable row level security;
alter table public.powerup_quotes enable row level security;
alter table public.powerup_quote_lines enable row level security;
revoke all on public.powerup_quote_items_catalog, public.powerup_quotes, public.powerup_quote_lines from anon, authenticated;
