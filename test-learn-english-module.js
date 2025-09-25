const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4000';
const TEST_USER_ID = 'test-user-123';

// Test data
const testData = {
    level: 'medium',
    topic: 'sports'
};

async function testLearnEnglishModule() {
    console.log('🧪 Testing Learn English Module Integration...\n');

    try {
        // Test 1: Get available topics
        console.log('1️⃣ Testing: Get Available Topics');
        const topicsResponse = await axios.get(`${BASE_URL}/api/learn-english/topics`);
        console.log('✅ Topics retrieved successfully');
        console.log('Available topics:', Object.keys(topicsResponse.data.topics));
        console.log('');

        // Test 2: Get user progress
        console.log('2️⃣ Testing: Get User Progress');
        const progressResponse = await axios.get(`${BASE_URL}/api/learn-english/progress/${TEST_USER_ID}`);
        console.log('✅ User progress retrieved successfully');
        console.log('Progress data structure:', Object.keys(progressResponse.data.progress));
        console.log('');

        // Test 3: Start a new session
        console.log('3️⃣ Testing: Start New Session');
        const sessionResponse = await axios.post(`${BASE_URL}/api/learn-english/start-session`, {
            userId: TEST_USER_ID,
            level: testData.level,
            topic: testData.topic
        });
        console.log('✅ Session started successfully');
        console.log('Session ID:', sessionResponse.data.sessionId);
        const sessionId = sessionResponse.data.sessionId;
        console.log('');

        // Test 4: Welcome greeting (ModuleFlow Step 1)
        console.log('4️⃣ Testing: Welcome Greeting (Step 1)');
        const welcomeResponse = await axios.post(`${BASE_URL}/api/learn-english/welcome-greeting`, {
            level: testData.level,
            topic: testData.topic
        });
        console.log('✅ Welcome greeting generated successfully');
        console.log('Welcome message:', welcomeResponse.data.spoken_sentence.substring(0, 100) + '...');
        console.log('');

        // Test 5: Practice sentence (ModuleFlow Step 2)
        console.log('5️⃣ Testing: Practice Sentence (Step 2)');
        const practiceResponse = await axios.post(`${BASE_URL}/api/learn-english/practice-sentence`, {
            level: testData.level,
            topic: testData.topic
        });
        console.log('✅ Practice sentence generated successfully');
        console.log('Practice sentence:', practiceResponse.data.spoken_sentence);
        console.log('');

        // Test 6: Pronunciation assessment (ModuleFlow Step 2)
        console.log('6️⃣ Testing: Pronunciation Assessment');
        const pronunciationResponse = await axios.post(`${BASE_URL}/api/learn-english/assess-pronunciation`, {
            userSpeech: "I love playing football with my friends",
            expectedSentence: practiceResponse.data.spoken_sentence,
            level: testData.level
        });
        console.log('✅ Pronunciation assessment completed successfully');
        console.log('Assessment feedback:', pronunciationResponse.data.spoken_sentence);
        console.log('');

        // Test 7: Grammar and vocabulary review (ModuleFlow Step 3)
        console.log('7️⃣ Testing: Grammar & Vocabulary Review (Step 3)');
        const grammarResponse = await axios.post(`${BASE_URL}/api/learn-english/grammar-vocabulary-review`, {
            userText: "I thinks football is very good sport for health and make friends",
            level: testData.level,
            topic: testData.topic
        });
        console.log('✅ Grammar & vocabulary review completed successfully');
        console.log('Grammar corrections:', grammarResponse.data.grammar_corrections.length);
        console.log('Vocabulary suggestions:', grammarResponse.data.vocabulary_suggestions.length);
        console.log('');

        // Test 8: Process conversation message
        console.log('8️⃣ Testing: AI Conversation (Step 4)');
        const conversationResponse = await axios.post(`${BASE_URL}/api/learn-english/process-message`, {
            sessionId: sessionId,
            message: "I really enjoy playing football because it keeps me fit and I can play with my team"
        });
        console.log('✅ Conversation message processed successfully');
        console.log('AI response:', conversationResponse.data.aiMessage.substring(0, 100) + '...');
        console.log('Analysis provided:', Object.keys(conversationResponse.data.analysis));
        console.log('');

        // Test 9: Session feedback (ModuleFlow Step 5)
        console.log('9️⃣ Testing: Session Feedback (Step 5)');
        const feedbackResponse = await axios.post(`${BASE_URL}/api/learn-english/session-feedback`, {
            sessionId: sessionId
        });
        console.log('✅ Session feedback generated successfully');
        console.log('Final feedback:', feedbackResponse.data.spoken_sentence.substring(0, 100) + '...');
        console.log('Overall feedback structure:', Object.keys(feedbackResponse.data.feedback));
        console.log('');

        // Test 10: End session
        console.log('🔟 Testing: End Session');
        const endResponse = await axios.post(`${BASE_URL}/api/learn-english/end-session`, {
            sessionId: sessionId
        });
        console.log('✅ Session ended successfully');
        console.log('Final session stats:', Object.keys(endResponse.data.sessionStats));
        console.log('');

        // Summary
        console.log('🎉 ALL TESTS PASSED! Learn English Module is working correctly!\n');
        console.log('📊 Test Summary:');
        console.log('✅ Topics API - Working');
        console.log('✅ User Progress API - Working');
        console.log('✅ Session Management - Working');
        console.log('✅ ModuleFlow Step 1 (Welcome) - Working');
        console.log('✅ ModuleFlow Step 2 (Practice & Assessment) - Working');
        console.log('✅ ModuleFlow Step 3 (Grammar & Vocabulary) - Working');
        console.log('✅ ModuleFlow Step 4 (AI Conversation) - Working');
        console.log('✅ ModuleFlow Step 5 (Session Summary) - Working');
        console.log('✅ Session Completion - Working');
        console.log('');
        console.log('🚀 The Learn English module is ready for use!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        console.log('\n🔧 Make sure:');
        console.log('1. Backend server is running on port 8080');
        console.log('2. MongoDB is connected');
        console.log('3. GEMINI_API_KEY is set in environment variables');
        console.log('4. All dependencies are installed');
    }
}

// Run the test
if (require.main === module) {
    testLearnEnglishModule();
}

module.exports = { testLearnEnglishModule };
