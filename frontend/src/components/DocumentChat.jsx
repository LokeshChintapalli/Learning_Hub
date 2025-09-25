import React, { useState } from 'react';
import axios from 'axios';

export default function DocumentChat() {
  const [file, setFile] = useState(null);
  const [docId, setDocId] = useState(null);
  const [summary, setSummary] = useState('');
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => setFile(e.target.files[0]);

  const uploadFile = async () => {
    if (!file) return alert('Select a file first');
    const fd = new FormData();
    fd.append('file', file);
    setLoading(true);
    try {
      const res = await axios.post('/api/doc/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocId(res.data.docId);
      setSummary(res.data.summary || 'No summary returned');
      setChatLog(prev => [...prev, { sender: 'system', text: 'Document uploaded and processed.' }]);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!docId) return alert('Upload a document first');
    if (!question.trim()) return;
    setChatLog(prev => [...prev, { sender: 'user', text: question }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await axios.post('/api/doc/chat', { docId, question });
      const ans = res.data.answer;
      setChatLog(prev => [...prev, { sender: 'ai', text: ans }]);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Question failed');
      setChatLog(prev => [...prev, { sender: 'ai', text: 'Error: Could not get answer.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h2>Document Summarizer & Chat</h2>

      <div style={{ marginBottom: 12 }}>
        <input type="file" onChange={handleFile} />
        <button onClick={uploadFile} disabled={loading} style={{ marginLeft: 8 }}>
          {loading ? 'Processing...' : 'Upload & Summarize'}
        </button>
      </div>

      {docId && (
        <div style={{ marginBottom: 12 }}>
          <h3>Summary</h3>
          <div style={{ background: '#f7f7f7', padding: 12, borderRadius: 6 }}>
            {summary || 'No summary'}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <h3>Chat with Document</h3>
        <div style={{ minHeight: 200, border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
          {chatLog.map((m, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <b>{m.sender === 'user' ? 'You:' : m.sender === 'ai' ? 'Assistant:' : 'System:'}</b>
              <div>{m.text}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', marginTop: 8 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask question related to document..."
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={askQuestion} disabled={loading} style={{ marginLeft: 8 }}>
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
