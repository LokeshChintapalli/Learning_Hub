import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useVoiceToText } from './useVoiceToText';
import Lottie from 'react-lottie';
import listeningAnimation from './animations/listening.json'; // Download a listening Lottie animation
import idleRobotAnimation from './animations/idleRobot.json'; // Download an idle robot animation
import speakingRobotAnimation from './animations/speakingRobot.json'; // Download a speaking robot animation
import './AssistantModule.css'; // We'll create this file next

const AssistantModule = () => {
    const [status, setStatus] = useState('idle'); // 'idle', 'listening', 'thinking', 'speaking'
    const [displayText, setDisplayText] = useState('');
    const { transcript, isListening, startListening, stopListening } = useVoiceToText({ setDisplayText });

    // This useEffect handles sending the prompt to the backend
    useEffect(() => {
        if (transcript && !isListening && status === 'listening') {
            setStatus('thinking');
            handleCommand(transcript);
        }
    }, [transcript, isListening, status]);

    const handleCommand = async (command) => {
        try {
            const response = await axios.post('/api/assistant/command', {
                prompt: command,
                customPrompt: "Lokesh" // Your name is passed to the backend
            });
            const { action, answer, url } = response.data;

            if (action === 'open_url') {
                window.open(url, '_blank');
                speakText(`Opening ${new URL(url).hostname}.`);
            } else if (action === 'speak_text') {
                speakText(answer);
            }
        } catch (error) {
            console.error('Error processing command:', error);
            setStatus('idle');
            speakText('Sorry, I am having trouble connecting.');
        }
    };

    const speakText = (text) => {
        setStatus('speaking');
        const utterance = new SpeechSynthesisUtterance(text);
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
            return listeningAnimation; // Using listening animation for both states for simplicity
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

    return (
        <div className="assistant-container">
            <div className="robot-animation-wrapper">
                <Lottie options={defaultOptions} height={300} width={300} />
            </div>
            <div className="status-indicator">
                {status === 'listening' && <p>Listening...</p>}
                {status === 'thinking' && <p>Thinking...</p>}
            </div>
            <div className="transcript-display">
                <p>{displayText}</p>
            </div>
            <button
                className="mic-button"
                onClick={isListening ? stopListening : startListening}
            >
                {isListening ? 'Stop Listening' : 'Start Listening'}
            </button>
        </div>
    );
};

export default AssistantModule;
