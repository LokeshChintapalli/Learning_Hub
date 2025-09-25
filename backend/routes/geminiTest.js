import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ Gemini API key not found in .env file");
}

// Route to handle user prompts
router.post('/ask', async (req, res) => {
  const userPrompt = req.body.prompt;

  if (!userPrompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    console.log("🔄 Sending request to Gemini API...");
    console.log("User prompt:", userPrompt);
    
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are JARVIS, created by Lokesh. Be friendly, funny, helpful, and always reply to the user's prompt. \n\n${userPrompt}`
              }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const reply = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (reply) {
      console.log("✅ Gemini API Response received successfully");
      res.status(200).json({ reply });
    } else {
      console.error("❌ Gemini returned no content");
      res.status(500).json({ error: "Gemini returned no content." });
    }
  } catch (err) {
    console.error("❌ Gemini API Error:", err.response?.data || err.message);
    console.error("Full error:", err);
    res.status(500).json({ error: "Something went wrong while processing your request." });
  }
});

export default router;
