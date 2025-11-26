// backend/routes/ai.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const db = require('../config/database');

const router = express.Router();

// Use memory storage for simple in-memory processing
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
});

const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;

if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY is not set. AI Auto Credit System will not work.');
} else {
    aiClient = new GoogleGenAI({ apiKey });
}

/**
 * Helper: extract text from Gemini response
 * (same style as chatbot.js)
 */
function extractTextFromGeminiResponse(response) {
    if (!response) return null;

    // Try response.text()
    if (typeof response.text === 'function') {
        const t = response.text();
        if (t) return String(t);
    }

    // Try candidates[0].content.parts
    if (response?.candidates && Array.isArray(response.candidates)) {
        const parts = response.candidates[0]?.content?.parts || [];
        const text = parts.map(p => p.text || '').join('');
        if (text) return String(text);
    }

    // Fallback: generic
    if (response?.output?.[0]?.content?.[0]?.text) {
        return String(response.output[0].content[0].text);
    }

    return null;
}

/**
 * Helper: parse JSON even if wrapped in ```json ``` or extra text
 */
function safeParseJson(rawText) {
    if (!rawText) return null;

    let str = rawText.trim();

    // Remove markdown fences if present
    str = str.replace(/```json/gi, '').replace(/```/g, '').trim();

    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        str = str.slice(firstBrace, lastBrace + 1);
    }

    try {
        return JSON.parse(str);
    } catch (err) {
        console.error('❌ Failed to parse AI JSON:', err.message, 'raw:', str.slice(0, 500));
        return null;
    }
}

/**
 * POST /api/ai/device-from-image
 * Body: multipart/form-data, field name = "image"
 */
router.post('/device-from-image', upload.single('image'), async (req, res) => {
    try {
        if (!aiClient || !apiKey) {
            return res.status(500).json({
                success: false,
                error: 'Gemini API key not configured on server'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Image file is required'
            });
        }

        const mimeType = req.file.mimetype || 'image/jpeg';
        const base64Data = req.file.buffer.toString('base64');

        const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash';

        const prompt = `
You are an expert in electronic devices.

From this image, identify the device and return ONLY JSON (no extra text, no markdown).
If you are unsure, make your best reasonable guess.

Return exactly this structure:

{
  "name": "string",         // Short device name (e.g., "iPhone 12")
  "brand": "string",        // Brand (e.g., "Apple", "Samsung")
  "model": "string",        // Model code or full model (e.g., "A2403" or "Galaxy S21")
  "category": "string",     // e.g., "Smartphone", "Laptop", "Tablet"
  "ram": "string",          // e.g., "4GB", "8GB"
  "storage": "string",      // e.g., "128GB", "256GB"
  "os": "string",           // e.g., "iOS 17", "Android 14", "Windows 11"
  "processor": "string",    // e.g., "A14 Bionic", "Intel i5"
  "year": "string",         // approximate release year if possible
  "notes": "string"         // any additional useful detail
}
`;

        const response = await aiClient.models.generateContent({
            model,
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }
            ]
        });

        const rawText = extractTextFromGeminiResponse(response);
        const deviceInfo = safeParseJson(rawText);

        if (!deviceInfo || !deviceInfo.name) {
            return res.status(500).json({
                success: false,
                error: 'AI could not reliably extract device details from the image'
            });
        }

        // ---- Search device in database (devices table) ----
        const searchTerm = deviceInfo.name;
        let estimate = null;
        console.log("AI Output:", deviceInfo);

        if (searchTerm) {
            // Try exact match first
            let [devices] = await db.execute(
                'SELECT * FROM devices WHERE LOWER(model_name) = LOWER(?) LIMIT 1',
                [searchTerm]
            );
            /*
            if (devices.length === 0) {
                // Try partial match
                [devices] = await db.execute(
                    'SELECT * FROM devices WHERE model_name LIKE ? LIMIT 1',
                    [`%${searchTerm}%`]
                );
            }
            */
            if (devices.length > 0) {
                const device = devices[0];
                const quantity = 1;
                const totalCredits = device.credits_value * quantity;

                estimate = {
                    device_id: device.device_id,
                    model_name: device.model_name,
                    category: device.category,
                    quantity,
                    credits_per_unit: device.credits_value,
                    total_credits: totalCredits,
                    gold: device.gold,
                    silver: device.silver,
                    copper: device.copper
                };
            }
            else{
                // Device NOT found in DB → generate credits using AI, but DO NOT mention prediction
                const prediction = await predictCredits(deviceInfo, aiClient);

                if (!prediction || !prediction.credits) {
                    return res.json({
                        success: true,
                        deviceInfo,
                        estimate: {
                            model_name: deviceInfo.name,
                            category: deviceInfo.category,
                            quantity: 1,
                            credits_per_unit: 25, // fallback if AI fails
                            gold: 0.02,
                            silver: 0.20,
                            copper: 10,
                            total_credits: 25
                        }
                    });
                }
                // Return credits normally (NO prediction text)
                return res.json({
                    success: true,
                    deviceInfo,
                    estimate: {
                        model_name: deviceInfo.name,
                        category: deviceInfo.category,
                        quantity: 1,
                        credits_per_unit: prediction.credits,
                        gold: prediction.estimated_gold,
                        silver: prediction.estimated_silver,
                        copper: prediction.estimated_copper,
                        total_credits: prediction.credits
                    }
                });
            }
        }

        return res.json({
            success: true,
            deviceInfo,
            estimate,
            message: estimate
                ? 'Device identified and credits found in database.'
                : 'Device identified, but no exact match found in database. Credits may be unavailable.'
        });
    } catch (err) {
        console.error('AI device-from-image error:', err);
        return res.status(500).json({
            success: false,
            error: 'Failed to analyze image',
            details: err.message
        });
    }
});

async function predictCredits(deviceInfo, aiClient) {
    const prompt = `
You are an e-waste recycling expert.

Based on this device's information, estimate how many recycling credits it should be worth.
Use similar values to typical smartphones/laptops/tablets/audio/wearable.

FORMAT RULES:
- "credits" must be a WHOLE NUMBER (no decimals).
- "estimated_gold", "estimated_silver", and "estimated_copper" must be in decimal format with EXACTLY 4 decimal places.
- No exponential notation. No text or explanation.

Return ONLY JSON in this exact format:

{
  "credits": number,                // e.g., 45
  "estimated_gold": number,         // e.g., 0.0250
  "estimated_silver": number,       // e.g., 0.2400
  "estimated_copper": number        // e.g., 14.5000
}

Device Info:
${JSON.stringify(deviceInfo)}
    `;

    const response = await aiClient.models.generateContent({
        model: process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }]
    });

    const text = extractTextFromGeminiResponse(response);
    return safeParseJson(text);
}

module.exports = router;