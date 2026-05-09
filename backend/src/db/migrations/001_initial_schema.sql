CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status TEXT NOT NULL DEFAULT 'active',
  opens_at TIME NOT NULL DEFAULT '06:00',
  closes_at TIME NOT NULL DEFAULT '22:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_checkin_at TIMESTAMPTZ
);

CREATE TABLE checkins (
  id BIGSERIAL PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  checked_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_out TIMESTAMPTZ,
  duration_min INTEGER GENERATED ALWAYS AS (
    CASE WHEN checked_out IS NOT NULL THEN EXTRACT(EPOCH FROM (checked_out - checked_in))/60 ELSE NULL END
  ) STORED
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  plan_type TEXT NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE anomalies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT, -- Added to track 'manually_dismissed' vs auto-resolved
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ, -- Added for the 24-hour retention PRD requirement
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REQUIRED INDEXES FOR PERFORMANCE BENCHMARKS
CREATE INDEX idx_members_churn_risk ON members (last_checkin_at) WHERE status = 'active';
CREATE INDEX idx_checkins_time_brin ON checkins USING BRIN (checked_in);
CREATE INDEX idx_checkins_live_occupancy ON checkins (gym_id, checked_out) WHERE checked_out IS NULL;
CREATE INDEX idx_payments_gym_date ON payments (gym_id, paid_at DESC);
CREATE INDEX idx_anomalies_active ON anomalies (gym_id, detected_at DESC) WHERE resolved = FALSE;

-- MATERIALIZED VIEW
CREATE MATERIALIZED VIEW gym_hourly_stats AS
  SELECT
    gym_id,
    EXTRACT(DOW FROM checked_in)::INTEGER AS day_of_week,
    EXTRACT(HOUR FROM checked_in)::INTEGER AS hour_of_day,
    COUNT(*) AS checkin_count
  FROM checkins
  WHERE checked_in >= NOW() - INTERVAL '7 days'
  GROUP BY gym_id, day_of_week, hour_of_day;
CREATE UNIQUE INDEX ON gym_hourly_stats (gym_id, day_of_week, hour_of_day);