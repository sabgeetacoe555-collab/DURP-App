-- Fix admin column in group_members table
-- This migration ensures the is_admin column exists

-- Add is_admin column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'group_members' 
        AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE group_members ADD COLUMN is_admin BOOLEAN DEFAULT false;
        COMMENT ON COLUMN group_members.is_admin IS 'Whether this member has admin privileges in the group';
    END IF;
END $$;
