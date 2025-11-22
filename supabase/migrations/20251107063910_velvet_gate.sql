/*
  # Add updated_at column to pickup_requests table

  1. Schema Changes
    - Add `updated_at` column to `pickup_requests` table
    - Set default value and auto-update on modification
    - Ensure tracking_note column exists as TEXT

  2. Purpose
    - Enable real-time tracking of pickup status changes
    - Support frontend polling and real-time updates
*/

-- Add updated_at column if it doesn't exist
ALTER TABLE pickup_requests 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Ensure tracking_note is TEXT type
ALTER TABLE pickup_requests 
MODIFY COLUMN tracking_note TEXT;

-- Update existing records to have updated_at = created_at
UPDATE pickup_requests 
SET updated_at = created_at 
WHERE updated_at IS NULL;