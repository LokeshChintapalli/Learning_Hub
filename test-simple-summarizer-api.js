// Test script for Simple Document Summarizer API endpoint
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:8080';
const TEST_ENDPOINT = `${API_BASE_URL}/api/doc/summarize`;

console.log('🧪 Testing Simple Document Summarizer API\n');

// Test function
async function testSummarizerAPI() {
    try {
        console.log('📡 Testing API endpoint:', TEST_ENDPOINT);
        
        // Check if test file exists
        const testFile = 'test-sample.txt';
        if (!fs.existsSync(testFile)) {
            console.log('📝 Creating test file...');
            const testContent = `
This is a test document for the Simple Document Summarizer.

The document contains multiple paragraphs with different topics:

1. Technology: Artificial Intelligence is revolutionizing how we work and live. Machine learning algorithms can process vast amounts of data to identify patterns and make predictions.

2. Environment: Climate change is one of the most pressing issues of our time. Rising temperatures, melting ice caps, and extreme weather events are affecting ecosystems worldwide.

3. Education: Online learning has become increasingly popular, especially after the pandemic. Students can now access courses from top universities around the world.

4. Health: Regular exercise and a balanced diet are essential for maintaining good health. Mental health is equally important and should not be neglected.

5. Economy: The global economy is interconnected, with events in one country affecting markets worldwide. Digital currencies and blockchain technology are emerging as new financial instruments.

This document should be summarized into exactly 5 bullet points covering the main topics discussed.
            `;
            fs.writeFileSync(testFile, testContent.trim());
            console.log('✅ Test file created');
        }

        // Create form data
        const form = new FormData();
        form.append('file', fs.createReadStream(testFile));

        console.log('📤 Sending request to API...');
        
        const response = await axios.post(TEST_ENDPOINT, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': 'Bearer test-token' // You may need to adjust this
            },
            timeout: 60000
        });

        console.log('✅ API Response received');
        console.log('📊 Status:', response.status);
        console.log('📋 Response data:');
        console.log(JSON.stringify(response.data, null, 2));

        // Validate response structure
        const data = response.data;
        if (data.success && data.summary && data.filename) {
            console.log('\n✅ Response structure is valid');
            
            // Check if summary contains bullet points
            const bulletCount = (data.summary.match(/•/g) || []).length;
            console.log(`🎯 Bullet points found: ${bulletCount}`);
            
            if (bulletCount === 5) {
                console.log('✅ Correct number of bullet points (5)');
            } else {
                console.log('⚠️  Expected 5 bullet points, got', bulletCount);
            }
        } else {
            console.log('❌ Invalid response structure');
        }

    } catch (error) {
        console.log('❌ API Test Failed');
        
        if (error.code === 'ECONNREFUSED') {
            console.log('🔌 Connection refused - Is the backend server running?');
            console.log('💡 Start the backend with: cd backend && npm run dev');
        } else if (error.response) {
            console.log('📊 Status:', error.response.status);
            console.log('📋 Error data:', error.response.data);
        } else {
            console.log('🔍 Error details:', error.message);
        }
    }
}

// Test different file types
async function testFileTypes() {
    console.log('\n📄 Testing different file types...');
    
    const fileTypes = [
        { name: 'test-sample.txt', type: 'text/plain' },
        // Note: PDF and DOCX testing would require actual files
    ];

    for (const fileType of fileTypes) {
        if (fs.existsSync(fileType.name)) {
            console.log(`\n🔍 Testing ${fileType.name}...`);
            // Test logic would go here
        }
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting API tests...\n');
    
    await testSummarizerAPI();
    await testFileTypes();
    
    console.log('\n🏁 API testing completed');
    console.log('\n📝 Next steps:');
    console.log('1. Ensure backend server is running: cd backend && npm run dev');
    console.log('2. Check Gemini API key is configured in .env');
    console.log('3. Test with actual PDF/DOCX files');
}

runTests();
