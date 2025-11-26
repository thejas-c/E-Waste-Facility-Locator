const { GoogleGenerativeAI } = require("@google/generative-ai");

// This picks whichever key is defined (priority: GOOGLE_API_KEY)
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ ERROR: GOOGLE_API_KEY or GEMINI_API_KEY is not set in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

module.exports = genAI;