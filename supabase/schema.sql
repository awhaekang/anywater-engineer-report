create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'engineer' check (role in ('engineer', 'manager', 'admin')),
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  management_no text,
  name text not null,
  owner_name text,
  address text not null,
  address_memo text,
  manager text,
  phone text,
  mobile text,
  open_time text,
  customer_type text,
  customer_status text not null default 'active' check (customer_status in ('active', 'terminated', 'caution', 'temporary')),
  source text not null default 'manual',
  external_id text,
  lat double precision,
  lng double precision,
  needs_geocode boolean not null default false,
  equipment text[] not null default '{}',
  products text[] not null default '{}',
  contact jsonb not null default '{}',
  route jsonb not null default '{}',
  contract jsonb not null default '{}',
  product jsonb not null default '{}',
  filter_schedule jsonb not null default '{}',
  service_order_snapshot jsonb not null default '{}',
  service_memo text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  order_type text not null check (order_type in ('install', 'remove', 'repair', 'inspection', 'filter-replace')),
  visit_date date not null,
  assigned_engineer_id uuid references public.profiles(id),
  assigned_engineer_name text,
  priority text not null default '보통' check (priority in ('보통', '높음', '긴급')),
  request text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'done', 'cancelled')),
  source text not null default 'office' check (source in ('office', 'periodic', 'field')),
  created_by uuid references public.profiles(id),
  completed_report_id uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visit_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.visit_type_checks (
  id uuid primary key default gen_random_uuid(),
  visit_type_id uuid not null references public.visit_types(id) on delete cascade,
  label text not null,
  required boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.visit_type_photo_steps (
  id uuid primary key default gen_random_uuid(),
  visit_type_id uuid not null references public.visit_types(id) on delete cascade,
  label text not null,
  required boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.visit_reports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  service_order_id uuid references public.service_orders(id),
  engineer_id uuid references public.profiles(id),
  visit_type_id uuid not null references public.visit_types(id),
  visit_date date not null default current_date,
  arrival_time time not null,
  finish_time time not null,
  issue_cause text,
  action_taken text not null,
  need_revisit boolean not null default false,
  customer_confirm text not null default '확인 완료',
  status text not null default '검토 대기' check (status in ('검토 대기', '승인', '반려')),
  latitude double precision,
  longitude double precision,
  reviewer_id uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_comment text,
  processed_products text[] not null default '{}',
  follow_up_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  report_id uuid references public.visit_reports(id) on delete set null,
  text text not null,
  priority text not null default '보통' check (priority in ('보통', '높음', '긴급')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_by uuid references public.profiles(id),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.visit_report_checks (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.visit_reports(id) on delete cascade,
  check_template_id uuid references public.visit_type_checks(id),
  label text not null,
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.visit_report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.visit_reports(id) on delete cascade,
  photo_step_id uuid references public.visit_type_photo_steps(id),
  label text not null,
  storage_path text not null,
  captured_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision
);

create index if not exists stores_location_idx on public.stores (lat, lng);
create index if not exists stores_management_no_idx on public.stores (management_no);
create index if not exists stores_status_idx on public.stores (customer_status);
create unique index if not exists stores_external_id_idx on public.stores (external_id) where external_id is not null;
create index if not exists service_orders_visit_date_idx on public.service_orders (visit_date, status);
create index if not exists visit_reports_store_date_idx on public.visit_reports (store_id, visit_date desc);
create index if not exists visit_reports_status_idx on public.visit_reports (status);
create index if not exists visit_reports_engineer_idx on public.visit_reports (engineer_id);

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.visit_types enable row level security;
alter table public.service_orders enable row level security;
alter table public.visit_type_checks enable row level security;
alter table public.visit_type_photo_steps enable row level security;
alter table public.visit_reports enable row level security;
alter table public.visit_report_checks enable row level security;
alter table public.visit_report_photos enable row level security;
alter table public.follow_ups enable row level security;

create policy "profiles_select_own_or_manager"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'admin')
    )
  );

create policy "stores_select_authenticated"
  on public.stores for select
  to authenticated
  using (true);

create policy "stores_write_manager"
  on public.stores for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'admin')
    )
  );

create policy "visit_templates_select_authenticated"
  on public.visit_types for select
  to authenticated
  using (true);

create policy "visit_template_checks_select_authenticated"
  on public.visit_type_checks for select
  to authenticated
  using (true);

create policy "visit_template_photos_select_authenticated"
  on public.visit_type_photo_steps for select
  to authenticated
  using (true);

create policy "visit_templates_write_manager"
  on public.visit_types for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'admin')
    )
  );

create policy "visit_reports_select_related"
  on public.visit_reports for select
  to authenticated
  using (
    engineer_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'admin')
    )
  );

create policy "visit_reports_insert_engineer"
  on public.visit_reports for insert
  to authenticated
  with check (engineer_id = auth.uid());

create policy "visit_reports_update_manager"
  on public.visit_reports for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'admin')
    )
  );

create policy "service_orders_select_authenticated"
  on public.service_orders for select
  to authenticated
  using (true);

create policy "service_orders_write_office_manager"
  on public.service_orders for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'admin')
    )
  );

create policy "follow_ups_select_authenticated"
  on public.follow_ups for select
  to authenticated
  using (true);

create policy "follow_ups_insert_engineer"
  on public.follow_ups for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "follow_ups_update_related"
  on public.follow_ups for update
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'admin')
    )
  );

create policy "visit_report_checks_select_related"
  on public.visit_report_checks for select
  to authenticated
  using (
    exists (
      select 1 from public.visit_reports r
      where r.id = report_id
      and (
        r.engineer_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('manager', 'admin')
        )
      )
    )
  );

create policy "visit_report_checks_insert_engineer"
  on public.visit_report_checks for insert
  to authenticated
  with check (
    exists (
      select 1 from public.visit_reports r
      where r.id = report_id and r.engineer_id = auth.uid()
    )
  );

create policy "visit_report_photos_select_related"
  on public.visit_report_photos for select
  to authenticated
  using (
    exists (
      select 1 from public.visit_reports r
      where r.id = report_id
      and (
        r.engineer_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('manager', 'admin')
        )
      )
    )
  );

create policy "visit_report_photos_insert_engineer"
  on public.visit_report_photos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.visit_reports r
      where r.id = report_id and r.engineer_id = auth.uid()
    )
  );
