import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

export const useSpeechAnalysis = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);
    
    // Cache and performance optimization
    const cacheRef = useRef(new Map());
    const requestTimeoutRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Debounced analyze message with caching and abort control
    const analyzeMessage = useCallback(async (sessionId, message) => {
        if (!sessionId || !message.trim()) {
            setError('Session ID and message are required');
            return null;
        }

        // Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Clear previous timeout
        if (requestTimeoutRef.current) {
            clearTimeout(requestTimeoutRef.current);
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        // Check cache first
        const cacheKey = `${sessionId}-${message.trim()}`;
        if (cacheRef.current.has(cacheKey)) {
            const cachedResult = cacheRef.current.get(cacheKey);
            setAnalysisResult(cachedResult);
            return cachedResult;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await axios.post('/api/learn-english/process-message', {
                sessionId,
                message: message.trim()
            }, {
                signal: abortControllerRef.current.signal,
                timeout: 30000 // 30 second timeout
            });

            const result = {
                aiMessage: response.data.aiMessage,
                analysis: response.data.analysis,
                sessionStats: response.data.sessionStats,
                timestamp: Date.now()
            };

            // Cache the result (limit cache size to 50 entries)
            if (cacheRef.current.size >= 50) {
                const firstKey = cacheRef.current.keys().next().value;
                cacheRef.current.delete(firstKey);
            }
            cacheRef.current.set(cacheKey, result);

            setAnalysisResult(result);
            return result;

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Request was aborted');
                return null;
            }

            let errorMessage = 'Failed to analyze message';
            
            if (err.code === 'ECONNABORTED') {
                errorMessage = 'Request timed out. Please try again.';
            } else if (err.response?.status === 429) {
                errorMessage = 'Too many requests. Please wait a moment and try again.';
            } else if (err.response?.status >= 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            }

            setError(errorMessage);
            console.error('Speech analysis error:', err);
            return null;
        } finally {
            setIsAnalyzing(false);
            abortControllerRef.current = null;
        }
    }, []);

    const startSession = useCallback(async (userId, level, topic) => {
        if (!userId || !level || !topic) {
            setError('User ID, level, and topic are required');
            return null;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await axios.post('/api/learn-english/start-session', {
                userId,
                level,
                topic
            });

            const result = {
                sessionId: response.data.sessionId,
                aiMessage: response.data.aiMessage,
                topicInfo: response.data.topicInfo
            };

            return result;

        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to start session';
            setError(errorMessage);
            console.error('Start session error:', err);
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const endSession = useCallback(async (sessionId) => {
        if (!sessionId) {
            setError('Session ID is required');
            return null;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await axios.post('/api/learn-english/end-session', {
                sessionId
            });

            const result = {
                sessionStats: response.data.sessionStats,
                userProgress: response.data.userProgress
            };

            return result;

        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to end session';
            setError(errorMessage);
            console.error('End session error:', err);
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const getUserProgress = useCallback(async (userId) => {
        if (!userId) {
            setError('User ID is required');
            return null;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await axios.get(`/api/learn-english/progress/${userId}`);

            const result = {
                progress: response.data.progress,
                topics: response.data.topics
            };

            return result;

        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to get user progress';
            setError(errorMessage);
            console.error('Get progress error:', err);
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const getTopics = useCallback(async () => {
        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await axios.get('/api/learn-english/topics');
            return response.data.topics;

        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to get topics';
            setError(errorMessage);
            console.error('Get topics error:', err);
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    // NEW SPEECH LEARNING FUNCTIONS

    const analyzeSpeechForLearning = useCallback(async (userSpeech, expectedText, level, learningMode = 'pronunciation') => {
        if (!userSpeech || !expectedText || !level) {
            setError('User speech, expected text, and level are required');
            return null;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await axios.post('/api/learn-english/analyze-speech', {
                userSpeech: userSpeech.trim(),
                expectedText: expectedText.trim(),
                level,
                learningMode
            });

            const result = {
                type: response.data.type,
                analysis: response.data,
                timestamp: Date.now()
            };

            setAnalysisResult(result);
            return result;

        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to analyze speech for learning';
            setError(errorMessage);
            console.error('Speech learning analysis error:', err);
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const generatePracticeSentence = useCallback(async (level, topic, difficulty = 'medium') => {
        if (!level || !topic) {
            setError('Level and topic are required');
            return null;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await axios.post('/api/learn-english/generate-practice-sentence', {
                level,
                topic,
                difficulty
            });

            return {
                sentence: response.data.sentence,
                topic: response.data.topic,
                level: response.data.level,
                difficulty: response.data.difficulty,
                instructions: response.data.instructions,
                tips: response.data.tips
            };

        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to generate practice sentence';
            setError(errorMessage);
            console.error('Generate practice sentence error:', err);
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const getLearningFeedback = useCallback(async (sessionId, performanceData) => {
        if (!sessionId || !performanceData) {
            setError('Session ID and performance data are required');
            return null;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await axios.post('/api/learn-english/learning-feedback', {
                sessionId,
                performanceData
            });

            return {
                overallScore: response.data.overall_score,
                pronunciationAverage: response.data.pronunciation_average,
                grammarAverage: response.data.grammar_average,
                exercisesCompleted: response.data.exercises_completed,
                feedback: response.data.feedback,
                achievements: response.data.achievements,
                nextSteps: response.data.next_steps,
                encouragement: response.data.encouragement,
                recommendedPractice: response.data.recommended_practice
            };

        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to get learning feedback';
            setError(errorMessage);
            console.error('Learning feedback error:', err);
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const clearAnalysis = useCallback(() => {
        setAnalysisResult(null);
    }, []);

    // Helper function to format analysis feedback
    const formatFeedback = useCallback((analysis) => {
        if (!analysis) return null;

        const feedback = {
            pronunciation: {
                score: analysis.pronunciation?.score || 0,
                feedback: analysis.pronunciation?.feedback || '',
                mistakes: analysis.pronunciation?.mistakes || [],
                level: analysis.pronunciation?.score >= 80 ? 'excellent' : 
                       analysis.pronunciation?.score >= 60 ? 'good' : 'needs improvement'
            },
            grammar: {
                score: analysis.grammar?.score || 0,
                corrections: analysis.grammar?.corrections || [],
                level: analysis.grammar?.score >= 90 ? 'excellent' : 
                       analysis.grammar?.score >= 70 ? 'good' : 'needs improvement'
            },
            vocabulary: {
                level: analysis.vocabulary?.level || 'beginner',
                suggestions: analysis.vocabulary?.suggestions || [],
                newWords: analysis.vocabulary?.newWords || []
            }
        };

        return feedback;
    }, []);

    // Helper function to get overall performance
    const getOverallPerformance = useCallback((analysis) => {
        if (!analysis) return null;

        const pronunciationScore = analysis.pronunciation?.score || 0;
        const grammarScore = analysis.grammar?.score || 0;
        const overallScore = Math.round((pronunciationScore + grammarScore) / 2);

        let performance = 'needs improvement';
        let color = '#ff6b6b';
        let message = 'Keep practicing! You\'re making progress.';

        if (overallScore >= 80) {
            performance = 'excellent';
            color = '#51cf66';
            message = 'Outstanding! Your English skills are impressive.';
        } else if (overallScore >= 60) {
            performance = 'good';
            color = '#ffd43b';
            message = 'Good job! You\'re doing well with room for improvement.';
        }

        return {
            score: overallScore,
            performance,
            color,
            message
        };
    }, []);

    // Helper function to format speech learning feedback
    const formatSpeechLearningFeedback = useCallback((analysisData) => {
        if (!analysisData) return null;

        const feedback = {
            type: analysisData.type,
            overall: analysisData.overall || analysisData.overall_score || 0,
            encouragement: analysisData.encouragement || '',
            nextAction: analysisData.next_action || 'continue'
        };

        if (analysisData.type === 'pronunciation_analysis') {
            feedback.pronunciation = {
                accuracy: analysisData.accuracy || 0,
                score: analysisData.pronunciation || 0,
                errors: analysisData.errors || [],
                missingWords: analysisData.missing_words || [],
                suggestions: analysisData.suggestions || []
            };
        } else if (analysisData.type === 'grammar_analysis') {
            feedback.grammar = {
                score: analysisData.grammar_score || 0,
                corrections: analysisData.corrections || [],
                vocabularyLevel: analysisData.vocabulary_level || '',
                vocabularySuggestions: analysisData.vocabulary_suggestions || [],
                newWords: analysisData.new_words || []
            };
        } else if (analysisData.type === 'general_analysis') {
            feedback.pronunciation = analysisData.pronunciation || {};
            feedback.grammar = analysisData.grammar || {};
        }

        return feedback;
    }, []);

    // Helper function to determine learning mode performance
    const getLearningPerformance = useCallback((analysisData) => {
        if (!analysisData) return null;

        const score = analysisData.overall || analysisData.overall_score || 0;
        let performance = 'needs improvement';
        let color = '#ff6b6b';
        let message = 'Keep practicing! You\'re making progress.';

        if (score >= 85) {
            performance = 'excellent';
            color = '#51cf66';
            message = 'Outstanding! Your pronunciation is very clear.';
        } else if (score >= 70) {
            performance = 'good';
            color = '#ffd43b';
            message = 'Good job! Focus on the highlighted areas for improvement.';
        } else if (score >= 50) {
            performance = 'fair';
            color = '#ff922b';
            message = 'You\'re improving! Try speaking more slowly and clearly.';
        }

        return {
            score,
            performance,
            color,
            message,
            nextAction: analysisData.next_action || 'continue'
        };
    }, []);

    return {
        // State
        isAnalyzing,
        analysisResult,
        error,

        // Original Actions
        analyzeMessage,
        startSession,
        endSession,
        getUserProgress,
        getTopics,
        clearError,
        clearAnalysis,

        // New Speech Learning Actions
        analyzeSpeechForLearning,
        generatePracticeSentence,
        getLearningFeedback,

        // Original Helpers
        formatFeedback,
        getOverallPerformance,

        // New Speech Learning Helpers
        formatSpeechLearningFeedback,
        getLearningPerformance
    };
};
