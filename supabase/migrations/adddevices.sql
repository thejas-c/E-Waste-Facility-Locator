ALTER TABLE devices ADD UNIQUE (model_name);

INSERT IGNORE INTO devices (model_name, category, gold, copper, silver, credits_value) VALUES
-- APPLE iPHONES
('iPhone 8', 'Smartphone', 0.0270, 13.8000, 0.2400, 40),
('iPhone X', 'Smartphone', 0.0290, 14.5000, 0.2600, 43),
('iPhone XR', 'Smartphone', 0.0280, 14.0000, 0.2500, 42),
('iPhone 11', 'Smartphone', 0.0300, 15.0000, 0.2700, 45),
('iPhone 11 Pro', 'Smartphone', 0.0320, 15.8000, 0.2900, 48),
('iPhone 12', 'Smartphone', 0.0320, 15.8000, 0.2900, 48),
('iPhone 12 Pro', 'Smartphone', 0.0340, 16.2000, 0.3100, 52),
('iPhone 13', 'Smartphone', 0.0350, 16.5000, 0.3200, 55),
('iPhone 13 Pro', 'Smartphone', 0.0370, 17.2000, 0.3400, 60),
('iPhone 14', 'Smartphone', 0.0360, 16.8000, 0.3300, 58),
('iPhone 14 Pro', 'Smartphone', 0.0400, 18.0000, 0.3500, 65),
('iPhone 15', 'Smartphone', 0.0380, 17.5000, 0.3400, 62),
('iPhone 15 Pro', 'Smartphone', 0.0410, 18.3000, 0.3600, 68),
('iPhone SE 2020', 'Smartphone', 0.0260, 13.2000, 0.2200, 38),
('iPhone SE 2022', 'Smartphone', 0.0270, 13.6000, 0.2300, 40),

-- APPLE iPAD / MACBOOK
('iPad 9th Gen', 'Tablet', 0.0600, 19.0000, 0.4800, 55),
('iPad Air 4', 'Tablet', 0.0650, 21.2000, 0.5200, 60),
('iPad Pro 11', 'Tablet', 0.0750, 23.5000, 0.5800, 70),
('MacBook Air M1', 'Laptop', 0.2000, 60.2000, 2.0000, 140),
('MacBook Air M2', 'Laptop', 0.2100, 62.5000, 2.1000, 150),
('MacBook Pro 13 M1', 'Laptop', 0.2300, 66.4000, 2.4000, 155),
('MacBook Pro 14 M1 Pro', 'Laptop', 0.2500, 70.0000, 2.6000, 170),

-- SAMSUNG GALAXY S / A
('Samsung Galaxy S9', 'Smartphone', 0.0280, 14.2000, 0.2500, 42),
('Samsung Galaxy S10', 'Smartphone', 0.0300, 15.0000, 0.2700, 45),
('Samsung Galaxy S20', 'Smartphone', 0.0310, 15.6000, 0.2800, 48),
('Samsung Galaxy S21', 'Smartphone', 0.0330, 16.4000, 0.2900, 50),
('Samsung Galaxy S22', 'Smartphone', 0.0350, 17.0000, 0.3100, 54),
('Samsung Galaxy S23', 'Smartphone', 0.0360, 17.5000, 0.3300, 58),
('Samsung Galaxy S23 Ultra', 'Smartphone', 0.0390, 18.6000, 0.3600, 65),
('Samsung Galaxy S24', 'Smartphone', 0.0370, 17.9000, 0.3400, 60),
('Samsung Galaxy S24 Ultra', 'Smartphone', 0.0410, 19.2000, 0.3700, 70),
('Samsung Galaxy A51', 'Smartphone', 0.0250, 13.6000, 0.2100, 34),
('Samsung Galaxy A52', 'Smartphone', 0.0260, 14.2000, 0.2200, 36),
('Samsung Galaxy A53', 'Smartphone', 0.0270, 14.6000, 0.2300, 38),
('Samsung Galaxy A54', 'Smartphone', 0.0280, 15.0000, 0.2400, 40),

-- SAMSUNG TABLETS
('Samsung Galaxy Tab A7', 'Tablet', 0.0700, 20.5000, 0.6000, 55),
('Samsung Galaxy Tab S6 Lite', 'Tablet', 0.0720, 21.0000, 0.6200, 58),
('Samsung Galaxy Tab S7', 'Tablet', 0.0780, 23.0000, 0.6500, 65),

