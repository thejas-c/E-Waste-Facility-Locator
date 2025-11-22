/*
  # Add Device Pickup Request and Tracking Feature

  1. New Tables
    - `pickup_requests`
      - `pickup_id` (int, primary key, auto increment)
      - `user_id` (int, foreign key to users)
      - `device_id` (int, foreign key to devices)
      - `address` (text, pickup address)
      - `scheduled_date` (date, preferred pickup date)
      - `scheduled_time` (varchar, preferred pickup time)
      - `status` (enum: pending, scheduled, picked_up, completed, cancelled)
      - `tracking_note` (text, admin notes for tracking)
      - `created_at` (timestamp)

  2. Security
    - Enable foreign key constraints for data integrity
    - Default status is 'pending'
    - Add indexes for better query performance
*/

-- Add pickup requests table
CREATE TABLE IF NOT EXISTS pickup_requests (
    pickup_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id INT NOT NULL,
    address TEXT NOT NULL,
    scheduled_date DATE,
    scheduled_time VARCHAR(20),
    status ENUM('pending', 'scheduled', 'picked_up', 'completed', 'cancelled') DEFAULT 'pending',
    tracking_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pickup_requests_user ON pickup_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_status ON pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_date ON pickup_requests(scheduled_date);

-- Insert sample pickup requests
INSERT INTO pickup_requests (user_id, device_id, address, scheduled_date, scheduled_time, status, tracking_note) VALUES
(2, 1, '123 Main Street, San Francisco, CA 94102', '2024-01-15', '10:00 AM - 12:00 PM', 'pending', 'Pickup request received, awaiting team assignment'),
(3, 3, '456 Oak Avenue, Los Angeles, CA 90210', '2024-01-16', '2:00 PM - 4:00 PM', 'scheduled', 'Team A assigned for pickup on scheduled date'),
(2, 4, '789 Pine Road, Seattle, WA 98101', '2024-01-10', '9:00 AM - 11:00 AM', 'completed', 'Device successfully picked up and processed'),
(3, 2, '321 Elm Street, Austin, TX 73301', '2024-01-18', '1:00 PM - 3:00 PM', 'picked_up', 'Device collected, being transported to facility');