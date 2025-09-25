import React, { useState, useEffect, useRef } from 'react';
import { useVoiceToText } from './useVoiceToText';
import { useTextToSpeech } from './useTextToSpeech';
import { useSpeechAnalysis } from './useSpeechAnalysis';
import styles from './styles.module.css';

const ConversationInterface = ({ 
    sessionId, 
    level, 
    topic, 
    onSessionEnd, 
    userId 
}) => {
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState(null);
    const [sessionStats, setSessionStats] = useState(null);
    const [learningMode, setLearningMode] = useState('conversation'); // 'conversation', 'pronunciation', 'grammar'
    const [practiceSentence, setPracticeSentence] = useState('');
    const [isLearningSession, setIsLearningSession] = useState(false);
    const [learningFeedback, setLearningFeedback] = useState(null);
    const messagesEndRef = useRef(null);

    // Hooks
    const { 
        transcript, 
        isListening, 
        startListening, 
        stopListening, 
        isSupported: voiceSupported 
    } = useVoiceToText({ setDisplayText: setCurrentMessage });

    const { 
        speak, 
        stop: stopSpeaking, 
        isSpeaking, 
        isSupported: speechSupported 
    } = useTextToSpeech();

    const { 
        analyzeMessage, 
        endSession, 
        isAnalyzing, 
        formatFeedback, 
        getOverallPerformance 
    } = useSpeechAnalysis();

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle voice input
    useEffect(() => {
        if (transcript && !isListening) {
            setCurrentMessage(transcript);
        }
    }, [transcript, isListening]);

    const handleSendMessage = async () => {
        if (!currentMessage.trim() || isAnalyzing) return;

        const userMessage = currentMessage.trim();
        setCurrentMessage('');
        setIsTyping(true);

        // Add user message to chat
        const newUserMessage = {
            id: Date.now(),
            text: userMessage,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newUserMessage]);

        try {
            // Additional validation before API call
            if (!sessionId) {
                throw new Error('Session ID is missing');
            }

            // Analyze message and get AI response
            const result = await analyzeMessage(sessionId, userMessage);
            
            if (result) {
                // Add AI response to chat
                const aiMessage = {
                    id: Date.now() + 1,
                    text: result.aiMessage,
                    sender: 'ai',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMessage]);

                // Update analysis and stats
                setCurrentAnalysis(result.analysis);
                setSessionStats(result.sessionStats);
                setShowFeedback(true);

                // Speak AI response
                if (speechSupported && result.aiMessage) {
                    speak(result.aiMessage);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Add user-friendly error message
            const errorMessage = {
                id: Date.now() + 1,
                text: 'Sorry, I encountered an error processing your message. Please try again.',
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleEndSession = async () => {
        try {
            // Additional validation before ending session
            if (!sessionId) {
                console.warn('No session ID available for ending session');
                if (onSessionEnd) {
                    onSessionEnd(null);
                }
                return;
            }

            const result = await endSession(sessionId);
            if (result && onSessionEnd) {
                onSessionEnd(result);
            }
        } catch (error) {
            console.error('Error ending session:', error);
            // Still call onSessionEnd to allow user to return to dashboard
            if (onSessionEnd) {
                onSessionEnd(null);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleVoiceInput = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const renderFeedback = () => {
        if (!showFeedback || !currentAnalysis) return null;

        const feedback = formatFeedback(currentAnalysis);
        const overall = getOverallPerformance(currentAnalysis);

        return (
            <div className={styles.feedback_panel}>
                <div className={styles.feedback_header}>
                    <h4>📊 Your Performance</h4>
                    <button 
                        className={styles.close_feedback}
                        onClick={() => setShowFeedback(false)}
                    >
                        ×
                    </button>
                </div>

                <div className={styles.overall_score}>
                    <div 
                        className={styles.score_circle}
                        style={{ borderColor: overall?.color }}
                    >
                        <span className={styles.score_number}>{overall?.score}</span>
                        <span className={styles.score_label}>Overall</span>
                    </div>
                    <p className={styles.score_message}>{overall?.message}</p>
                </div>

                <div className={styles.feedback_sections}>
                    {/* Pronunciation Feedback */}
                    <div className={styles.feedback_section}>
                        <div className={styles.section_header}>
                            <span className={styles.section_icon}>🗣️</span>
                            <span className={styles.section_title}>Pronunciation</span>
                            <span className={styles.section_score}>{feedback.pronunciation.score}/100</span>
                        </div>
                        <p className={styles.section_feedback}>{feedback.pronunciation.feedback}</p>
                        {feedback.pronunciation.mistakes.length > 0 && (
                            <div className={styles.mistakes}>
                                <strong>Focus on:</strong> {feedback.pronunciation.mistakes.join(', ')}
                            </div>
                        )}
                    </div>

                    {/* Grammar Feedback */}
                    <div className={styles.feedback_section}>
                        <div className={styles.section_header}>
                            <span className={styles.section_icon}>📝</span>
                            <span className={styles.section_title}>Grammar</span>
                            <span className={styles.section_score}>{feedback.grammar.score}/100</span>
                        </div>
                        {feedback.grammar.corrections.length > 0 ? (
                            <div className={styles.corrections}>
                                {feedback.grammar.corrections.map((correction, index) => (
                                    <div key={index} className={styles.correction_item}>
                                        <span className={styles.original}>"{correction.original}"</span>
                                        <span className={styles.arrow}>→</span>
                                        <span className={styles.suggestion}>"{correction.suggestion}"</span>
                                        <p className={styles.rule}>{correction.rule}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.section_feedback}>Great grammar! No corrections needed.</p>
                        )}
                    </div>

                    {/* Vocabulary Feedback */}
                    <div className={styles.feedback_section}>
                        <div className={styles.section_header}>
                            <span className={styles.section_icon}>📚</span>
                            <span className={styles.section_title}>Vocabulary</span>
                            <span className={styles.section_level}>{feedback.vocabulary.level}</span>
                        </div>
                        {feedback.vocabulary.suggestions.length > 0 && (
                            <div className={styles.vocabulary_suggestions}>
                                <strong>Try using:</strong> {feedback.vocabulary.suggestions.join(', ')}
                            </div>
                        )}
                        {feedback.vocabulary.newWords.length > 0 && (
                            <div className={styles.new_words}>
                                <strong>New words learned:</strong> {feedback.vocabulary.newWords.join(', ')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Validation - render error states if required props are missing
    if (!sessionId) {
        return (
            <div className={styles.conversation_container}>
                <div className={styles.error_container}>
                    <div className={styles.error_message}>
                        <span className={styles.error_icon}>⚠️</span>
                        <h3>Session Error</h3>
                        <p>No valid session ID provided. Unable to start conversation.</p>
                        <button 
                            className={styles.error_btn}
                            onClick={() => onSessionEnd && onSessionEnd(null)}
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!level || !topic) {
        return (
            <div className={styles.conversation_container}>
                <div className={styles.error_container}>
                    <div className={styles.error_message}>
                        <span className={styles.error_icon}>⚠️</span>
                        <h3>Configuration Error</h3>
                        <p>Missing level or topic information. Unable to start conversation.</p>
                        <button 
                            className={styles.error_btn}
                            onClick={() => onSessionEnd && onSessionEnd(null)}
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.conversation_container}>
            {/* Header */}
            <div className={styles.conversation_header}>
                <div className={styles.session_info}>
                    <h3>🎯 {level.charAt(0).toUpperCase() + level.slice(1)} Level</h3>
                    <p>📚 {topic.charAt(0).toUpperCase() + topic.slice(1)} Conversation</p>
                    <div className={styles.topic_indicator}>
                        <span className={styles.topic_label}>Current Topic:</span>
                        <span className={styles.topic_name}>{topic.charAt(0).toUpperCase() + topic.slice(1)}</span>
                    </div>
                </div>
                <div className={styles.session_stats}>
                    {sessionStats && (
                        <>
                            <div className={styles.stat_item}>
                                <span className={styles.stat_label}>Messages:</span>
                                <span className={styles.stat_value}>{sessionStats.messagesCount}</span>
                            </div>
                            <div className={styles.stat_item}>
                                <span className={styles.stat_label}>Avg Score:</span>
                                <span className={styles.stat_value}>
                                    {Math.round((sessionStats.pronunciationAverage + sessionStats.grammarAverage) / 2)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
                <button 
                    className={styles.end_session_btn}
                    onClick={handleEndSession}
                >
                    End Session
                </button>
            </div>

            {/* Messages */}
            <div className={styles.messages_container}>
                {messages.map((message) => (
                    <div 
                        key={message.id} 
                        className={`${styles.message} ${styles[message.sender]}`}
                    >
                        <div className={styles.message_content}>
                            <p>{message.text}</p>
                            <span className={styles.message_time}>
                                {formatTime(message.timestamp)}
                            </span>
                        </div>
                        {message.sender === 'ai' && speechSupported && (
                            <button 
                                className={styles.speak_btn}
                                onClick={() => speak(message.text)}
                                disabled={isSpeaking}
                            >
                                {isSpeaking ? '🔊' : '🔈'}
                            </button>
                        )}
                    </div>
                ))}
                
                {isTyping && (
                    <div className={`${styles.message} ${styles.ai}`}>
                        <div className={styles.typing_indicator}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={styles.input_container}>
                <div className={styles.input_wrapper}>
                    <textarea
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message or use voice input..."
                        className={styles.message_input}
                        rows={2}
                        disabled={isAnalyzing}
                    />
                    
                    <div className={styles.input_controls}>
                        {voiceSupported && (
                            <button
                                className={`${styles.voice_btn} ${isListening ? styles.listening : ''}`}
                                onClick={toggleVoiceInput}
                                disabled={isAnalyzing}
                                title={isListening ? 'Stop listening' : 'Start voice input'}
                            >
                                {isListening ? '🎤' : '🎙️'}
                            </button>
                        )}
                        
                        <button
                            className={styles.send_btn}
                            onClick={handleSendMessage}
                            disabled={!currentMessage.trim() || isAnalyzing}
                        >
                            {isAnalyzing ? '⏳' : '📤'}
                        </button>
                    </div>
                </div>
                
                {isListening && (
                    <div className={styles.listening_indicator}>
                        <span className={styles.pulse}></span>
                        Listening... Speak now!
                    </div>
                )}
            </div>

            {/* Feedback Panel */}
            {renderFeedback()}
        </div>
    );
};

export default ConversationInterface;