-- XIAOMI / REDMI / POCO
('Redmi Note 7', 'Smartphone', 0.0230, 12.5000, 0.1900, 30),
('Redmi Note 8', 'Smartphone', 0.0240, 13.0000, 0.2000, 32),
('Redmi Note 9', 'Smartphone', 0.0250, 13.5000, 0.2100, 34),
('Redmi Note 10', 'Smartphone', 0.0260, 14.2000, 0.2300, 37),
('Redmi Note 10S', 'Smartphone', 0.0270, 14.4000, 0.2400, 38),
('Redmi Note 10 Pro', 'Smartphone', 0.0280, 14.8000, 0.2500, 40),
('Redmi Note 11', 'Smartphone', 0.0270, 14.5000, 0.2400, 39),
('Redmi Note 11 Pro', 'Smartphone', 0.0290, 15.0000, 0.2600, 42),
('Redmi Note 12', 'Smartphone', 0.0290, 15.2000, 0.2600, 43),
('Redmi Note 12 Pro', 'Smartphone', 0.0310, 15.8000, 0.2800, 46),
('Redmi 9 Power', 'Smartphone', 0.0240, 13.0000, 0.2000, 32),
('Xiaomi 11 Lite', 'Smartphone', 0.0280, 14.9000, 0.2500, 40),
('Xiaomi Mi 10T', 'Smartphone', 0.0300, 15.6000, 0.2700, 44),
('Xiaomi 12', 'Smartphone', 0.0320, 16.0000, 0.2900, 48),
('Xiaomi 13', 'Smartphone', 0.0340, 16.8000, 0.3100, 52),
('Poco X3 Pro', 'Smartphone', 0.0290, 15.0000, 0.2500, 41),
('Poco F3', 'Smartphone', 0.0300, 15.6000, 0.2600, 43),
('Poco X5 Pro', 'Smartphone', 0.0310, 15.9000, 0.2700, 45),

-- ONEPLUS
('OnePlus 6', 'Smartphone', 0.0270, 14.0000, 0.2300, 38),
('OnePlus 7', 'Smartphone', 0.0280, 14.4000, 0.2400, 40),
('OnePlus 7T', 'Smartphone', 0.0290, 14.8000, 0.2500, 42),
('OnePlus 8', 'Smartphone', 0.0300, 15.2000, 0.2600, 44),
('OnePlus 8T', 'Smartphone', 0.0310, 15.4000, 0.2700, 46),
('OnePlus 9', 'Smartphone', 0.0310, 15.2000, 0.2600, 46),
('OnePlus 9 Pro', 'Smartphone', 0.0330, 16.0000, 0.2800, 50),
('OnePlus 10R 5G', 'Smartphone', 0.0320, 16.2000, 0.2800, 50),
('OnePlus 10 Pro', 'Smartphone', 0.0340, 16.8000, 0.3000, 55),
('OnePlus 11', 'Smartphone', 0.0360, 17.2000, 0.3100, 58),
('OnePlus Nord', 'Smartphone', 0.0260, 13.8000, 0.2200, 36),
('OnePlus Nord 2', 'Smartphone', 0.0280, 14.5000, 0.2300, 40),
('OnePlus Nord CE 2', 'Smartphone', 0.0250, 13.6000, 0.2100, 34),

-- REALME
('Realme 6', 'Smartphone', 0.0240, 13.0000, 0.2000, 32),
('Realme 7', 'Smartphone', 0.0250, 13.4000, 0.2100, 34),
('Realme 8', 'Smartphone', 0.0260, 13.8000, 0.2200, 36),
('Realme 8 Pro', 'Smartphone', 0.0270, 14.0000, 0.2300, 38),
('Realme 9 Pro', 'Smartphone', 0.0280, 14.6000, 0.2400, 40),
('Realme GT Neo 2', 'Smartphone', 0.0290, 15.0000, 0.2500, 42),
('Realme GT Neo 3', 'Smartphone', 0.0300, 15.4000, 0.2600, 45),

-- OPPO
('Oppo F11 Pro', 'Smartphone', 0.0240, 12.9000, 0.1900, 32),
('Oppo F19 Pro', 'Smartphone', 0.0250, 13.1000, 0.1900, 33),
('Oppo Reno 5', 'Smartphone', 0.0270, 14.2000, 0.2300, 38),
('Oppo Reno 6', 'Smartphone', 0.0290, 15.0000, 0.2500, 42),
('Oppo A74', 'Smartphone', 0.0240, 12.7000, 0.1800, 30),

