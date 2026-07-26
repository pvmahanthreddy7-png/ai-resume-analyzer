const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  extractedText: {
    type: String
  },
  analysis: {
    score: Number,
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    missingSkills: [String],
    experienceLevel: String,
    summary: String
  },
  jobRole: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', resumeSchema);