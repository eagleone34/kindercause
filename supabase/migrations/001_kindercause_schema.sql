-- KinderCause Database Schema
-- Version: 1.0 MVP
-- Date: December 15, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ORGANIZATIONS TABLE (Daycares using the platform)
-- =============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- For public URLs: kindercause.com/[slug]
  description TEXT,
  logo_url TEXT,
  website TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  is_nonprofit BOOLEAN DEFAULT false,
  tax_id TEXT, -- EIN for 501(c)(3) organizations
  stripe_account_id TEXT, -- Stripe Connect account ID
  stripe_account_status TEXT DEFAULT 'pending', -- pending, active, restricted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- FUNDRAISERS TABLE (Events + Donation Campaigns)
-- =============================================================================
CREATE TABLE IF NOT EXISTS fundraisers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- For public URLs: kindercause.com/[org-slug]/[fundraiser-slug]
  type TEXT NOT NULL CHECK (type IN ('event', 'donation_campaign')),
  
  -- For donation campaigns
  goal_amount DECIMAL(10,2), -- Target amount (nullable for events)
  current_amount DECIMAL(10,2) DEFAULT 0, -- Running total
  
  -- For events
  ticket_price DECIMAL(10,2), -- Price per ticket (nullable for campaigns)
  capacity INTEGER, -- Max attendees (nullable for campaigns)
  tickets_sold INTEGER DEFAULT 0,
  
  -- Common fields
  description TEXT,
  image_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT, -- For in-person events
  
  -- Settings
  allow_recurring BOOLEAN DEFAULT false, -- For donation campaigns
  show_donor_wall BOOLEAN DEFAULT false, -- Public list of donors
  send_tax_receipts BOOLEAN DEFAULT false, -- Auto-send tax receipts
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, slug)
);

-- =============================================================================
-- PURCHASES TABLE (Tickets + Donations)
-- =============================================================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  
  -- Purchaser/Donor info
  purchaser_name TEXT NOT NULL,
  purchaser_email TEXT NOT NULL,
  purchaser_phone TEXT,
  
  -- Payment info
  amount DECIMAL(10,2) NOT NULL, -- Total amount charged
  quantity INTEGER DEFAULT 1, -- Number of tickets (1 for donations)
  
  -- Fee breakdown
  stripe_fee DECIMAL(10,2), -- Stripe's processing fee
  platform_fee DECIMAL(10,2), -- KinderCause's fee (3%)
  net_amount DECIMAL(10,2), -- Amount after fees
  
  -- Stripe references
  stripe_payment_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_checkout_session_id TEXT,
  
  -- For recurring donations
  is_recurring BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  
  -- QR code for event tickets
  qr_code_data TEXT,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  
  -- Additional data
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CONTACTS TABLE (Parent Email Lists)
-- =============================================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Tagging system
  tags TEXT[] DEFAULT '{}', -- Array of tags: ['Current Parents', 'Alumni', 'Board']
  
  -- Email preferences
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  
  -- Tracking
  total_donated DECIMAL(10,2) DEFAULT 0,
  donation_count INTEGER DEFAULT 0,
  last_donation_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, email)
);

-- =============================================================================
-- EMAIL CAMPAIGNS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  subject TEXT NOT NULL,
  body TEXT NOT NULL, -- HTML content
  
  -- Recipient filtering
  recipient_filter JSONB DEFAULT '{}', -- Tag filters: {"tags": ["Current Parents"]}
  recipient_count INTEGER DEFAULT 0,
  
  -- Sending status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Analytics (Phase 2)
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- VOLUNTEER SHIFTS TABLE (Phase 2)
-- =============================================================================
CREATE TABLE IF NOT EXISTS volunteer_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- e.g., "Setup 8-10am"
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  slots_available INTEGER NOT NULL DEFAULT 1,
  slots_filled INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- VOLUNTEER SIGNUPS TABLE (Phase 2)
