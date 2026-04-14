const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// GET /api/admin/reviews - Get all reviews (admin view)
router.get('/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const filter = req.query.filter;

    const query = {};
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

// DELETE /api/admin/reviews/:id - Soft delete a review
router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/reviews/bulk/fake - Delete all fake reviews
router.delete('/reviews/bulk/fake', async (req, res) => {
  try {
    const result = await Review.updateMany(
      { classification: 'FAKE' },
      { isDeleted: true }
    );
    res.json({ message: `Deleted ${result.modifiedCount} fake reviews` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/reviews/:id/restore - Restore deleted review
router.patch('/reviews/:id/restore', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    );
    res.json({ message: 'Review restored', review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
