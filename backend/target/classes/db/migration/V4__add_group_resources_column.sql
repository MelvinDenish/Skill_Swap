-- Add resource_id column to group_resources table
ALTER TABLE group_resources ADD COLUMN resource_id UUID NOT NULL;