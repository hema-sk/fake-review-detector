const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { analyzeSingle, analyzeBatch } = require('../services/mlService');
const Review = require('../models/Review');

// POST /api/reviews/analyze - Analyze a single review
router.post('/analyze',
  [body('review').isString().trim().isLength({ min: 10, max: 5000 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { review } = req.body;
      const mlResult = await analyzeSingle(review);

      //const saved = await Review.create({
        //text: review,
        //classification: mlResult.classification,
        //confidence: mlResult.confidence,
        //fake_probability: mlResult.fake_probability,
        //genuine_probability: mlResult.genuine_probability,
        //features: mlResult.features,
        //source: 'manual',
      //});

      res.json(mlResult);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Analysis failed', message: err.message });
    }
  }
);

// POST /api/reviews/analyze-batch - Analyze multiple reviews
router.post('/analyze-batch',
  [body('reviews').isArray({ min: 1, max: 100 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { reviews, batchId } = req.body;
      const mlResult = await analyzeBatch(reviews);

      // Save all to DB
      const docs = mlResult.results.map(r => ({
        text: r.review,
        classification: r.classification,
        confidence: r.confidence,
        fake_probability: r.fake_probability,
        genuine_probability: r.genuine_probability,
        features: r.features,
        source: 'batch',
        batchId: batchId || null,
      }));
      //await Review.insertMany(docs);

      res.json(mlResult);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Batch analysis failed', message: err.message });
    }
  }
);

// GET /api/reviews - Get recent reviews with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = req.query.filter; // 'FAKE' | 'GENUINE' | undefined

    const query = { isDeleted: false };
    if (filter === 'FAKE' || filter === 'GENUINE') query.classification = filter;

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ reviews, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/stats - Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const total = await Review.countDocuments({ isDeleted: false });
    const fake = await Review.countDocuments({ classification: 'FAKE', isDeleted: false });
    const genuine = total - fake;

    const avgConfidenceResult = await Review.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, avgConf: { $avg: '$confidence' } } }
    ]);

    const recentTrend = await Review.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          fake: { $sum: { $cond: [{ $eq: ['$classification', 'FAKE'] }, 1, 0] } },
          genuine: { $sum: { $cond: [{ $eq: ['$classification', 'GENUINE'] }, 1, 0] } },
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 14 }
    ]);

    res.json({
      total,
      fake,
      genuine,
      fakePercent: total ? Math.round(fake / total * 100) : 0,
      genuinePercent: total ? Math.round(genuine / total * 100) : 0,
      avgConfidence: avgConfidenceResult[0]?.avgConf?.toFixed(3) || 0,
      trend: recentTrend,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
