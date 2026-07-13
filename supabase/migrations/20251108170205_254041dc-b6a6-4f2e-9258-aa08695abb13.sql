-- Insert realistic checkpoint data based on patrol verification log
INSERT INTO public.checkpoints (checkpoint_name, location_description, qr_code, gps_coordinates, expected_scan_order, is_active) VALUES
('Main Gate', 'Primary entry point - Main security checkpoint', 'QR-MG-001', '-1.2921, 36.8219', 1, true),
('Warehouse Rear Door', 'Rear warehouse access point - Check locks and lighting', 'RFID-WRD-002', '-1.2923, 36.8221', 2, true),
('CCTV Control Room Entrance', 'Control room entry - Verify operator presence', 'QR-CCR-003', '-1.2920, 36.8220', 3, true),
('Perimeter Fence East', 'Eastern perimeter boundary - Inspect fence integrity', 'RFID-PFE-004', '-1.2918, 36.8225', 4, true),
('Staff Parking Zone', 'Employee parking area - Verify lighting and vehicle security', 'QR-SPZ-005', '-1.2925, 36.8218', 5, true),
('Generator Room', 'Backup power facility - Check fuel and ventilation', 'RFID-GR-006', '-1.2922, 36.8217', 6, true),
('Server Room Corridor', 'IT infrastructure access - Verify cooling system', 'QR-SRC-007', '-1.2919, 36.8222', 7, true),
('Admin Office Entrance', 'Administrative wing entry - Check lighting and door security', 'RFID-AOE-008', '-1.2924, 36.8216', 8, true),
('Roof Access Ladder', 'Rooftop access point - Inspect for intrusion', 'QR-RAL-009', '-1.2917, 36.8223', 9, true),
('Exit Gate', 'Secondary exit point - Handover and final security check', 'RFID-EG-010', '-1.2926, 36.8215', 10, true);