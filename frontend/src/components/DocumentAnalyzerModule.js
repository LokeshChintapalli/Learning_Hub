import React, { useState } from 'react';
import axios from 'axios';
import './DocumentAnalyzerModule.css';

const DocumentAnalyzerModule = () => {
    const [file, setFile] = useState(null);
    const [userQuery, setUserQuery] = useState('');
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !userQuery) {
            alert('Please upload a file and enter a question.');
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append('document', file);
        formData.append('userQuery', userQuery);

        try {
            const response = await axios.post('/api/document/analyze', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setAnswer(response.data.answer);
        } catch (error) {
            console.error('Error during document analysis:', error);
            setAnswer('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="document-analyzer-container">
            <h1>Document Analyzer</h1>
            <p>Upload a PDF and ask a question about its content.</p>
            <form onSubmit={handleSubmit}>
                <div className="file-input-wrapper">
                    <label htmlFor="file-upload" className="custom-file-upload">
                        {file ? file.name : 'Choose a file'}
                    </label>
                    <input id="file-upload" type="file" onChange={handleFileChange} />
                </div>
                <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Ask a question about the document..."
                    className="query-input"
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Analyzing...' : 'Get Answer'}
                </button>
            </form>
            {answer && (
                <div className="answer-box">
                    <h3>Answer:</h3>
                    <p>{answer}</p>
                </div>
            )}
        </div>
    );
};

export default DocumentAnalyzerModule;
