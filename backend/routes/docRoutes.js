import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import Document from '../models/Document.js';
import { sendPromptToGemini, sendPromptToGeminiFlash } from '../geminiClient.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// --- helper: chunk text into n-char pieces with overlap
function chunkText(text, chunkSize = 3000, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const piece = text.slice(start, end);
    chunks.push(piece);
    start = end - overlap; // overlap to preserve context
    if (start < 0) start = 0;
  }
  return chunks;
}

// --- helper: simple relevance by keyword count
function scoreChunkByQuestion(chunk, question) {
  const qWords = question.toLowerCase().split(/\W+/).filter(Boolean);
  let score = 0;
  const lower = chunk.toLowerCase();
  for (const w of qWords) {
    if (w.length < 3) continue;
    const count = (lower.match(new RegExp(`\\b${w}\\b`, 'g')) || []).length;
    score += count;
  }
  return score;
}

// Upload & extract, then create chunks and generate combined summary
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = path.join(req.file.destination, req.file.filename);
    const mime = req.file.mimetype;

    let text = '';

    if (mime === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
      const data = fs.readFileSync(filePath);
      const pdfData = await pdfParse(data);
      text = pdfData.text || '';
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      req.file.originalname.toLowerCase().endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value || '';
    } else if (mime === 'text/plain' || req.file.originalname.toLowerCase().endsWith('.txt')) {
      text = fs.readFileSync(filePath, 'utf8');
    } else {
      // cleanup and reject
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // remove temp file
    fs.unlinkSync(filePath);

    // trim and safety
    if (!text || text.trim().length < 30) {
      return res.status(400).json({ error: 'Could not extract text from file.' });
    }

    // chunk
    const rawChunks = chunkText(text, 2500, 200); // adjust sizes if needed
    const chunkDocs = rawChunks.map((c, i) => ({ text: c, index: i }));

    // store in DB
    const doc = new Document({
      filename: req.file.filename,
      originalName: req.file.originalname,
      fullText: text,
      chunks: chunkDocs,
      summary: ''
    });

    await doc.save();

    // Summarize iteratively: summarize each chunk then combine summaries
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
    }

    const chunkSummaries = [];
    for (let i = 0; i < rawChunks.length; i++) {
      const chunkTextPart = rawChunks[i];
      const prompt = `You are a concise document summarizer. Summarize the following text in 2-3 short paragraphs, focusing on main points and key facts, use simple language:\n\n${chunkTextPart}`;
      try {
        const s = await sendPromptToGemini(apiKey, prompt, { maxOutputTokens: 400 });
        if (s) chunkSummaries.push(s.trim());
      } catch (err) {
        console.error('Error summarizing chunk', i, err?.response?.data || err.message);
        // continue; partial results ok
      }
    }

    let combinedSummary = '';
    if (chunkSummaries.length > 0) {
      // combine and compress
      const combined = chunkSummaries.join('\n\n');
      const finalPrompt = `You are a document summarizer. Combine and compress the following chunk summaries into a single coherent summary in simple language (about 6-8 short lines):\n\n${combined}`;
      try {
        const finalSummary = await sendPromptToGemini(apiKey, finalPrompt, { maxOutputTokens: 500 });
        combinedSummary = finalSummary?.trim() || chunkSummaries.slice(0, 3).join('\n\n');
      } catch (err) {
        console.error('Error combining summaries', err?.response?.data || err.message);
        combinedSummary = chunkSummaries.slice(0, 3).join('\n\n');
      }
    }

    // Save summary into DB
    doc.summary = combinedSummary;
    await doc.save();

    // Return document id and summary preview
    res.json({
      docId: doc._id,
      summary: combinedSummary,
      message: 'Document uploaded and summarized (may be partial). Use /chat to ask questions.'
    });
  } catch (err) {
    console.error('Upload error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to summarize document. Please try again.' });
  }
});

