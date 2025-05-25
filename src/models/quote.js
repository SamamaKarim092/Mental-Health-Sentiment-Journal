// src/models/quote.js
const mongoose = require('mongoose');

const QuoteSchema = mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    default: 'Unknown',
    trim: true
  },
  type: {
    type: String,
    enum: ['quote', 'tip'], // Differentiate between quotes and tips
    required: true
  },
  sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'], // Can add sentiment for quotes/tips too
      default: 'positive' // Most inspirational content is positive/neutral
  }
  // You could add a category field later if you want to categorize tips/quotes
}, {
  timestamps: true
});

const Quote = mongoose.model('Quote', QuoteSchema);

module.exports = Quote;