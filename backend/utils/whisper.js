'use strict';
const FormData = require('form-data');
const axios = require('axios');

async function transcribeAudio(audioBuffer, filename = 'audio.webm') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const form = new FormData();
  form.append('file', audioBuffer, { filename, contentType: 'audio/webm' });
  form.append('model', 'whisper-large-v3-turbo');
  form.append('response_format', 'json');
  form.append('language', 'en');

  const resp = await axios.post(
    'https://api.groq.com/openai/v1/audio/transcriptions',
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${apiKey}`
      },
      timeout: 30000
    }
  );

  return resp.data?.text || '';
}

module.exports = { transcribeAudio };
