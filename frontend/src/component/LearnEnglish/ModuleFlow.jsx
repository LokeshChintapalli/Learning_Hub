import React, { useState, useEffect } from 'react';
import { useTextToSpeech } from './useTextToSpeech';
import { useVoiceToText } from './useVoiceToText';
import axios from 'axios';
import styles from './styles.module.css';

const ModuleFlow = ({ level, topic, userId, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Step-specific states
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [practiceSentence, setPracticeSentence] = useState('');
    const [userInput, setUserInput] = useState('');
    const [currentFeedback, setCurrentFeedback] = useState(null);
    const [sessionResults, setSessionResults] = useState({
        pronunciationScores: [],
        grammarCorrections: [],
        vocabularyLearned: [],
        overallFeedback: null
    });

    // Hooks
    const { speak, isSpeaking, isSupported: ttsSupported } = useTextToSpeech();
    const { 
        transcript, 
        isListening, 
        startListening, 
        stopListening, 
        isSupported: sttSupported 
    } = useVoiceToText({ setDisplayText: setUserInput });

    // Step titles and descriptions
    const steps = [
        { 
            title: "Welcome & Setup", 
            description: "Get ready to start your English learning journey",
            icon: "👋"
        },
        { 
            title: "Listening & Speaking", 
            description: "Practice pronunciation with guided exercises",
            icon: "🗣️"
        },
        { 
            title: "Grammar & Vocabulary", 
            description: "Review and improve your language skills",
            icon: "📝"
        },
        { 
            title: "AI Conversation", 
            description: "Have a natural conversation with your AI tutor",
            icon: "💬"
        },
        { 
            title: "Session Summary", 
            description: "Review your progress and get personalized feedback",
            icon: "📊"
        }
    ];

    // Initialize session on component mount and when topic/level changes
    useEffect(() => {
        if (currentStep === 1) {
            handleStep1Welcome();
        }
    }, []);

    // Reset component state when topic or level changes
    useEffect(() => {
        setCurrentStep(1);
        setSessionData(null);
        setWelcomeMessage('');
        setPracticeSentence('');
        setUserInput('');
        setCurrentFeedback(null);
        setSessionResults({
            pronunciationScores: [],
            grammarCorrections: [],
            vocabularyLearned: [],
            overallFeedback: null
        });
        setError(null);
        
        // Restart welcome step with new topic/level
        if (level && topic) {
            handleStep1Welcome();
        }
    }, [level, topic]);

    // Handle voice input updates
    useEffect(() => {
        if (transcript && !isListening) {
            setUserInput(transcript);
        }
    }, [transcript, isListening]);

    // Step 1: Welcome & Setup with robust fallback
    const handleStep1Welcome = async () => {
        setLoading(true);
        setError(null);

        // Fallback welcome messages for different topics and levels
        const fallbackWelcomes = {
            sports: {
                easy: "Welcome! I'm excited to help you practice talking about sports. We'll start with simple words and take our time. Are you ready to begin?",
                medium: "Hello! Today we'll practice discussing sports and fitness. We'll work on everyday sports conversations. Let's get started!",
                difficult: "Welcome to your advanced sports discussion session! We'll challenge you with sophisticated sports terminology and complex conversations. Ready to excel?"
            },
            business: {
                easy: "Welcome! Let's practice basic business English together. We'll use simple words and go step by step. Ready to start learning?",
                medium: "Hello! Today we'll practice professional business conversations. We'll work on common workplace situations. Let's begin!",
                difficult: "Welcome to your advanced business English session! We'll explore complex business scenarios and professional communication. Ready to advance your skills?"
            },
            travel: {
                easy: "Welcome! I'm here to help you learn travel English. We'll start with basic travel words and phrases. Ready for your journey?",
                medium: "Hello! Today we'll practice travel conversations for your adventures. We'll cover common travel situations. Let's explore together!",
                difficult: "Welcome to your advanced travel English session! We'll discuss complex travel scenarios and cultural experiences. Ready to become a confident traveler?"
            },
            food: {
                easy: "Welcome! Let's learn about food and cooking together. We'll start with simple food words and recipes. Ready to cook up some English?",
                medium: "Hello! Today we'll practice food and cooking conversations. We'll explore different cuisines and dining experiences. Let's get cooking!",
                difficult: "Welcome to your advanced culinary English session! We'll discuss sophisticated cooking techniques and gourmet experiences. Ready to master culinary communication?"
            },
            technology: {
                easy: "Welcome! Let's explore technology English together. We'll start with basic tech words and simple concepts. Ready to connect?",
                medium: "Hello! Today we'll practice technology conversations. We'll discuss everyday tech topics and digital life. Let's get connected!",
                difficult: "Welcome to your advanced technology English session! We'll explore cutting-edge innovations and complex technical discussions. Ready to innovate your English?"
            },
            health: {
                easy: "Welcome! I'm here to help you learn health and wellness English. We'll start with basic health words. Ready to feel better about English?",
                medium: "Hello! Today we'll practice health and wellness conversations. We'll discuss common health topics and wellness practices. Let's get healthy!",
                difficult: "Welcome to your advanced health English session! We'll explore complex medical topics and wellness philosophies. Ready to master health communication?"
            }
        };

        try {
            // Try to get AI-generated welcome message first
            const response = await axios.post('/api/learn-english/welcome-greeting', {
                level,
                topic
            }, { timeout: 5000 }); // 5 second timeout

            setWelcomeMessage(response.data.spoken_sentence);
            setCurrentFeedback(response.data);

            // Speak the welcome message
            if (ttsSupported) {
                speak(response.data.spoken_sentence);
            }

        } catch (err) {
            console.log('API welcome failed, using fallback:', err.message);
            
            // Use fallback welcome message
            const fallbackMessage = fallbackWelcomes[topic]?.[level] || 
                `Welcome! I'm excited to help you practice ${topic} at ${level} level. Let's start learning together!`;
            
            setWelcomeMessage(fallbackMessage);
            setCurrentFeedback({
                spoken_sentence: fallbackMessage,
                expected_pronunciation: "",
                grammar_corrections: [],
                vocabulary_suggestions: [],
                feedback: `Session started for ${level} level ${topic} practice.`
            });

            // Speak the fallback message
            if (ttsSupported) {
                speak(fallbackMessage);
            }
        }

        // Always try to create session, with fallback
        try {
            const sessionResponse = await axios.post('/api/learn-english/start-session', {
                userId,
                level,
                topic
            }, { timeout: 5000 });

            setSessionData(sessionResponse.data);

        } catch (sessionErr) {
            console.log('Session creation failed, using fallback session:', sessionErr.message);
            
            // Create fallback session data
            const fallbackSessionData = {
                sessionId: `fallback-session-${Date.now()}`,
                aiMessage: welcomeMessage || fallbackWelcomes[topic]?.[level] || "Welcome to your English learning session!",
                topicInfo: {
                    name: topic.charAt(0).toUpperCase() + topic.slice(1),
                    icon: "📚",
                    keywords: ["practice", "learning", "conversation"]
                }
            };
            
            setSessionData(fallbackSessionData);
        }

        setLoading(false);
    };

    // Step 2: Listening & Speaking Practice
    const handleStep2ListeningSpeaking = async () => {
        setLoading(true);
        setError(null);

        try {
            // First, get a practice sentence
            const sentenceResponse = await axios.post('/api/learn-english/practice-sentence', {
                level,
                topic
            });

            setPracticeSentence(sentenceResponse.data.spoken_sentence);
            setCurrentFeedback(sentenceResponse.data);

            // Speak the practice sentence
            if (ttsSupported) {
                speak(sentenceResponse.data.spoken_sentence);
            }

        } catch (err) {
            setError('Failed to generate practice sentence. Please try again.');
            console.error('Practice sentence error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Assess pronunciation after user repeats
    const handlePronunciationAssessment = async () => {
        if (!userInput.trim()) {
            setError('Please speak or type your response first.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/learn-english/assess-pronunciation', {
                userSpeech: userInput,
                expectedSentence: practiceSentence,
                level
            });

            setCurrentFeedback(response.data);
            setSessionResults(prev => ({
                ...prev,
                pronunciationScores: [...prev.pronunciationScores, response.data]
            }));

            // Speak the feedback
            if (ttsSupported) {
                speak(response.data.spoken_sentence);
            }

        } catch (err) {
            setError('Failed to assess pronunciation. Please try again.');
            console.error('Pronunciation assessment error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Grammar & Vocabulary Review
    const handleStep3GrammarVocabulary = async () => {
        if (!userInput.trim()) {
            setError('Please provide some text for grammar and vocabulary review.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/learn-english/grammar-vocabulary-review', {
                userText: userInput,
                level,
                topic
            });

            setCurrentFeedback(response.data);
            setSessionResults(prev => ({
                ...prev,
                grammarCorrections: [...prev.grammarCorrections, ...response.data.grammar_corrections],
                vocabularyLearned: [...prev.vocabularyLearned, ...response.data.vocabulary_suggestions]
            }));

            // Speak the feedback
            if (ttsSupported) {
                speak(response.data.spoken_sentence);
            }

        } catch (err) {
            setError('Failed to review grammar and vocabulary. Please try again.');
            console.error('Grammar vocabulary error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Step 4: AI Conversation (redirect to existing conversation interface)
    const handleStep4Conversation = () => {
        // This will be handled by the parent component
        // We'll pass the session data to the conversation interface
        setCurrentStep(4);
    };

    // Step 5: Session Summary
    const handleStep5Summary = async () => {
        if (!sessionData?.sessionId) {
            setError('No session data available for summary.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/api/learn-english/session-feedback', {
                sessionId: sessionData.sessionId
            });

            setCurrentFeedback(response.data);
            setSessionResults(prev => ({
                ...prev,
                overallFeedback: response.data
            }));

            // Speak the final feedback
            if (ttsSupported) {
                speak(response.data.spoken_sentence);
            }

        } catch (err) {
            setError('Failed to generate session summary. Please try again.');
            console.error('Session summary error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Check if user can proceed to next step based on current step requirements
    const canProceedToNextStep = () => {
        switch (currentStep) {
            case 1:
                return welcomeMessage; // Step 1 completed when welcome message is loaded
            case 2:
                return userInput.trim() && currentFeedback; // Step 2 completed when user provided input and got feedback
            case 3:
                return userInput.trim() && currentFeedback; // Step 3 completed when user provided input and got feedback
            case 4:
                return true; // Step 4 can always proceed (conversation step)
            case 5:
                return true; // Final step
            default:
                return false;
        }
    };

    // Check if a step is accessible (completed or current)
    const isStepAccessible = (stepNumber) => {
        if (stepNumber <= currentStep) return true;
        if (stepNumber === currentStep + 1) return canProceedToNextStep();
        return false;
    };

    // Navigation functions
    const navigateToStep = (stepNumber) => {
        // Only allow navigation to current step, previous steps, or next step if current step is completed
        if (isStepAccessible(stepNumber)) {
            setCurrentStep(stepNumber);
            setUserInput('');
            setError(null);

            // Auto-trigger step actions
            if (stepNumber === 2) {
                handleStep2ListeningSpeaking();
            } else if (stepNumber === 4) {
                handleStep4Conversation();
            } else if (stepNumber === 5) {
                handleStep5Summary();
            }
        }
    };

    const nextStep = () => {
        if (currentStep < 5 && canProceedToNextStep()) {
            navigateToStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            navigateToStep(currentStep - 1);
        }
    };

    const toggleVoiceInput = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className={styles.step_content}>
                        <div className={styles.welcome_section}>
                            <h3>Welcome to Your English Learning Session!</h3>
                            <div className={styles.session_info}>
                                <div className={styles.info_item}>
                                    <span className={styles.info_label}>Level:</span>
                                    <span className={styles.info_value}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                                </div>
                                <div className={styles.info_item}>
                                    <span className={styles.info_label}>Topic:</span>
                                    <span className={styles.info_value}>{topic.charAt(0).toUpperCase() + topic.slice(1)}</span>
                                </div>
                            </div>
                            {welcomeMessage && (
                                <div className={styles.ai_message}>
                                    <div className={styles.message_icon}>🤖</div>
                                    <div className={styles.message_content}>
                                        <p>{welcomeMessage}</p>
                                        {ttsSupported && (
                                            <button 
                                                className={styles.speak_btn}
                                                onClick={() => speak(welcomeMessage)}
                                                disabled={isSpeaking}
                                            >
                                                {isSpeaking ? '🔊' : '🔈'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className={styles.step_content}>
                        <div className={styles.practice_section}>
                            <h3>Listening & Speaking Practice</h3>
                            <p>Listen to the sentence below and repeat it clearly:</p>
                            
                            {practiceSentence && (
                                <div className={styles.practice_sentence}>
                                    <div className={styles.sentence_box}>
                                        <p>"{practiceSentence}"</p>
                                        {ttsSupported && (
                                            <button 
                                                className={styles.repeat_btn}
                                                onClick={() => speak(practiceSentence)}
                                                disabled={isSpeaking}
                                            >
                                                {isSpeaking ? '🔊 Playing...' : '🔈 Listen Again'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className={styles.input_section}>
                                <h4>Now you try:</h4>
                                <div className={styles.input_wrapper}>
                                    <textarea
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        placeholder="Speak using the microphone or type your response..."
                                        className={styles.user_input}
                                        rows={3}
                                    />
                                    <div className={styles.input_controls}>
                                        {sttSupported && (
                                            <button
                                                className={`${styles.voice_btn} ${isListening ? styles.listening : ''}`}
                                                onClick={toggleVoiceInput}
                                                disabled={loading}
                                            >
                                                {isListening ? '🎤 Listening...' : '🎙️ Speak'}
                                            </button>
                                        )}
                                        <button
                                            className={styles.assess_btn}
                                            onClick={handlePronunciationAssessment}
                                            disabled={!userInput.trim() || loading}
                                        >
                                            {loading ? '⏳ Assessing...' : '✅ Check Pronunciation'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className={styles.step_content}>
                        <div className={styles.grammar_section}>
                            <h3>Grammar & Vocabulary Review</h3>
                            <p>Write or speak a sentence about {topic} and I'll help you improve it:</p>
                            
                            <div className={styles.input_section}>
                                <div className={styles.input_wrapper}>
                                    <textarea
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        placeholder={`Write a sentence about ${topic}... For example: "I think ${topic} is very interesting because..."`}
                                        className={styles.user_input}
                                        rows={4}
                                    />
                                    <div className={styles.input_controls}>
                                        {sttSupported && (
                                            <button
                                                className={`${styles.voice_btn} ${isListening ? styles.listening : ''}`}
                                                onClick={toggleVoiceInput}
                                                disabled={loading}
                                            >
                                                {isListening ? '🎤 Listening...' : '🎙️ Speak'}
                                            </button>
                                        )}
                                        <button
                                            className={styles.review_btn}
                                            onClick={handleStep3GrammarVocabulary}
                                            disabled={!userInput.trim() || loading}
                                        >
                                            {loading ? '⏳ Reviewing...' : '📝 Review Grammar & Vocabulary'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {currentFeedback && currentFeedback.grammar_corrections && (
                                <div className={styles.feedback_section}>
                                    <h4>📝 Grammar Feedback:</h4>
                                    {currentFeedback.grammar_corrections.length > 0 ? (
                                        <div className={styles.corrections}>
                                            {currentFeedback.grammar_corrections.map((correction, index) => (
                                                <div key={index} className={styles.correction_item}>
                                                    <span className={styles.original}>"{correction.original}"</span>
                                                    <span className={styles.arrow}>→</span>
                                                    <span className={styles.suggestion}>"{correction.suggestion}"</span>
                                                    <p className={styles.explanation}>{correction.explanation}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={styles.positive_feedback}>✅ Excellent grammar! No corrections needed.</p>
                                    )}

                                    {currentFeedback.vocabulary_suggestions && currentFeedback.vocabulary_suggestions.length > 0 && (
                                        <div className={styles.vocabulary_section}>
                                            <h4>📚 Vocabulary Suggestions:</h4>
                                            <div className={styles.suggestions}>
                                                {currentFeedback.vocabulary_suggestions.map((word, index) => (
                                                    <span key={index} className={styles.suggestion_word}>{word}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className={styles.step_content}>
                        <div className={styles.conversation_section}>
                            <h3>AI Conversation Practice</h3>
                            <p>Ready for a natural conversation? Click below to start talking with your AI tutor!</p>
                            <div className={styles.conversation_info}>
                                <div className={styles.info_card}>
                                    <div className={styles.card_icon}>💬</div>
                                    <h4>What to expect:</h4>
                                    <ul>
                                        <li>Natural conversation about {topic}</li>
                                        <li>Real-time feedback on your responses</li>
                                        <li>Personalized questions based on your level</li>
                                        <li>Pronunciation and grammar tips</li>
                                    </ul>
                                </div>
                            </div>
                            <button 
                                className={styles.start_conversation_btn}
                                onClick={() => onComplete && onComplete('conversation', sessionData)}
                            >
                                🚀 Start AI Conversation
                            </button>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className={styles.step_content}>
                        <div className={styles.summary_section}>
                            <h3>🎉 Session Complete!</h3>
                            
                            {currentFeedback && (
                                <div className={styles.final_feedback}>
                                    <div className={styles.ai_message}>
                                        <div className={styles.message_icon}>🤖</div>
                                        <div className={styles.message_content}>
                                            <p>{currentFeedback.spoken_sentence}</p>
                                            {ttsSupported && (
                                                <button 
                                                    className={styles.speak_btn}
                                                    onClick={() => speak(currentFeedback.spoken_sentence)}
                                                    disabled={isSpeaking}
                                                >
                                                    {isSpeaking ? '🔊' : '🔈'}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {currentFeedback.feedback && typeof currentFeedback.feedback === 'object' && (
                                        <div className={styles.detailed_feedback}>
                                            <div className={styles.feedback_grid}>
                                                <div className={styles.feedback_card}>
                                                    <h4>🗣️ Pronunciation</h4>
                                                    <div className={styles.score_display}>
                                                        Score: {currentFeedback.feedback.overall_score}%
                                                    </div>
                                                    {currentFeedback.feedback.pronunciation_issues && currentFeedback.feedback.pronunciation_issues.length > 0 && (
                                                        <div className={styles.issues}>
                                                            <strong>Focus areas:</strong>
                                                            <ul>
                                                                {currentFeedback.feedback.pronunciation_issues.map((issue, index) => (
                                                                    <li key={index}>{issue}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={styles.feedback_card}>
                                                    <h4>📝 Grammar</h4>
                                                    {currentFeedback.feedback.grammar_mistakes && currentFeedback.feedback.grammar_mistakes.length > 0 ? (
                                                        <div className={styles.mistakes}>
                                                            <strong>Areas to improve:</strong>
                                                            <ul>
                                                                {currentFeedback.feedback.grammar_mistakes.map((mistake, index) => (
                                                                    <li key={index}>{mistake.rule || mistake}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <p className={styles.positive}>✅ Great grammar!</p>
                                                    )}
                                                </div>

                                                <div className={styles.feedback_card}>
                                                    <h4>📚 Vocabulary</h4>
                                                    {currentFeedback.feedback.new_words_learned && currentFeedback.feedback.new_words_learned.length > 0 ? (
                                                        <div className={styles.new_words}>
                                                            <strong>Words learned today:</strong>
                                                            <div className={styles.word_tags}>
                                                                {currentFeedback.feedback.new_words_learned.map((word, index) => (
                                                                    <span key={index} className={styles.word_tag}>{word}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p>Keep expanding your vocabulary!</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={styles.encouragement}>
                                                <h4>💪 Keep Going!</h4>
                                                <p>{currentFeedback.feedback.encouragement}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={styles.action_buttons}>
                                <button 
                                    className={styles.new_session_btn}
                                    onClick={() => onComplete && onComplete('restart')}
                                >
                                    🔄 Start New Session
                                </button>
                                <button 
                                    className={styles.dashboard_btn}
                                    onClick={() => onComplete && onComplete('dashboard')}
                                >
                                    📊 View Progress
                                </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return <div>Invalid step</div>;
        }
    };

    return (
        <div className={styles.module_flow_container}>
            {/* Interactive Progress Bar */}
            <div className={styles.progress_header}>
                <div className={styles.progress_bar}>
                    {steps.map((step, index) => (
                        <div 
                            key={index}
                            className={`${styles.progress_step} ${
                                index + 1 === currentStep ? styles.active : 
                                index + 1 < currentStep ? styles.completed : ''
                            } ${isStepAccessible(index + 1) ? styles.clickable : styles.disabled}`}
                            onClick={() => navigateToStep(index + 1)}
                        >
                            <div className={styles.step_number}>
                                {index + 1 < currentStep ? '✓' : index + 1}
                            </div>
                            <div className={styles.step_info}>
                                <div className={styles.step_icon}>{step.icon}</div>
                                <div className={styles.step_title}>{step.title}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Current Step Content */}
            <div className={styles.step_container}>
                <div className={styles.step_header}>
                    <h2>{steps[currentStep - 1].icon} {steps[currentStep - 1].title}</h2>
                    <p>{steps[currentStep - 1].description}</p>
                </div>

                {renderStepContent()}

                {/* Error Display */}
                {error && (
                    <div className={styles.error_message}>
                        <span className={styles.error_icon}>⚠️</span>
                        {error}
                        <button 
                            className={styles.error_close}
                            onClick={() => setError(null)}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Feedback Display */}
                {currentFeedback && currentStep !== 5 && (
                    <div className={styles.current_feedback}>
                        <div className={styles.feedback_header}>
                            <h4>💡 AI Feedback</h4>
                        </div>
                        <div className={styles.feedback_content}>
                            <p>{currentFeedback.feedback}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className={styles.loading_overlay}>
                    <div className={styles.loading_spinner}></div>
                    <p>Processing...</p>
                </div>
            )}
        </div>
    );
};

export default ModuleFlow;
