// Simple test script to verify document processing fixes
import fs from 'fs';
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

console.log('🧪 Testing Document Processing Fixes');
console.log('====================================\n');

// Create a simple test document
const testContent = `Test Document for Error Fix Verification

This is a simple test document to verify that the 500 error has been resolved.

Key Points:
- Document processing should work without errors
- Error handling should be improved
- User feedback should be more helpful

Conclusion:
This test document should be processed successfully by the enhanced document summarization system.`;

const testFilePath = './test-document.txt';

async function runTest() {
    try {
        // Create test file
        console.log('📝 Creating test document...');
        fs.writeFileSync(testFilePath, testContent);
        console.log('✅ Test document created');

        // Prepare form data
        const formData = new FormData();
        const fileBuffer = fs.readFileSync(testFilePath);
        const blob = new Blob([fileBuffer], { type: 'text/plain' });
        formData.append('document', blob, 'test-document.txt');

        console.log('\n🚀 Testing document summarization endpoint...');
        
        // Test the API
        const response = await fetch(`${API_BASE}/api/document/summarize`, {
            method: 'POST',
            body: formData
        });

        console.log(`📊 Response Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS: Document processed without 500 error!');
            console.log('\n📋 Response Summary:');
            console.log(`- Success: ${data.success}`);
            console.log(`- Session ID: ${data.sessionId ? 'Generated' : 'Missing'}`);
            console.log(`- Summary Length: ${data.summary ? data.summary.length : 0} characters`);
            console.log(`- Metadata: ${data.metadata ? 'Present' : 'Missing'}`);
            
            if (data.isPartial) {
                console.log(`⚠️ Partial Result: ${data.message}`);
            }
            
            console.log('\n📄 Summary Preview:');
            console.log(data.summary ? data.summary.substring(0, 200) + '...' : 'No summary');
            
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.log('❌ FAILED: Still getting error response');
            console.log(`Error: ${errorData.error}`);
            console.log(`Suggestion: ${errorData.suggestion || 'None provided'}`);
        }

    } catch (error) {
        console.log('❌ TEST FAILED with exception:');
        console.log(`Error: ${error.message}`);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Server appears to be offline. Please:');
            console.log('1. Start the backend server: npm run dev');
            console.log('2. Ensure it\'s running on port 5000');
            console.log('3. Run this test again');
        }
    } finally {
        // Cleanup
        try {
            fs.unlinkSync(testFilePath);
            console.log('\n🧹 Test file cleaned up');
        } catch (e) {
            // File might not exist, ignore
        }
    }
}

console.log('Starting test in 2 seconds...\n');
setTimeout(runTest, 2000);
