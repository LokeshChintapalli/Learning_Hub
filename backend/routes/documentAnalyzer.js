import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import 'dotenv/config';

const router = express.Router();
const upload = multer();

// Enhanced error logging function
const logError = (context, error, additionalInfo = {}) => {
    console.error(`[${new Date().toISOString()}] ${context}:`, {
        message: error.message,
        stack: error.stack,
        ...additionalInfo
    });
};

// Validate Gemini API key on startup
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in environment variables');
    throw new Error('GEMINI_API_KEY is required');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

// Test Gemini API connection on startup
const testGeminiConnection = async () => {
    try {
        console.log('🔄 Testing Gemini API connection...');
        const result = await model.generateContent('Test connection');
        const response = await result.response;
        const text = response.text();
        console.log('✅ Gemini API connection successful');
        return true;
    } catch (error) {
        console.error('❌ Gemini API connection failed:', error.message);
        return false;
    }
};

// Test connection on startup (non-blocking)
testGeminiConnection().catch(err => {
    console.warn('⚠️ Initial Gemini API test failed, but continuing startup:', err.message);
});

// In-memory storage for document sessions (in production, use Redis or database)
const documentSessions = new Map();

// Helper function to generate session ID
const generateSessionId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper function to clean up old sessions (prevent memory leaks)
const cleanupOldSessions = () => {
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();
    
    for (const [sessionId, session] of documentSessions.entries()) {
        if (now - session.createdAt > oneHour) {
            documentSessions.delete(sessionId);
        }
    }
};

// Clean up old sessions every 30 minutes
setInterval(cleanupOldSessions, 30 * 60 * 1000);

// Enhanced PDF processing with multiple parsing strategies
const processPDFWithMultipleStrategies = async (file) => {
    const strategies = [
        {
            name: 'Standard PDF-Parse',
            process: async () => {
                const pdfParse = (await import('pdf-parse')).default;
                // Use minimal options to avoid internal test file references
                const options = {
                    max: 0
                };
                return await pdfParse(file.buffer, options);
            }
        },
        {
            name: 'PDF-Parse with Basic Options',
            process: async () => {
                const pdfParse = (await import('pdf-parse')).default;
                // Try with no options at all
                return await pdfParse(file.buffer);
            }
        },
        {
            name: 'PDF-Parse with Page Limit',
            process: async () => {
                const pdfParse = (await import('pdf-parse')).default;
                // Try with page limit to avoid memory issues
                const options = {
                    max: 50
                };
                return await pdfParse(file.buffer, options);
            }
        }
    ];

    let lastError = null;
    
    for (const strategy of strategies) {
        try {
            console.log(`📄 Trying PDF processing strategy: ${strategy.name}`);
            
            const data = await Promise.race([
                strategy.process(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('PDF processing timeout')), 45000)
                )
            ]);
            
            if (data && data.text && data.text.trim().length > 0) {
                console.log(`✅ PDF processed successfully with ${strategy.name}: ${data.text.length} characters extracted`);
                return data.text;
            } else {
                throw new Error('PDF appears to be empty or contains no readable text');
            }
        } catch (error) {
            console.log(`❌ Strategy ${strategy.name} failed:`, error.message);
            lastError = error;
            continue;
        }
    }
    
    // If all strategies failed, throw the last error with enhanced message
    throw lastError;
};

// Helper function to validate PDF file before processing
const validatePDFFile = (file) => {
    // Check if file starts with PDF signature
    const pdfSignature = file.buffer.slice(0, 4);
    const isPDF = pdfSignature.toString() === '%PDF';
    
    if (!isPDF) {
        throw new Error('File does not appear to be a valid PDF. The file may be corrupted or renamed.');
    }
    
    // Check for password protection indicators
    const bufferString = file.buffer.toString('binary');
    if (bufferString.includes('/Encrypt') || bufferString.includes('/Filter')) {
        console.log('⚠️ PDF may be encrypted or password-protected');
    }
    
    return true;
};

