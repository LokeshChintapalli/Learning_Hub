// Test script for Gemini integration
import { testGeminiConnection, chatWithGemini } from './geminiTest.js';
import dotenv from 'dotenv';

dotenv.config();

async function testGeminiIntegration() {
    console.log('🧪 Testing Gemini AI Integration...\n');
    
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
        console.log('❌ GEMINI_API_KEY not found in environment variables');
        console.log('📝 Please create a .env file with your Gemini API key');
        console.log('💡 Copy env-template.txt to .env and add your API key\n');
        return;
    }
    
    console.log('✅ GEMINI_API_KEY found in environment');
    console.log('🔑 API Key:', process.env.GEMINI_API_KEY.substring(0, 10) + '...\n');
    
    // Test connection
    console.log('🔗 Testing Gemini API connection...');
    const connectionTest = await testGeminiConnection();
    
    if (connectionTest.success) {
        console.log('✅ Connection successful!');
        console.log('🤖 Response:', connectionTest.response);
    } else {
        console.log('❌ Connection failed:', connectionTest.error);
        return;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Gemini Integration Test Complete!');
    console.log('✅ Your virtual assistant is ready to use');
    console.log('🚀 Start the server with: npm run dev');
    console.log('='.repeat(50));
}

// Run the test
testGeminiIntegration().catch(console.error);