-- VIVO
('Vivo V17', 'Smartphone', 0.0250, 13.2000, 0.2000, 34),
('Vivo V19', 'Smartphone', 0.0260, 13.8000, 0.2100, 36),
('Vivo V21', 'Smartphone', 0.0280, 14.6000, 0.2400, 39),
('Vivo V25', 'Smartphone', 0.0290, 15.2000, 0.2600, 41),
('Vivo Y20', 'Smartphone', 0.0230, 12.8000, 0.1900, 30),

-- GOOGLE PIXEL
('Google Pixel 4', 'Smartphone', 0.0300, 15.2000, 0.2700, 45),
('Google Pixel 4a', 'Smartphone', 0.0280, 14.6000, 0.2500, 40),
('Google Pixel 5', 'Smartphone', 0.0310, 15.6000, 0.2800, 48),
('Google Pixel 6', 'Smartphone', 0.0340, 17.0000, 0.3000, 55),
('Google Pixel 6a', 'Smartphone', 0.0320, 16.2000, 0.2900, 50),
('Google Pixel 7', 'Smartphone', 0.0350, 17.6000, 0.3200, 58),
('Google Pixel 7a', 'Smartphone', 0.0330, 16.8000, 0.3000, 52),
('Google Pixel 8', 'Smartphone', 0.0360, 18.0000, 0.3300, 60),

-- MOTOROLA
('Moto G5 Plus', 'Smartphone', 0.0220, 11.8000, 0.1800, 28),
('Moto G8 Power', 'Smartphone', 0.0230, 12.6000, 0.1900, 30),
('Moto G60', 'Smartphone', 0.0250, 13.8000, 0.2200, 34),
('Moto G52', 'Smartphone', 0.0230, 12.9000, 0.2000, 30),
('Moto Edge 20', 'Smartphone', 0.0280, 14.8000, 0.2400, 40),

-- LAPTOPS: DELL
('Dell Inspiron 15', 'Laptop', 0.1600, 48.3000, 1.5000, 115),
('Dell Inspiron 14 5000', 'Laptop', 0.1500, 45.0000, 1.4000, 110),
('Dell Latitude 5400', 'Laptop', 0.1400, 45.2000, 1.3000, 105),
('Dell XPS 13', 'Laptop', 0.1900, 55.8000, 1.7000, 130),
('Dell G15 Gaming', 'Laptop', 0.2100, 62.0000, 2.0000, 150),

-- LAPTOPS: LENOVO
('Lenovo ThinkPad X1 Carbon', 'Laptop', 0.1800, 52.4000, 1.8000, 130),
('Lenovo ThinkPad T480', 'Laptop', 0.1700, 50.2000, 1.6000, 120),
('Lenovo IdeaPad 3', 'Laptop', 0.1500, 46.1000, 1.2000, 100),
('Lenovo IdeaPad Gaming 3', 'Laptop', 0.1900, 56.0000, 1.8000, 135),
('Lenovo Legion 5', 'Laptop', 0.2000, 60.0000, 2.0000, 150),

-- LAPTOPS: HP
('HP Pavilion 15', 'Laptop', 0.1550, 47.0000, 1.3000, 110),
('HP Pavilion Gaming 15', 'Laptop', 0.1800, 52.0000, 1.7000, 130),
('HP EliteBook 840', 'Laptop', 0.1650, 50.2000, 1.4000, 120),
('HP Omen 15', 'Laptop', 0.2100, 62.0000, 2.1000, 155),

-- LAPTOPS: ASUS
('Asus VivoBook 15', 'Laptop', 0.1500, 46.8000, 1.3000, 108),
('Asus TUF Gaming F15', 'Laptop', 0.2050, 60.0000, 2.0000, 145),
('Asus ROG Strix G15', 'Laptop', 0.2200, 65.0000, 2.2000, 160),

-- LAPTOPS: ACER
('Acer Aspire 5', 'Laptop', 0.1550, 47.2000, 1.3000, 110),
('Acer Aspire 7', 'Laptop', 0.1700, 48.5000, 1.5000, 115),
('Acer Nitro 5', 'Laptop', 0.2100, 62.0000, 2.0000, 150),