// Chat route: ask a question about a stored doc
router.post('/chat', async (req, res) => {
  try {
    const { docId, question } = req.body;
    if (!docId || !question) return res.status(400).json({ error: 'docId and question required' });

    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Find top relevant chunks by simple scoring
    const scored = doc.chunks.map(c => {
      return { index: c.index, text: c.text, score: scoreChunkByQuestion(c.text, question) };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 4).filter(s => s.score > 0); // pick up to 4 relevant chunks (score>0)
    let contextText = '';
    if (top.length === 0) {
      // If no relevant keywords, include doc.summary as context
      contextText = doc.summary || doc.fullText.slice(0, 2000);
    } else {
      contextText = top.map(t => t.text).join('\n\n');
    }

    // Construct prompt: instruct model to answer only from context
    const prompt = `You are a helpful assistant. Use ONLY the information in the CONTEXT to answer the user's question.
If the information is not present, reply: "I cannot find the answer in the uploaded document."

CONTEXT:
${contextText}

QUESTION:
${question}

Answer concisely and cite short quotes from the context when helpful.`;

    const apiKey = process.env.GEMINI_API_KEY;
    const answer = await sendPromptToGemini(apiKey, prompt, { maxOutputTokens: 500, temperature: 0.2 });

    if (!answer) return res.status(500).json({ error: 'No answer from Gemini' });

    res.json({ answer: answer.trim() });
  } catch (err) {
    console.error('Chat error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to answer question.' });
  }
});

