import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

console.log('=== Gemini API Setup Verification ===\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
console.log('1. Checking .env file...');
if (fs.existsSync(envPath)) {
    console.log('   ✅ .env file exists');
    
    // Read .env file content (safely)
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    console.log('   📄 .env file contents:');
    lines.forEach((line, index) => {
        if (line.trim() && !line.startsWith('#')) {
            const [key] = line.split('=');
            if (key === 'GEMINI_API_KEY') {
                console.log(`   Line ${index + 1}: GEMINI_API_KEY=***hidden***`);
            } else {
                console.log(`   Line ${index + 1}: ${line}`);
            }
        } else if (line.trim()) {
            console.log(`   Line ${index + 1}: ${line}`);
        }
    });
} else {
    console.log('   ❌ .env file does not exist');
    console.log('   📝 Please create a .env file in the backend folder');
}

console.log('\n2. Loading environment variables...');
dotenv.config();

console.log('3. Checking GEMINI_API_KEY...');
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.log('   ❌ GEMINI_API_KEY not found in environment');
    console.log('\n🔧 TO FIX THIS:');
    console.log('1. Get your API key from: https://makersuite.google.com/app/apikey');
    console.log('2. Create/edit backend/.env file');
    console.log('3. Add this line: GEMINI_API_KEY=your_actual_api_key_here');
    console.log('4. Restart your server');
} else if (apiKey === 'your_gemini_api_key_here') {
    console.log('   ⚠️  GEMINI_API_KEY is still the placeholder value');
    console.log('   📝 Please replace with your actual API key');
} else {
    console.log('   ✅ GEMINI_API_KEY is set');
    console.log('   📏 Length:', apiKey.length);
    console.log('   🔍 Format check:');
    
    if (apiKey.startsWith('AIza')) {
        console.log('      ✅ Starts with "AIza" (correct format)');
    } else {
        console.log('      ❌ Does not start with "AIza" (may be invalid)');
        console.log('      💡 Google AI API keys typically start with "AIza"');
    }
    
    if (apiKey.length >= 35) {
        console.log('      ✅ Length looks correct (35+ characters)');
    } else {
        console.log('      ❌ Length seems too short (should be 35+ characters)');
    }
}

console.log('\n=== End Verification ===');
