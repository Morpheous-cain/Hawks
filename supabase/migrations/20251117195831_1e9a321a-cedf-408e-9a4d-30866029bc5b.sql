-- Drop the existing check constraint
ALTER TABLE advisory_history DROP CONSTRAINT advisory_history_category_check;

-- Add updated check constraint that includes 'crime'
ALTER TABLE advisory_history ADD CONSTRAINT advisory_history_category_check 
CHECK (category = ANY (ARRAY['traffic'::text, 'terror'::text, 'protest'::text, 'weather'::text, 'crime'::text]));