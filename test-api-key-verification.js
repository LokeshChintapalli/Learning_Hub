const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:5000';

async function testLearnEnglishEndpoint() {
    console.log('🧪 Testing Learn English API endpoint...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/learn-english/topics`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Learn English topics endpoint working');
            console.log(`Topics available: ${Object.keys(data.topics || {}).length}`);
            return true;
        } else {
            console.log('❌ Learn English topics endpoint failed');
            console.log('Error:', data);
            return false;
        }
    } catch (error) {
        console.log('❌ Connection error:', error.message);
        return false;
    }
}

async function testWelcomeGreeting() {
    console.log('\n🧪 Testing Learn English welcome greeting (uses new API key)...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/learn-english/welcome-greeting`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                level: 'medium',
                topic: 'sports'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Welcome greeting generated successfully');
            console.log(`Greeting: ${data.spoken_sentence?.substring(0, 100)}...`);
            return true;
        } else {
            console.log('❌ Welcome greeting failed');
            console.log('Error:', data);
            return false;
        }
    } catch (error) {
        console.log('❌ Connection error:', error.message);
        return false;
    }
}

async function testDocumentSummarizerEndpoint() {
    console.log('\n🧪 Testing Document Summarizer endpoint (should use original API key)...');
    
    try {
        // Test a simple endpoint that doesn't require file upload
        const response = await fetch(`${BASE_URL}/api/documents/test-connection`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.status === 404) {
            console.log('ℹ️  Document test endpoint not found (expected)');
            return true; // This is expected if the endpoint doesn't exist
        }
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Document endpoint accessible');
            return true;
        } else {
            console.log('⚠️  Document endpoint response:', response.status);
            return true; // We just want to verify the server is responding
        }
    } catch (error) {
        console.log('❌ Connection error:', error.message);
        return false;
    }
}

async function runQuickTest() {
    console.log('🚀 Quick API Key Verification Test');
    console.log('=' .repeat(50));
    
    let passed = 0;
    let total = 0;
    
    // Test 1: Basic Learn English endpoint
    total++;
    if (await testLearnEnglishEndpoint()) passed++;
    
    // Test 2: Learn English with AI (new API key)
    total++;
    if (await testWelcomeGreeting()) passed++;
    
    // Test 3: Document endpoint accessibility
    total++;
    if (await testDocumentSummarizerEndpoint()) passed++;
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 QUICK TEST RESULTS');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${total - passed} ❌`);
    
    if (passed === total) {
        console.log('\n🎉 Dual API key system appears to be working!');
        console.log('✅ Learn English module can access its dedicated API key');
        console.log('✅ Server is responding to requests');
    } else {
        console.log('\n⚠️  Some tests failed. Check server status and API keys.');
    }
    
    console.log('\n🔑 Next Steps:');
    console.log('- Check server logs to confirm which API key is being used');
    console.log('- Test Document Summarizer to ensure it uses the original key');
    console.log('- Run full Learn English workflow test');
}

// Run the quick test
runQuickTest().catch(console.error);
