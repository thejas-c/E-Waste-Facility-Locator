/*
  # Add recycling requests table for admin management

  1. New Tables
    - `recycling_requests`
      - `request_id` (int, primary key, auto increment)
      - `user_id` (int, foreign key to users)
      - `device_id` (int, foreign key to devices)
      - `facility_id` (int, foreign key to facilities)
      - `status` (enum: pending, approved, rejected)
      - `submitted_at` (timestamp)
      - `processed_at` (timestamp, nullable)
      - `processed_by` (int, foreign key to users - admin who processed)

  2. Security
    - Add foreign key constraints for data integrity
    - Default status is 'pending'
*/

-- Add recycling requests table for admin workflow
CREATE TABLE IF NOT EXISTS recycling_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id INT NOT NULL,
    facility_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    processed_by INT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_recycling_requests_status ON recycling_requests(status);
CREATE INDEX IF NOT EXISTS idx_recycling_requests_user ON recycling_requests(user_id);