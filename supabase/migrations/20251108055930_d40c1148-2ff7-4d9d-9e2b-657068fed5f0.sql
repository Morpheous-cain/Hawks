-- Add contact fields and additional client information
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS primary_contact_name TEXT,
ADD COLUMN IF NOT EXISTS primary_contact_role TEXT,
ADD COLUMN IF NOT EXISTS secondary_contact_name TEXT,
ADD COLUMN IF NOT EXISTS secondary_contact_role TEXT,
ADD COLUMN IF NOT EXISTS contract_ref TEXT,
ADD COLUMN IF NOT EXISTS active_sites_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_action TEXT,
ADD COLUMN IF NOT EXISTS annual_value NUMERIC;

-- Insert comprehensive client data for Alpha Pride Security
INSERT INTO public.clients (client_id, legal_name, primary_contact_name, primary_contact_role, secondary_contact_name, secondary_contact_role, sector, contract_ref, active_sites_count, status, next_action, annual_value)
VALUES
('CL001', 'Freedom Airline Limited', 'Mr. David Kamau', 'Head of Security', 'Ms. Faith Njoroge', 'Admin Manager', 'Aviation', 'APSL/FA/2025/02', 2, 'active', 'Renew contract – due Dec 2025', 2500000),
('CL002', 'Melili Hotel Nairobi', 'Mr. Brian Otieno', 'Hotel Manager', 'Ms. Sharon Wairimu', 'HR', 'Hospitality', 'APSL/MH/2025/03', 1, 'active', 'Schedule refresher training', 1600000),
('CL003', 'Avix Motors', 'Mr. Hassan Noor', 'Operations Manager', 'Mr. Kelvin Njoroge', 'Workshop Supervisor', 'Automotive', 'APSL/AM/2025/01', 1, 'active', 'Site inspection – CCTV upgrade', 1800000),
('CL004', 'Autobox Motors Ltd', 'Mr. Samuel Kariuki', 'GM', 'Ms. Mary Nduta', 'HR', 'Automotive', 'APSL/ABM/2024/12', 1, 'pending_renewal', 'Review and renew Q1 2026', 1400000),
('CL005', 'Intex Africa Limited', 'Mr. George Mwangi', 'Facility Manager', 'Mr. Joseph Mutua', 'Safety Officer', 'Construction', 'APSL/INX/2025/01', 1, 'active', 'Submit updated Risk Assessment', 2200000),
('CL006', 'BBS Mall', 'Ms. Njeri Wambui', 'Mall Administrator', 'Mr. Charles Kimani', 'Head of Security', 'Retail & Commercial', 'APSL/BBS/2025/04', 1, 'active', 'Conduct night patrol audit', 2800000),
('CL007', 'Aboosto Cosmetics Ltd', 'Ms. Zainab Mohamed', 'Managing Director', 'Mr. Jamal Farah', 'Operations Officer', 'Manufacturing & Distribution', 'APSL/ABO/2025/02', 1, 'active', 'Deploy additional CCTV units', 1700000),
('CL008', 'Nextgen Mall', 'Mr. Collins Oduor', 'Property Manager', 'Ms. Ruth Achieng', 'Facility Admin', 'Retail & Real Estate', 'APSL/NXM/2025/05', 1, 'pending_renewal', 'Submit new proposal for renewal', 2100000),
('CL009', 'NSSF Apartments', 'Ms. Alice Karanja', 'Property Officer', 'Mr. Peter Githinji', 'Estate Supervisor', 'Residential', 'APSL/NSSF/2025/01', 1, 'active', 'Review perimeter lighting report', 1500000),
('CL010', 'Tuskys Logistics Ltd', 'Mr. John Wanjala', 'Logistics Director', 'Ms. Lilian Chebet', 'Fleet Supervisor', 'Logistics & Transport', 'APSL/TLL/2025/03', 1, 'active', 'GPS tracking integration ongoing', 2400000),
('CL011', 'Equity Centre', 'Mr. Moses Kibe', 'Building Manager', 'Mr. Daniel Kiptoo', 'Security Supervisor', 'Corporate Offices', 'APSL/EQC/2025/04', 1, 'active', 'Conduct risk audit Q1 2026', 1900000),
('CL012', 'Lake View Villas', 'Ms. Fatuma Yusuf', 'Property Manager', 'Mr. Abdi Noor', 'Maintenance Supervisor', 'Residential', 'APSL/LVV/2024/11', 1, 'active', 'Check expiry of insurance cover', 1300000),
('CL013', 'Kenya Builders & Concrete Co.', 'Mr. Stephen Maina', 'Operations Head', 'Mr. Francis Mutua', 'Site Engineer', 'Industrial', 'APSL/KBC/2025/02', 1, 'active', 'Submit Q4 safety inspection', 2000000),
('CL014', 'Crown Paints Kenya PLC', 'Ms. Beatrice Auma', 'Admin Officer', 'Mr. Ahmed Salim', 'Security Liaison', 'Manufacturing', 'APSL/CPK/2025/03', 1, 'active', 'Coordinate VIP escort protocol', 2300000),
('CL015', 'Brookside Dairies', 'Mr. Nicholas Kariuki', 'Security & Compliance Officer', 'Mr. Peter Njoroge', 'HR Officer', 'Manufacturing & Food Processing', 'APSL/BRK/2025/01', 1, 'active', 'Conduct 24-hour guard rotation audit', 2600000)
ON CONFLICT (client_id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  primary_contact_name = EXCLUDED.primary_contact_name,
  primary_contact_role = EXCLUDED.primary_contact_role,
  secondary_contact_name = EXCLUDED.secondary_contact_name,
  secondary_contact_role = EXCLUDED.secondary_contact_role,
  sector = EXCLUDED.sector,
  contract_ref = EXCLUDED.contract_ref,
  active_sites_count = EXCLUDED.active_sites_count,
  status = EXCLUDED.status,
  next_action = EXCLUDED.next_action,
  annual_value = EXCLUDED.annual_value;