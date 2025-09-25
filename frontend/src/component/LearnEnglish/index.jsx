import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConversationInterface from './ConversationInterface';
import ProgressTracker from './ProgressTracker';
import ModuleFlow from './ModuleFlow';
import { useSpeechAnalysis } from './useSpeechAnalysis';
import styles from './styles.module.css';

const LearnEnglish = () => {
    // State management
    const [currentView, setCurrentView] = useState('dashboard'); // dashboard, moduleflow, conversation, progress
    const [selectedLevel, setSelectedLevel] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [currentSession, setCurrentSession] = useState(null);
    const [userProgress, setUserProgress] = useState(null);
    const [sessionResult, setSessionResult] = useState(null);
    const [availableTopics, setAvailableTopics] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get user ID from localStorage (assuming it's stored there after login)
    const userId = localStorage.getItem('userId') || 'demo-user';

    // Hooks
    const { 
        startSession, 
        getUserProgress, 
        getTopics, 
        isAnalyzing, 
        error: analysisError 
    } = useSpeechAnalysis();

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            // Load user progress and topics
            const [progressResult, topicsResult] = await Promise.all([
                getUserProgress(userId),
                getTopics()
            ]);

            if (progressResult) {
                setUserProgress(progressResult.progress);
            }

            if (topicsResult) {
                setAvailableTopics(topicsResult);
            }
        } catch (err) {
            setError('Failed to load data');
            console.error('Load data error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        window.location.reload();
    };

    const handleStartConversation = async () => {
        if (!selectedLevel || !selectedTopic) {
            setError('Please select both level and topic');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Clear any previous session data to ensure fresh start
            setCurrentSession(null);
            
            const sessionData = await startSession(userId, selectedLevel, selectedTopic);
            
            if (sessionData) {
                setCurrentSession({
                    sessionId: sessionData.sessionId,
                    level: selectedLevel,
                    topic: selectedTopic,
                    topicInfo: sessionData.topicInfo,
                    initialMessage: sessionData.aiMessage
                });
                setCurrentView('conversation');
            } else {
                setError('Failed to start conversation session');
            }
        } catch (err) {
            setError('Failed to start conversation');
            console.error('Start conversation error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle starting the 5-step guided learning
    const handleStartGuidedLearning = () => {
        if (!selectedLevel || !selectedTopic) {
            setError('Please select both level and topic');
            return;
        }

        setCurrentView('moduleflow');
        setError(null);
    };

    // Handle ModuleFlow completion
    const handleModuleFlowComplete = (action, data) => {
        switch (action) {
            case 'conversation':
                // Validate session data before starting conversation
                if (!data || !data.sessionId) {
                    setError('Invalid session data. Unable to start conversation.');
                    console.error('ModuleFlow provided invalid session data:', data);
                    setCurrentView('dashboard');
                    return;
                }
                // Start conversation with session data from ModuleFlow
                setCurrentSession(data);
                setCurrentView('conversation');
                break;
            case 'restart':
                // Restart the module flow
                setCurrentView('moduleflow');
                break;
            case 'dashboard':
                // Go back to dashboard
                handleBackToDashboard();
                break;
            default:
                handleBackToDashboard();
        }
    };

    const handleSessionEnd = (result) => {
        setSessionResult(result);
        setCurrentSession(null);
        setCurrentView('progress');
        // Reload user progress
        loadInitialData();
    };

    const handleBackToDashboard = () => {
        setCurrentView('dashboard');
        setSelectedLevel('');
        setSelectedTopic('');
        setSessionResult(null);
        setError(null);
    };

    // Level configuration
    const levels = [
        { 
            id: 'easy', 
            name: 'Easy', 
            description: 'Perfect for beginners', 
            icon: '🌱',
            color: '#51cf66'
        },
        { 
            id: 'medium', 
            name: 'Medium', 
            description: 'Build your confidence', 
            icon: '🌿',
            color: '#ffd43b'
        },
        { 
            id: 'difficult', 
            name: 'Difficult', 
            description: 'Challenge yourself', 
            icon: '🌳',
            color: '#ff6b6b'
        }
    ];

    const renderDashboard = () => (
        <div className={styles.main_content}>
            {/* Welcome Section */}
            <div className={styles.welcome_section}>
                <div className={styles.card_icon}>🤖</div>
                <h2>AI English Tutor</h2>
                <p>Practice English with your personal AI tutor. Get real-time feedback on pronunciation, grammar, and vocabulary!</p>
            </div>

            {/* Progress Overview */}
            {userProgress && (
                <div className={styles.progress_section}>
                    <h3>Your Learning Progress</h3>
                    <div className={styles.progress_stats}>
                        <div className={styles.stat_card}>
                            <div className={styles.stat_number}>{userProgress.completedSessions}</div>
                            <div className={styles.stat_label}>Sessions Completed</div>
                        </div>
                        <div className={styles.stat_card}>
                            <div className={styles.stat_number}>
                                {Math.round((userProgress.skillsProgress.pronunciation.currentScore + 
                                           userProgress.skillsProgress.grammar.currentScore) / 2)}%
                            </div>
                            <div className={styles.stat_label}>Overall Score</div>
                        </div>
                        <div className={styles.stat_card}>
                            <div className={styles.stat_number}>{userProgress.streakDays}</div>
                            <div className={styles.stat_label}>Day Streak</div>
                        </div>
                        <div className={styles.stat_card}>
                            <div className={styles.stat_number}>{userProgress.skillsProgress.vocabulary.wordsLearned}</div>
                            <div className={styles.stat_label}>Words Learned</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Level Selection */}
            <div className={styles.levels_section}>
                <h3>Choose Your Level</h3>
                <div className={styles.levels_grid}>
                    {levels.map(level => (
                        <div 
                            key={level.id}
                            className={`${styles.level_card} ${selectedLevel === level.id ? styles.selected : ''}`}
                            onClick={() => setSelectedLevel(level.id)}
                            style={{ borderColor: selectedLevel === level.id ? level.color : 'rgba(255, 255, 255, 0.2)' }}
                        >
                            <div className={styles.level_icon}>{level.icon}</div>
                            <h4>{level.name}</h4>
                            <p>{level.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Topic Selection */}
            {selectedLevel && (
                <div className={styles.topics_section}>
                    <h3>Select a Topic</h3>
                    <div className={styles.topics_grid}>
                        {Object.entries(availableTopics).map(([key, topic]) => (
                            <div 
                                key={key}
                                className={`${styles.topic_card} ${selectedTopic === key ? styles.selected : ''}`}
                                onClick={() => setSelectedTopic(key)}
                            >
                                <div className={styles.topic_icon}>{topic.icon}</div>
                                <h4>{topic.name}</h4>
                                <div className={styles.topic_keywords}>
                                    {topic.keywords.slice(0, 3).join(' • ')}
                                </div>
                                {userProgress?.topicProgress[key] && (
                                    <div className={styles.topic_progress}>
                                        <span>Sessions: {userProgress.topicProgress[key].sessionsCompleted}</span>
                                        <span>Best: {userProgress.topicProgress[key].bestScore}%</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Start Buttons */}
            {selectedLevel && selectedTopic && (
                <div className={styles.start_section}>
                    <div className={styles.start_options}>
                        <button 
                            className={styles.start_guided_btn}
                            onClick={handleStartGuidedLearning}
                            disabled={loading || isAnalyzing}
                        >
                            {loading ? '🔄 Starting...' : '📚 Start Guided Learning (5 Steps)'}
                        </button>
                        <button 
                            className={styles.start_conversation_btn}
                            onClick={handleStartConversation}
                            disabled={loading || isAnalyzing}
                        >
                            {loading ? '🔄 Starting...' : '🚀 Start AI Conversation'}
                        </button>
                    </div>
                    <div className={styles.start_description}>
                        <p><strong>Guided Learning:</strong> Complete 5-step structured learning with pronunciation, grammar, and conversation practice.</p>
                        <p><strong>AI Conversation:</strong> Jump directly into natural conversation with your AI tutor.</p>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {(error || analysisError) && (
                <div className={styles.error_message}>
                    <span className={styles.error_icon}>⚠️</span>
                    {error || analysisError}
                    <button 
                        className={styles.error_close}
                        onClick={() => setError(null)}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Features Section */}
            <div className={styles.features_section}>
                <h3>AI Tutor Features</h3>
                <div className={styles.features_grid}>
                    <div className={styles.feature_card}>
                        <div className={styles.feature_icon}>🗣️</div>
                        <h4>Speech Recognition</h4>
                        <p>Speak naturally and get instant pronunciation feedback</p>
                    </div>
                    <div className={styles.feature_card}>
                        <div className={styles.feature_icon}>📝</div>
                        <h4>Grammar Correction</h4>
                        <p>Real-time grammar checking with detailed explanations</p>
                    </div>
                    <div className={styles.feature_card}>
                        <div className={styles.feature_icon}>📚</div>
                        <h4>Vocabulary Building</h4>
                        <p>Learn new words and get suggestions for better expressions</p>
                    </div>
                    <div className={styles.feature_card}>
                        <div className={styles.feature_icon}>🤖</div>
                        <h4>AI Conversations</h4>
                        <p>Engage in natural conversations tailored to your level</p>
                    </div>
                    <div className={styles.feature_card}>
                        <div className={styles.feature_icon}>📊</div>
                        <h4>Progress Tracking</h4>
                        <p>Monitor your improvement with detailed analytics</p>
                    </div>
                    <div className={styles.feature_card}>
                        <div className={styles.feature_icon}>🎯</div>
                        <h4>Personalized Learning</h4>
                        <p>Adaptive content based on your performance and interests</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderConversation = () => {
        // Add null checks to prevent runtime errors
        if (!currentSession) {
            return (
                <div className={styles.error_container}>
                    <div className={styles.error_message}>
                        <span className={styles.error_icon}>⚠️</span>
                        No active session found. Please start a new conversation.
                        <button 
                            className={styles.error_close}
                            onClick={handleBackToDashboard}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            );
        }

        if (!currentSession.sessionId) {
            return (
                <div className={styles.error_container}>
                    <div className={styles.error_message}>
                        <span className={styles.error_icon}>⚠️</span>
                        Invalid session data. Missing session ID.
                        <button 
                            className={styles.error_close}
                            onClick={handleBackToDashboard}
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <ConversationInterface
                sessionId={currentSession.sessionId}
                level={currentSession.level}
                topic={currentSession.topic}
                userId={userId}
                onSessionEnd={handleSessionEnd}
            />
        );
    };

    const renderModuleFlow = () => (
        <ModuleFlow
            level={selectedLevel}
            topic={selectedTopic}
            userId={userId}
            onComplete={handleModuleFlowComplete}
        />
    );

    const renderProgress = () => (
        <ProgressTracker
            userProgress={userProgress}
            sessionResult={sessionResult}
            onClose={handleBackToDashboard}
        />
    );

    if (loading && !userProgress) {
        return (
            <div className={styles.main_container}>
                <div className={styles.loading_container}>
                    <div className={styles.loading_spinner}></div>
                    <p>Loading your English learning dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.main_container}>
            {/* Navigation Bar */}
            <nav className={styles.navbar}>
                <h1>🎓 Learn English AI</h1>
                <div className={styles.nav_buttons}>
                    {currentView !== 'dashboard' && (
                        <button 
                            className={styles.back_btn}
                            onClick={handleBackToDashboard}
                        >
                            ← Back to Dashboard
                        </button>
                    )}
                    <Link to="/" className={styles.back_btn}>
                        🏠 Home
                    </Link>
                    <button className={styles.white_btn} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            {currentView === 'dashboard' && renderDashboard()}
            {currentView === 'moduleflow' && renderModuleFlow()}
            {currentView === 'conversation' && renderConversation()}
            {currentView === 'progress' && renderProgress()}
        </div>
    );
};

export default LearnEnglish;
