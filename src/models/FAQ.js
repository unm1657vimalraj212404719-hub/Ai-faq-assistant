const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: [true, 'Question is required'], trim: true },
    answer: { type: String, required: [true, 'Answer is required'], trim: true },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

faqSchema.index({ question: 'text', answer: 'text', category: 'text' });
faqSchema.index({ category: 1 });

module.exports = mongoose.model('FAQ', faqSchema);