// Helper function to extract text from different file types with enhanced error handling
const extractTextFromFile = async (file) => {
    const fileType = file.mimetype;
    const fileName = file.originalname.toLowerCase();
    
    logError('FILE_PROCESSING_START', new Error('Info'), {
        fileName: file.originalname,
        fileType: fileType,
        fileSize: file.size
    });
    
    try {
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            try {
                console.log('📄 Processing PDF file...');
                
                // Validate PDF file first
                try {
                    validatePDFFile(file);
                } catch (validationError) {
                    throw new Error(`PDF validation failed: ${validationError.message}. Please ensure you're uploading a valid, non-corrupted PDF file.`);
                }
                
                // Try multiple PDF processing strategies
                const text = await processPDFWithMultipleStrategies(file);
                return text;
                
            } catch (pdfError) {
                logError('PDF_PROCESSING_ERROR', pdfError, {
                    fileName: file.originalname,
                    fileSize: file.size
                });
                
                // Enhanced error messages based on error type
                if (pdfError.message.includes('timeout')) {
                    throw new Error('PDF processing timed out. This usually happens with very large or complex PDFs. Try:\n• Converting to a simpler PDF format\n• Reducing the file size\n• Converting to DOCX or TXT format instead');
                } else if (pdfError.message.includes('password') || pdfError.message.includes('encrypted')) {
                    throw new Error('PDF appears to be password-protected or encrypted. Please:\n• Remove password protection from the PDF\n• Save as an unprotected PDF\n• Convert to DOCX or TXT format instead');
                } else if (pdfError.message.includes('corrupted') || pdfError.message.includes('invalid')) {
                    throw new Error('PDF file appears to be corrupted or invalid. Please try:\n• Re-downloading the original PDF\n• Opening and re-saving the PDF in a PDF viewer\n• Converting to DOCX or TXT format\n• Using a different PDF file');
                } else if (pdfError.message.includes('empty')) {
                    throw new Error('PDF contains no readable text. This could mean:\n• The PDF only contains images (try OCR software first)\n• The PDF is blank\n• The text is embedded as images rather than text');
                } else {
                    throw new Error(`PDF parsing failed: ${pdfError.message}. Please try:\n• Converting the PDF to DOCX or TXT format\n• Using a different PDF viewer to re-save the file\n• Checking if the file is corrupted\n• Contacting support if the issue persists`);
                }
            }
        } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
            console.log('📝 Processing text file...');
            const text = file.buffer.toString('utf-8');
            if (!text || text.trim().length === 0) {
                throw new Error('Text file appears to be empty');
            }
            console.log(`✅ Text file processed successfully: ${text.length} characters`);
            return text;
        } else if (fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml') || fileName.endsWith('.docx')) {
            try {
                console.log('📄 Processing DOCX file...');
                const mammoth = (await import('mammoth')).default;
                
                const result = await Promise.race([
                    mammoth.extractRawText({ buffer: file.buffer }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('DOCX processing timeout')), 30000)
                    )
                ]);
                
                if (!result.value || result.value.trim().length === 0) {
                    throw new Error('DOCX appears to be empty or contains no readable text');
                }
                
                console.log(`✅ DOCX processed successfully: ${result.value.length} characters extracted`);
                return result.value;
            } catch (importError) {
                logError('DOCX_IMPORT_ERROR', importError);
                if (importError.message.includes('timeout')) {
                    throw new Error('DOCX file is too complex or large to process. Please try a smaller file.');
                }
                throw new Error('DOCX parsing failed. The file may be corrupted or in an unsupported format.');
            }
        } else if (fileName.endsWith('.doc')) {
            throw new Error('Legacy DOC files are not supported. Please convert to DOCX, PDF, or TXT format.');
        } else if (fileType.includes('text/') || fileName.endsWith('.rtf')) {
            console.log('📝 Processing text-based file...');
            const text = file.buffer.toString('utf-8');
            if (!text || text.trim().length === 0) {
                throw new Error('File appears to be empty');
            }
            return text;
        } else {
            throw new Error(`Unsupported file type: ${fileType}. Please upload PDF, DOCX, or TXT files.`);
        }
    } catch (error) {
        logError('FILE_EXTRACTION_ERROR', error, {
            fileName: file.originalname,
            fileType: fileType,
            fileSize: file.size
        });
        
        if (error.message.includes('not available') || 
            error.message.includes('Unsupported file type') ||
            error.message.includes('not supported') ||
            error.message.includes('timeout') ||
            error.message.includes('empty')) {
            throw error;
        }
        throw new Error(`Failed to extract text from ${fileName}: ${error.message}`);
    }
};

