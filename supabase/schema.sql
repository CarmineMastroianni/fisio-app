-- ============================================================
-- FISIO-APP — Schema Supabase
-- Esegui questo script nel SQL Editor del tuo progetto Supabase.
-- Ogni fisioterapista accede con le proprie credenziali Supabase
-- Auth e vede SOLO i propri dati (Row Level Security).
-- ============================================================

-- Abilita UUID extension (disponibile di default in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELLA: patients
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nome            text        DEFAULT '',
  cognome         text        DEFAULT '',
  telefono        text        DEFAULT '',
  email           text        DEFAULT '',
  indirizzo       text        DEFAULT '',
  note_cliniche   text        DEFAULT '',
  note_logistiche text,
  tags            text[]      DEFAULT '{}',
  clinical_notes  jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELLA: appointments
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id           uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid          NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id   uuid          NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  start_time   timestamptz   NOT NULL,
  end_time     timestamptz   NOT NULL,
  luogo        text          DEFAULT '',
  trattamento  text          DEFAULT '',
  costo        numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2),
  status       text          DEFAULT 'programmata'
                             CHECK (status IN ('programmata','completata','cancellata','no-show')),
  payment      jsonb         DEFAULT '{"paid": false}',
  deposits     jsonb         DEFAULT '[]',
  notes        jsonb,
  series_id    uuid,
  google_event_id text,
  created_at   timestamptz   NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELLA: settings (una riga per utente)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  user_id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tariffa_standard  numeric(10,2) NOT NULL DEFAULT 70,
  trattamenti       jsonb       NOT NULL DEFAULT '[]',
  metodi_pagamento  jsonb       NOT NULL DEFAULT '[]',
  google_calendar_enabled boolean NOT NULL DEFAULT false,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELLA: patient_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS patient_documents (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  category   text        NOT NULL DEFAULT 'altro'
                         CHECK (category IN ('referto','prescrizione','altro')),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  data_url   text
);

-- ============================================================
-- TABELLA: visit_attachments
-- ============================================================
CREATE TABLE IF NOT EXISTS visit_attachments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  visit_id   uuid        NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  category   text        NOT NULL DEFAULT 'altro'
                         CHECK (category IN ('referto','foto','esercizi','altro')),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  data_url   text
);

-- ============================================================
-- INDICI per performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_patients_user_id       ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id   ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient   ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start     ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_patient_docs_patient   ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_visit_attach_visit     ON visit_attachments(visit_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Ogni utente vede e modifica SOLO i propri dati.
-- ============================================================

ALTER TABLE patients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_attachments ENABLE ROW LEVEL SECURITY;

-- patients
CREATE POLICY "patients: accesso proprio" ON patients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- appointments
CREATE POLICY "appointments: accesso proprio" ON appointments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- settings
CREATE POLICY "settings: accesso proprio" ON settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- patient_documents
CREATE POLICY "documents: accesso proprio" ON patient_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- visit_attachments
CREATE POLICY "attachments: accesso proprio" ON visit_attachments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- MIGRAZIONE: Google Calendar integration
-- Esegui queste ALTER TABLE se lo schema era già applicato.
-- ============================================================
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS google_event_id text;

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS google_calendar_enabled boolean NOT NULL DEFAULT false;

-- ============================================================
-- NOTA SULLE CREDENZIALI FISIOTERAPISTI
-- Crea i due account dal tuo progetto Supabase:
--   Authentication → Users → Invite user (o Add user)
-- Ogni fisioterapista usa la propria email/password per accedere.
-- I loro dati sono completamente isolati via RLS.
-- ============================================================
