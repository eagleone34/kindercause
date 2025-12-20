-- Add custom_groups column to organizations table
-- This allows organizations to define their own contact groups beyond the defaults

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_groups TEXT[] DEFAULT '{}';
