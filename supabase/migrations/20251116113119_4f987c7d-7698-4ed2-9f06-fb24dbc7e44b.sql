-- Create document categories enum
CREATE TYPE document_category AS ENUM (
  'staff_certification',
  'contract',
  'handbook',
  'policy_procedure',
  'sop',
  'training_material',
  'investigation'
);

-- Create document status enum
CREATE TYPE document_status AS ENUM (
  'active',
  'expired',
  'pending_review',
  'archived'
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category document_category NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date DATE,
  status document_status DEFAULT 'active',
  staff_id UUID REFERENCES public.staff(id),
  client_id UUID REFERENCES public.clients(id),
  site_id UUID REFERENCES public.sites(id),
  version_number INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES public.documents(id),
  tags TEXT[],
  requires_signature BOOLEAN DEFAULT false,
  signed_by UUID REFERENCES auth.users(id),
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff certifications table
CREATE TABLE public.staff_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id),
  certification_type TEXT NOT NULL,
  certification_number TEXT,
  issuing_authority TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  document_id UUID REFERENCES public.documents(id),
  status document_status DEFAULT 'active',
  alert_days_before INTEGER DEFAULT 30,
  last_alert_sent TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document access logs table
CREATE TABLE public.document_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id),
  accessed_by UUID NOT NULL REFERENCES auth.users(id),
  access_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investigation attachments table
CREATE TABLE public.investigation_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investigation_id TEXT NOT NULL,
  document_id UUID NOT NULL REFERENCES public.documents(id),
  attachment_type TEXT,
  notes TEXT,
  attached_by UUID REFERENCES auth.users(id),
  attached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence for document numbers
CREATE SEQUENCE IF NOT EXISTS document_number_seq;

-- Create function to set document number
CREATE OR REPLACE FUNCTION public.set_document_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.document_number IS NULL THEN
    NEW.document_number := 'DOC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('document_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for document number
CREATE TRIGGER set_document_number_trigger
BEFORE INSERT ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.set_document_number();

-- Create function to check expiring certifications
CREATE OR REPLACE FUNCTION public.check_expiring_certifications()
RETURNS TABLE (
  staff_id UUID,
  staff_name TEXT,
  certification_type TEXT,
  expiry_date DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.staff_id,
    s.full_name,
    sc.certification_type,
    sc.expiry_date,
    (sc.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry
  FROM public.staff_certifications sc
  JOIN public.staff s ON s.id = sc.staff_id
  WHERE sc.status = 'active'
    AND sc.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    AND sc.expiry_date >= CURRENT_DATE
  ORDER BY sc.expiry_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Authenticated users can view documents"
ON public.documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Elevated users can manage documents"
ON public.documents FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));

CREATE POLICY "Users can upload documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = uploaded_by);

-- RLS Policies for staff certifications
CREATE POLICY "Authenticated users can view certifications"
ON public.staff_certifications FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Elevated users can manage certifications"
ON public.staff_certifications FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'hr_custodian'));

-- RLS Policies for document access logs
CREATE POLICY "Elevated users can view access logs"
ON public.document_access_logs FOR SELECT
TO authenticated
USING (is_elevated_user(auth.uid()));

CREATE POLICY "System can insert access logs"
ON public.document_access_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = accessed_by);

-- RLS Policies for investigation attachments
CREATE POLICY "Authenticated users can view investigation attachments"
ON public.investigation_attachments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can attach documents"
ON public.investigation_attachments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = attached_by);

CREATE POLICY "Elevated users can manage investigation attachments"
ON public.investigation_attachments FOR ALL
TO authenticated
USING (is_elevated_user(auth.uid()));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/jpg']),
  ('certifications', 'certifications', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']);

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Elevated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND is_elevated_user(auth.uid()));

-- Storage policies for certifications bucket
CREATE POLICY "Authenticated users can view certifications"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'certifications');

CREATE POLICY "Authorized users can upload certifications"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certifications' AND (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'hr_custodian')));

CREATE POLICY "Elevated users can delete certifications"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'certifications' AND (is_elevated_user(auth.uid()) OR has_role(auth.uid(), 'hr_custodian')));

-- Create trigger for updated_at
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_certifications_updated_at
BEFORE UPDATE ON public.staff_certifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();