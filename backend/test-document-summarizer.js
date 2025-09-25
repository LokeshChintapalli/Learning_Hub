// Test script for document summarization functionality
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE = 'http://localhost:8080';

// Create a test text file
const testContent = `
This is a test document for the AI document summarization system.

The document contains multiple paragraphs with various topics:

1. Introduction to AI Technology
Artificial Intelligence has revolutionized many industries by providing automated solutions to complex problems. Machine learning algorithms can process vast amounts of data and identify patterns that humans might miss.

2. Benefits of Document Summarization
Document summarization helps users quickly understand the key points of lengthy documents. This saves time and improves productivity in professional environments.

3. Implementation Details
The system uses advanced natural language processing techniques to extract the most important information from documents. It maintains the original context while condensing the content.

4. Future Applications
As AI technology continues to advance, document summarization will become even more accurate and useful across various domains including legal, medical, and academic fields.

Conclusion:
This technology represents a significant step forward in information processing and knowledge management.
`;

// Write test file
fs.writeFileSync('test-document.txt', testContent);

async function testDocumentSummarization() {
    try {
        console.log('🧪 Testing Document Summarization API...\n');

        // Create form data
        const formData = new FormData();
        formData.append('document', fs.createReadStream('test-document.txt'));

        // Test summarization endpoint
        console.log('📄 Sending document for summarization...');
        const response = await fetch(`${API_BASE}/api/document/summarize`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Document summarization successful!\n');
            
            console.log('📊 Document Metadata:');
            console.log(`- File: ${data.metadata.fileName}`);
            console.log(`- Size: ${(data.metadata.fileSize / 1024).toFixed(2)} KB`);
            console.log(`- Words: ${data.metadata.wordCount}`);
            console.log(`- Characters: ${data.metadata.characterCount}`);
            console.log(`- Processed: ${new Date(data.metadata.processedAt).toLocaleString()}\n`);
            
            console.log('✨ AI Generated Summary:');
            console.log('=' .repeat(50));
            console.log(data.summary);
            console.log('=' .repeat(50));
        } else {
            console.log('❌ Summarization failed:', data.error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        // Clean up test file
        if (fs.existsSync('test-document.txt')) {
            fs.unlinkSync('test-document.txt');
        }
    }
}

// Run the test
testDocumentSummarization();
