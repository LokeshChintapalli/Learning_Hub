import axios from 'axios';

const GEMINI_PRO_ENDPOINT = (apiKey) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

const GEMINI_FLASH_ENDPOINT = (apiKey) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

/**
 * API Key Management for Different Modules with Rotation Support
 */
const API_KEYS = {
  // Document Summarizer uses the original API key with backup
  DOCUMENT_SUMMARIZER: [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_BACKUP
  ].filter(Boolean),
  // Learn English Module uses the new dedicated API key
  LEARN_ENGLISH: [
    process.env.GEMINI_API_KEY_LEARN_ENGLISH || 'AIzaSyBEefkK8DJY4Jls9U4Z6CR6VbNlIgmPreE',
    process.env.GEMINI_API_KEY_LEARN_ENGLISH_BACKUP
  ].filter(Boolean)
};

// Track API key health and usage
const API_KEY_HEALTH = {
  DOCUMENT_SUMMARIZER: {},
  LEARN_ENGLISH: {}
};

/**
 * Get API key for specific module with rotation support
 * @param {string} module - Module name ('document' or 'learn-english')
 * @param {number} keyIndex - Index of API key to use (for rotation)
 * @returns {string} API key for the module
 */
function getApiKeyForModule(module, keyIndex = 0) {
  let keys;
  switch (module) {
    case 'document':
    case 'document-summarizer':
      keys = API_KEYS.DOCUMENT_SUMMARIZER;
      break;
    case 'learn-english':
    case 'english':
      keys = API_KEYS.LEARN_ENGLISH;
      break;
    default:
      // Default to document summarizer key for backward compatibility
      keys = API_KEYS.DOCUMENT_SUMMARIZER;
  }
  
  if (!keys || keys.length === 0) {
    throw new Error(`No API keys configured for module: ${module}`);
  }
  
  return keys[keyIndex % keys.length];
}

/**
 * Mark API key as unhealthy
 * @param {string} module - Module name
 * @param {number} keyIndex - Index of the API key
 * @param {number} retryAfter - Seconds to wait before retrying
 */
function markApiKeyUnhealthy(module, keyIndex, retryAfter = 60) {
  const moduleKey = module === 'document' || module === 'document-summarizer' ? 'DOCUMENT_SUMMARIZER' : 'LEARN_ENGLISH';
  if (!API_KEY_HEALTH[moduleKey]) {
    API_KEY_HEALTH[moduleKey] = {};
  }
  API_KEY_HEALTH[moduleKey][keyIndex] = {
    unhealthy: true,
    retryAfter: Date.now() + (retryAfter * 1000)
  };
}

/**
 * Check if API key is healthy
 * @param {string} module - Module name
 * @param {number} keyIndex - Index of the API key
 * @returns {boolean} True if healthy
 */
