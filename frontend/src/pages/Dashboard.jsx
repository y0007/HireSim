import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [mode, setMode] = useState('mock'); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) { alert('You must be logged in'); return; }
    
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('company', company);
    formData.append('position', position);
    formData.append('description', description);
    formData.append('requirements', requirements);
    formData.append('numQuestions', numQuestions);
    formData.append('difficulty', difficulty);
    formData.append('mode', mode);
    if (resumeFile) formData.append('resume', resumeFile);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/interviews`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/interview/${data.interviewId}`);
    } catch (err) {
      console.error('Error creating interview:', err);
      alert('Failed to create interview');
      setIsSubmitting(false);
    }
  };

  const InputStyle = "w-full p-3.5 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner";
  const LabelStyle = "block text-sm font-medium text-gray-400 mb-1.5 ml-1";

  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 glass-panel rounded-3xl shadow-2xl relative overflow-hidden">
      
      {/* Decorative Glow */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Configure Interview</h1>
        <p className="text-gray-400 mb-8 text-sm">Fill in the details below to generate a highly tailored AI mock interview.</p>
        
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={LabelStyle}>Company</label>
              <input value={company} onChange={e => setCompany(e.target.value)} required placeholder="e.g. OpenAI, Stripe" className={InputStyle} />
            </div>
            <div>
              <label className={LabelStyle}>Position</label>
              <input value={position} onChange={e => setPosition(e.target.value)} required placeholder="e.g. Senior Frontend Engineer" className={InputStyle} />
            </div>
          </div>

          <div>
            <label className={LabelStyle}>Job Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Paste the job description here to tailor the AI questions..." className={`${InputStyle} min-h-[120px] resize-y`} />
          </div>

          <div>
            <label className={LabelStyle}>Requirements (Optional)</label>
            <textarea value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="Specific skills required (e.g. React, Node.js, System Design)" className={`${InputStyle} min-h-[80px] resize-y`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={LabelStyle}>Questions</label>
              <input type="number" min={1} max={15} value={numQuestions} onChange={e => setNumQuestions(e.target.value)} className={InputStyle} />
            </div>
            <div>
              <label className={LabelStyle}>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={InputStyle}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className={LabelStyle}>Mode</label>
              <select value={mode} onChange={e => setMode(e.target.value)} className={InputStyle}>
                <option value="mock">Mock Interview</option>
                <option value="timed">Timed Practice</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LabelStyle}>Upload Resume (Optional)</label>
            <div className="flex items-center justify-center w-full mt-1">
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-gray-700/50 border-dashed rounded-xl cursor-pointer bg-gray-900/30 hover:bg-gray-800/50 hover:border-blue-500/50 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="mb-1 text-sm text-gray-400 group-hover:text-gray-300">
                    <span className="font-semibold text-blue-400">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF Document (MAX. 5MB)</p>
                </div>
                <input type="file" accept="application/pdf" onChange={e => setResumeFile(e.target.files[0])} className="hidden" />
              </label>
            </div>
            {resumeFile && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-400 bg-green-400/10 p-2 rounded-lg border border-green-400/20">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                {resumeFile.name}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-4 px-4 mt-6 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <><svg className="animate-spin w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Preparing AI...</>
            ) : 'Generate Mock Interview'}
          </button>
        </form>
      </div>
    </div>
  );
}
