-- Cash & In-Transit (CIT) module — functional baseline.
-- Permissive RLS for authenticated users; tighter role gates will be layered later.

create table if not exists public.cit_routes (
  id uuid primary key default gen_random_uuid(),
  route_code text unique not null,
  name text not null,
  origin text,
  destination text,
  risk_grade text not null default 'medium' check (risk_grade in ('low','medium','high','critical')),
  distance_km numeric,
  checkpoints jsonb default '[]'::jsonb,
  notes text,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cit_crews (
  id uuid primary key default gen_random_uuid(),
  crew_code text unique not null,
  crew_name text not null,
  commander text,
  driver text,
  guards text[] default '{}',
  vehicle_reg text,
  status text not null default 'available' check (status in ('available','on_run','off_duty','suspended')),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cit_runs (
  id uuid primary key default gen_random_uuid(),
  run_number text unique not null,
  route_id uuid references public.cit_routes(id) on delete set null,
  crew_id uuid references public.cit_crews(id) on delete set null,
  client_name text,
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','dispatched','in_transit','completed','aborted')),
  cash_amount numeric default 0,
  currency text not null default 'KES',
  seal_numbers text[] default '{}',
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cit_manifests (
  id uuid primary key default gen_random_uuid(),
  manifest_number text unique not null,
  run_id uuid references public.cit_runs(id) on delete cascade,
  declared_amount numeric not null default 0,
  currency text not null default 'KES',
  seal_numbers text[] default '{}',
  signed_by_sender text,
  signed_by_receiver text,
  status text not null default 'draft' check (status in ('draft','signed','delivered','disputed')),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cit_vault_movements (
  id uuid primary key default gen_random_uuid(),
  movement_number text unique not null,
  movement_type text not null check (movement_type in ('inbound','outbound','transfer','adjustment')),
  amount numeric not null default 0,
  currency text not null default 'KES',
  from_party text,
  to_party text,
  run_id uuid references public.cit_runs(id) on delete set null,
  occurred_at timestamptz not null default now(),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.cit_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_number text unique not null,
  run_id uuid references public.cit_runs(id) on delete set null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  incident_type text,
  location text,
  description text,
  status text not null default 'open' check (status in ('open','investigating','resolved','closed')),
  reported_by uuid,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists cit_run_seq;
create sequence if not exists cit_manifest_seq;
create sequence if not exists cit_vault_seq;
create sequence if not exists cit_incident_seq;
create sequence if not exists cit_route_seq;
create sequence if not exists cit_crew_seq;

create or replace function public.set_cit_numbers()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'cit_runs' and (new.run_number is null or new.run_number = '') then
    new.run_number := 'CIT-RUN-' || to_char(current_date,'YYYYMMDD') || '-' || lpad(nextval('cit_run_seq')::text,4,'0');
  elsif tg_table_name = 'cit_manifests' and (new.manifest_number is null or new.manifest_number = '') then
    new.manifest_number := 'CIT-MAN-' || to_char(current_date,'YYYYMMDD') || '-' || lpad(nextval('cit_manifest_seq')::text,4,'0');
  elsif tg_table_name = 'cit_vault_movements' and (new.movement_number is null or new.movement_number = '') then
    new.movement_number := 'CIT-VLT-' || to_char(current_date,'YYYYMMDD') || '-' || lpad(nextval('cit_vault_seq')::text,4,'0');
  elsif tg_table_name = 'cit_incidents' and (new.incident_number is null or new.incident_number = '') then
    new.incident_number := 'CIT-INC-' || to_char(current_date,'YYYYMMDD') || '-' || lpad(nextval('cit_incident_seq')::text,4,'0');
  elsif tg_table_name = 'cit_routes' and (new.route_code is null or new.route_code = '') then
    new.route_code := 'CIT-RT-' || lpad(nextval('cit_route_seq')::text,4,'0');
  elsif tg_table_name = 'cit_crews' and (new.crew_code is null or new.crew_code = '') then
    new.crew_code := 'CIT-CRW-' || lpad(nextval('cit_crew_seq')::text,4,'0');
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['cit_routes','cit_crews','cit_runs','cit_manifests','cit_vault_movements','cit_incidents'] loop
    execute format('drop trigger if exists trg_%I_num on public.%I', t, t);
    execute format('create trigger trg_%I_num before insert on public.%I for each row execute function public.set_cit_numbers()', t, t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['cit_routes','cit_crews','cit_runs','cit_manifests','cit_incidents'] loop
    execute format('drop trigger if exists trg_%I_touch on public.%I', t, t);
    execute format('create trigger trg_%I_touch before update on public.%I for each row execute function public.update_updated_at_column()', t, t);
  end loop;
end $$;

alter table public.cit_routes enable row level security;
alter table public.cit_crews enable row level security;
alter table public.cit_runs enable row level security;
alter table public.cit_manifests enable row level security;
alter table public.cit_vault_movements enable row level security;
alter table public.cit_incidents enable row level security;

do $$
declare t text;
begin
  foreach t in array array['cit_routes','cit_crews','cit_runs','cit_manifests','cit_vault_movements','cit_incidents'] loop
    execute format('drop policy if exists "cit_auth_read" on public.%I', t);
    execute format('create policy "cit_auth_read" on public.%I for select to authenticated using (true)', t);
    execute format('drop policy if exists "cit_auth_write" on public.%I', t);
    execute format('create policy "cit_auth_write" on public.%I for insert to authenticated with check (true)', t);
    execute format('drop policy if exists "cit_auth_update" on public.%I', t);
    execute format('create policy "cit_auth_update" on public.%I for update to authenticated using (true) with check (true)', t);
    execute format('drop policy if exists "cit_auth_delete" on public.%I', t);
    execute format('create policy "cit_auth_delete" on public.%I for delete to authenticated using (true)', t);
  end loop;
end $$;

alter publication supabase_realtime add table public.cit_runs;
alter publication supabase_realtime add table public.cit_manifests;
alter publication supabase_realtime add table public.cit_vault_movements;
alter publication supabase_realtime add table public.cit_incidents;
alter publication supabase_realtime add table public.cit_routes;
alter publication supabase_realtime add table public.cit_crews;