-- =============================================================================
CREATE TABLE IF NOT EXISTS volunteer_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES volunteer_shifts(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Reminder sent
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(shift_id, email)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_organizations_user ON organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

CREATE INDEX IF NOT EXISTS idx_fundraisers_org ON fundraisers(organization_id);
CREATE INDEX IF NOT EXISTS idx_fundraisers_status ON fundraisers(status);
CREATE INDEX IF NOT EXISTS idx_fundraisers_type ON fundraisers(type);
CREATE INDEX IF NOT EXISTS idx_fundraisers_start_date ON fundraisers(start_date);

CREATE INDEX IF NOT EXISTS idx_purchases_fundraiser ON purchases(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_purchases_email ON purchases(purchaser_email);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_payment ON purchases(stripe_payment_id);

CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_org ON email_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_signups ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see/modify their own
CREATE POLICY "Users manage own organizations" ON organizations
  FOR ALL USING (auth.uid() = user_id);

-- Fundraisers: Owners can manage, public can view active
CREATE POLICY "Org owners manage fundraisers" ON fundraisers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = fundraisers.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Public view active fundraisers" ON fundraisers
  FOR SELECT USING (status = 'active');

-- Purchases: Owners can view all, purchasers can view their own
CREATE POLICY "Org owners view purchases" ON purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fundraisers
      JOIN organizations ON organizations.id = fundraisers.organization_id
      WHERE fundraisers.id = purchases.fundraiser_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Purchasers view own purchases" ON purchases
  FOR SELECT USING (purchaser_email = auth.email());

-- Allow inserts for purchases (anyone can donate/buy tickets)
CREATE POLICY "Anyone can create purchases" ON purchases
  FOR INSERT WITH CHECK (true);

-- Contacts: Only org owners
CREATE POLICY "Org owners manage contacts" ON contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = contacts.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

-- Email Campaigns: Only org owners
CREATE POLICY "Org owners manage email campaigns" ON email_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = email_campaigns.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

-- Volunteer Shifts: Owners manage, public view
CREATE POLICY "Org owners manage shifts" ON volunteer_shifts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fundraisers
      JOIN organizations ON organizations.id = fundraisers.organization_id
      WHERE fundraisers.id = volunteer_shifts.fundraiser_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Public view shifts" ON volunteer_shifts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fundraisers
      WHERE fundraisers.id = volunteer_shifts.fundraiser_id
      AND fundraisers.status = 'active'
    )
  );

-- Volunteer Signups: Anyone can sign up
CREATE POLICY "Anyone can signup for shifts" ON volunteer_signups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Org owners view signups" ON volunteer_signups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM volunteer_shifts
      JOIN fundraisers ON fundraisers.id = volunteer_shifts.fundraiser_id
      JOIN organizations ON organizations.id = fundraisers.organization_id
      WHERE volunteer_shifts.id = volunteer_signups.shift_id
      AND organizations.user_id = auth.uid()
    )
  );

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_fundraisers_updated_at
  BEFORE UPDATE ON fundraisers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update fundraiser totals after purchase
CREATE OR REPLACE FUNCTION update_fundraiser_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE fundraisers
    SET 
      current_amount = current_amount + NEW.amount,
      tickets_sold = CASE 
        WHEN type = 'event' THEN tickets_sold + NEW.quantity
        ELSE tickets_sold
      END,
      updated_at = NOW()
    WHERE id = NEW.fundraiser_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fundraiser_on_purchase
  AFTER INSERT OR UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_fundraiser_totals();

-- Function to update contact donation stats
CREATE OR REPLACE FUNCTION update_contact_donation_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO contacts (organization_id, name, email, total_donated, donation_count, last_donation_at)
    SELECT 
      f.organization_id,
      NEW.purchaser_name,
      NEW.purchaser_email,
      NEW.amount,
      1,
      NOW()
    FROM fundraisers f
    WHERE f.id = NEW.fundraiser_id
    ON CONFLICT (organization_id, email) 
    DO UPDATE SET
      total_donated = contacts.total_donated + NEW.amount,
      donation_count = contacts.donation_count + 1,
      last_donation_at = NOW(),
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_on_purchase
  AFTER INSERT OR UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_contact_donation_stats();
