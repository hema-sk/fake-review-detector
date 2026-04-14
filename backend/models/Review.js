const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  text: { type: String, required: true },
  classification: { type: String, enum: ['FAKE', 'GENUINE'], required: true },
  confidence: { type: Number, required: true },
  fake_probability: { type: Number, required: true },
  genuine_probability: { type: Number, required: true },
  features: {
    fake_pattern_hits: Number,
    genuine_pattern_hits: Number,
    caps_ratio: Number,
    exclamation_count: Number,
    avg_word_length: Number,
    review_length: Number,
    unique_word_ratio: Number,
  },
  source: { type: String, default: 'manual' }, // 'manual' | 'csv'
  batchId: { type: String, default: null },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

reviewSchema.index({ classification: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
