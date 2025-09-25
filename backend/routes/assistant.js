import express from 'express';
import { chatWithGemini, chatWithGeminiAdvanced, testGeminiConnection } from '../geminiTest.js';

const router = express.Router();

// Route for basic chat functionality (matches frontend expectation)
router.post('/talk', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const reply = await chatWithGemini(message);
        res.json({ reply });

    } catch (error) {
        console.error('Error in processing assistant talk request:', error);
        res.status(500).json({ error: 'Failed to get a response from the assistant.' });
    }
});

// Route for enhanced chat with conversation history
router.post('/ask', async (req, res) => {
    try {
        const { prompt, conversationHistory } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const response = await chatWithGeminiAdvanced(prompt, conversationHistory);
        res.json({ response });

    } catch (error) {
        console.error('Error in processing assistant ask request:', error);
        res.status(500).json({ error: 'Failed to get a response from the assistant.' });
    }
});

// Legacy route for backward compatibility
router.post('/command', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const reply = await chatWithGemini(prompt);
        res.json({ reply });

    } catch (error) {
        console.error('Error in processing assistant command request:', error);
        res.status(500).json({ error: 'Failed to get a response from the assistant.' });
    }
});

// Test endpoint to check Gemini API connection
router.get('/test', async (req, res) => {
    try {
        const testResult = await testGeminiConnection();
        res.json(testResult);
    } catch (error) {
        console.error('Error testing Gemini connection:', error);
        res.status(500).json({ error: 'Failed to test Gemini connection.' });
    }
});

export default router;
