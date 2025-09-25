import React, { useState, useEffect } from 'react';
import { talkToAssistant } from '../../api/geminiApi';
import { useVoiceToText } from './useVoiceToText';
// import Lottie from 'react-lottie'; // Temporarily disabled for testing
import { Link } from 'react-router-dom';
import styles from "./styles.module.css";
import './AssistantModule.css';

// Placeholder animation data - you can replace these with actual Lottie animation files
const createPlaceholderAnimation = (color) => ({
    v: "5.5.7",
    fr: 30,
    ip: 0,
    op: 60,
    w: 300,
    h: 300,
    nm: "Placeholder Animation",
    ddd: 0,
    assets: [],
    layers: [{
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Circle",
        sr: 1,
        ks: {
            o: { a: 0, k: 100 },
            r: { a: 1, k: [{ i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [0] }, { t: 59, s: [360] }] },
            p: { a: 0, k: [150, 150, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: { a: 0, k: [100, 100, 100] }
        },
        ao: 0,
        shapes: [{
            ty: "gr",
            it: [{
                d: 1,
                ty: "el",
                s: { a: 0, k: [100, 100] },
                p: { a: 0, k: [0, 0] }
            }, {
                ty: "fl",
                c: { a: 0, k: color },
                o: { a: 0, k: 100 }
            }]
        }],
        ip: 0,
        op: 60,
        st: 0
    }]
});

const listeningAnimation = createPlaceholderAnimation([0.2, 0.8, 1, 1]); // Blue
const idleRobotAnimation = createPlaceholderAnimation([0.5, 0.5, 0.5, 1]); // Gray
const speakingRobotAnimation = createPlaceholderAnimation([0.2, 1, 0.2, 1]); // Green

const VirtualAssistant = () => {
    const [status, setStatus] = useState('idle'); // 'idle', 'listening', 'thinking', 'speaking'
    const [displayText, setDisplayText] = useState('');
    const [assistantReply, setAssistantReply] = useState('');
    const { transcript, isListening, startListening, stopListening, isSupported } = useVoiceToText({ setDisplayText });

    // This useEffect handles sending the prompt to the backend
    useEffect(() => {
        if (transcript && !isListening && status === 'listening') {
            setStatus('thinking');
            handleCommand(transcript);
        }
    }, [transcript, isListening, status]);

    const handleCommand = async (command) => {
        try {
            // Use the existing talkToAssistant API function
            const reply = await talkToAssistant(command);
            setAssistantReply(reply);
            speakText(reply);
        } catch (error) {
            console.error('Error processing command:', error);
            setStatus('idle');
            const errorMessage = 'Sorry, I am having trouble connecting.';
            setAssistantReply(errorMessage);
            speakText(errorMessage);
        }
    };

    const speakText = (text) => {
        setStatus('speaking');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onend = () => {
            setStatus('idle');
        };
        window.speechSynthesis.speak(utterance);
    };
    
    // Choose which animation to display based on the status
    const getRobotAnimation = () => {
        if (status === 'speaking') {
            return speakingRobotAnimation;
        } else if (status === 'listening' || status === 'thinking') {
            return listeningAnimation;
        } else {
            return idleRobotAnimation;
        }
    };

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: getRobotAnimation(),
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
        }
    };

    const handleStartListening = () => {
        setDisplayText('');
        setAssistantReply('');
        startListening();
    };

    const handleStopListening = () => {
        stopListening();
    };

    // Sync component status with hook's isListening state
    useEffect(() => {
        if (isListening) {
            setStatus('listening');
        } else if (status === 'listening') {
            setStatus('idle');
        }
    }, [isListening, status]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.reload();
    };

    return (
        <div className={styles.main_container}>
            <nav className={styles.navbar}>
                <h1>Jarvis - Virtual Assistant</h1>
                <div className={styles.nav_buttons}>
                    <Link to="/" className={styles.back_btn}>
                        ← Back to Dashboard
                    </Link>
                    <button className={styles.white_btn} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>
            
            <div className={styles.main_content}>
                <div className={styles.welcome_section}>
                    <div className={styles.card_icon}>
                        🤖
                    </div>
                    <h2>Jarvis AI Assistant</h2>
                    <p>Your voice-activated intelligent companion with enhanced animations. Click the button below and speak to interact with Jarvis.</p>
                </div>

                <div className={styles.chat_container}>
                    <div className={styles.chat_header}>
                        <h3>Enhanced Voice Interaction</h3>
                    </div>
                    
                    <div className="assistant-container">
                        <div className="robot-animation-wrapper">
                            {/* <Lottie options={defaultOptions} height={200} width={200} /> */}
                            <div style={{ 
                                width: '200px', 
                                height: '200px', 
                                backgroundColor: '#f0f0f0', 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '48px'
                            }}>
                                {status === 'listening' ? '🎤' : status === 'thinking' ? '🤔' : status === 'speaking' ? '🗣️' : '🤖'}
                            </div>
                        </div>
                        
                        <div className="status-indicator">
                            {status === 'listening' && <p>🎤 Listening...</p>}
                            {status === 'thinking' && <p>🤔 Thinking...</p>}
                            {status === 'speaking' && <p>🗣️ Speaking...</p>}
                            {status === 'idle' && <p>💬 Ready to listen</p>}
                        </div>
                        
                        <div className="transcript-display">
                            {displayText && (
                                <div className={styles.message_user}>
                                    <div className={styles.message_content_user}>
                                        You said: {displayText}
                                    </div>
                                    <div className={styles.message_avatar_user}>👤</div>
                                </div>
                            )}
                            
                            {assistantReply && (
                                <div className={styles.message_bot}>
                                    <div className={styles.message_avatar}>🤖</div>
                                    <div className={styles.message_content}>
                                        {assistantReply}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className={styles.voice_controls}>
                            {!isSupported && (
                                <p style={{ color: '#ff6b6b', marginBottom: '10px' }}>
                                    ⚠️ Voice recognition is not supported in this browser
                                </p>
                            )}
                            <button
                                className={`${styles.mic_button} ${isListening ? styles.listening : ''}`}
                                onClick={isListening ? handleStopListening : handleStartListening}
                                disabled={!isSupported || status === 'thinking' || status === 'speaking'}
                            >
                                {isListening ? '🛑 Stop Listening' : '🎤 Start Listening'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualAssistant;
