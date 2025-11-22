-- E-Waste Facility Locator Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS ewaste_locator;
USE ewaste_locator;

-- Users table (authentication)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    credits INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- E-waste recycling facilities
CREATE TABLE facilities (
    facility_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    contact VARCHAR(100),
    operating_hours TEXT,
    website VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device types and their material values
CREATE TABLE devices (
    device_id INT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    gold DECIMAL(8, 4) DEFAULT 0,
    copper DECIMAL(8, 4) DEFAULT 0,
    silver DECIMAL(8, 4) DEFAULT 0,
    credits_value INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Educational content about e-waste
CREATE TABLE educational_content (
    content_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(300),
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User recycling history
CREATE TABLE recycling_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id INT NOT NULL,
    facility_id INT NOT NULL,
    credits_earned INT NOT NULL,
    recycled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id) ON DELETE CASCADE
);

-- Marketplace listings for repair/reuse
CREATE TABLE marketplace_listings (
    listing_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_name VARCHAR(150) NOT NULL,
    condition_type ENUM('excellent', 'good', 'fair', 'poor') NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image_url VARCHAR(300),
    status ENUM('active', 'sold', 'removed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- AI chatbot conversation logs
CREATE TABLE chat_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);