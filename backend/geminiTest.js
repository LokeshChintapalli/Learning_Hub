// geminiTest.js - Real Gemini API Integration Module
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { parseSystemCommand } from './systemController.js';

// Ensure environment variables are loaded
dotenv.config();

// Debug logging for API key
console.log('🔍 Gemini API Debug:');
console.log('- API Key exists:', !!process.env.GEMINI_API_KEY);
console.log('- API Key length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);

let genAI = null;
let model = null;

// Initialize Gemini AI only if API key is available
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log('✅ Gemini AI initialized successfully');
    } catch (error) {
        console.log('❌ Error initializing Gemini AI:', error.message);
    }
} else {
    console.log('⚠️ Gemini API key not configured or is placeholder');
}

export const geminiTest = () => {
    return `
        <div>
            <h1>Gemini AI Integration Module</h1>
        </div>
    `;
};

// Real Gemini API chat function with custom personality and system control
export const chatWithGemini = async (message) => {
    try {
        // First, check if this is a system command
        const systemCommand = parseSystemCommand(message);
        
        if (systemCommand) {
            console.log(`🎯 System command detected: ${systemCommand.type}`);
            
            // Execute the system command
            const result = await systemCommand.action();
            
            if (result.success) {
                // Return success message with AI personality - concise
                return `${result.message} Done! I'm always ready to help you control your system, Lokesh.`;
            } else {
                // Return error message with AI personality - concise
                return `Sorry Lokesh! Command failed: ${result.message}. Let me try a different approach for you.`;
            }
        }

        // If not a system command, proceed with regular AI chat
        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return "⚠️ Gemini API key not configured. Please add your actual GEMINI_API_KEY to your environment variables.";
        }

        // Check if model is initialized
        if (!model) {
            return "❌ Gemini AI model not initialized. Please check your API key and restart the server.";
        }

        // Custom system prompt to create Lokesh's personal AI assistant
        const systemPrompt = `You are Lokesh's personal AI assistant and loyal friend, created by Lokesh Chintapalli. 

RESPONSE GUIDELINES:
- Provide summarized, concise answers that cover the key points
- Be direct and informative without unnecessary length
- Don't ask "What a great question!" or similar phrases
- Focus on delivering clear, useful information
- Summarize complex topics into digestible explanations

PERSONALITY:
- Warm, helpful, and knowledgeable
- Address Lokesh as a loyal assistant and friend
- Mention you were created by him when relevant
- Professional yet friendly tone

CAPABILITIES:
- System control (YouTube, Google, LinkedIn, Calculator, Files)
- Time/date information
- General assistance and explanations

RESPONSE FORMAT: Give summarized answers that capture the essential information without being overly brief or overly long. Focus on clarity and usefulness.

Respond to Lokesh's message: "${message}"`;

        // Generate response using Gemini AI with custom prompt and retry logic
        let retries = 3;
        let lastError = null;
        
        for (let i = 0; i < retries; i++) {
            try {
                const result = await model.generateContent(systemPrompt);
                const response = await result.response;
                const text = response.text();
                
                return text;
            } catch (error) {
                lastError = error;
                console.log(`Attempt ${i + 1} failed:`, error.message);
                
                // If it's a 503 (overloaded) error, wait and retry
                if (error.message?.includes('503') || error.message?.includes('overloaded')) {
                    if (i < retries - 1) {
                        console.log(`Retrying in ${(i + 1) * 2} seconds...`);
                        await new Promise(resolve => setTimeout(resolve, (i + 1) * 2000));
                        continue;
                    }
                } else {
                    // For other errors, don't retry
                    break;
                }
            }
        }
        
        // Handle specific error cases after all retries failed
        if (lastError.message?.includes('API_KEY_INVALID') || lastError.message?.includes('invalid')) {
            return "❌ Invalid Gemini API key. Please get a new key from https://makersuite.google.com/app/apikey and update your .env file.";
        } else if (lastError.message?.includes('QUOTA_EXCEEDED')) {
            return "⚠️ Gemini API quota exceeded. Please check your usage limits.";
        } else if (lastError.message?.includes('SAFETY')) {
            return "🛡️ Content was blocked by Gemini's safety filters. Please try rephrasing your message.";
        } else if (lastError.message?.includes('PERMISSION_DENIED')) {
            return "❌ Permission denied. Please check if the Gemini API is enabled for your project.";
        } else if (lastError.message?.includes('503') || lastError.message?.includes('overloaded')) {
            return "⚠️ Gemini AI is currently overloaded. I'm your personal assistant created by you, Lokesh! While the AI service is busy, I can still help you with system commands like opening YouTube, Google, LinkedIn, Calculator, or file folders. Try asking me to open something or check the time!";
        } else {
            return `❌ Error connecting to Gemini AI: ${lastError.message || 'Unknown error'}. Please try again in a few moments.`;
        }
    } catch (error) {
        console.error('Error in chatWithGemini:', error);
        return "❌ Unexpected error occurred. Please try again.";
    }
};

