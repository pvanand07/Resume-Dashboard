import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import ResumeUpload from './pages/ResumeUpload';
import CandidateDetails from './pages/CandidateDetails';
import { Loader2 } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate a loading time to allow data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto text-primary-500 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            HR Candidates Dashboard
          </h1>
          <p className="text-gray-500">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/upload" element={<ResumeUpload />} />
        <Route path="/candidate/:hashPrefix" element={<CandidateDetails />} />
      </Routes>
    </Router>
  );
}

export default App;