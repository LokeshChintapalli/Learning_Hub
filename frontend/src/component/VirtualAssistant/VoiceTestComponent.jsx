import React, { useState } from 'react';
import { useVoiceToText } from './useVoiceToText';

const VoiceTestComponent = () => {
    const [displayText, setDisplayText] = useState('');
    const { transcript, isListening, startListening, stopListening, isSupported } = useVoiceToText({ setDisplayText });

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h2>Voice Recognition Test</h2>
            
            <div style={{ marginBottom: '20px' }}>
                <p><strong>Browser Support:</strong> {isSupported ? '✅ Supported' : '❌ Not Supported'}</p>
                <p><strong>Status:</strong> {isListening ? '🎤 Listening...' : '⏸️ Not Listening'}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={isListening ? stopListening : startListening}
                    disabled={!isSupported}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: isListening ? '#ff4444' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: isSupported ? 'pointer' : 'not-allowed'
                    }}
                >
                    {isListening ? 'Stop Listening' : 'Start Listening'}
                </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3>Display Text:</h3>
                <div style={{ 
                    border: '1px solid #ccc', 
                    padding: '10px', 
                    minHeight: '50px',
                    backgroundColor: '#f9f9f9'
                }}>
                    {displayText || 'No text captured yet...'}
                </div>
            </div>

            <div>
                <h3>Transcript:</h3>
                <div style={{ 
                    border: '1px solid #ccc', 
                    padding: '10px', 
                    minHeight: '50px',
                    backgroundColor: '#f0f8ff'
                }}>
                    {transcript || 'No transcript yet...'}
                </div>
            </div>
        </div>
    );
};

export default VoiceTestComponent;
