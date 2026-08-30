// src/pages/Analysis.jsx — HireSim modernized with rich analysis UI
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Score Card ───────────────────────────────────────────────────────────────
function ScoreCard({ label, value, icon }) {
  const score = typeof value === 'number' ? value : null;
  const pct = score !== null ? (score / 5) * 100 : 0;
  const color = score === null ? 'gray' : score >= 4 ? 'green' : score >= 3 ? 'yellow' : 'red';
  const colorMap = {
    green: { bar: 'bg-green-500', text: 'text-green-400', ring: 'ring-green-500/30' },
    yellow: { bar: 'bg-yellow-500', text: 'text-yellow-400', ring: 'ring-yellow-500/30' },
    red: { bar: 'bg-red-500', text: 'text-red-400', ring: 'ring-red-500/30' },
    gray: { bar: 'bg-gray-600', text: 'text-gray-500', ring: 'ring-gray-600/30' },
  };
  const c = colorMap[color];
  return (
    <div className={`p-4 rounded-xl bg-gray-700/50 border border-gray-600/50 ring-1 ${c.ring} hover:bg-gray-700 transition`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400 font-medium">{icon} {label}</span>
        <span className={`text-2xl font-bold ${c.text}`}>{score !== null ? `${score}/5` : 'N/A'}</span>
      </div>
      <div className="w-full bg-gray-600/50 rounded-full h-1.5">
        <div className={`${c.bar} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Grade Badge ───────────────────────────────────────────────────────────────
function GradeBadge({ grade }) {
  if (!grade) return null;
  const colors = {
    'A+': 'bg-green-500/20 text-green-400 border-green-500/40',
    'A':  'bg-green-500/20 text-green-400 border-green-500/40',
    'B+': 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    'B':  'bg-blue-500/20 text-blue-400 border-blue-500/40',
    'C+': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    'C':  'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    'D':  'bg-red-500/20 text-red-400 border-red-500/40',
  };
  const cls = colors[grade] || 'bg-gray-500/20 text-gray-400 border-gray-500/40';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-lg font-bold ${cls}`}>
      {grade}
    </span>
  );
}

// ─── Hire Probability Badge ────────────────────────────────────────────────────
function HireBadge({ prob }) {
  if (!prob) return null;
  const map = {
    High:   'bg-green-500/20 text-green-400 border-green-500/40',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    Low:    'bg-red-500/20 text-red-400 border-red-500/40',
  };
  const cls = map[prob] || 'bg-gray-500/20 text-gray-400 border-gray-500/40';
  const icons = { High: '🚀', Medium: '👍', Low: '⚠️' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-sm font-medium ${cls}`}>
      {icons[prob]} Hire Probability: {prob}
    </span>
  );
}

// ─── Mini score bar for per-question feedback ──────────────────────────────────
function MiniScore({ score }) {
  if (!score) return null;
  const colors = score >= 4 ? 'text-green-400' : score >= 3 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-bold ${colors}`}>{score}/5</span>;
}

// ─── Main Analysis Component ──────────────────────────────────────────────────
export default function Analysis() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('scores'); // 'scores' | 'transcript' | 'feedback'
  const chatRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/interviews/${id}`, { headers: getAuthHeaders() });
        if (mounted) setInterview(res.data);
      } catch (err) {
        if (err?.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); return; }
        setError('Failed to load interview data.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id, navigate]);

  const runAnalysis = async () => {
    setRunning(true);
    setError(null);
    try {
      await axios.post(`${API}/interviews/${id}/analyze`, {}, { headers: getAuthHeaders() });
      const res = await axios.get(`${API}/interviews/${id}`, { headers: getAuthHeaders() });
      setInterview(res.data);
      setActiveTab('scores');
      localStorage.setItem('hiresim_refresh', Date.now());
    } catch (err) {
      if (err?.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); return; }
      setError('Analysis failed — try again.');
    } finally {
      setRunning(false);
    }
  };

  const handleDownloadTranscript = () => {
    const ctx = interview?.context || [];
    const text = ctx.filter(c => c.role !== 'system').map(c =>
      `${c.role === 'assistant' ? 'INTERVIEWER' : 'YOU'}: ${c.content}`
    ).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `transcript_${id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <svg className="animate-spin w-10 h-10 text-blue-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-gray-400">Loading analysis...</p>
      </div>
    </div>
  );

  if (error && !interview) return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 text-red-400">{error}</div>
    </div>
  );

  if (!interview) return null;

  const analysis = interview.analysis || null;
  const scores = analysis?.scores || {};
  const messages = (interview.context || []).filter(c => c.role !== 'system');
  const perQ = analysis?.perQuestionFeedback || [];

  // Compute overall score
  const scoreVals = [scores.communication, scores.technical, scores.structure, scores.confidence, scores.problemSolving]
    .filter(v => typeof v === 'number');
  const overall = scoreVals.length > 0
    ? Math.round((scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) * 10) / 10
    : null;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Interview Analysis</h1>
          <p className="text-gray-400 mt-1">{interview.position} @ {interview.company}</p>
          {analysis && (
            <div className="flex flex-wrap gap-2 mt-2">
              <GradeBadge grade={analysis.overallGrade} />
              <HireBadge prob={analysis.hireProbability} />
              {overall !== null && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-blue-500/40 bg-blue-500/20 text-blue-400 text-sm font-medium">
                  ⭐ Overall: {overall}/5
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!analysis ? (
            <button
              onClick={runAnalysis}
              disabled={running}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
            >
              {running ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Analyzing...</>
              ) : '🧠 Run AI Analysis'}
            </button>
          ) : (
            <button
              onClick={runAnalysis}
              disabled={running}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {running ? 'Re-running...' : '↺ Re-run'}
            </button>
          )}
          <button onClick={handleDownloadTranscript} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition">
            ↓ Transcript
          </button>
          <button onClick={() => navigate('/dashboard')} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition">
            + New Interview
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-900/20 border border-red-700/40 rounded-xl text-red-400 text-sm">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800/80 p-1 rounded-xl border border-gray-700/50 w-fit">
        {[
          { key: 'scores', label: '📊 Scores' },
          { key: 'transcript', label: '💬 Transcript' },
          ...(perQ.length > 0 ? [{ key: 'feedback', label: '🎯 Per-Question' }] : []),
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── SCORES TAB ─── */}
      {activeTab === 'scores' && (
        <div className="space-y-6">
          {!analysis ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
              <div className="text-4xl mb-3">🧠</div>
              <h3 className="text-white font-semibold mb-2">No analysis yet</h3>
              <p className="text-gray-400 text-sm mb-4">Run AI analysis to get detailed scores, feedback, and recommendations.</p>
              <button
                onClick={runAnalysis}
                disabled={running}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {running ? 'Analyzing...' : '🧠 Run AI Analysis'}
              </button>
            </div>
          ) : (
            <>
              {/* Score Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <ScoreCard label="Communication" value={scores.communication} icon="🗣️" />
                <ScoreCard label="Technical Depth" value={scores.technical} icon="⚙️" />
                <ScoreCard label="Structure" value={scores.structure} icon="📋" />
                <ScoreCard label="Confidence" value={scores.confidence} icon="💪" />
                <ScoreCard label="Problem Solving" value={scores.problemSolving} icon="🧩" />
                <ScoreCard label="Overall" value={overall} icon="⭐" />
              </div>

              {/* Summary */}
              {analysis.summary && (
                <div className="p-5 rounded-xl bg-gray-700/40 border border-gray-600/50">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">📝 Summary</h3>
                  <p className="text-gray-300 leading-relaxed">{analysis.summary}</p>
                </div>
              )}

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.strengths?.length > 0 && (
                  <div className="p-5 rounded-xl bg-green-900/10 border border-green-700/30">
                    <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">✅ Strengths</h3>
                    <ul className="space-y-2">
                      {analysis.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                          <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.improvements?.length > 0 && (
                  <div className="p-5 rounded-xl bg-yellow-900/10 border border-yellow-700/30">
                    <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">⚡ Improvements</h3>
                    <ol className="space-y-2">
                      {analysis.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                          <span className="text-yellow-400 font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                          {imp}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>

              {/* Next Steps */}
              {analysis.nextSteps?.length > 0 && (
                <div className="p-5 rounded-xl bg-blue-900/10 border border-blue-700/30">
                  <h3 className="text-blue-400 font-semibold mb-3">🚀 Recommended Next Steps</h3>
                  <ul className="space-y-2">
                    {analysis.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                        <span className="text-blue-400 mt-0.5">→</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── TRANSCRIPT TAB ─── */}
      {activeTab === 'transcript' && (
        <div
          ref={chatRef}
          className="space-y-3 max-h-[60vh] overflow-y-auto pr-2"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}
        >
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No transcript available</div>
          ) : messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center flex-shrink-0 text-blue-400 text-xs font-bold">AI</div>
              )}
              <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-700/80 text-gray-100 rounded-bl-sm border border-gray-600/50'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 text-gray-300 text-xs font-bold">U</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── PER-QUESTION FEEDBACK TAB ─── */}
      {activeTab === 'feedback' && (
        <div className="space-y-3">
          {perQ.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No per-question feedback available. Run analysis first.</div>
          ) : perQ.map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-700/40 border border-gray-600/50 hover:bg-gray-700/60 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Q{i + 1}</span>
                    {item.score && <MiniScore score={item.score} />}
                  </div>
                  <p className="text-white text-sm font-medium mb-2">{item.question}</p>
                  {item.assessment && (
                    <p className="text-gray-400 text-sm leading-relaxed">{item.assessment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
