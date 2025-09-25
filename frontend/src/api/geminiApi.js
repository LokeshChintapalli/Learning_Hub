// frontend/src/api/geminiApi.js
import axios from 'axios';

// Base URL for the API (uses proxy from package.json)
const API_BASE_URL = '/api/assistant';
const DOCUMENT_API_BASE_URL = '/api/doc';

// Basic chat function for simple interactions
export const askGemini = async (prompt) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/ask`, { prompt });
    return res.data.response;
  } catch (err) {
    console.error("Error contacting Gemini API:", err);
    return "Sorry, something went wrong! Please make sure the backend server is running.";
  }
};

// Enhanced chat function with conversation history
export const askGeminiWithHistory = async (prompt, conversationHistory = []) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/ask`, { 
      prompt, 
      conversationHistory 
    });
    return res.data.response;
  } catch (err) {
    console.error("Error contacting Gemini API with history:", err);
    return "Sorry, something went wrong! Please make sure the backend server is running.";
  }
};

// Voice chat function (matches existing frontend implementation)
export const talkToAssistant = async (message) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/talk`, { message });
    return res.data.reply;
  } catch (err) {
    console.error("Error talking to assistant:", err);
    return "Sorry, I am unable to respond at this time. Please make sure the backend server is running.";
  }
};

// Legacy function for backward compatibility
export const sendCommand = async (prompt) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/command`, { prompt });
    return res.data.reply;
  } catch (err) {
    console.error("Error sending command to assistant:", err);
    return "Sorry, something went wrong! Please try again later.";
  }
};

// Test function to check API connection
export const testGeminiConnection = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/test`);
    return res.data;
  } catch (err) {
    console.error("Error testing Gemini connection:", err);
    return { success: false, error: "Failed to connect to the assistant API" };
  }
};

// Enhanced document-related API functions with better error handling
export const summarizeDocument = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axios.post(`${DOCUMENT_API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      timeout: 60000 // 60 second timeout for large files
    });
    
    return res.data;
  } catch (err) {
    console.error("Error summarizing document:", err);
    
    // Enhanced error handling with user-friendly messages
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      throw new Error('The document is taking longer than expected to process. Please try with a smaller file or try again later.');
    }
    
    if (err.response?.status === 503) {
      const retryAfter = err.response.data?.retryAfter || 30;
      throw new Error(`The AI service is currently busy. Please try again in ${retryAfter} seconds.`);
    }
    
    if (err.response?.status === 400) {
      const errorMsg = err.response.data?.error || 'Invalid file or request.';
      const suggestion = err.response.data?.suggestion || 'Please check your file and try again.';
      throw new Error(`${errorMsg} ${suggestion}`);
    }
    
    if (err.response?.status === 413) {
      throw new Error('File is too large. Please upload a file smaller than 10MB.');
    }
    
    // If we have a partial response (fallback), return it
    if (err.response?.data?.summary && err.response.data.isPartial) {
      return {
        ...err.response.data,
        isPartial: true,
        message: err.response.data.message || 'Partial summary generated due to technical difficulties.'
      };
    }
    
    // Enhanced error handling with specific PDF guidance
    const errorMessage = err.response?.data?.error || err.message || 'Failed to summarize document.';
    
    // Provide specific guidance for PDF-related errors
    if (errorMessage.includes('PDF parsing failed') || 
        errorMessage.includes('corrupted') || 
        errorMessage.includes('password-protected') ||
        errorMessage.includes('validation failed') ||
        errorMessage.includes('invalid PDF')) {
      throw new Error(errorMessage); // Pass through the detailed backend error message
    }
    
    // Generic fallback for other errors
    throw new Error(`I had trouble processing your document: ${errorMessage}. Please try again or contact support if the issue persists.`);
  }
};

export const chatWithDocument = async (sessionId, question) => {
  try {
    const res = await axios.post(`${DOCUMENT_API_BASE_URL}/chat`, {
      docId: sessionId,
      question
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      timeout: 30000 // 30 second timeout for chat
    });
    
    return res.data;
  } catch (err) {
    console.error("Error chatting with document:", err);
    
    // Enhanced error handling for chat
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      throw new Error('Your question is taking longer than expected to process. Please try rephrasing or ask a simpler question.');
    }
    
    if (err.response?.status === 503) {
      const fallbackAnswer = err.response.data?.fallbackAnswer || 
        "I'm experiencing high demand right now, but I'm still here to help! Could you try rephrasing your question or ask about a different aspect of your document?";
      return {
        answer: fallbackAnswer,
        sessionId: sessionId,
        success: true,
        isPartial: true,
        message: 'Response generated during high system load.'
      };
    }
    
    if (err.response?.status === 404) {
      throw new Error('Document session expired. Please upload your document again to continue the conversation.');
    }
    
    // If we have a partial response (fallback), return it
    if (err.response?.data?.answer && err.response.data.isPartial) {
      return {
        ...err.response.data,
        isPartial: true,
        message: err.response.data.message || 'Response generated with limited processing due to technical difficulties.'
      };
    }
    
    // Generic fallback with helpful message
    const errorMessage = err.response?.data?.error || err.message || 'Failed to process your question.';
    throw new Error(`I had trouble with that question: ${errorMessage}. Could you try rephrasing it or ask about a different aspect of your document?`);
  }
};

