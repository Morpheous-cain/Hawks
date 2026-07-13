-- Fix search_path for generate_document_number function
CREATE OR REPLACE FUNCTION generate_document_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix search_path for set_document_number_v2 function
CREATE OR REPLACE FUNCTION set_document_number_v2()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.document_number IS NULL OR NEW.document_number = '' THEN
    NEW.document_number := generate_document_number();
  END IF;
  RETURN NEW;
END;
$$;