// Test the dual API key functions directly
import { sendPromptToGeminiFlash, sendPromptToGeminiFlashForLearnEnglish } from './backend/geminiClient.js';

async function testDualAPIKeys() {
    console.log('🧪 Testing Dual API Key Functions');
    console.log('=' .repeat(50));
    
    const testPrompt = "Say hello and introduce yourself as an AI assistant.";
    
    try {
        console.log('\n1️⃣ Testing Document Summarizer API Key (original)...');
        const docResult = await sendPromptToGeminiFlash(process.env.GEMINI_API_KEY, testPrompt);
        console.log('✅ Document Summarizer API Key working');
        console.log(`Response: ${docResult?.substring(0, 100)}...`);
    } catch (error) {
        console.log('❌ Document Summarizer API Key failed');
        console.log('Error:', error.message);
    }
    
    try {
        console.log('\n2️⃣ Testing Learn English API Key (dedicated)...');
        const learnResult = await sendPromptToGeminiFlashForLearnEnglish(testPrompt);
        console.log('✅ Learn English API Key working');
        console.log(`Response: ${learnResult?.substring(0, 100)}...`);
    } catch (error) {
        console.log('❌ Learn English API Key failed');
        console.log('Error:', error.message);
    }
    
    console.log('\n🔑 API Key Configuration:');
    console.log(`Document Summarizer: ${process.env.GEMINI_API_KEY ? 'Set' : 'Missing'}`);
    console.log(`Learn English: AIzaSyBEefkK8DJY4Jls9U4Z6CR6VbNlIgmPreE`);
}

testDualAPIKeys().catch(console.error);
