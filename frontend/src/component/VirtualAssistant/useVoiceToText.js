// This is an updated version of the hook to provide real-time updates
import { useState, useEffect, useRef } from 'react';

export const useVoiceToText = ({ setDisplayText }) => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef(null);

    // Always call useEffect at the top level - check support inside the effect
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        setIsSupported(true);
        
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true; // This gives real-time updates
        recognition.lang = 'en-US';
        
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setIsListening(true);
            setDisplayText('');
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const speechToText = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += speechToText;
                }
            }
            if (finalTranscript) {
                setTranscript(finalTranscript);
                setDisplayText(finalTranscript);
            }
        };

        return () => {
            if (recognition) {
                recognition.onstart = null;
                recognition.onend = null;
                recognition.onresult = null;
            }
        };
    }, [setDisplayText]);

    const startListening = () => {
        if (!isSupported || !recognitionRef.current || isListening) return;
        
        try {
            setTranscript('');
            recognitionRef.current.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            setIsListening(false);
        }
    };

    const stopListening = () => {
        if (!isSupported || !recognitionRef.current || !isListening) return;
        
        try {
            recognitionRef.current.stop();
        } catch (error) {
            console.error('Error stopping speech recognition:', error);
            setIsListening(false);
        }
    };

    // Return the same interface regardless of support status
    return { 
        transcript, 
        isListening, 
        startListening, 
        stopListening,
        isSupported 
    };
};
