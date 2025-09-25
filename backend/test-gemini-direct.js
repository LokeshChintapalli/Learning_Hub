import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testGeminiAPI() {
    console.log('=== Direct Gemini API Test ===');
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.log('❌ No API key found in environment variables');
        console.log('Please check your .env file contains: GEMINI_API_KEY=your_key_here');
        return;
    }
    
    console.log('✅ API key found, length:', apiKey.length);
    console.log('Key preview:', apiKey.substring(0, 10) + '...');
    
    try {
        console.log('🔄 Initializing Gemini AI...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        console.log('🔄 Sending test message...');
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ Success! Gemini responded:', text);
        
    } catch (error) {
        console.log('❌ Error:', error.message);
        
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid')) {
            console.log('🔧 This means your API key is invalid or expired');
            console.log('📝 Steps to fix:');
            console.log('1. Go to https://makersuite.google.com/app/apikey');
            console.log('2. Create a new API key');
            console.log('3. Update your .env file with the new key');
        } else if (error.message.includes('PERMISSION_DENIED')) {
            console.log('🔧 Permission denied - check if Gemini API is enabled for your project');
        } else {
            console.log('🔧 Full error details:', error);
        }
    }
}

testGeminiAPI();
