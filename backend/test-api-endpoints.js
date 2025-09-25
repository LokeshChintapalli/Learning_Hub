// Comprehensive API endpoint testing script
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:8080';

// Test data
const testFiles = {
    txt: {
        name: 'test-document.txt',
        content: `Document Summarization Test

This is a test document for API endpoint testing.

Key Features:
1. PDF Support - Extract text from PDF documents
2. DOCX Support - Extract text from Microsoft Word documents  
3. TXT Support - Handle plain text files
4. File Validation - Size and type checking
5. Session Management - Maintain conversation context

Technical Implementation:
- Uses Gemini API for AI processing
- Express.js backend with multer for file uploads
- React frontend with modern UI

Benefits:
- Saves time by quickly summarizing documents
- Enables interactive Q&A about content
- Supports multiple file formats
- Provides detailed metadata

This test document contains enough content to generate a meaningful summary and test the chat functionality.`
    },
    oversized: {
        name: 'oversized-test.txt',
        content: 'A'.repeat(11 * 1024 * 1024) // 11MB file to test size limit
    }
};

// Helper function to create test files
const createTestFiles = () => {
    console.log('📁 Creating test files...');
    
    // Create normal text file
    fs.writeFileSync(testFiles.txt.name, testFiles.txt.content);
    console.log(`✅ Created ${testFiles.txt.name}`);
    
    // Create oversized file for validation testing
    fs.writeFileSync(testFiles.oversized.name, testFiles.oversized.content);
    console.log(`✅ Created ${testFiles.oversized.name} (${(testFiles.oversized.content.length / 1024 / 1024).toFixed(1)}MB)`);
};

// Helper function to clean up test files
const cleanupTestFiles = () => {
    console.log('🧹 Cleaning up test files...');
    
    [testFiles.txt.name, testFiles.oversized.name].forEach(filename => {
        if (fs.existsSync(filename)) {
            fs.unlinkSync(filename);
            console.log(`🗑️ Deleted ${filename}`);
        }
    });
};

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

const logTest = (testName, passed, details = '') => {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${testName}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName}: ${details}`);
    }
    testResults.details.push({ testName, passed, details });
};

// Test 1: Server Health Check
const testServerHealth = async () => {
    console.log('\n🏥 Test 1: Server Health Check');
    console.log('=' .repeat(50));
    
    try {
        const response = await fetch(`${API_BASE}/api/assistant/test`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            logTest('Server Health Check', true);
        } else {
            logTest('Server Health Check', false, 'Server not responding correctly');
        }
    } catch (error) {
        logTest('Server Health Check', false, error.message);
    }
};

// Test 2: Document Upload and Summarization
const testDocumentSummarization = async () => {
    console.log('\n📄 Test 2: Document Upload and Summarization');
    console.log('=' .repeat(50));
    
    try {
        const formData = new FormData();
        formData.append('document', fs.createReadStream(testFiles.txt.name));

        const response = await fetch(`${API_BASE}/api/document/summarize`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success && data.summary && data.sessionId) {
            logTest('Document Upload', true);
            logTest('Summary Generation', true);
            logTest('Session Creation', true);
            logTest('Metadata Extraction', data.metadata ? true : false);
            
            console.log(`📊 Metadata: ${data.metadata.fileName}, ${data.metadata.wordCount} words`);
            console.log(`🆔 Session ID: ${data.sessionId}`);
            
            return data.sessionId; // Return for chat testing
        } else {
            logTest('Document Upload', false, data.error || 'Unknown error');
            return null;
        }
    } catch (error) {
        logTest('Document Upload', false, error.message);
        return null;
    }
};

// Test 3: Chat Functionality
const testChatFunctionality = async (sessionId) => {
    console.log('\n💬 Test 3: Chat Functionality');
    console.log('=' .repeat(50));
    
    if (!sessionId) {
        logTest('Chat Functionality', false, 'No session ID available');
        return;
    }
    
    const testQuestions = [
        "What are the key features mentioned in this document?",
        "How many benefits are listed?",
        "What technology is used for the backend?"
    ];
    
    for (const question of testQuestions) {
        try {
            const response = await fetch(`${API_BASE}/api/document/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    question: question
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success && data.answer) {
                logTest(`Chat Question: "${question.substring(0, 30)}..."`, true);
                console.log(`🤖 Answer: ${data.answer.substring(0, 100)}...`);
            } else {
                logTest(`Chat Question: "${question.substring(0, 30)}..."`, false, data.error);
            }
        } catch (error) {
            logTest(`Chat Question: "${question.substring(0, 30)}..."`, false, error.message);
        }
    }
};