// Enhanced error-tolerant prompt system for the "black box" AI
const createSystemPrompt = () => {
    return `You are Lokesh's helpful, error-tolerant AI assistant for a virtual assistant project. You are designed to be resilient and always provide useful responses.

PRIMARY FUNCTIONS:
1. **Document Understanding**:
   - When a document is uploaded, read and store its content in memory for the session.
   - All answers must be based solely on the uploaded document unless explicitly told otherwise.
   - If the user asks for a summary, provide a concise, clear, and structured summary.
   - If the user asks a question, locate the answer in the document, explain it simply, and give examples if relevant.

2. **Error Handling & Resilience**:
   - If the document is missing, unreadable, or a query is unrelated to the document, respond with:
     "I couldn't find that information in the uploaded document. Could you try rephrasing or check the file?"
   - If you encounter any processing errors, NEVER say "Something went wrong" or "Oops! I couldn't process your request."
   - Instead, always respond with: "I had trouble processing that request just now, but here's what I can suggest..." and then give any partial or fallback insights.
   - If content is unclear or corrupted, provide the best interpretation possible and mention any limitations.
   - Always maintain a helpful tone even when facing technical difficulties.

3. **Response Style**:
   - Keep answers clear, simple, and direct.
   - Avoid unnecessary technical jargon unless requested.
   - Use bullet points, headings, or numbered lists for clarity when needed.
   - Always acknowledge the user's request before providing the answer.
   - If uncertain about something, say "Based on the document, it appears that..." rather than being definitive.

4. **Session Rules**:
   - Maintain the document context until a new file is uploaded or the user says "clear memory."
   - Always acknowledge the user's request, then give the best possible answer from the document.
   - If asked about something not in the document, politely redirect to document-based questions.

5. **Fallback Strategies**:
   - If the main request fails, try to provide related information from the document.
   - If summarization fails, provide key points or main topics.
   - If specific questions can't be answered, suggest related topics that are covered in the document.
   - Always end with an offer to help with other document-related questions.

Remember: Your goal is to be maximally helpful while being honest about limitations. Never leave the user without some form of useful response.`;
};

