'use strict';
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { ObjectId } = require('mongodb');
const { ChatGroq } = require('@langchain/groq');
const { HumanMessage, SystemMessage, AIMessage } = require('@langchain/core/messages');
const { retrieveRelevantQuestions } = require('../utils/vectorStore');
const logger = require('../utils/logger');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

function getLLM(streaming = false) {
  return new ChatGroq({
    model: process.env.GROQ_MODEL || 'groq/compound-mini',
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.7,
    maxTokens: 512,
    streaming,
  });
}

function extractJsonSubstring(text) {
  if (!text || typeof text !== 'string') return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) {
    try { return JSON.parse(fenced[1].trim()); } catch {}
  }
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }
  return null;
}

function parseQuestionsFromText(text) {
  if (!text) return [];
  text = text.replace(/```[\s\S]*?```/g, '').trim();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];
  let cur = '';
  for (const l of lines) {
    if (/^(\d+[\.\)]|\-|\*|\u2022)\s+/.test(l)) {
      if (cur) items.push(cur.trim());
      cur = l.replace(/^(\d+[\.\)]|\-|\*|\u2022)\s+/, '');
    } else {
      cur += (cur ? ' ' : '') + l;
    }
  }
  if (cur) items.push(cur.trim());
  return items;
}

async function callLLM(messages) {
  const start = Date.now();
  try {
    const llm = getLLM(false);
    const langchainMessages = messages.map(m => {
      if (m.role === 'system') return new SystemMessage(m.content);
      if (m.role === 'assistant') return new AIMessage(m.content);
      return new HumanMessage(m.content);
    });
    const response = await llm.invoke(langchainMessages);
    const text = typeof response.content === 'string' ? response.content : String(response.content);
    logger.llmCall({
      model: process.env.GROQ_MODEL,
      latencyMs: Date.now() - start,
      success: true,
      endpoint: 'chat'
    });
    return text;
  } catch (err) {
    logger.error('llm_call_failed', { error: err.message });
    throw err;
  }
}

function robustParseAnalysis(llmText) {
  const parsed = extractJsonSubstring(llmText);
  if (parsed && parsed.scores) {
    return {
      analysis: {
        scores: parsed.scores,
        summary: parsed.summary || llmText.slice(0, 500),
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        perQuestionFeedback: Array.isArray(parsed.perQuestionFeedback) ? parsed.perQuestionFeedback : [],
        overallGrade: parsed.overallGrade || null,
        hireProbability: parsed.hireProbability || null,
      },
      raw: llmText
    };
  }
  return {
    analysis: {
      scores: { communication: null, technical: null, structure: null, confidence: null, problemSolving: null },
      summary: llmText.slice(0, 1000),
      improvements: ['Could not parse structured analysis.'],
      strengths: [], perQuestionFeedback: [], overallGrade: null, hireProbability: null,
    },
    raw: llmText
  };
}

router.get('/', async (req, res) => {
  try {
    const interviews = await global.db.collection('interviews')
      .find({ userId: req.user.id })
      .project({ company: 1, position: 1, status: 1, createdAt: 1, updatedAt: 1, difficulty: 1, mode: 1, ragQuestions: 0 })
      .sort({ createdAt: -1 })
      .toArray();
    return res.json(interviews);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to list interviews' });
  }
});

router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const { company, position, description, requirements, numQuestions, difficulty, mode } = req.body;
    let resumeText = '';
    if (req.file && req.file.mimetype === 'application/pdf') {
      try {
        const parsed = await pdfParse(req.file.buffer);
        resumeText = (parsed && parsed.text) ? parsed.text.trim() : '';
      } catch (e) {}
    }

    const queryText = `${position || ''} ${company || ''} ${description || ''} ${requirements || ''} ${resumeText.slice(0, 500)}`;
    const ragQuestions = retrieveRelevantQuestions(queryText, 12);

    const systemPrompt = `You are an expert interviewer for ${position} at ${company}.
Job: ${description} | Req: ${requirements}
Candidate: ${resumeText.slice(0, 2000)}
Settings: ${numQuestions} questions, ${difficulty} diff, mode=${mode}
Bank: ${ragQuestions.join('; ')}
Rules: ONE question at a time. No runnable code. Keep follow-ups short.`;

    let questions = [];
    const qPrompt = `Generate ${numQuestions || 5} ${difficulty || 'medium'}-difficulty questions for ${position}.
Mix behavioral and technical. Return JSON: { "questions": ["Q1", "Q2", ...] }`;

    try {
      const qReply = await callLLM([{ role: 'system', content: systemPrompt }, { role: 'user', content: qPrompt }]);
      const parsed = extractJsonSubstring(qReply);
      if (parsed && Array.isArray(parsed.questions)) questions = parsed.questions.map(q => String(q).trim());
      else questions = parseQuestionsFromText(qReply);
    } catch (e) {}

    if (!questions || questions.length === 0) questions = ragQuestions.slice(0, Number(numQuestions) || 5);
    if (!questions || questions.length === 0) questions = ['Tell me about yourself.'];

    const doc = {
      userId: req.user.id,
      company, position, description, requirements,
      numQuestions: Number(numQuestions) || questions.length,
      difficulty, mode, resumeText, questions,
      ragQuestions, currentQuestionIndex: 0,
      context: [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: questions[0], ts: new Date() }
      ],
      status: 'in_progress', createdAt: new Date(), updatedAt: new Date()
    };
    const result = await global.db.collection('interviews').insertOne(doc);
    return res.json({ interviewId: result.insertedId, assistant: questions[0], ragUsed: true });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create interview session' });
  }
});

