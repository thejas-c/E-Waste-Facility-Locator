-- Seed data for E-Waste Facility Locator
USE ewaste_locator;

-- Insert admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role, credits) VALUES
('Admin User', 'admin@ewaste.com', '$2a$10$WGqhVXLrjKcyZSgdz6oVXuN8CjzG6Y3kE7QXxGtC2rO6pI1fW8KMO', 'admin', 1000),
('John Doe', 'john@example.com', '$2a$10$WGqhVXLrjKcyZSgdz6oVXuN8CjzG6Y3kE7QXxGtC2rO6pI1fW8KMO', 'user', 150),
('Jane Smith', 'jane@example.com', '$2a$10$WGqhVXLrjKcyZSgdz6oVXuN8CjzG6Y3kE7QXxGtC2rO6pI1fW8KMO', 'user', 200);

-- Insert e-waste recycling facilities
INSERT INTO facilities (name, address, latitude, longitude, contact, operating_hours, website) VALUES
('Green Tech Recycling Center', '123 Eco Lane, San Francisco, CA 94102', 37.7749, -122.4194, '(415) 555-0123', 'Mon-Fri 9AM-5PM, Sat 10AM-3PM', 'www.greentech-recycle.com'),
('EcoWaste Solutions', '456 Recycle Blvd, Los Angeles, CA 90210', 34.0522, -118.2437, '(213) 555-0456', 'Mon-Sat 8AM-6PM', 'www.ecowaste-solutions.com'),
('Digital Waste Hub', '789 Tech Street, Seattle, WA 98101', 47.6062, -122.3321, '(206) 555-0789', 'Tue-Sun 10AM-7PM', 'www.digital-waste-hub.com'),
('Metro E-Waste Center', '321 Urban Ave, New York, NY 10001', 40.7128, -74.0060, '(212) 555-0321', '24/7 Drop-off Available', 'www.metro-ewaste.com'),
('Sustainable Electronics', '654 Green Way, Austin, TX 73301', 30.2672, -97.7431, '(512) 555-0654', 'Mon-Fri 9AM-6PM', 'www.sustainable-electronics.com');

-- Insert device types and their recycling values
INSERT INTO devices (model_name, category, gold, copper, silver, credits_value) VALUES
('iPhone 12', 'Smartphone', 0.034, 15.5, 0.3, 50),
('iPhone 11', 'Smartphone', 0.030, 14.2, 0.25, 45),
('Samsung Galaxy S21', 'Smartphone', 0.032, 16.8, 0.28, 48),
('MacBook Pro 13"', 'Laptop', 0.15, 45.5, 1.2, 120),
('Dell XPS 13', 'Laptop', 0.12, 42.3, 1.0, 110),
('iPad Air', 'Tablet', 0.08, 25.6, 0.6, 75),
('Sony PlayStation 4', 'Gaming Console', 0.05, 35.2, 0.4, 65),
('Desktop PC Tower', 'Desktop', 0.25, 85.4, 2.1, 180),
('Apple Watch Series 6', 'Wearable', 0.01, 3.2, 0.05, 25),
('Wireless Earbuds', 'Audio', 0.005, 1.8, 0.02, 15);

-- Insert educational content
INSERT INTO educational_content (title, description, image_url, category) VALUES
('Lead Toxicity in Old CRT Monitors', 'CRT monitors contain up to 4 pounds of lead in their glass tubes. When improperly disposed, lead can leach into groundwater and cause severe health issues including brain damage and developmental problems in children.', 'https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg', 'Health Hazards'),
('Mercury in Electronic Devices', 'Fluorescent backlights in LCD screens contain mercury vapor. A single laptop screen contains enough mercury to contaminate 4,000 gallons of water. Always recycle electronics through certified facilities.', 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg', 'Environmental Impact'),
('Precious Metals Recovery', 'One ton of electronic waste contains more gold than 17 tons of gold ore! E-waste recycling recovers valuable materials: gold, silver, copper, and rare earth elements that can be reused in new products.', 'https://images.pexels.com/photos/128867/coins-currency-investment-insurance-128867.jpeg', 'Resource Recovery'),
('Plastic Pollution from E-Waste', 'Electronic devices contain multiple types of plastics, many containing toxic flame retardants. When burned or improperly disposed, they release dioxins and furans into the atmosphere.', 'https://images.pexels.com/photos/2547565/pexels-photo-2547565.jpeg', 'Environmental Impact'),
('Global E-Waste Crisis', 'The world generates over 50 million tons of e-waste annually - equivalent to throwing away 1,000 laptops every second! Only 20% is properly recycled through certified facilities.', 'https://images.pexels.com/photos/2382894/pexels-photo-2382894.jpeg', 'Statistics');

-- Insert sample marketplace listings
INSERT INTO marketplace_listings (user_id, device_name, condition_type, price, description, status) VALUES
(2, 'iPhone 11 - 64GB Space Gray', 'good', 299.99, 'Excellent working condition, minor scratches on back. Includes original charger and box. Battery health at 87%.', 'active'),
(3, 'MacBook Air 2019 - 13 inch', 'excellent', 699.99, 'Like new condition, barely used. Perfect for students or professionals. Includes original packaging and accessories.', 'active'),
(2, 'iPad 6th Generation - 32GB', 'fair', 199.99, 'Some wear on corners and screen has minor scratches. Fully functional, great for basic use and reading.', 'active'),
(3, 'Dell Monitor 24 inch 1080p', 'good', 89.99, 'Great condition monitor, perfect for home office setup. No dead pixels, clear display.', 'active');