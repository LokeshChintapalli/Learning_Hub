import { useState, useEffect, useRef, useCallback } from 'react';

export const useVoiceToText = ({ setDisplayText, onResult, onError }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState(null);
    
    const recognitionRef = useRef(null);
    const timeoutRef = useRef(null);
    const callbacksRef = useRef({ setDisplayText, onResult, onError });

    // Update callbacks ref when they change
    useEffect(() => {
        callbacksRef.current = { setDisplayText, onResult, onError };
    }, [setDisplayText, onResult, onError]);

    // Initialize speech recognition (only once)
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            setIsSupported(true);
            
            // Initialize speech recognition
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 1;

            // Handle results
            recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                const fullTranscript = finalTranscript || interimTranscript;
                setTranscript(fullTranscript);

                // Update display text if callback provided
                if (callbacksRef.current.setDisplayText && fullTranscript) {
                    callbacksRef.current.setDisplayText(fullTranscript);
                }

                // Call onResult callback if provided
                if (callbacksRef.current.onResult && finalTranscript) {
                    callbacksRef.current.onResult(finalTranscript);
                }

                // Reset timeout for auto-stop
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                
                // Auto-stop after 5 seconds of silence (increased from 3)
                timeoutRef.current = setTimeout(() => {
                    if (recognitionRef.current && recognition === recognitionRef.current) {
                        recognition.stop();
                    }
                }, 5000);
            };

            // Handle errors
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                let errorMessage = 'Speech recognition error occurred.';
                
                switch (event.error) {
                    case 'no-speech':
                        errorMessage = 'No speech detected. Please try again.';
                        break;
                    case 'audio-capture':
                        errorMessage = 'Microphone not accessible. Please check permissions.';
                        break;
                    case 'not-allowed':
                        errorMessage = 'Microphone permission denied. Please allow microphone access.';
                        break;
                    case 'network':
                        errorMessage = 'Network error occurred. Please check your connection.';
                        break;
                    case 'aborted':
                        errorMessage = 'Speech recognition was aborted.';
                        break;
                    default:
                        errorMessage = `Speech recognition error: ${event.error}`;
                }
                
                setError(errorMessage);
                setIsListening(false);
                
                if (callbacksRef.current.onError) {
                    callbacksRef.current.onError(errorMessage);
                }
            };

            // Handle start
            recognition.onstart = () => {
                setIsListening(true);
                setError(null);
                setTranscript('');
            };

            // Handle end
            recognition.onend = () => {
                setIsListening(false);
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            };

            recognitionRef.current = recognition;
        } else {
            setIsSupported(false);
            setError('Speech recognition is not supported in this browser.');
        }

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []); // Empty dependency array - only run once

    const startListening = useCallback(() => {
        if (!isSupported) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        if (!recognitionRef.current) {
            setError('Speech recognition not initialized.');
            return;
        }

        if (isListening) {
            return; // Already listening
        }

        try {
            setError(null);
            setTranscript('');
            recognitionRef.current.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            setError('Failed to start speech recognition. Please try again.');
        }
    }, [isSupported, isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
        
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setError(null);
    }, []);

    return {
        transcript,
        isListening,
        isSupported,
        error,
        startListening,
        stopListening,
        resetTranscript
    };
};
