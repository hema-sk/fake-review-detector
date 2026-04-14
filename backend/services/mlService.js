const axios = require('axios');

const mlClient = axios.create({
  baseURL: process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

async function analyzeSingle(review) {
  const res = await mlClient.post('/analyze/single', { review });
  return res.data;
}

async function analyzeBatch(reviews) {
  const res = await mlClient.post('/analyze', { reviews });
  return res.data;
}

async function checkHealth() {
  const res = await mlClient.get('/health');
  return res.data;
}

module.exports = { analyzeSingle, analyzeBatch, checkHealth };