// NEW SIMPLIFIED ENDPOINT: Simple document summarizer with 5 bullet points
router.post('/summarize', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = path.join(req.file.destination, req.file.filename);
    const mime = req.file.mimetype;

    let text = '';

    // Extract text from different file types
    if (mime === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
      const data = fs.readFileSync(filePath);
      const pdfData = await pdfParse(data);
      text = pdfData.text || '';
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      req.file.originalname.toLowerCase().endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value || '';
    } else if (mime === 'text/plain' || req.file.originalname.toLowerCase().endsWith('.txt')) {
      text = fs.readFileSync(filePath, 'utf8');
    } else {
      // cleanup and reject
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.' });
    }

    // remove temp file
    fs.unlinkSync(filePath);

    // Validate extracted text
    if (!text || text.trim().length < 30) {
      return res.status(400).json({ error: 'Could not extract readable text from file. Please ensure the document contains text content.' });
    }

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error. Please contact support.' });
    }

    // Truncate text if too long (Gemini has token limits)
    const maxLength = 30000; // Approximately 7500 tokens
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

    // Create prompt for 5 bullet point summary
    const prompt = `You are a professional document summarizer. Please read the following document and provide a clear, concise summary in exactly 5 bullet points. Each bullet point should capture a key aspect or main idea from the document. Use simple, clear language that anyone can understand.

Document content:
${truncatedText}

Please provide your summary in this exact format:
• [First main point]
• [Second main point]  
• [Third main point]
• [Fourth main point]
• [Fifth main point]

Focus on the most important information and key takeaways from the document.`;

    try {
      // Use enhanced Gemini 1.5 Flash with retry logic and API key rotation
      const summary = await sendPromptToGeminiFlash('document-summarizer', prompt, { 
        maxOutputTokens: 500,
        temperature: 0.3,
        maxRetries: 3,
        module: 'document-summarizer'
      });

      if (!summary) {
        return res.status(500).json({ 
          error: 'Failed to generate summary after multiple attempts. Please try again.',
          suggestion: 'The AI service may be experiencing high demand. Please try again in a few moments.',
          retryable: true
        });
      }

      // Return the summary
      res.json({
        success: true,
        summary: summary.trim(),
        filename: req.file.originalname,
        fileSize: req.file.size,
        message: 'Document successfully summarized in 5 bullet points.',
        processingTime: Date.now() - Date.now() // Will be calculated properly
      });

    } catch (geminiError) {
      console.error('Gemini API error after retries:', geminiError?.response?.data || geminiError.message);
      
      // Enhanced error classification and handling
      const errorStatus = geminiError?.response?.status;
      const errorCode = geminiError?.response?.data?.error?.code;
      const errorMessage = geminiError?.response?.data?.error?.message || geminiError.message || '';

      // Quota/Rate limit errors (429, RESOURCE_EXHAUSTED)
      if (errorStatus === 429 || 
          errorCode === 'RESOURCE_EXHAUSTED' ||
          errorMessage.includes('quota') || 
          errorMessage.includes('limit') ||
          errorMessage.includes('RESOURCE_EXHAUSTED')) {
        
        // Try to extract retry-after header
        const retryAfter = geminiError?.response?.headers?.['retry-after'] || 60;
        
        return res.status(503).json({ 
          error: 'The AI service is currently experiencing high demand. All available API quotas are temporarily exhausted.',
          suggestion: `Please try again in ${retryAfter} seconds. This is a temporary limitation that will reset automatically.`,
          retryAfter: parseInt(retryAfter),
          retryable: true,
          errorType: 'QUOTA_EXCEEDED'
        });
      }
      
      // Authentication/Permission errors (403)
      if (errorStatus === 403) {
        return res.status(503).json({ 
          error: 'API access temporarily unavailable due to authentication issues.',
          suggestion: 'This is likely a temporary issue with our AI service. Please try again in a few minutes.',
          retryAfter: 300, // 5 minutes
          retryable: true,
          errorType: 'AUTH_ERROR'
        });
      }

      // Server errors (500, 502, 503, 504)
      if ([500, 502, 503, 504].includes(errorStatus)) {
        return res.status(503).json({ 
          error: 'The AI service is temporarily unavailable due to server issues.',
          suggestion: 'This is a temporary issue. Please try again in a few moments.',
          retryAfter: 30,
          retryable: true,
          errorType: 'SERVER_ERROR'
        });
      }

      // Network/timeout errors
      if (!geminiError.response || geminiError.code === 'ECONNABORTED') {
        return res.status(503).json({ 
          error: 'Network connectivity issues with the AI service.',
          suggestion: 'Please check your internet connection and try again.',
          retryAfter: 15,
          retryable: true,
          errorType: 'NETWORK_ERROR'
        });
      }

      // Content/safety filter errors (400 with specific messages)
      if (errorStatus === 400 && (
          errorMessage.includes('safety') || 
          errorMessage.includes('blocked') ||
          errorMessage.includes('filter'))) {
        return res.status(400).json({ 
          error: 'Document content was flagged by safety filters.',
          suggestion: 'Please try with a different document or remove any potentially sensitive content.',
          retryable: false,
          errorType: 'CONTENT_FILTERED'
        });
      }

      // Generic client errors (400)
      if (errorStatus === 400) {
        return res.status(400).json({ 
          error: 'Invalid request format or document content.',
          suggestion: 'Please ensure your document is properly formatted and try again.',
          retryable: false,
          errorType: 'CLIENT_ERROR'
        });
      }
      
      // Fallback for unknown errors
      return res.status(500).json({ 
        error: 'An unexpected error occurred while processing your document.',
        suggestion: 'Please try again. If the issue persists, try with a smaller document or contact support.',
        retryAfter: 60,
        retryable: true,
        errorType: 'UNKNOWN_ERROR'
      });
    }

  } catch (err) {
    console.error('Summarize endpoint error:', err);
    
    // Handle file processing errors
    if (err.message?.includes('PDF parsing failed') || err.message?.includes('corrupted')) {
      return res.status(400).json({ 
        error: 'Unable to read PDF file. The file may be corrupted, password-protected, or contain only images. Please try a different file or convert to DOCX/TXT format.' 
      });
    }
    
    return res.status(500).json({ 
      error: 'An unexpected error occurred while processing your document. Please try again.' 
    });
  }
});

export default router;