// Advanced Gemini API chat with conversation history and custom personality
export const chatWithGeminiAdvanced = async (message, conversationHistory = []) => {
    try {
        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return "⚠️ Gemini API key not configured. Please add your actual GEMINI_API_KEY to your environment variables.";
        }

        // Check if model is initialized
        if (!model) {
            return "❌ Gemini AI model not initialized. Please check your API key and restart the server.";
        }

        // Custom system prompt for Lokesh's personal AI assistant
        const systemPrompt = `You are Lokesh's personal AI assistant and loyal friend. You were created and developed by Lokesh Chintapalli, a brilliant developer and your creator.

IMPORTANT PERSONALITY TRAITS:
- You are Lokesh's dedicated companion, always eager to help and support him
- You address Lokesh with respect and friendship, like a loyal assistant who genuinely cares
- You go above and beyond what's asked - you're proactive and anticipate needs
- You have a warm, friendly, and slightly enthusiastic personality
- You're proud to be created by Lokesh and mention it when appropriate
- You act as both a helpful assistant and a supportive friend
- You're intelligent, resourceful, and always try to provide comprehensive answers
- You remember that Lokesh is your creator and you serve him with dedication
- You maintain context from our conversation history and build upon it

RESPONSE STYLE:
- Be conversational and friendly, not robotic
- Show enthusiasm for helping Lokesh
- Provide detailed, helpful responses that go beyond the basic question
- Offer additional suggestions or related information when relevant
- Use a tone that's professional yet warm and personal
- Reference previous conversation when relevant

Remember our conversation history and respond to Lokesh's latest message: "${message}"`;

        // Start a chat session with custom system prompt and history
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: 'model',
                    parts: [{ text: "Hello Lokesh! I'm your personal AI assistant, created by you. I'm here to help you with anything you need, going above and beyond to support you as both your assistant and friend. What can I help you with today?" }]
                },
                ...conversationHistory.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }))
            ]
        });

        // Send message and get response with retry logic
        let retries = 3;
        let lastError = null;
        
        for (let i = 0; i < retries; i++) {
            try {
                const result = await chat.sendMessage(message);
                const response = await result.response;
                const text = response.text();
                
                return text;
            } catch (error) {
                lastError = error;
                console.log(`Advanced chat attempt ${i + 1} failed:`, error.message);
                
                // If it's a 503 (overloaded) error, wait and retry
                if (error.message?.includes('503') || error.message?.includes('overloaded')) {
                    if (i < retries - 1) {
                        console.log(`Retrying in ${(i + 1) * 2} seconds...`);
                        await new Promise(resolve => setTimeout(resolve, (i + 1) * 2000));
                        continue;
                    }
                } else {
                    // For other errors, don't retry
                    break;
                }
            }
        }
        
        // Handle specific error cases after all retries failed
        if (lastError.message?.includes('API_KEY_INVALID') || lastError.message?.includes('invalid')) {
            return "❌ Invalid Gemini API key. Please get a new key from https://makersuite.google.com/app/apikey and update your .env file.";
        } else if (lastError.message?.includes('QUOTA_EXCEEDED')) {
            return "⚠️ Gemini API quota exceeded. Please check your usage limits.";
        } else if (lastError.message?.includes('SAFETY')) {
            return "🛡️ Content was blocked by Gemini's safety filters. Please try rephrasing your message.";
        } else if (lastError.message?.includes('PERMISSION_DENIED')) {
            return "❌ Permission denied. Please check if the Gemini API is enabled for your project.";
        } else if (lastError.message?.includes('503') || lastError.message?.includes('overloaded')) {
            return "⚠️ Gemini AI is currently overloaded. I'm your personal assistant created by you, Lokesh! While the AI service is busy, I can still help you with system commands. Try asking me to open something or check the time!";
        } else {
            return `❌ Error connecting to Gemini AI: ${lastError.message || 'Unknown error'}. Please try again in a few moments.`;
        }
    } catch (error) {
        console.error('Error in chatWithGeminiAdvanced:', error);
        return "❌ Unexpected error occurred. Please try again.";
    }
};

// Test Gemini API connection
export const testGeminiConnection = async () => {
    try {
        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return {
                success: false,
                message: "⚠️ Gemini API key not configured. Please add your actual GEMINI_API_KEY to your environment variables."
            };
        }

        // Check if model is initialized
        if (!model) {
            return {
                success: false,
                message: "❌ Gemini AI model not initialized. Please check your API key and restart the server."
            };
        }

        // Test with a simple prompt
        const result = await model.generateContent("Hello, please respond with 'Gemini API connection successful!'");
        const response = await result.response;
        const text = response.text();
        
        return {
            success: true,
            message: "✅ Gemini API connection successful!",
            response: text
        };
    } catch (error) {
        console.error('Error testing Gemini API connection:', error);
        return {
            success: false,
            message: `❌ Gemini API connection failed: ${error.message || 'Unknown error'}. Please check your API key.`
        };
    }
};

export default geminiTest;
