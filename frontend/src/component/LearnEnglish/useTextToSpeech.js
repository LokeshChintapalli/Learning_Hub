import { useState, useEffect, useRef } from 'react';

export const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const synthRef = useRef(null);

    useEffect(() => {
        if ('speechSynthesis' in window) {
            setIsSupported(true);
            synthRef.current = window.speechSynthesis;

            const loadVoices = () => {
                const availableVoices = synthRef.current.getVoices();
                const englishVoices = availableVoices.filter(voice => 
                    voice.lang.startsWith('en')
                );
                setVoices(englishVoices);
                
                // Set default voice (prefer female English voice)
                const defaultVoice = englishVoices.find(voice => 
                    voice.name.toLowerCase().includes('female') || 
                    voice.name.toLowerCase().includes('samantha') ||
                    voice.name.toLowerCase().includes('karen')
                ) || englishVoices[0];
                
                setSelectedVoice(defaultVoice);
            };

            // Load voices immediately if available
            loadVoices();

            // Also load when voices change (some browsers load them asynchronously)
            synthRef.current.addEventListener('voiceschanged', loadVoices);

            return () => {
                if (synthRef.current) {
                    synthRef.current.removeEventListener('voiceschanged', loadVoices);
                }
            };
        } else {
            setIsSupported(false);
        }
    }, []);

    const speak = (text, options = {}) => {
        if (!isSupported || !synthRef.current || !text) {
            console.warn('Text-to-speech not supported or no text provided');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            // Cancel any ongoing speech
            synthRef.current.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            
            // Set voice
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            // Set speech parameters
            utterance.rate = options.rate || 0.9; // Slightly slower for learning
            utterance.pitch = options.pitch || 1;
            utterance.volume = options.volume || 1;

            // Event handlers
            utterance.onstart = () => {
                setIsSpeaking(true);
            };

            utterance.onend = () => {
                setIsSpeaking(false);
                resolve();
            };

            utterance.onerror = (event) => {
                setIsSpeaking(false);
                console.error('Speech synthesis error:', event.error);
                reject(new Error(`Speech synthesis failed: ${event.error}`));
            };

            utterance.onpause = () => {
                setIsSpeaking(false);
            };

            utterance.onresume = () => {
                setIsSpeaking(true);
            };

            // Start speaking
            try {
                synthRef.current.speak(utterance);
            } catch (error) {
                setIsSpeaking(false);
                reject(error);
            }
        });
    };

    const stop = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    const pause = () => {
        if (synthRef.current && isSpeaking) {
            synthRef.current.pause();
        }
    };

    const resume = () => {
        if (synthRef.current && !isSpeaking) {
            synthRef.current.resume();
        }
    };

    const changeVoice = (voiceName) => {
        const voice = voices.find(v => v.name === voiceName);
        if (voice) {
            setSelectedVoice(voice);
        }
    };

    return {
        speak,
        stop,
        pause,
        resume,
        changeVoice,
        isSpeaking,
        isSupported,
        voices,
        selectedVoice
    };
};