-- TABLETS: LENOVO / XIAOMI
('Lenovo Tab M10', 'Tablet', 0.0680, 19.8000, 0.5500, 52),
('Lenovo Tab P11', 'Tablet', 0.0720, 21.0000, 0.5800, 58),
('Xiaomi Pad 5', 'Tablet', 0.0740, 22.0000, 0.6000, 60),

-- WEARABLES
('Apple Watch Series 4', 'Wearable', 0.0100, 3.0000, 0.0600, 22),
('Apple Watch Series 6', 'Wearable', 0.0110, 3.4000, 0.0700, 24),
('Apple Watch Series 7', 'Wearable', 0.0120, 3.8000, 0.0800, 26),
('Samsung Galaxy Watch 4', 'Wearable', 0.0100, 3.2000, 0.0600, 22),
('Samsung Galaxy Watch 5', 'Wearable', 0.0110, 3.5000, 0.0700, 24),
('Realme Watch 2', 'Wearable', 0.0080, 2.8000, 0.0400, 20),
('Mi Band 6', 'Wearable', 0.0040, 1.5000, 0.0200, 12),

-- AUDIO
('AirPods 2', 'Audio', 0.0040, 1.6000, 0.0200, 14),
('AirPods Pro', 'Audio', 0.0050, 1.8000, 0.0300, 18),
('Galaxy Buds 2', 'Audio', 0.0040, 1.6000, 0.0200, 14),
('Realme Buds Air 2', 'Audio', 0.0040, 1.5000, 0.0150, 12),
('Oppo Enco Buds', 'Audio', 0.0040, 1.6000, 0.0150, 12);

INSERT IGNORE INTO devices (model_name, category, gold, copper, silver, credits_value) VALUES

-- EXTRA APPLE DEVICES (NOT IN PREVIOUS LIST)
('iPhone 7', 'Smartphone', 0.0240, 12.5000, 0.2100, 32),
('iPhone 7 Plus', 'Smartphone', 0.0250, 12.9000, 0.2200, 34),
('iPhone 6s', 'Smartphone', 0.0220, 11.8000, 0.1900, 30),
('iPhone 6s Plus', 'Smartphone', 0.0230, 12.2000, 0.2000, 32),
('iPhone 8 Plus', 'Smartphone', 0.0280, 14.2000, 0.2500, 42),
('iPhone 12 Mini', 'Smartphone', 0.0300, 15.0000, 0.2600, 46),
('iPhone 13 Mini', 'Smartphone', 0.0310, 15.5000, 0.2700, 48),
('MacBook Pro 16 (Intel)', 'Laptop', 0.2600, 72.0000, 2.7000, 180),

-- EXTRA SAMSUNG DEVICES
('Samsung Galaxy S8', 'Smartphone', 0.0270, 13.9000, 0.2400, 38),
('Samsung Galaxy S8+', 'Smartphone', 0.0280, 14.3000, 0.2500, 40),
('Samsung Galaxy S10e', 'Smartphone', 0.0290, 14.9000, 0.2600, 42),
('Samsung Galaxy Note 9', 'Smartphone', 0.0300, 15.2000, 0.2700, 45),
('Samsung Galaxy Note 10', 'Smartphone', 0.0320, 16.0000, 0.2900, 50),
('Samsung Galaxy Note 20', 'Smartphone', 0.0340, 17.2000, 0.3000, 55),
('Samsung Galaxy A30', 'Smartphone', 0.0230, 12.4000, 0.1900, 30),
('Samsung Galaxy A72', 'Smartphone', 0.0280, 14.9000, 0.2300, 38),
('Samsung Galaxy M31', 'Smartphone', 0.0260, 14.3000, 0.2200, 36),
('Samsung Galaxy M33', 'Smartphone', 0.0270, 14.9000, 0.2300, 38),

-- EXTRA XIAOMI / REDMI / POCO
('Redmi Note 5 Pro', 'Smartphone', 0.0220, 11.9000, 0.1800, 29),
('Redmi Note 6 Pro', 'Smartphone', 0.0230, 12.6000, 0.1900, 31),
('Redmi Note 12 Turbo', 'Smartphone', 0.0310, 15.8000, 0.2700, 45),
('Xiaomi Mi 11 Ultra', 'Smartphone', 0.0360, 18.2000, 0.3400, 62),
('Xiaomi Redmi K50', 'Smartphone', 0.0320, 16.4000, 0.2900, 48),
('Poco X2', 'Smartphone', 0.0270, 14.4000, 0.2200, 36),
('Poco X4 Pro', 'Smartphone', 0.0300, 15.6000, 0.2600, 44),

