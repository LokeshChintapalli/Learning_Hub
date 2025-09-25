const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_USER_ID = 'test-user-dual-api';

// Test data
const testData = {
    level: 'medium',
    topic: 'sports',
    userMessage: 'I love playing basketball with my friends',
    userSpeech: 'Basketball is my favorite sport to play',
    userText: 'I enjoys playing football every weekend'
};

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();
        return {
            status: response.status,
            data: data,
            success: response.ok
        };
    } catch (error) {
        return {
            status: 0,
            data: { error: error.message },
            success: false
        };
    }
}

// Test functions
async function testStartSession() {
    console.log('\n🧪 Testing /api/learn-english/start-session...');
    
    const result = await makeRequest('/api/learn-english/start-session', 'POST', {
        userId: TEST_USER_ID,
        level: testData.level,
        topic: testData.topic
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
        console.log('✅ Session started successfully');
        console.log(`Session ID: ${result.data.sessionId}`);
        console.log(`AI Message: ${result.data.aiMessage?.substring(0, 100)}...`);
        return result.data.sessionId;
    } else {
        console.log('❌ Session start failed');
        console.log('Error:', result.data);
        return null;
    }
}

async function testProcessMessage(sessionId) {
    console.log('\n🧪 Testing /api/learn-english/process-message...');
    
    const result = await makeRequest('/api/learn-english/process-message', 'POST', {
        sessionId: sessionId,
        message: testData.userMessage
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
        console.log('✅ Message processed successfully');
        console.log(`AI Response: ${result.data.aiMessage?.substring(0, 100)}...`);
        console.log(`Analysis provided: ${result.data.analysis ? 'Yes' : 'No'}`);
        console.log(`Session stats updated: ${result.data.sessionStats ? 'Yes' : 'No'}`);
    } else {
        console.log('❌ Message processing failed');
        console.log('Error:', result.data);
    }
    
    return result.success;
}

async function testWelcomeGreeting() {
    console.log('\n🧪 Testing /api/learn-english/welcome-greeting...');
    
    const result = await makeRequest('/api/learn-english/welcome-greeting', 'POST', {
        level: testData.level,
        topic: testData.topic
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
        console.log('✅ Welcome greeting generated successfully');
        console.log(`Greeting: ${result.data.spoken_sentence?.substring(0, 100)}...`);
        console.log(`Feedback: ${result.data.feedback}`);
    } else {
        console.log('❌ Welcome greeting failed');
        console.log('Error:', result.data);
    }
    
    return result.success;
}

async function testPracticeSentence() {
    console.log('\n🧪 Testing /api/learn-english/practice-sentence...');
    
    const result = await makeRequest('/api/learn-english/practice-sentence', 'POST', {
        level: testData.level,
        topic: testData.topic
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
        console.log('✅ Practice sentence generated successfully');
        console.log(`Sentence: ${result.data.spoken_sentence}`);
        console.log(`Expected pronunciation: ${result.data.expected_pronunciation}`);
    } else {
        console.log('❌ Practice sentence failed');
        console.log('Error:', result.data);
    }
    
    return result.success;
}

async function testAssessPronunciation() {
    console.log('\n🧪 Testing /api/learn-english/assess-pronunciation...');
    
    const result = await makeRequest('/api/learn-english/assess-pronunciation', 'POST', {
        userSpeech: testData.userSpeech,
        expectedSentence: 'Basketball is a popular sport worldwide',
        level: testData.level
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
        console.log('✅ Pronunciation assessed successfully');
        console.log(`Feedback: ${result.data.spoken_sentence}`);
        console.log(`Assessment: ${result.data.feedback}`);
    } else {
        console.log('❌ Pronunciation assessment failed');
        console.log('Error:', result.data);
    }
    
    return result.success;
}

async function testGrammarVocabularyReview() {
    console.log('\n🧪 Testing /api/learn-english/grammar-vocabulary-review...');
    
    const result = await makeRequest('/api/learn-english/grammar-vocabulary-review', 'POST', {
        userText: testData.userText,
        level: testData.level,
        topic: testData.topic
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
        console.log('✅ Grammar & vocabulary reviewed successfully');
        console.log(`Feedback: ${result.data.spoken_sentence}`);
        console.log(`Grammar corrections: ${result.data.grammar_corrections?.length || 0}`);
        console.log(`Vocabulary suggestions: ${result.data.vocabulary_suggestions?.length || 0}`);
    } else {
        console.log('❌ Grammar & vocabulary review failed');
        console.log('Error:', result.data);
    }
    
    return result.success;
}

async function testSessionFeedback(sessionId) {
    console.log('\n🧪 Testing /api/learn-english/session-feedback...');
    
    const result = await makeRequest('/api/learn-english/session-feedback', 'POST', {
        sessionId: sessionId
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
        console.log('✅ Session feedback generated successfully');
        console.log(`Feedback: ${result.data.spoken_sentence?.substring(0, 100)}...`);
        console.log(`Overall score: ${result.data.feedback?.overall_score || 'N/A'}`);
    } else {
        console.log('❌ Session feedback failed');
        console.log('Error:', result.data);
    }
    
    return result.success;
}

async function testEndSession(sessionId) {
    console.log('\n🧪 Testing /api/learn-english/end-session...');
    
    const result = await makeRequest('/api/learn-english/end-session', 'POST', {
        sessionId: sessionId
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
        console.log('✅ Session ended successfully');
        console.log(`Session stats: ${result.data.sessionStats ? 'Provided' : 'Missing'}`);
        console.log(`User progress: ${result.data.userProgress ? 'Updated' : 'Missing'}`);
    } else {
        console.log('❌ Session end failed');
        console.log('Error:', result.data);
    }
    
    return result.success;
}

async function testGetProgress() {
    console.log('\n🧪 Testing /api/learn-english/progress/:userId...');
    
    const result = await makeRequest(`/api/learn-english/progress/${TEST_USER_ID}`, 'GET');
    
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
        console.log('✅ Progress retrieved successfully');
        console.log(`Progress data: ${result.data.progress ? 'Available' : 'Missing'}`);
        console.log(`Topics data: ${result.data.topics ? 'Available' : 'Missing'}`);
    } else {
        console.log('❌ Progress retrieval failed');
        console.log('Error:', result.data);
    }
    
    return result.success;
}

async function testGetTopics() {
    console.log('\n🧪 Testing /api/learn-english/topics...');
    
    const result = await makeRequest('/api/learn-english/topics', 'GET');
    
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
        console.log('✅ Topics retrieved successfully');
        console.log(`Topics count: ${Object.keys(result.data.topics || {}).length}`);
    } else {
        console.log('❌ Topics retrieval failed');
        console.log('Error:', result.data);
    }
    
    return result.success;
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Learn English Module API Tests with Dual API Key System');
    console.log('=' .repeat(70));
    
    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };
    
    // Test 1: Start Session (creates session for other tests)
    results.total++;
    const sessionId = await testStartSession();
    if (sessionId) {
        results.passed++;
    } else {
        results.failed++;
        console.log('\n❌ Cannot continue with session-dependent tests');
        return;
    }
    
    // Test 2: Process Message
    results.total++;
    const processSuccess = await testProcessMessage(sessionId);
    if (processSuccess) results.passed++; else results.failed++;
    
    // Test 3: Welcome Greeting
    results.total++;
    const welcomeSuccess = await testWelcomeGreeting();
    if (welcomeSuccess) results.passed++; else results.failed++;
    
    // Test 4: Practice Sentence
    results.total++;
    const practiceSuccess = await testPracticeSentence();
    if (practiceSuccess) results.passed++; else results.failed++;
    
    // Test 5: Assess Pronunciation
    results.total++;
    const pronunciationSuccess = await testAssessPronunciation();
    if (pronunciationSuccess) results.passed++; else results.failed++;
    
    // Test 6: Grammar & Vocabulary Review
    results.total++;
    const grammarSuccess = await testGrammarVocabularyReview();
    if (grammarSuccess) results.passed++; else results.failed++;
    
    // Test 7: Session Feedback
    results.total++;
    const feedbackSuccess = await testSessionFeedback(sessionId);
    if (feedbackSuccess) results.passed++; else results.failed++;
    
    // Test 8: End Session
    results.total++;
    const endSuccess = await testEndSession(sessionId);
    if (endSuccess) results.passed++; else results.failed++;
    
    // Test 9: Get Progress
    results.total++;
    const progressSuccess = await testGetProgress();
    if (progressSuccess) results.passed++; else results.failed++;
    
    // Test 10: Get Topics
    results.total++;
    const topicsSuccess = await testGetTopics();
    if (topicsSuccess) results.passed++; else results.failed++;
    
    // Summary
    console.log('\n' + '=' .repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(70));
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed} ✅`);
    console.log(`Failed: ${results.failed} ❌`);
    console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
    
    if (results.failed === 0) {
        console.log('\n🎉 All Learn English Module API endpoints are working correctly with the new dedicated API key!');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the API implementation and ensure the server is running.');
    }
    
    console.log('\n🔑 API Key Verification:');
    console.log('- Learn English Module endpoints should be using the dedicated API key');
    console.log('- Check server logs to confirm API key usage');
}

// Run the tests
runTests().catch(console.error);