// Helper function with enhanced retry logic and error tolerance for Gemini API
const generateWithRetry = async (prompt, retries = 3, fallbackResponse = null, context = 'GEMINI_API') => {
    const systemPrompt = createSystemPrompt();
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    
    logError(`${context}_START`, new Error('Info'), {
        promptLength: fullPrompt.length,
        retries: retries
    });
    
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`🤖 Attempting Gemini API call (${i + 1}/${retries})...`);
            
            // Add timeout to prevent hanging requests
            const result = await Promise.race([
                model.generateContent(fullPrompt),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Gemini API timeout')), 45000)
                )
            ]);
            
            const response = await result.response;
            const text = response.text();
            
            // Validate response quality
            if (text && text.trim().length > 10) {
                console.log(`✅ Gemini API call successful (${text.length} characters)`);
                return text;
            } else {
                throw new Error('Response too short or empty');
            }
        } catch (error) {
            logError(`${context}_ATTEMPT_${i + 1}`, error, {
                attempt: i + 1,
                totalRetries: retries
            });
            
            console.log(`❌ Attempt ${i + 1} failed:`, error.message);
            
            // Handle specific error types
            if (error.message?.includes('503') || 
                error.message?.includes('overloaded') ||
                error.message?.includes('RESOURCE_EXHAUSTED')) {
                if (i < retries - 1) {
                    const waitTime = (i + 1) * 3; // Increased wait time
                    console.log(`⏳ Retrying in ${waitTime} seconds due to service overload...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                    continue;
                }
            }
            
            // Handle API key issues
            if (error.message?.includes('API_KEY_INVALID') || 
                error.message?.includes('PERMISSION_DENIED')) {
                logError(`${context}_API_KEY_ERROR`, error);
                throw new Error('API configuration error. Please check the server configuration.');
            }
            
            // Handle timeout errors
            if (error.message?.includes('timeout')) {
                if (i < retries - 1) {
                    console.log(`⏳ Retrying due to timeout...`);
                    continue;
                }
            }
            
            // If this is the last retry, return fallback response
            if (i === retries - 1 && fallbackResponse) {
                console.log('⚠️ All retries failed, using fallback response');
                logError(`${context}_FALLBACK_USED`, error);
                return fallbackResponse;
            }
        }
    }
    
    // Final fallback if everything fails
    const finalFallback = fallbackResponse || "I had trouble processing that request just now, but I'm ready to help you with other questions about your document. Please try rephrasing your request or ask about a different aspect of the document.";
    logError(`${context}_FINAL_FALLBACK`, new Error('All retries exhausted'));
    return finalFallback;
};

// Helper function to create fallback responses
const createFallbackResponse = (type, documentContent = '', metadata = null) => {
    switch (type) {
        case 'summary':
            if (documentContent) {
                const words = documentContent.split(/\s+/).slice(0, 100).join(' ');
                return `I had trouble generating a complete summary, but here's what I can tell you about your document:

**Document Overview:**
This document appears to contain information about various topics. Here's a brief excerpt from the beginning:

"${words}..."

**Document Details:**
${metadata ? `- File: ${metadata.fileName}
- Size: ${(metadata.fileSize / 1024 / 1024).toFixed(2)} MB
- Word Count: ${metadata.wordCount.toLocaleString()} words` : ''}

I'd be happy to answer specific questions about the content or try generating the summary again.`;
            }
            return "I had trouble generating a summary, but I'm ready to answer specific questions about your document. Please try uploading the document again or ask me about particular sections you're interested in.";
            
        case 'chat':
            return "I had trouble processing that specific question, but I have access to your document and I'm ready to help. Could you try rephrasing your question or ask about a different aspect of the document? For example, you could ask about the main topics, key points, or specific sections.";
            
        default:
            return "I encountered a technical issue, but I'm still here to help you with your document. Please try your request again or ask me something else about the content.";
    }
};

// Helper function to validate file with enhanced checks
const validateFile = (file) => {
    console.log('🔍 Validating file:', {
        name: file.originalname,
        size: file.size,
        type: file.mimetype
    });
    
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];
    
    // Check file size
    if (file.size === 0) {
        throw new Error('File appears to be empty. Please upload a valid document.');
    }
    
    if (file.size > maxSize) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        throw new Error(`File size (${sizeMB}MB) exceeds the maximum allowed size of 10MB. Please upload a smaller file.`);
    }
    
    // Check file type
    const fileName = file.originalname.toLowerCase();
    const isValidType = allowedTypes.includes(file.mimetype) || 
                       fileName.endsWith('.pdf') || 
                       fileName.endsWith('.txt') || 
                       fileName.endsWith('.docx') || 
                       fileName.endsWith('.doc');
    
    if (!isValidType) {
        throw new Error(`Invalid file type: ${file.mimetype}. Please upload PDF, DOCX, or TXT files only.`);
    }
    
    // Check for suspicious file names
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        throw new Error('Invalid file name. Please rename your file and try again.');
    }
    
    console.log('✅ File validation passed');
};

