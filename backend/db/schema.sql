-- Skema minimal modul User Management MOKA (PostgreSQL / Supabase)
-- Aman dijalankan ulang (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(150) NOT NULL,
  email             VARCHAR(254) NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  role              VARCHAR(20) NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'committee')),
  email_verified_at TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evt_user_id ON email_verification_tokens(user_id);

CREATE TABLE IF NOT EXISTS password_reset_otps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash    VARCHAR(255) NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ NULL,
  used_at     TIMESTAMPTZ NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pro_user_id ON password_reset_otps(user_id);

-- RLS aktif tanpa policy: akses via Supabase anon/authenticated API tertutup,
-- backend terhubung langsung sebagai role postgres (pemilik tabel).
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;