function isApiKeyHealthy(module, keyIndex) {
  const moduleKey = module === 'document' || module === 'document-summarizer' ? 'DOCUMENT_SUMMARIZER' : 'LEARN_ENGLISH';
  const health = API_KEY_HEALTH[moduleKey]?.[keyIndex];
  if (!health || !health.unhealthy) return true;
  
  // Check if retry period has passed
  if (Date.now() > health.retryAfter) {
    delete API_KEY_HEALTH[moduleKey][keyIndex];
    return true;
  }
  
  return false;
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-based)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay(attempt, baseDelay = 1000, maxDelay = 30000) {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Enhanced sendPromptToGemini with retry logic and API key rotation
 * @param {string} apiKey - API key to use (or module name for auto-rotation)
 * @param {string} prompt - prompt text
 * @param {object} options - { temperature, maxOutputTokens, maxRetries, module }
 */
async function sendPromptToGemini(apiKey, prompt, options = {}) {
  const maxRetries = options.maxRetries ?? 3;
  const module = options.module || 'document-summarizer';
  
  // If apiKey is actually a module name, get the actual key
  let actualApiKey = apiKey;
  let useKeyRotation = false;
  
  if (apiKey === 'document-summarizer' || apiKey === 'learn-english') {
    useKeyRotation = true;
    actualApiKey = getApiKeyForModule(apiKey, 0);
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If using key rotation, try different keys on retry
      if (useKeyRotation && attempt > 0) {
        const keys = apiKey === 'document-summarizer' ? API_KEYS.DOCUMENT_SUMMARIZER : API_KEYS.LEARN_ENGLISH;
        for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
          if (isApiKeyHealthy(apiKey, keyIndex)) {
            actualApiKey = getApiKeyForModule(apiKey, keyIndex);
            break;
          }
        }
      }

      const url = GEMINI_PRO_ENDPOINT(actualApiKey);

      const body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxOutputTokens ?? 800
        }
      };

      const resp = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: options.timeout || 60000
      });

      const reply = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return reply ?? null;

    } catch (err) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryableError = isRetryableGeminiError(err);
      
      // Mark API key as unhealthy if it's a quota/auth error
      if (useKeyRotation && (err.response?.status === 429 || err.response?.status === 403)) {
        const keyIndex = API_KEYS[apiKey === 'document-summarizer' ? 'DOCUMENT_SUMMARIZER' : 'LEARN_ENGLISH'].indexOf(actualApiKey);
        if (keyIndex >= 0) {
          markApiKeyUnhealthy(apiKey, keyIndex, 300); // 5 minutes
        }
      }

      if (isLastAttempt || !isRetryableError) {
        throw err;
      }

      // Calculate delay for exponential backoff
      const delay = calculateBackoffDelay(attempt);
      console.log(`Gemini API attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

/**
 * Enhanced sendPromptToGeminiFlash with retry logic and API key rotation
 * @param {string} apiKey - API key to use (or module name for auto-rotation)
 * @param {string} prompt - prompt text
 * @param {object} options - { temperature, maxOutputTokens, maxRetries, module }
 */
async function sendPromptToGeminiFlash(apiKey, prompt, options = {}) {
  const maxRetries = options.maxRetries ?? 3;
  const module = options.module || 'document-summarizer';
  
  // If apiKey is actually a module name, get the actual key
  let actualApiKey = apiKey;
  let useKeyRotation = false;
  
  if (apiKey === 'document-summarizer' || apiKey === 'learn-english') {
    useKeyRotation = true;
    actualApiKey = getApiKeyForModule(apiKey, 0);
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If using key rotation, try different keys on retry
      if (useKeyRotation && attempt > 0) {
        const keys = apiKey === 'document-summarizer' ? API_KEYS.DOCUMENT_SUMMARIZER : API_KEYS.LEARN_ENGLISH;
        for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
          if (isApiKeyHealthy(apiKey, keyIndex)) {
            actualApiKey = getApiKeyForModule(apiKey, keyIndex);
            break;
          }
        }
      }

      const url = GEMINI_FLASH_ENDPOINT(actualApiKey);

      const body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxOutputTokens ?? 1000
        }
      };

      const resp = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: options.timeout || 60000
      });

      const reply = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return reply ?? null;

    } catch (err) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryableError = isRetryableGeminiError(err);
      
      // Mark API key as unhealthy if it's a quota/auth error
      if (useKeyRotation && (err.response?.status === 429 || err.response?.status === 403)) {
        const keyIndex = API_KEYS[apiKey === 'document-summarizer' ? 'DOCUMENT_SUMMARIZER' : 'LEARN_ENGLISH'].indexOf(actualApiKey);
        if (keyIndex >= 0) {
          markApiKeyUnhealthy(apiKey, keyIndex, 300); // 5 minutes
        }
      }

      if (isLastAttempt || !isRetryableError) {
        throw err;
      }

      // Calculate delay for exponential backoff
      const delay = calculateBackoffDelay(attempt);
      console.log(`Gemini Flash API attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

/**
 * Check if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is retryable
 */
function isRetryableGeminiError(error) {
  if (!error.response) {
    // Network errors are retryable
    return true;
  }

  const status = error.response.status;
  const errorCode = error.response.data?.error?.code;
  const errorMessage = error.response.data?.error?.message || error.message || '';

  // Retryable status codes
  if ([429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  // Retryable error codes/messages
  if (errorCode === 'RESOURCE_EXHAUSTED' || 
      errorMessage.includes('quota') || 
      errorMessage.includes('limit') ||
      errorMessage.includes('busy') ||
      errorMessage.includes('overloaded')) {
    return true;
  }

  // Non-retryable errors (auth, invalid request, etc.)
  return false;
}

/**
 * Module-specific wrapper functions for easier usage
 */

/**
 * Send prompt to Gemini Pro for Document Summarizer module
 */
async function sendPromptToGeminiForDocuments(prompt, options = {}) {
  const apiKey = getApiKeyForModule('document');
  return await sendPromptToGemini(apiKey, prompt, options);
}

/**
 * Send prompt to Gemini Flash for Document Summarizer module
 */
async function sendPromptToGeminiFlashForDocuments(prompt, options = {}) {
  const apiKey = getApiKeyForModule('document');
  return await sendPromptToGeminiFlash(apiKey, prompt, options);
}

/**
 * Send prompt to Gemini Pro for Learn English module
 */
async function sendPromptToGeminiForLearnEnglish(prompt, options = {}) {
  const apiKey = getApiKeyForModule('learn-english');
  return await sendPromptToGemini(apiKey, prompt, options);
}

/**
 * Send prompt to Gemini Flash for Learn English module
 */
async function sendPromptToGeminiFlashForLearnEnglish(prompt, options = {}) {
  const apiKey = getApiKeyForModule('learn-english');
  return await sendPromptToGeminiFlash(apiKey, prompt, options);
}

export { 
  sendPromptToGemini, 
  sendPromptToGeminiFlash,
  getApiKeyForModule,
  sendPromptToGeminiForDocuments,
  sendPromptToGeminiFlashForDocuments,
  sendPromptToGeminiForLearnEnglish,
  sendPromptToGeminiFlashForLearnEnglish
};
