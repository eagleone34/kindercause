-- Migration: Add children to contacts and fund_categories to organizations
-- Date: Dec 20, 2024

-- =============================================================================
-- CONTACTS: Add children JSONB field
-- =============================================================================
-- Structure: [{ "name": "Emma", "birthdate": "2019-05-15", "class": "Butterfly Room" }]
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]';

-- =============================================================================
-- ORGANIZATIONS: Add fund_categories JSONB field
-- =============================================================================
-- Structure: ["General Fund", "Karate Class", "Dance Class", "Art Supplies"]
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS fund_categories JSONB DEFAULT '["General Fund"]';

-- =============================================================================
-- FUNDRAISERS: Add fund_allocation JSONB field
-- =============================================================================
-- Structure: [{ "category": "Karate Class", "percentage": 40 }, { "category": "Dance Class", "percentage": 60 }]
ALTER TABLE fundraisers
ADD COLUMN IF NOT EXISTS fund_allocation JSONB DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN contacts.children IS 'Array of children: [{ "name": string, "birthdate": date, "class": string }]';
COMMENT ON COLUMN organizations.fund_categories IS 'Array of fund category names configured by the org';
COMMENT ON COLUMN fundraisers.fund_allocation IS 'How funds are allocated: [{ "category": string, "percentage": number }]';
