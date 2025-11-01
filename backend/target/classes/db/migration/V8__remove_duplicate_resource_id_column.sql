-- First ensure any null resource_id values are synchronized with resource_item_id
UPDATE group_resources SET resource_id = resource_item_id WHERE resource_id IS NULL;

-- Then ensure any null resource_item_id values are synchronized with resource_id
UPDATE group_resources SET resource_item_id = resource_id WHERE resource_item_id IS NULL;

-- Verify data integrity - both columns should have the same values
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM group_resources 
    WHERE resource_id != resource_item_id 
    OR resource_id IS NULL 
    OR resource_item_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Data integrity check failed: resource_id and resource_item_id columns have different values';
  END IF;
END $$;

-- Drop the duplicate column - keeping resource_item_id as it's more descriptive
ALTER TABLE group_resources DROP COLUMN resource_id;