export const getDocumentSession = async (sessionId) => {
  try {
    const res = await axios.get(`${DOCUMENT_API_BASE_URL}/session/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return res.data;
  } catch (err) {
    console.error("Error getting document session:", err);
    throw err;
  }
};

// Enhanced utility functions for retry logic
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const calculateRetryDelay = (attempt, baseDelay = 2000, maxDelay = 30000) => {
  const delay = Math.min(baseDelay * Math.pow(1.5, attempt), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
};

const isRetryableError = (error) => {
  if (!error.response) return true; // Network errors are retryable
  
  const status = error.response.status;
  const errorData = error.response.data;
  
  // Check if backend explicitly says it's retryable
  if (errorData?.retryable === false) return false;
  if (errorData?.retryable === true) return true;
  
  // Default retryable status codes
  return [429, 500, 502, 503, 504].includes(status);
};

// NEW SIMPLIFIED API: Enhanced Simple document summarizer with retry logic
export const summarizeDocumentSimple = async (file, options = {}) => {
  const maxRetries = options.maxRetries || 3;
  const onProgress = options.onProgress || (() => {});
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Update progress
      onProgress({
        stage: 'uploading',
        attempt: attempt + 1,
        maxAttempts: maxRetries + 1,
        message: attempt === 0 ? 'Uploading document...' : `Retrying upload (attempt ${attempt + 1})...`
      });

      const res = await axios.post(`${DOCUMENT_API_BASE_URL}/summarize`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: options.timeout || 90000, // Increased timeout for retries
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            stage: 'uploading',
            progress: percentCompleted,
            attempt: attempt + 1,
            maxAttempts: maxRetries + 1,
            message: `Uploading... ${percentCompleted}%`
          });
        }
      });
      
      // Success - return the result
      onProgress({
        stage: 'completed',
        progress: 100,
        message: 'Document successfully processed!'
      });
      
      return res.data;
      
    } catch (err) {
      console.error(`Document summarization attempt ${attempt + 1} failed:`, err);
      
      const isLastAttempt = attempt === maxRetries;
      const shouldRetry = !isLastAttempt && isRetryableError(err);
      
      // Handle specific error types
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        if (isLastAttempt) {
          throw new Error('The document is taking too long to process. Please try with a smaller file or check your internet connection.');
        }
        // Continue to retry logic below
      }
      
      // Handle backend error responses
      if (err.response?.data) {
        const errorData = err.response.data;
        const status = err.response.status;
        
        // Service unavailable with retry info
        if (status === 503 && errorData.retryable) {
          const retryAfter = errorData.retryAfter || 30;
          
          if (isLastAttempt) {
            throw new Error(`${errorData.error} We've tried ${maxRetries + 1} times but the service is still busy. ${errorData.suggestion || 'Please try again later.'}`);
          }
          
          // Wait for the suggested retry time
          onProgress({
            stage: 'waiting',
            attempt: attempt + 1,
            maxAttempts: maxRetries + 1,
            message: `${errorData.error} Waiting ${retryAfter} seconds before retry...`,
            waitTime: retryAfter
          });
          
          await sleep(retryAfter * 1000);
          continue; // Retry
        }
        
        // Non-retryable errors
        if (!errorData.retryable || status === 400) {
          throw new Error(errorData.error || errorData.message || 'Invalid request or file format.');
        }
        
        // File too large
        if (status === 413) {
          throw new Error('File is too large. Please upload a file smaller than 10MB.');
        }
        
        // Generic server errors that might be retryable
        if (shouldRetry) {
          const delay = calculateRetryDelay(attempt);
          onProgress({
            stage: 'waiting',
            attempt: attempt + 1,
            maxAttempts: maxRetries + 1,
            message: `${errorData.error || 'Processing failed'}. Retrying in ${Math.round(delay/1000)} seconds...`,
            waitTime: Math.round(delay/1000)
          });
          
          await sleep(delay);
          continue; // Retry
        }
        
        // Non-retryable server error
        throw new Error(errorData.error || errorData.message || 'Failed to process document.');
      }
      
      // Network or other errors
      if (shouldRetry) {
        const delay = calculateRetryDelay(attempt);
        onProgress({
          stage: 'waiting',
          attempt: attempt + 1,
          maxAttempts: maxRetries + 1,
          message: `Connection failed. Retrying in ${Math.round(delay/1000)} seconds...`,
          waitTime: Math.round(delay/1000)
        });
        
        await sleep(delay);
        continue; // Retry
      }
      
      // Final failure
      const errorMessage = err.response?.data?.error || err.message || 'Failed to summarize document.';
      throw new Error(`Unable to process your document after ${maxRetries + 1} attempts: ${errorMessage}`);
    }
  }
};

// Enhanced document summarization with fallback options
export const summarizeDocumentWithFallback = async (file, options = {}) => {
  try {
    // Try the simple summarizer first
    return await summarizeDocumentSimple(file, options);
  } catch (error) {
    console.warn('Simple summarizer failed, trying fallback options:', error.message);
    
    // If it's a content/size issue, try with truncation
    if (error.message.includes('too large') || error.message.includes('token')) {
      if (options.onProgress) {
        options.onProgress({
          stage: 'fallback',
          message: 'Trying with document truncation...'
        });
      }
      
      // This would require backend support for truncation parameter
      return await summarizeDocumentSimple(file, { 
        ...options, 
        truncate: true,
        maxRetries: 1 
      });
    }
    
    // Re-throw the original error if no fallback is applicable
    throw error;
  }
};

// Utility function to format conversation history
export const formatConversationHistory = (messages) => {
  return messages.map(msg => ({
    role: msg.isUser ? 'user' : 'assistant',
    content: msg.text
  }));
};
