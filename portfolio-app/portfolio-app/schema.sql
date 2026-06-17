-- ============================================================
--  Portfolio schema — run this in Supabase → SQL Editor → New query
-- ============================================================

-- 1. Contact submissions ------------------------------------------------
create table if not exists connect_requests (
  id          bigint generated always as identity primary key,
  name        text not null,
  email       text not null,
  message     text not null,
  created_at  timestamptz default now()
);

-- 2. Audit log (populated automatically by the trigger below) ----------
create table if not exists connect_audit (
  id          bigint generated always as identity primary key,
  request_id  bigint,
  action      text,
  logged_at   timestamptz default now()
);

-- 3. AFTER INSERT trigger — logs every new contact (your trigger practice) 
create or replace function log_connect() returns trigger as $$
begin
  insert into connect_audit (request_id, action)
  values (new.id, 'INSERT');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_connect_audit on connect_requests;
create trigger trg_connect_audit
  after insert on connect_requests
  for each row execute function log_connect();

-- 4. Blog posts ---------------------------------------------------------
create table if not exists blog_posts (
  id          text primary key,          -- slug, e.g. 'tuning-spark'
  title       text not null,
  category    text,
  excerpt     text,
  body        text not null,             -- HTML (h2, p, ul, pre, code...)
  read_time   text,
  published   boolean default true,
  created_at  timestamptz default now()
);

-- 5. Row-Level Security -------------------------------------------------
-- The serverless functions use the SERVICE ROLE key, which bypasses RLS,
-- so writes are safe. We only need a public read policy for published posts.
alter table blog_posts enable row level security;

drop policy if exists "public read published" on blog_posts;
create policy "public read published"
  on blog_posts for select
  using (published = true);

-- connect_requests + connect_audit have RLS OFF (default) and are only
-- ever touched by the service-role function, so they stay private.

-- 6. (optional) seed one post so the blog isn't empty on first deploy ---
insert into blog_posts (id, title, category, excerpt, body, read_time)
values (
  'welcome',
  'System Online',
  'Meta · Notes',
  'First transmission from the new archive. More field notes incoming.',
  '<p>The archive is live. Real posts on Spark tuning, streaming architecture and lakehouse design are on the way.</p>',
  '1 min'
)
on conflict (id) do nothing;
