const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { analyzeBatch } = require('../services/mlService');
const Review = require('../models/Review');

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// POST /api/upload/csv - Upload and analyze CSV
router.post('/csv', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const reviews = [];
  const batchId = uuidv4();

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => {
          // Accept columns: 'review', 'text', 'Review', 'Text', 'comment'
          const text = row.review || row.text || row.Review || row.Text || row.comment || Object.values(row)[0];
          if (text && text.trim().length > 5) reviews.push(text.trim());
        })
        .on('end', resolve)
        .on('error', reject);
    });

    fs.unlink(req.file.path, () => {}); // cleanup

    if (reviews.length === 0) {
      return res.status(400).json({ error: 'No valid reviews found in CSV. Ensure column is named "review" or "text".' });
    }
    if (reviews.length > 200) {
      return res.status(400).json({ error: 'Maximum 200 reviews per upload' });
    }

    const mlResult = await analyzeBatch(reviews);

    const docs = mlResult.results.map(r => ({
      text: r.review,
      classification: r.classification,
      confidence: r.confidence,
      fake_probability: r.fake_probability,
      genuine_probability: r.genuine_probability,
      features: r.features,
      source: 'csv',
      batchId,
    }));
    await Review.insertMany(docs);

    res.json({ ...mlResult, batchId });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: 'CSV processing failed', message: err.message });
  }
});

module.exports = router;
