'use strict';
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { transcribeAudio } = require('../utils/whisper');
const logger = require('../utils/logger');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.post('/', upload.single('audio'), async (req, res) => {
  const start = Date.now();
  try {
    if (!req.file) return res.status(400).json({ message: 'No audio file provided' });
    const text = await transcribeAudio(req.file.buffer, req.file.originalname || 'audio.webm');
    logger.llmCall({ model: 'whisper-large-v3-turbo', latencyMs: Date.now() - start, success: true, endpoint: 'transcription' });
    return res.json({ text });
  } catch (err) {
    logger.error('whisper_transcription_failed', { error: err.message });
    console.error('Transcription error:', err.response?.data || err.message);
    return res.status(500).json({ message: 'Transcription failed', error: err.message });
  }
});

module.exports = router;
