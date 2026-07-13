-- Add new document categories to the document_category enum
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'hr_employment';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'employee_contract';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'job_description';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'employee_handbook';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'leave_policy';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'nda';

ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'health_safety';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'risk_assessment';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'incident_report';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'safety_certificate';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'emergency_plan';

ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'financial';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'financial_statement';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'audit_report';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'tax_document';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'invoice_template';

ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'operational';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'process_documentation';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'work_instruction';

ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'psra_license';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'first_aid';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'drivers_license';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'firearms_license';

ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'client_management';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'client_contract';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'service_agreement';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'proposal';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'site_sop';

ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'policy';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'code_of_conduct';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'ethics_policy';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'security_policy';
ALTER TYPE document_category ADD VALUE IF NOT EXISTS 'vehicle_policy';