-- EXTRA ONEPLUS DEVICES
('OnePlus 5', 'Smartphone', 0.0250, 13.5000, 0.2100, 34),
('OnePlus 5T', 'Smartphone', 0.0260, 13.9000, 0.2200, 36),
('OnePlus 12', 'Smartphone', 0.0380, 18.2000, 0.3300, 62),
('OnePlus Nord CE 3', 'Smartphone', 0.0260, 14.1000, 0.2300, 37),
('OnePlus Nord N20', 'Smartphone', 0.0250, 13.6000, 0.2100, 34),

-- EXTRA OPPO / VIVO
('Oppo Reno 8', 'Smartphone', 0.0300, 15.4000, 0.2600, 44),
('Oppo A96', 'Smartphone', 0.0250, 13.5000, 0.2100, 34),
('Vivo V27', 'Smartphone', 0.0300, 15.6000, 0.2600, 45),
('Vivo Y33s', 'Smartphone', 0.0240, 13.1000, 0.2000, 31),

-- EXTRA REALME
('Realme Narzo 20 Pro', 'Smartphone', 0.0250, 13.2000, 0.2000, 33),
('Realme Narzo 30', 'Smartphone', 0.0260, 13.7000, 0.2200, 35),
('Realme 10 Pro+', 'Smartphone', 0.0290, 15.1000, 0.2500, 42),

-- GOOGLE PIXEL (MORE)
('Google Pixel 2', 'Smartphone', 0.0250, 13.2000, 0.2100, 34),
('Google Pixel 3a', 'Smartphone', 0.0260, 13.8000, 0.2200, 36),
('Google Pixel 5a', 'Smartphone', 0.0300, 15.0000, 0.2700, 45),
('Google Pixel 8 Pro', 'Smartphone', 0.0380, 18.2000, 0.3400, 65),

-- MOTOROLA EXTRA
('Moto G9 Power', 'Smartphone', 0.0260, 14.2000, 0.2200, 36),
('Moto G40 Fusion', 'Smartphone', 0.0270, 14.8000, 0.2300, 38),
('Moto Edge 40', 'Smartphone', 0.0310, 15.9000, 0.2600, 46),

-- EXTRA LAPTOPS (NOT IN PREVIOUS BIG LIST)
('Dell Inspiron 3511', 'Laptop', 0.1550, 47.5000, 1.3500, 112),
('Dell Vostro 3400', 'Laptop', 0.1450, 44.0000, 1.2500, 105),
('HP Spectre x360', 'Laptop', 0.2000, 60.0000, 1.9000, 145),
('HP Victus 16', 'Laptop', 0.2300, 66.0000, 2.1000, 160),
('Lenovo Yoga Slim 7', 'Laptop', 0.1800, 52.0000, 1.8000, 135),
('Lenovo LOQ', 'Laptop', 0.2200, 64.0000, 2.1000, 158),
('Acer Swift 3', 'Laptop', 0.1500, 46.0000, 1.3000, 108),
('Asus ZenBook 14', 'Laptop', 0.1600, 48.0000, 1.4000, 115),

-- EXTRA TABLETS
('Realme Pad X', 'Tablet', 0.0650, 20.5000, 0.5500, 58),
('Oppo Pad Air', 'Tablet', 0.0680, 21.0000, 0.5800, 60),
('Xiaomi Pad 6', 'Tablet', 0.0750, 23.0000, 0.6200, 68),

-- EXTRA SMARTWATCHES
('Amazfit GTR 3', 'Wearable', 0.0090, 3.0000, 0.0400, 18),
('Amazfit Bip U Pro', 'Wearable', 0.0070, 2.3000, 0.0300, 14),
('OnePlus Watch', 'Wearable', 0.0090, 3.0000, 0.0500, 22),

-- EXTRA AUDIO
('Sony WF-1000XM4', 'Audio', 0.0050, 1.9000, 0.0300, 20),
('JBL Tune 130NC', 'Audio', 0.0040, 1.6000, 0.0200, 14),
('Boat Airdopes 141', 'Audio', 0.0030, 1.1000, 0.0100, 10);
