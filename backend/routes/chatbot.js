// backend/routes/chatbot.js
require('dotenv').config();
const express = require('express');
const router = express.Router();

const db = require('../config/database'); // your mysql2 pool (keep your existing config)
const { GoogleGenAI } = require('@google/genai'); // official SDK per quickstart

// Optional: middleware to extract logged-in user (if you already have verifyToken middleware)
// const { verifyToken } = require('../middleware/auth');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('WARNING: GEMINI_API_KEY is not set. Chatbot will still work with a fallback message.');
}

// initialize client
const aiClient = new GoogleGenAI({
  // SDK will pick up GEMINI_API_KEY from env, but you can explicitly pass:
  apiKey: apiKey
});

// single helper to call Gemini safely and return a string
async function generateGeminiAnswer(prompt, model = (process.env.GEMINI_MODEL || 'gemini-2.5-flash')) {
  // Guard: if no apiKey, skip call
  if (!apiKey) {
    return null;
  }

  try {
    const response = await aiClient.models.generateContent({
      model,
      // contents can be string or array of parts as per docs
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      // you can tune other options here (temperature, max output tokens) if SDK supports them
      // Example (if supported): temperature: 0.4
    });

    // SDK returns response.text or candidates. Pick the most common fields (defensive)
    // Many examples show `response.text()` or `response.candidates[0].content.parts[0].text`
    // Try to extract both ways:
    if (!response) return null;

    // If SDK exposes .text()
    if (typeof response.text === 'function') {
      const t = response.text();
      if (t) return String(t);
    }

    // Candidate style extraction
    if (response?.candidates && Array.isArray(response.candidates) && response.candidates[0]?.content?.parts) {
      const parts = response.candidates[0].content.parts;
      const text = parts.map(p => p.text || p).join('');
      if (text) return String(text);
    }

    // Fallback: any top-level field
    if (response?.output?.[0]?.content?.[0]?.text) {
      return String(response.output[0].content[0].text);
    }

    // As last resort, stringify a portion
    return JSON.stringify(response).slice(0, 2000);
  } catch (err) {
    console.error('Gemini API call failed:', err);
    return null;
  }
}

// POST /api/chatbot/query
// Public endpoint (optionally protect with verifyToken if you want authenticated-only access)
router.post('/query', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !String(question).trim()) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    // 1) Try to get answer from Gemini
    let answer = await generateGeminiAnswer(String(question).trim());

    // 2) If Gemini failed (no key or API error), return a friendly fallback
    if (!answer) {
      // Non-blocking local fallback (still returns success so frontend stays functional)
      answer = `Sorry — AI assistant is temporarily unavailable. Here is a fallback answer: we recommend dropping e-waste at certified collection centers and following manufacturer take-back policies.`;
    }

    // 3) Log conversation to DB asynchronously (do not block response on DB success)
    (async () => {
      try {
        // Try to get user_id if Authorization header contains JWT compatible with your app
        let userId = null;
        try {
          const authHeader = req.header('Authorization') || '';
          if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '').trim();
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded?.user_id ?? decoded?.userId ?? null;
          }
        } catch (e) {
          // invalid token or no jwt - treat as anonymous
        }

        // Insert log; columns: chat_log_id (autoinc), user_id (nullable), question, answer, created_at
        await db.execute(
          'INSERT INTO chat_logs (user_id, question, answer) VALUES (?, ?, ?)',
          [userId, question, answer]
        );
      } catch (logErr) {
        // Log but do not fail the response
        console.warn('Chatbot: failed to write chat log (non-fatal):', logErr?.message || logErr);
      }
    })();

    // 4) Return canonical response shape (frontend expects response.response.answer)
    return res.json({
      success: true,
      response: {
        answer
      }
    });
  } catch (err) {
    console.error('Chatbot /query error:', err);
    // Always return consistent JSON shape even on error so frontend remains stable
    return res.status(200).json({
      success: true,
      response: {
        answer: 'Sorry — something went wrong while processing your message. Please try again.'
      }
    });
  }
});

module.exports = router;
