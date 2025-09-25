import {Route,Routes,Navigate } from 'react-router-dom';
import {useState, useEffect} from 'react';
import Main from "./component/Main";
import Signup from "./component/signup";
import Login from "./component/Login";
import VirtualAssistant from "./component/VirtualAssistant";

import SimpleDocumentSummarizer from "./component/SimpleDocumentSummarizer";
import LearnEnglish from "./component/LearnEnglish";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setUser(token);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/signup" element = {user ? <Navigate replace to="/" /> : <Signup/>} />
      <Route path="/login" element = {user ? <Navigate replace to="/" /> : <Login/>} />
      <Route path="/" element = {user ? <Main/> : <Navigate replace to="/login" />} />
      <Route path="/virtual-assistant" element = {user ? <VirtualAssistant/> : <Navigate replace to="/login" />} />
    
      <Route path="/simple-document-summarizer" element = {user ? <SimpleDocumentSummarizer/> : <Navigate replace to="/login" />} />
      {/* Temporary test route for Learn English module - bypassing authentication for testing */}
      <Route path="/learn-english" element={<LearnEnglish/>} />
      <Route path="/learn-english-test" element={<LearnEnglish/>} />
    </Routes>
  );
}

export default App;
