-- Function to generate document number
CREATE OR REPLACE FUNCTION generate_document_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  doc_number TEXT;
BEGIN
  -- Get the count of existing documents and add 1
  SELECT COUNT(*) + 1 INTO next_num FROM documents;
  
  -- Format as DOC-YYYY-NNNN
  doc_number := 'DOC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 4, '0');
  
  RETURN doc_number;
END;
$$ LANGUAGE plpgsql;

-- Update the existing trigger to use the new function
DROP TRIGGER IF EXISTS set_document_number_trigger ON documents;

CREATE OR REPLACE FUNCTION set_document_number_v2()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.document_number IS NULL OR NEW.document_number = '' THEN
    NEW.document_number := generate_document_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_document_number_trigger
BEFORE INSERT ON documents
FOR EACH ROW
EXECUTE FUNCTION set_document_number_v2();