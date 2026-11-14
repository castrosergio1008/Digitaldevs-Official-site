-- Digital-devs chatbot: leads and anonymous chat events
-- Design doc: docs/design/2026-11-13-chatbot-persistencia-analitica.md (section 4.7)
--
-- Apply once in the Supabase SQL editor. The app talks to PostgREST with the
-- service role key, which bypasses RLS. RLS is enabled with no policies so the
-- anon/public roles cannot read or write these tables directly.

-- Leads comerciales
create table if not exists leads (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 2 and 80),
  contact         text not null check (char_length(contact) between 5 and 40),
  method          text not null check (method in ('whatsapp', 'email')),
  session_id_hash text not null,                       -- sha256(sessionId + pepper)
  source          text not null default 'form'
                  check (source in ('form', 'detection', 'chip')),
  path            text,                                -- ruta de la página (sin query params)
  context         text,                                -- resumen corto, limpio de PII
  notified_at     timestamptz,                         -- cuándo se notificó al equipo
  created_at      timestamptz not null default now()
);

-- Unique: enforces "max 1 lead per session" and enables the atomic upsert in
-- /api/leads. This replaces the non-unique index from the design doc.
create unique index if not exists idx_leads_session on leads (session_id_hash);
create index if not exists idx_leads_created on leads (created_at desc);

-- Eventos anónimos del chat (sin PII)
create table if not exists chat_events (
  id              bigint generated always as identity primary key,
  event_name      text not null
                  check (event_name in ('chat_opened', 'lead_captured', 'whatsapp_clicked', 'diagnosis_completed', 'lead_attempt')),
  session_id_hash text not null,
  path            text,
  metadata        jsonb not null default '{}'::jsonb,  -- lista blanca, sin PII
  created_at      timestamptz not null default now()
);

create index if not exists idx_chat_events_name_time on chat_events (event_name, created_at desc);
create index if not exists idx_chat_events_session on chat_events (session_id_hash);

-- RLS: direct access is denied for every role; only the server's service role
-- (which bypasses RLS) can read or write through PostgREST.
alter table leads enable row level security;
alter table chat_events enable row level security;

-- `lead_attempt` was added after the initial release: keep existing projects
-- in sync by replacing the check constraint (idempotent).
alter table chat_events drop constraint if exists chat_events_event_name_check;
alter table chat_events add constraint chat_events_event_name_check
  check (event_name in ('chat_opened', 'lead_captured', 'whatsapp_clicked', 'diagnosis_completed', 'lead_attempt'));
