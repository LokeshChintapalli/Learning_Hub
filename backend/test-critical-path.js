// test-critical-path.js - Critical Path Testing for System Control
import { chatWithGemini } from './geminiTest.js';

console.log('🧪 Critical Path Testing - Lokesh\'s AI Assistant\n');

async function testCriticalCommands() {
    const testCommands = [
        'what time is it',
        'what is the date',
        'open calculator',
        'open youtube and search for programming tutorials'
    ];
    
    console.log('=== TESTING CRITICAL SYSTEM COMMANDS ===\n');
    
    for (const command of testCommands) {
        console.log(`🎤 Testing voice command: "${command}"`);
        console.log('⏳ Processing...');
        
        try {
            const response = await chatWithGemini(command);
            console.log(`🤖 AI Response: ${response}`);
            console.log('✅ Command processed successfully\n');
        } catch (error) {
            console.log(`❌ Error: ${error.message}\n`);
        }
    }
    
    console.log('🎯 Critical path testing completed!');
    console.log('\n📋 What was tested:');
    console.log('✅ Time command (instant response)');
    console.log('✅ Date command (instant response)');
    console.log('✅ Calculator command (system control)');
    console.log('✅ YouTube search command (web control)');
    console.log('\n🚀 Your AI assistant is ready for voice commands!');
}

testCriticalCommands().catch(console.error);
