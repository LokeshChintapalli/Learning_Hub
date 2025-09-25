// Test script for the new Document Summarizer + Chat implementation
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE = 'http://localhost:8080/api/doc';

async function testDocumentSummarizer() {
    console.log('🧪 Testing New Document Summarizer + Chat Implementation...\n');

    try {
        // Test 1: Create a simple test document
        const testContent = `
        This is a test document for the new Document Summarizer implementation.
        
        Key Features:
        1. MongoDB storage for documents and chunks
        2. Text chunking for large documents
        3. Iterative summarization (chunk → combine)
        4. Enhanced chat with keyword relevance retrieval
        5. REST API calls to Gemini
        
        Benefits:
        - Better handling of large documents
        - Persistent storage in MongoDB
        - More accurate chat responses through retrieval
        - Scalable architecture
        
        This implementation replaces the previous in-memory storage system
        with a robust MongoDB-based solution that can handle production workloads.
        `;

        fs.writeFileSync('test-doc.txt', testContent);
        console.log('✅ Created test document');

        // Test 2: Upload and summarize document
        console.log('\n📤 Testing document upload and summarization...');
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream('test-doc.txt'));

        const uploadResponse = await axios.post(`${API_BASE}/upload`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 30000
        });

        console.log('✅ Document uploaded successfully');
        console.log('📄 Document ID:', uploadResponse.data.docId);
        console.log('📝 Summary Preview:', uploadResponse.data.summary.substring(0, 100) + '...');

        const docId = uploadResponse.data.docId;

        // Test 3: Chat with document
        console.log('\n💬 Testing chat functionality...');
        
        const questions = [
            "What are the key features mentioned?",
            "What are the benefits of this implementation?"
        ];

        for (const question of questions) {
            console.log(`\n❓ Question: ${question}`);
            
            const chatResponse = await axios.post(`${API_BASE}/chat`, {
                docId: docId,
                question: question
            });

            console.log(`🤖 Answer: ${chatResponse.data.answer.substring(0, 150)}...`);
        }

        // Cleanup
        fs.unlinkSync('test-doc.txt');
        console.log('\n🧹 Cleaned up test files');

        console.log('\n🎉 Critical-path testing passed! New Document Summarizer implementation is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        
        console.log('\n🔧 Note: This test requires the backend server to be running on port 8080');
        console.log('Start the server with: npm run dev');
        
        // Cleanup on error
        if (fs.existsSync('test-doc.txt')) {
            fs.unlinkSync('test-doc.txt');
        }
    }
}

// Run the test
testDocumentSummarizer();
