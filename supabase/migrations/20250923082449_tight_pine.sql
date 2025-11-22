/*
  # Seed admin data and sample recycling requests

  1. Sample Data
    - Sample recycling requests in pending status
    - Additional test data for admin functionality

  2. Test Data
    - Pending requests for admin to process
    - Various device types and facilities
*/

-- Insert sample recycling requests for admin testing
INSERT INTO recycling_requests (user_id, device_id, facility_id, status) VALUES
(2, 1, 1, 'pending'),  -- John's iPhone 12 request
(3, 3, 2, 'pending'),  -- Jane's Samsung Galaxy request
(2, 4, 3, 'approved'), -- John's MacBook Pro (already processed)
(3, 6, 1, 'rejected'); -- Jane's iPad request (rejected)

-- Update processed requests with timestamps and admin
UPDATE recycling_requests 
SET processed_at = DATE_SUB(NOW(), INTERVAL 1 DAY), processed_by = 1 
WHERE status IN ('approved', 'rejected');