router.post('/:id/turn', async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const { answer } = req.body;
    const col = global.db.collection('interviews');
    const interview = await col.findOne({ _id });
    if (!interview || interview.status === 'completed') return res.status(400).json({ message: 'Invalid or completed' });

    let idx = interview.currentQuestionIndex || 0;
    const total = interview.numQuestions || 5;
    const context = interview.context || [];

    if (answer === '__start__') {
      const firstA = context.find(c => c.role === 'assistant');
      return res.json({ assistant: firstA?.content || 'Hello', questionNumber: 1, totalQuestions: total, done: false });
    }

    const isSkip = answer === '__skip__';
    const newContext = [...context, { role: 'user', content: isSkip ? '[Skipped]' : answer, ts: new Date() }];
    idx++;

    const isLast = idx >= total;
    const nextPrompt = isLast 
      ? `Interview complete. Thank candidate in 2 sentences.` 
      : `Based on answer, move to next question (${idx + 1}/${total}). 2 sentences max.`;

    const msgs = newContext.map(m => ({ role: m.role, content: m.content })).concat([{ role: 'user', content: nextPrompt }]);
    const assistantText = await callLLM(msgs);

    const finalContext = [...newContext, { role: 'assistant', content: assistantText, ts: new Date() }];
    await col.updateOne({ _id }, {
      $set: { context: finalContext, currentQuestionIndex: idx, status: isLast ? 'completed' : 'in_progress', updatedAt: new Date() }
    });

    return res.json({ assistant: assistantText, questionNumber: isLast ? idx : idx + 1, totalQuestions: total, done: isLast });
  } catch (err) {
    return res.status(500).json({ message: 'Turn failed' });
  }
});

router.post('/:id/stream-turn', async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const { answer } = req.body;
    const col = global.db.collection('interviews');
    const interview = await col.findOne({ _id });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    let idx = interview.currentQuestionIndex || 0;
    const total = interview.numQuestions || 5;
    const newContext = [...(interview.context || []), { role: 'user', content: answer, ts: new Date() }];
    idx++;

    const isLast = idx >= total;
    const nextPrompt = isLast ? `Interview complete. Thank candidate in 2 sentences.` : `Move to Q ${idx + 1}/${total}. 2 sentences max.`;

    const msgs = newContext.map(m => m.role === 'system' ? new SystemMessage(m.content) : m.role === 'assistant' ? new AIMessage(m.content) : new HumanMessage(m.content)).concat([new HumanMessage(nextPrompt)]);

    const llm = getLLM(true);
    let fullText = '';
    const stream = await llm.stream(msgs);
    for await (const chunk of stream) {
      const token = typeof chunk.content === 'string' ? chunk.content : '';
      if (token) {
        fullText += token;
        sendEvent({ type: 'token', token });
      }
    }

    const finalContext = [...newContext, { role: 'assistant', content: fullText, ts: new Date() }];
    await col.updateOne({ _id }, { $set: { context: finalContext, currentQuestionIndex: idx, status: isLast ? 'completed' : 'in_progress', updatedAt: new Date() } });

    sendEvent({ type: 'done', questionNumber: isLast ? idx : idx + 1, totalQuestions: total, done: isLast });
    res.end();
  } catch (err) {
    try { res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`); res.end(); } catch {}
  }
});

router.post('/:id/complete', async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    await global.db.collection('interviews').updateOne({ _id }, { $set: { status: 'completed', updatedAt: new Date() } });
    return res.json({ message: 'Completed' });
  } catch (e) { res.status(500).send('Error'); }
});

router.get('/:id', async (req, res) => {
  try {
    const interview = await global.db.collection('interviews').findOne({ _id: new ObjectId(req.params.id) }, { projection: { resumeText: 0 } });
    return res.json(interview);
  } catch (e) { res.status(500).send('Error'); }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const _id = new ObjectId(req.params.id);
    const col = global.db.collection('interviews');
    const interview = await col.findOne({ _id });

    const txt = interview.context.filter(c => c.role !== 'system').map(c => `${c.role}: ${c.content}`).join('\n');
    const p = `Evaluate transcript. Role: ${interview.position}. Return ONLY JSON:
{ "scores": {"communication":<1-5>, "technical":<1-5>, "structure":<1-5>, "confidence":<1-5>, "problemSolving":<1-5>},
  "overallGrade": "A/B/C/D", "hireProbability": "High/Medium/Low", "summary": "...", "strengths": [".."], "improvements": [".."],
  "perQuestionFeedback": [{"question": "..", "assessment": "..", "score": <1-5>}] }
Transcript:
${txt}`;

    const llmText = await callLLM([{ role: 'system', content: 'Expert coach. JSON only.' }, { role: 'user', content: p }]);
    const { analysis, raw } = robustParseAnalysis(llmText);
    await col.updateOne({ _id }, { $set: { analysis, analysisRaw: raw, updatedAt: new Date() } });
    return res.json({ analysis });
  } catch (e) { res.status(500).send('Error'); }
});

module.exports = router;
