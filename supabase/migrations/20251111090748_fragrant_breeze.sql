/*
  # Add Mass Collection Services for Institutions and Industries

  1. New Tables
    - `mass_collection_requests`
      - `collection_id` (int, primary key, auto increment)
      - `org_name` (varchar, organization name)
      - `org_type` (enum: College, Company, Industry, Government, NGO)
      - `contact_person` (varchar, contact person name)
      - `contact_phone` (varchar, phone number)
      - `contact_email` (varchar, email address)
      - `address` (text, collection address)
      - `pincode` (varchar, postal code)
      - `estimated_items` (text, description of items)
      - `scheduled_date` (date, preferred pickup date)
      - `scheduled_time` (varchar, preferred pickup time)
      - `status` (enum: pending, scheduled, in_progress, completed, cancelled)
      - `tracking_note` (text, admin notes for tracking)
      - `created_at` (timestamp)
      - `updated_at` (timestamp, auto-update)

  2. Security
    - Add indexes for better query performance
    - Default status is 'pending'
*/

-- Add mass collection requests table
CREATE TABLE IF NOT EXISTS mass_collection_requests (
    collection_id INT AUTO_INCREMENT PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL,
    org_type ENUM('College','Company','Industry','Government','NGO') NOT NULL,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(15),
    contact_email VARCHAR(100),
    address TEXT NOT NULL,
    pincode VARCHAR(10),
    estimated_items TEXT,
    scheduled_date DATE,
    scheduled_time VARCHAR(20),
    status ENUM('pending','scheduled','in_progress','completed','cancelled') DEFAULT 'pending',
    tracking_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mass_collection_status ON mass_collection_requests(status);
CREATE INDEX IF NOT EXISTS idx_mass_collection_org_type ON mass_collection_requests(org_type);
CREATE INDEX IF NOT EXISTS idx_mass_collection_date ON mass_collection_requests(scheduled_date);

-- Insert sample mass collection requests
INSERT INTO mass_collection_requests (org_name, org_type, contact_person, contact_phone, contact_email, address, pincode, estimated_items, scheduled_date, scheduled_time, status, tracking_note) VALUES
('Tech University', 'College', 'Dr. Sarah Johnson', '555-0123', 'sarah.johnson@techuni.edu', '123 University Ave, San Francisco, CA', '94102', 'Approximately 200 old computers, 50 printers, and various networking equipment from computer labs', '2024-01-20', '10:00 AM - 2:00 PM', 'pending', 'Mass collection request received, awaiting team assignment'),
('GreenTech Solutions Inc.', 'Company', 'Mike Chen', '555-0456', 'mike.chen@greentech.com', '456 Business Park Dr, Los Angeles, CA', '90210', 'Office equipment upgrade: 150 desktop computers, 75 monitors, 25 servers, miscellaneous cables and accessories', '2024-01-25', '9:00 AM - 12:00 PM', 'scheduled', 'Collection team Alpha assigned for pickup on scheduled date'),
('City Manufacturing Corp', 'Industry', 'Jennifer Rodriguez', '555-0789', 'j.rodriguez@citymanuf.com', '789 Industrial Blvd, Seattle, WA', '98101', 'Industrial equipment: 50 control panels, 100 electronic components, old machinery with embedded electronics', '2024-01-15', '8:00 AM - 4:00 PM', 'completed', 'Mass collection completed successfully - 2.5 tons of e-waste processed');