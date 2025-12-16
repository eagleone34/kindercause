-- Rename waitlist table to demo_appointments
ALTER TABLE IF EXISTS waitlist RENAME TO demo_appointments;

-- Add new columns for demo tracking
ALTER TABLE demo_appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled'; -- scheduled, completed, no-show
ALTER TABLE demo_appointments ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE demo_appointments ADD COLUMN IF NOT EXISTS calendar_link TEXT;

-- Update comments/metadata if possible (Postgres specific)
COMMENT ON TABLE demo_appointments IS 'Tracks demo bookings from Zcal';