// Test 4: Session Management
const testSessionManagement = async (sessionId) => {
    console.log('\n🗂️ Test 4: Session Management');
    console.log('=' .repeat(50));
    
    if (!sessionId) {
        logTest('Session Management', false, 'No session ID available');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/document/session/${sessionId}`);
        const data = await response.json();
        
        if (response.ok && data.success && data.metadata) {
            logTest('Session Retrieval', true);
            logTest('Conversation History', data.conversationHistory ? true : false);
            console.log(`📝 Conversation History: ${data.conversationHistory.length} messages`);
        } else {
            logTest('Session Retrieval', false, data.error);
        }
    } catch (error) {
        logTest('Session Retrieval', false, error.message);
    }
};

// Test 5: File Validation
const testFileValidation = async () => {
    console.log('\n🔒 Test 5: File Validation');
    console.log('=' .repeat(50));
    
    // Test oversized file
    try {
        const formData = new FormData();
        formData.append('document', fs.createReadStream(testFiles.oversized.name));

        const response = await fetch(`${API_BASE}/api/document/summarize`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok && data.error && data.error.includes('size')) {
            logTest('File Size Validation', true);
        } else {
            logTest('File Size Validation', false, 'Should reject oversized files');
        }
    } catch (error) {
        logTest('File Size Validation', false, error.message);
    }
    
    // Test invalid file type (create a fake image file)
    try {
        fs.writeFileSync('test-image.jpg', 'fake image content');
        
        const formData = new FormData();
        formData.append('document', fs.createReadStream('test-image.jpg'));

        const response = await fetch(`${API_BASE}/api/document/summarize`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok && data.error && (data.error.includes('type') || data.error.includes('Unsupported'))) {
            logTest('File Type Validation', true);
        } else {
            logTest('File Type Validation', false, 'Should reject invalid file types');
        }
        
        // Clean up fake image
        fs.unlinkSync('test-image.jpg');
    } catch (error) {
        logTest('File Type Validation', false, error.message);
    }
};

// Test 6: Error Handling
const testErrorHandling = async () => {
    console.log('\n⚠️ Test 6: Error Handling');
    console.log('=' .repeat(50));
    
    // Test missing file
    try {
        const response = await fetch(`${API_BASE}/api/document/summarize`, {
            method: 'POST',
            body: new FormData()
        });

        const data = await response.json();

        if (!response.ok && data.error && data.error.includes('No file')) {
            logTest('Missing File Error', true);
        } else {
            logTest('Missing File Error', false, 'Should return error for missing file');
        }
    } catch (error) {
        logTest('Missing File Error', false, error.message);
    }
    
    // Test invalid session ID for chat
    try {
        const response = await fetch(`${API_BASE}/api/document/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: 'invalid-session-id',
                question: 'Test question'
            })
        });

        const data = await response.json();

        if (!response.ok && data.error && data.error.includes('session')) {
            logTest('Invalid Session Error', true);
        } else {
            logTest('Invalid Session Error', false, 'Should return error for invalid session');
        }
    } catch (error) {
        logTest('Invalid Session Error', false, error.message);
    }
};

// Test 7: Legacy Endpoint Compatibility
const testLegacyEndpoint = async () => {
    console.log('\n🔄 Test 7: Legacy Endpoint Compatibility');
    console.log('=' .repeat(50));
    
    try {
        const formData = new FormData();
        formData.append('document', fs.createReadStream(testFiles.txt.name));
        formData.append('userQuery', 'What is this document about?');

        const response = await fetch(`${API_BASE}/api/document/analyze`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.answer) {
            logTest('Legacy Analyze Endpoint', true);
            console.log(`🤖 Legacy Response: ${data.answer.substring(0, 100)}...`);
        } else {
            logTest('Legacy Analyze Endpoint', false, data.error);
        }
    } catch (error) {
        logTest('Legacy Analyze Endpoint', false, error.message);
    }
};

// Main test runner
const runAllTests = async () => {
    console.log('🧪 COMPREHENSIVE API ENDPOINT TESTING');
    console.log('=' .repeat(60));
    console.log('Testing all document summarizer API endpoints...\n');
    
    // Create test files
    createTestFiles();
    
    try {
        // Run all tests
        await testServerHealth();
        const sessionId = await testDocumentSummarization();
        await testChatFunctionality(sessionId);
        await testSessionManagement(sessionId);
        await testFileValidation();
        await testErrorHandling();
        await testLegacyEndpoint();
        
        // Print final results
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('=' .repeat(60));
        console.log(`✅ Passed: ${testResults.passed}`);
        console.log(`❌ Failed: ${testResults.failed}`);
        console.log(`📈 Total: ${testResults.total}`);
        console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
        
        if (testResults.failed > 0) {
            console.log('\n❌ Failed Tests:');
            testResults.details
                .filter(test => !test.passed)
                .forEach(test => console.log(`   - ${test.testName}: ${test.details}`));
        }
        
        console.log('\n🎉 API Testing Complete!');
        
    } finally {
        // Clean up test files
        cleanupTestFiles();
    }
};

// Run the tests
runAllTests().catch(console.error);
