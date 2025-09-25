const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4000';
const TEST_USER_ID = 'test-user-topic-sync';

// Test different topics to ensure synchronization
const testTopics = [
    { topic: 'food', level: 'medium' },
    { topic: 'travel', level: 'easy' },
    { topic: 'technology', level: 'difficult' },
    { topic: 'health', level: 'medium' }
];

async function testTopicSynchronization() {
    console.log('🧪 Testing Topic Synchronization in Learn English Module...\n');

    for (const testData of testTopics) {
        console.log(`\n🔍 Testing Topic: ${testData.topic.toUpperCase()} (${testData.level} level)`);
        console.log('=' .repeat(60));

        try {
            // Test 1: Start session with specific topic
            console.log('1️⃣ Starting session...');
            const sessionResponse = await axios.post(`${BASE_URL}/api/learn-english/start-session`, {
                userId: TEST_USER_ID,
                level: testData.level,
                topic: testData.topic
            });
            
            const sessionId = sessionResponse.data.sessionId;
            console.log(`✅ Session started: ${sessionId}`);

            // Test 2: Welcome greeting should match topic
            console.log('2️⃣ Testing welcome greeting...');
            const welcomeResponse = await axios.post(`${BASE_URL}/api/learn-english/welcome-greeting`, {
                level: testData.level,
                topic: testData.topic
            });
            
            const welcomeMessage = welcomeResponse.data.spoken_sentence.toLowerCase();
            const topicMentioned = welcomeMessage.includes(testData.topic) || 
                                 welcomeMessage.includes(getTopicName(testData.topic).toLowerCase());
            
            if (topicMentioned) {
                console.log(`✅ Welcome message correctly mentions ${testData.topic}`);
                console.log(`   Preview: "${welcomeResponse.data.spoken_sentence.substring(0, 80)}..."`);
            } else {
                console.log(`❌ Welcome message doesn't mention ${testData.topic}`);
                console.log(`   Message: "${welcomeResponse.data.spoken_sentence}"`);
            }

            // Test 3: Practice sentence should be topic-relevant
            console.log('3️⃣ Testing practice sentence...');
            const practiceResponse = await axios.post(`${BASE_URL}/api/learn-english/practice-sentence`, {
                level: testData.level,
                topic: testData.topic
            });
            
            const practiceSentence = practiceResponse.data.spoken_sentence.toLowerCase();
            const topicKeywords = getTopicKeywords(testData.topic);
            const hasTopicKeyword = topicKeywords.some(keyword => 
                practiceSentence.includes(keyword.toLowerCase())
            );
            
            if (hasTopicKeyword) {
                console.log(`✅ Practice sentence is ${testData.topic}-related`);
                console.log(`   Sentence: "${practiceResponse.data.spoken_sentence}"`);
            } else {
                console.log(`❌ Practice sentence not ${testData.topic}-related`);
                console.log(`   Sentence: "${practiceResponse.data.spoken_sentence}"`);
                console.log(`   Expected keywords: ${topicKeywords.join(', ')}`);
            }

            // Test 4: AI conversation should stay on topic
            console.log('4️⃣ Testing AI conversation topic focus...');
            const conversationResponse = await axios.post(`${BASE_URL}/api/learn-english/process-message`, {
                sessionId: sessionId,
                message: `I want to talk about ${testData.topic}`
            });
            
            const aiResponse = conversationResponse.data.aiMessage.toLowerCase();
            const aiStaysOnTopic = aiResponse.includes(testData.topic) || 
                                 topicKeywords.some(keyword => 
                                     aiResponse.includes(keyword.toLowerCase())
                                 );
            
            if (aiStaysOnTopic) {
                console.log(`✅ AI conversation stays focused on ${testData.topic}`);
                console.log(`   AI Response: "${conversationResponse.data.aiMessage.substring(0, 80)}..."`);
            } else {
                console.log(`❌ AI conversation doesn't focus on ${testData.topic}`);
                console.log(`   AI Response: "${conversationResponse.data.aiMessage}"`);
            }

            // Test 5: End session
            console.log('5️⃣ Ending session...');
            await axios.post(`${BASE_URL}/api/learn-english/end-session`, {
                sessionId: sessionId
            });
            console.log('✅ Session ended successfully');

        } catch (error) {
            console.error(`❌ Error testing ${testData.topic}:`, error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
        }
    }

    console.log('\n🎉 Topic Synchronization Test Complete!');
    console.log('\n📋 Summary:');
    console.log('- Tested 4 different topics (food, travel, technology, health)');
    console.log('- Verified welcome messages mention correct topics');
    console.log('- Confirmed practice sentences are topic-relevant');
    console.log('- Ensured AI conversations stay focused on selected topics');
    console.log('- Validated session management works across different topics');
}

function getTopicName(topic) {
    const topicNames = {
        sports: "Sports & Fitness",
        business: "Business & Work", 
        travel: "Travel & Tourism",
        food: "Food & Cooking",
        technology: "Technology & Innovation",
        health: "Health & Wellness"
    };
    return topicNames[topic] || topic;
}

function getTopicKeywords(topic) {
    const keywords = {
        sports: ["football", "basketball", "tennis", "swimming", "gym", "exercise", "training", "competition"],
        business: ["meeting", "presentation", "project", "client", "deadline", "strategy", "marketing", "sales"],
        travel: ["vacation", "hotel", "flight", "passport", "sightseeing", "culture", "adventure", "destination"],
        food: ["recipe", "restaurant", "cooking", "ingredients", "cuisine", "flavor", "nutrition", "dining"],
        technology: ["computer", "software", "internet", "smartphone", "artificial intelligence", "innovation", "digital", "programming"],
        health: ["doctor", "medicine", "exercise", "nutrition", "mental health", "wellness", "symptoms", "treatment"]
    };
    return keywords[topic] || [];
}
if (require.main === module) {
    testTopicSynchronization();
}
module.exports = { testTopicSynchronization };
