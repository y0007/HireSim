// src/pages/Interview.jsx — HireSim modernized with SSE Streaming + Whisper STT + Progress tracking
import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Animated typing cursor
function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 px-4 py-3 bg-gray-700/60 rounded-2xl rounded-tl-sm w-fit">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// Progress bar component
function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Question {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Interview() {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Chat state
  const [history, setHistory] = useState([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Input state
  const [textAnswer, setTextAnswer] = useState('');
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'voice'

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Interview metadata
  const [interviewMeta, setInterviewMeta] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);

  // Refs
  const chatRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const textareaRef = useRef(null);

  // Scroll chat to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }, []);

  // Load interview metadata on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`${API}/interviews/${interviewId}`, { headers: getAuthHeaders() });
        const doc = res.data;
        setInterviewMeta(doc);
        setTotalQuestions(doc.numQuestions || 5);

        if (doc.status && doc.status !== 'in_progress') {
          navigate(`/analysis/${interviewId}`, { replace: true });
          return;
        }

        // Rebuild history from context (exclude system prompt)
        if (Array.isArray(doc.context) && doc.context.length > 1) {
          const msgs = doc.context
            .filter(c => c.role !== 'system')
            .map(c => ({ role: c.role, text: c.content }));
          setHistory(msgs);
          if (msgs.length > 0) setStarted(true);
          const qNum = msgs.filter(m => m.role === 'assistant').length;
          setQuestionNumber(qNum);
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        setStatusMsg('Failed to load interview');
      }
    }
    load();
  }, [interviewId, navigate]);

  useEffect(() => { scrollToBottom(); }, [history, streamingText]);

  // TTS
  const speak = useCallback((text) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google'));
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  }, []);

  // Add message to history
  const addMessage = useCallback((role, text) => {
    setHistory(prev => [...prev, { role, text }]);
    if (role === 'assistant') speak(text);
  }, [speak]);

  // ─── STREAMING SSE TURN ────────────────────────────────────────────────────
  const sendStreamingTurn = useCallback(async (answer) => {
    if (isSubmitting || isStreaming) return;
    setIsSubmitting(true);
    setIsTyping(false);

    // Optimistically add user message
    setHistory(prev => [...prev, { role: 'user', text: answer }]);
    setTextAnswer('');

    setIsStreaming(true);
    setStreamingText('');

    try {
      const response = await fetch(`${API}/interviews/${interviewId}/stream-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ answer }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let isDone = false;
      let finalQuestionNumber = questionNumber + 1;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'token') {
              fullText += data.token;
              setStreamingText(fullText);
            } else if (data.type === 'done') {
              isDone = data.done;
              finalQuestionNumber = data.questionNumber || finalQuestionNumber;
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch {}
        }
      }

      // Commit streamed message to history
      setStreamingText('');
      setIsStreaming(false);
      setHistory(prev => [...prev, { role: 'assistant', text: fullText }]);
      speak(fullText);
      setQuestionNumber(finalQuestionNumber);

      if (isDone) {
        setDone(true);
        setStatusMsg('Interview complete! Redirecting to analysis...');
        setTimeout(() => navigate(`/analysis/${interviewId}`), 2500);
      }
    } catch (err) {
      console.error('Streaming error, falling back to regular:', err);
      // Fallback to non-streaming
      await sendRegularTurn(answer, true);
    } finally {
      setIsSubmitting(false);
      setIsStreaming(false);
    }
  }, [interviewId, isSubmitting, isStreaming, questionNumber, navigate, speak]);

  // ─── REGULAR (NON-STREAMING) TURN FALLBACK ───────────────────────────────
  const sendRegularTurn = useCallback(async (answer, skipUserMsg = false) => {
    if (!skipUserMsg) {
      setHistory(prev => [...prev, { role: 'user', text: answer }]);
      setTextAnswer('');
    }
    setIsTyping(true);
    try {
      const res = await axios.post(
        `${API}/interviews/${interviewId}/turn`,
        { answer },
        { headers: getAuthHeaders() }
      );
      setIsTyping(false);
      const { assistant, done: isDone, questionNumber: qNum, totalQuestions: total } = res.data;
      addMessage('assistant', assistant);
      if (qNum) setQuestionNumber(qNum);
      if (total) setTotalQuestions(total);
      if (isDone) {
        setDone(true);
        setTimeout(() => navigate(`/analysis/${interviewId}`), 2500);
      }
    } catch (err) {
      setIsTyping(false);
      setStatusMsg(err?.response?.data?.message || 'Failed to get response');
    }
  }, [interviewId, addMessage, navigate]);

  // ─── START INTERVIEW ───────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    setStarted(true);
    setIsTyping(true);
    try {
      const res = await axios.post(
        `${API}/interviews/${interviewId}/turn`,
        { answer: '__start__' },
        { headers: getAuthHeaders() }
      );
      setIsTyping(false);
      const { assistant, totalQuestions: total } = res.data;
      if (total) setTotalQuestions(total);
      setQuestionNumber(1);
      addMessage('assistant', assistant);
    } catch {
      setIsTyping(false);
      // Show first question from meta if API fails
      const firstQ = interviewMeta?.questions?.[0] || 'Tell me about yourself and what excites you about this role.';
      addMessage('assistant', firstQ);
      setQuestionNumber(1);
    }
  }, [interviewId, addMessage, interviewMeta]);

  // ─── TEXT SUBMIT ───────────────────────────────────────────────────────────
  const handleTextSubmit = useCallback((e) => {
    e?.preventDefault();
    const answer = textAnswer.trim();
    if (!answer || isSubmitting || isStreaming || done) return;
    sendStreamingTurn(answer);
  }, [textAnswer, isSubmitting, isStreaming, done, sendStreamingTurn]);

  // Ctrl+Enter to submit
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleTextSubmit();
  }, [handleTextSubmit]);

  // ─── WHISPER VOICE RECORDING ───────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      mr.start(250);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      setStatusMsg('Microphone access denied. Please allow microphone access.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  }, [isRecording]);

  // Transcribe audio with Whisper when recording stops and blob is ready
  useEffect(() => {
    if (!audioBlob) return;
    async function transcribe() {
      setIsTranscribing(true);
      setStatusMsg('Transcribing with Whisper AI...');
      try {
        const form = new FormData();
        form.append('audio', audioBlob, 'recording.webm');
        const res = await axios.post(`${API}/transcribe`, form, {
          headers: { ...getAuthHeaders() },
        });
        const text = res.data?.text || '';
        if (text.trim()) {
          setTextAnswer(text.trim());
          setInputMode('text');
          setStatusMsg('✓ Transcribed! Review and submit.');
        } else {
          setStatusMsg('No speech detected. Try again.');
        }
      } catch (err) {
        // Fall back to browser STT if Whisper fails
        setStatusMsg('Whisper unavailable — using browser speech recognition.');
        startBrowserSTT();
      } finally {
        setIsTranscribing(false);
        setAudioBlob(null);
      }
    }
    transcribe();
  }, [audioBlob]);

  // Browser speech recognition fallback
  const startBrowserSTT = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setStatusMsg('Speech recognition not supported in this browser.'); return; }
    const recog = new SpeechRecognition();
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setTextAnswer(transcript);
      setInputMode('text');
    };
    recog.onerror = () => setStatusMsg('Speech recognition error.');
    recog.start();
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  const metaLabel = interviewMeta ? `${interviewMeta.position || 'Interview'} @ ${interviewMeta.company || ''}` : '';

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto px-4 py-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-white">{metaLabel}</h1>
          <div className="flex items-center gap-2 mt-1">
            {interviewMeta?.difficulty && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                interviewMeta.difficulty === 'hard' ? 'bg-red-900/40 text-red-400' :
                interviewMeta.difficulty === 'medium' ? 'bg-yellow-900/40 text-yellow-400' :
                'bg-green-900/40 text-green-400'
              }`}>{interviewMeta.difficulty}</span>
            )}
            {interviewMeta?.mode && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 font-medium">
                {interviewMeta.mode}
              </span>
            )}
            {interviewMeta?.ragUsed !== false && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-400 font-medium">
                ⚡ RAG
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-400 hover:text-white transition px-3 py-1.5 border border-gray-600 rounded-lg hover:border-gray-500"
        >
          ✕ End
        </button>
      </div>

      {/* Progress bar */}
      {started && (
        <div className="mb-3 flex-shrink-0">
          <ProgressBar current={questionNumber} total={totalQuestions} />
        </div>
      )}

      {/* Status message */}
      {statusMsg && (
        <div className={`mb-2 px-3 py-2 rounded-lg text-sm flex-shrink-0 ${
          statusMsg.startsWith('✓') ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'
        }`}>
          {statusMsg}
        </div>
      )}

      {/* Chat window */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 transparent' }}
      >
        {/* Welcome state */}
        {!started && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                </svg>
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">Ready to Start?</h2>
              <p className="text-gray-400 text-sm mb-6">
                Your interview has been prepared with {totalQuestions} AI-powered questions tailored to your role and background.
              </p>
              <button
                onClick={handleStart}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
              >
                Start Interview
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center flex-shrink-0 text-blue-400 text-xs font-bold">
                AI
              </div>
            )}
            <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-700/80 text-gray-100 rounded-bl-sm border border-gray-600/50'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 text-gray-300 text-xs font-bold">
                U
              </div>
            )}
          </div>
        ))}

        {/* Streaming text */}
        {isStreaming && streamingText && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center flex-shrink-0 text-blue-400 text-xs font-bold">
              AI
            </div>
            <div className="max-w-[78%] px-4 py-3 rounded-2xl rounded-bl-sm bg-gray-700/80 text-gray-100 text-sm leading-relaxed border border-gray-600/50">
              <div className="whitespace-pre-wrap">{streamingText}<span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse" /></div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {(isTyping || (isStreaming && !streamingText)) && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center flex-shrink-0 text-blue-400 text-xs font-bold">
              AI
            </div>
            <TypingIndicator />
          </div>
        )}

        {/* Done state */}
        {done && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-600/40 rounded-xl text-green-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Interview complete! Generating your analysis...
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      {started && !done && (
        <div className="flex-shrink-0 mt-3 border-t border-gray-700 pt-3">
          {/* Mode toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setInputMode('text')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                inputMode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              ⌨️ Type Answer
            </button>
            <button
              onClick={() => setInputMode('voice')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                inputMode === 'voice' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              🎙️ Voice (Whisper AI)
            </button>
          </div>

          {inputMode === 'text' ? (
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={textAnswer}
                onChange={e => setTextAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting || isStreaming}
                placeholder="Type your answer... (Ctrl+Enter to send)"
                rows={3}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500 transition disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!textAnswer.trim() || isSubmitting || isStreaming}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 self-end"
              >
                {isSubmitting || isStreaming ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                Send
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {isTranscribing ? (
                <div className="flex items-center gap-2 text-blue-400 text-sm">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Transcribing with Whisper AI...
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <span className="w-3 h-3 bg-white rounded-sm" />
                        Stop Recording · {formatTime(recordingTime)}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                        Start Recording
                      </>
                    )}
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500">Powered by Groq Whisper · Accurate multilingual transcription</p>
            </div>
          )}

          {/* Skip button */}
          <div className="flex justify-end mt-2">
            <button
              onClick={() => sendStreamingTurn('[Skipped]')}
              disabled={isSubmitting || isStreaming}
              className="text-xs text-gray-500 hover:text-gray-400 transition"
            >
              Skip question →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