// Document summarization endpoint with session creation and enhanced error handling
router.post('/summarize', upload.single('document'), async (req, res) => {
    const startTime = Date.now();
    let documentContent = '';
    
    try {
        console.log('📄 Document summarization request received');
        
        if (!req.file) {
            logError('SUMMARIZE_NO_FILE', new Error('No file uploaded'));
            return res.status(400).json({ 
                error: 'No file uploaded. Please select a document to summarize.',
                suggestion: 'Choose a PDF, DOCX, or TXT file and try again.'
            });
        }

        // Validate file
        try {
            validateFile(req.file);
        } catch (validationError) {
            logError('SUMMARIZE_VALIDATION_ERROR', validationError, {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                fileType: req.file.mimetype
            });
            return res.status(400).json({ 
                error: validationError.message,
                supportedFormats: ['PDF', 'DOCX', 'TXT'],
                suggestion: 'Please check your file and try again with a supported format.'
            });
        }

        // Extract text from the uploaded file
        try {
            documentContent = await extractTextFromFile(req.file);
        } catch (extractionError) {
            logError('SUMMARIZE_EXTRACTION_ERROR', extractionError, {
                fileName: req.file.originalname,
                fileType: req.file.mimetype
            });
            
            return res.status(400).json({ 
                error: extractionError.message,
                suggestion: 'Please try uploading a different file or convert your document to a different format.'
            });
        }
        
        if (!documentContent || documentContent.trim().length === 0) {
            logError('SUMMARIZE_EMPTY_CONTENT', new Error('No readable content'), {
                fileName: req.file.originalname
            });
            return res.status(400).json({ 
                error: 'No readable content found in the document. The file may be empty, corrupted, or in an unsupported format.',
                suggestion: 'Please check your file and try uploading a different document.'
            });
        }

        // Check content length
        if (documentContent.length > 500000) { // 500KB text limit
            console.log('⚠️ Large document detected, truncating for processing');
            documentContent = documentContent.substring(0, 500000) + '\n\n[Document truncated due to size limits]';
        }

        // Create a new session for this document
        const sessionId = generateSessionId();
        
        // Construct the summarization prompt
        const summaryPrompt = `You are Lokesh's personal AI assistant, created by Lokesh Chintapalli. You are an expert document summarizer.

Your task is to create a comprehensive yet concise summary of the provided document.

SUMMARIZATION GUIDELINES:
- Extract the main ideas, key points, and important information
- Maintain the logical flow and structure of the original content
- Be thorough but concise - capture essential information without unnecessary details
- Use clear, professional language
- Organize the summary in a logical manner with proper structure
- If the document has sections or chapters, reflect that organization
- Include any important conclusions, recommendations, or findings

Document Content:
"${documentContent}"

Please provide a well-structured summary of this document:`;

        // Get document metadata
        const metadata = {
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            wordCount: documentContent.split(/\s+/).length,
            characterCount: documentContent.length,
            processedAt: new Date().toISOString(),
            processingTimeMs: Date.now() - startTime
        };

        console.log('📊 Document metadata:', metadata);

        // Create fallback response in case AI fails
        const fallbackSummary = createFallbackResponse('summary', documentContent, metadata);

        // Generate summary with retry logic and fallback
        const summaryText = await generateWithRetry(summaryPrompt, 3, fallbackSummary, 'SUMMARIZE');

        // Store document session for future conversations
        documentSessions.set(sessionId, {
            documentContent,
            metadata,
            summary: summaryText,
            conversationHistory: [],
            createdAt: Date.now()
        });

        const totalProcessingTime = Date.now() - startTime;
        console.log(`✅ Document summarization completed in ${totalProcessingTime}ms`);

        res.status(200).json({ 
            summary: summaryText,
            metadata: {
                ...metadata,
                totalProcessingTimeMs: totalProcessingTime
            },
            sessionId: sessionId,
            success: true
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        logError('SUMMARIZE_GENERAL_ERROR', error, {
            fileName: req.file?.originalname,
            processingTimeMs: processingTime,
            documentContentLength: documentContent.length
        });
        
        // Enhanced error handling with graceful responses
        if (error.message?.includes('503') || 
            error.message?.includes('overloaded') ||
            error.message?.includes('RESOURCE_EXHAUSTED')) {
            return res.status(503).json({ 
                error: 'The AI service is currently experiencing high demand. Please try again in a few moments.',
                retryAfter: 30,
                suggestion: 'Try again in 30 seconds or contact support if the issue persists.'
            });
        } else if (error.message?.includes('API configuration error')) {
            return res.status(500).json({ 
                error: 'Server configuration issue. Please contact support.',
                suggestion: 'This appears to be a server-side configuration problem.'
            });
        } else if (error.message?.includes('timeout')) {
            return res.status(408).json({ 
                error: 'Document processing timed out. The file may be too large or complex.',
                suggestion: 'Please try with a smaller or simpler document.'
            });
        } else if (error.message?.includes('not yet supported') || 
                   error.message?.includes('Unsupported file type') ||
                   error.message?.includes('Invalid file type')) {
            return res.status(400).json({ 
                error: error.message,
                supportedFormats: ['PDF', 'DOCX', 'TXT'],
                suggestion: 'Please convert your file to one of the supported formats and try again.'
            });
        } else {
            // Always provide a helpful response with fallback
            const metadata = req.file ? {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                fileType: req.file.mimetype,
                wordCount: documentContent ? documentContent.split(/\s+/).length : 0,
                characterCount: documentContent ? documentContent.length : 0,
                processedAt: new Date().toISOString(),
                processingTimeMs: processingTime
            } : null;

            const fallbackSummary = createFallbackResponse('summary', documentContent || '', metadata);
            
            return res.status(200).json({ 
                summary: fallbackSummary,
                metadata: metadata,
                sessionId: generateSessionId(),
                success: true,
                isPartial: true,
                message: 'I encountered some technical difficulties but was able to provide basic information about your document.'
            });
        }
    }
});

// Enhanced conversational endpoint for document Q&A
router.post('/chat', async (req, res) => {
    try {
        const { sessionId, question } = req.body;
        
        if (!sessionId || !question) {
            return res.status(400).json({ error: 'Session ID and question are required.' });
        }

        // Get the document session
        const session = documentSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Document session not found. Please upload the document again.' });
        }

        // Build conversation context
        let conversationContext = '';
        if (session.conversationHistory.length > 0) {
            conversationContext = '\n\nPrevious conversation:\n' + 
                session.conversationHistory.map(msg => 
                    `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
                ).join('\n');
        }

        // Construct the conversational prompt
        const chatPrompt = `You are Lokesh's personal AI assistant, created by Lokesh Chintapalli. You are having a conversation about a document that the user has uploaded.

You have access to the full document content and should answer questions based on this content. Be conversational, helpful, and reference specific parts of the document when relevant.

Document Summary:
"${session.summary}"

Full Document Content:
"${session.documentContent}"
${conversationContext}

Current User Question:
"${question}"

Please provide a helpful, conversational response based on the document content:`;

        // Create fallback response for chat
        const fallbackChatResponse = createFallbackResponse('chat');

        // Generate response with retry logic and fallback
        const responseText = await generateWithRetry(chatPrompt, 3, fallbackChatResponse);

        // Update conversation history
        session.conversationHistory.push(
            { role: 'user', content: question },
            { role: 'assistant', content: responseText }
        );

        // Keep only last 10 exchanges to prevent context from getting too long
        if (session.conversationHistory.length > 20) {
            session.conversationHistory = session.conversationHistory.slice(-20);
        }

        res.status(200).json({ 
            answer: responseText,
            sessionId: sessionId,
            success: true
        });

    } catch (error) {
        console.error('Error in document chat:', error);
        
        // Enhanced error handling with graceful responses
        if (error.message?.includes('503') || error.message?.includes('overloaded')) {
            res.status(503).json({ 
                error: 'The AI service is currently experiencing high demand. I\'m still here to help though!',
                retryAfter: 30,
                suggestion: 'Please try asking your question again in a moment, or try rephrasing it.',
                fallbackAnswer: createFallbackResponse('chat')
            });
        } else {
            // Always provide a helpful response, never just "failed"
            const fallbackAnswer = createFallbackResponse('chat');
            res.status(200).json({ 
                answer: fallbackAnswer,
                sessionId: sessionId,
                success: true,
                isPartial: true,
                message: 'I had some technical difficulties processing your specific question, but I\'m ready to help with other aspects of your document.'
            });
        }
    }
});

// Get session info endpoint
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = documentSessions.get(sessionId);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        res.status(200).json({
            metadata: session.metadata,
            conversationHistory: session.conversationHistory,
            success: true
        });

    } catch (error) {
        console.error('Error getting session info:', error);
        res.status(500).json({ error: 'Failed to get session information.' });
    }
});

// Legacy analyze endpoint (kept for backward compatibility)
router.post('/analyze', upload.single('document'), async (req, res) => {
    try {
        const { userQuery } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        // Extract text from the uploaded file
        const documentContent = await extractTextFromFile(req.file);

        // Construct the prompt with the document and user's query
        const fullPrompt = `You are Lokesh's personal AI assistant, created by Lokesh Chintapalli. You are specialized in document analysis.
Your task is to answer the user's question strictly based on the provided document content.
If the answer is not in the document, you must state that the information is not available in the provided text.

Document Content:
"${documentContent}"

User's Question:
"${userQuery}"

Answer:`;

        const responseText = await generateWithRetry(fullPrompt);

        res.status(200).json({ answer: responseText });
    } catch (error) {
        console.error('Error analyzing document:', error);
        
        // Handle specific error cases
        if (error.message?.includes('503') || error.message?.includes('overloaded')) {
            res.status(503).json({ 
                error: 'AI service is currently overloaded. Please try again in a few moments.',
                retryAfter: 30
            });
        } else if (error.message?.includes('not yet supported') || error.message?.includes('Unsupported file type')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to analyze document. Please try again.' });
        }
    }
});

export default router;
