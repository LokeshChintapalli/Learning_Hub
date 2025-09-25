import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { summarizeDocumentSimple } from '../../api/geminiApi';
import styles from './styles.module.css';

const SimpleDocumentSummarizer = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [summary, setSummary] = useState('');
    const [error, setError] = useState('');
    const [fileInfo, setFileInfo] = useState(null);
    const [processingProgress, setProcessingProgress] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.reload();
    }

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setSummary('');
            setError('');
            setFileInfo(null);
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) return;
        
        setIsProcessing(true);
        setError('');
        setSummary('');
        setProcessingProgress(null);
        setRetryCount(0);
        
        try {
            const data = await summarizeDocumentSimple(selectedFile, {
                maxRetries: 3,
                timeout: 120000, // 2 minutes
                onProgress: (progress) => {
                    setProcessingProgress(progress);
                    if (progress.attempt > 1) {
                        setRetryCount(progress.attempt - 1);
                    }
                }
            });
            
            setSummary(data.summary);
            setFileInfo({
                filename: data.filename,
                fileSize: data.fileSize,
                message: data.message,
                processingTime: data.processingTime
            });
            
        } catch (error) {
            console.error('Error summarizing document:', error);
            
            // Enhanced error handling with retry information
            let errorMessage = error.message || 'Failed to summarize document. Please try again.';
            
            // Add retry information if applicable
            if (retryCount > 0) {
                errorMessage = `After ${retryCount + 1} attempts: ${errorMessage}`;
            }
            
            // Check if error contains specific guidance
            if (error.message?.includes('quota') || error.message?.includes('busy')) {
                errorMessage += '\n\n💡 Tip: The AI service is experiencing high demand. Try again in a few minutes, or try with a smaller document.';
            } else if (error.message?.includes('timeout') || error.message?.includes('too long')) {
                errorMessage += '\n\n💡 Tip: Try with a smaller document or check your internet connection.';
            } else if (error.message?.includes('format') || error.message?.includes('Invalid')) {
                errorMessage += '\n\n💡 Tip: Make sure your file is a PDF, DOCX, or TXT file with readable text content.';
            }
            
            setError(errorMessage);
        } finally {
            setIsProcessing(false);
            setProcessingProgress(null);
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault();
    }

    const handleDrop = (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            setSelectedFile(file);
            setSummary('');
            setError('');
            setFileInfo(null);
        }
    }

    const handleCopySummary = () => {
        if (summary) {
            navigator.clipboard.writeText(summary).then(() => {
                alert('Summary copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy summary to clipboard.');
            });
        }
    }

    const handleDownloadSummary = () => {
        if (summary) {
            const blob = new Blob([summary], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedFile?.name || 'document'}_summary.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    const resetForm = () => {
        setSelectedFile(null);
        setSummary('');
        setError('');
        setFileInfo(null);
    }

    return (
        <div className={styles.main_container}>
            <nav className={styles.navbar}>
                <h1>Simple Document Summarizer</h1>
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
                        ⚡
                    </div>
                    <h2>Quick Document Summary</h2>
                    <p>Upload your document and get a clear 5-point summary powered by Gemini 1.5 Flash. Fast, simple, and effective.</p>
                </div>

                <div className={styles.upload_section}>
                    <div className={styles.upload_container}>
                        <h3>Upload Document</h3>
                        
                        <div 
                            className={styles.drop_zone}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <div className={styles.drop_icon}>📄</div>
                            <p>Drag and drop your file here or</p>
                            <input
                                type="file"
                                id="fileInput"
                                className={styles.file_input}
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.txt"
                            />
                            <label htmlFor="fileInput" className={styles.file_label}>
                                Choose File
                            </label>
                            <div className={styles.supported_formats}>
                                <small>Supports: PDF, DOCX, TXT files</small>
                            </div>
                        </div>

                        {selectedFile && (
                            <div className={styles.file_info}>
                                <div className={styles.file_details}>
                                    <span className={styles.file_icon}>📄</span>
                                    <div>
                                        <p className={styles.file_name}>{selectedFile.name}</p>
                                        <p className={styles.file_size}>
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    className={styles.upload_btn}
                                    onClick={handleUpload}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Summarizing...' : 'Get 5-Point Summary'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className={styles.error_section}>
                        <div className={styles.error_icon}>❌</div>
                        <h3>Error Processing Document</h3>
                        <div className={styles.error_content}>
                            {error.split('\n\n').map((paragraph, index) => (
                                <p key={index} className={paragraph.startsWith('💡') ? styles.error_tip : styles.error_text}>
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                        
                        {retryCount > 0 && (
                            <div className={styles.retry_summary}>
                                <span className={styles.retry_count_badge}>
                                    🔄 Attempted {retryCount + 1} times
                                </span>
                            </div>
                        )}
                        
                        <div className={styles.error_actions}>
                            <button 
                                className={styles.retry_btn}
                                onClick={() => {
                                    setError('');
                                    setRetryCount(0);
                                }}
                            >
                                Dismiss
                            </button>
                            {selectedFile && (
                                <button 
                                    className={styles.retry_btn}
                                    onClick={handleUpload}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Processing...' : 'Try Again'}
                                </button>
                            )}
                            <button 
                                className={styles.help_btn}
                                onClick={() => {
                                    const helpText = `Common solutions:\n\n` +
                                        `• Try with a smaller document (under 5MB)\n` +
                                        `• Ensure your document contains readable text\n` +
                                        `• Check your internet connection\n` +
                                        `• Wait a few minutes if the service is busy\n` +
                                        `• Try converting PDF to DOCX if having issues`;
                                    alert(helpText);
                                }}
                            >
                                💡 Get Help
                            </button>
                        </div>
                    </div>
                )}

                {isProcessing && (
                    <div className={styles.processing_section}>
                        <div className={styles.loading_spinner}></div>
                        
                        {processingProgress ? (
                            <div className={styles.progress_container}>
                                <h3>
                                    {processingProgress.stage === 'uploading' && '📤 Uploading Document...'}
                                    {processingProgress.stage === 'waiting' && '⏳ Waiting to Retry...'}
                                    {processingProgress.stage === 'fallback' && '🔄 Trying Alternative Method...'}
                                    {processingProgress.stage === 'completed' && '✅ Processing Complete!'}
                                </h3>
                                
                                <p className={styles.progress_message}>
                                    {processingProgress.message}
                                </p>
                                
                                {processingProgress.progress && (
                                    <div className={styles.progress_bar}>
                                        <div 
                                            className={styles.progress_fill}
                                            style={{ width: `${processingProgress.progress}%` }}
                                        ></div>
                                    </div>
                                )}
                                
                                {processingProgress.attempt > 1 && (
                                    <div className={styles.retry_info}>
                                        <span className={styles.retry_badge}>
                                            Attempt {processingProgress.attempt} of {processingProgress.maxAttempts}
                                        </span>
                                    </div>
                                )}
                                
                                {processingProgress.waitTime && (
                                    <div className={styles.wait_info}>
                                        <span className={styles.wait_badge}>
                                            ⏱️ Waiting {processingProgress.waitTime}s...
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.default_processing}>
                                <h3>Creating Summary...</h3>
                                <p>Gemini 1.5 Flash is analyzing your document and generating 5 key points</p>
                                <div className={styles.processing_steps}>
                                    <div className={styles.step}>📄 Reading document...</div>
                                    <div className={styles.step}>🤖 AI analysis in progress...</div>
                                    <div className={styles.step}>✨ Generating bullet points...</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {summary && (
                    <div className={styles.summary_section}>
                        <div className={styles.summary_header}>
                            <h3>📋 Document Summary</h3>
                            {fileInfo && (
                                <div className={styles.file_badge}>
                                    {fileInfo.filename} • {(fileInfo.fileSize / 1024 / 1024).toFixed(2)} MB
                                </div>
                            )}
                        </div>
                        
                        <div className={styles.summary_content}>
                            <div className={styles.summary_badge}>
                                <span className={styles.ai_badge}>⚡ Powered by Gemini 1.5 Flash</span>
                            </div>
                            
                            <div className={styles.summary_text}>
                                {summary.split('\n').map((line, index) => {
                                    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                                        return (
                                            <div key={index} className={styles.bullet_point}>
                                                {line.trim()}
                                            </div>
                                        );
                                    } else if (line.trim()) {
                                        return (
                                            <p key={index} className={styles.summary_paragraph}>
                                                {line.trim()}
                                            </p>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                            
                            <div className={styles.summary_actions}>
                                <button 
                                    className={styles.action_btn}
                                    onClick={handleCopySummary}
                                >
                                    📋 Copy Summary
                                </button>
                                <button 
                                    className={styles.action_btn}
                                    onClick={handleDownloadSummary}
                                >
                                    💾 Download
                                </button>
                                <button 
                                    className={styles.action_btn_secondary}
                                    onClick={resetForm}
                                >
                                    🔄 New Document
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.features_section}>
                    <h3>Why Choose Simple Summarizer?</h3>
                    <div className={styles.features_grid}>
                        <div className={styles.feature_card}>
                            <div className={styles.feature_icon}>⚡</div>
                            <h4>Lightning Fast</h4>
                            <p>Powered by Gemini 1.5 Flash for quick results</p>
                        </div>
                        <div className={styles.feature_card}>
                            <div className={styles.feature_icon}>🎯</div>
                            <h4>5 Key Points</h4>
                            <p>Focused summaries with exactly 5 bullet points</p>
                        </div>
                        <div className={styles.feature_card}>
                            <div className={styles.feature_icon}>📄</div>
                            <h4>Multiple Formats</h4>
                            <p>PDF, Word documents, and text files supported</p>
                        </div>
                        <div className={styles.feature_card}>
                            <div className={styles.feature_icon}>🔒</div>
                            <h4>Secure & Private</h4>
                            <p>Documents processed securely, no storage</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimpleDocumentSummarizer;
