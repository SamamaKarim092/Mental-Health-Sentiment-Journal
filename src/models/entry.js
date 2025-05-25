// src/models/entry.js
const mongoose = require('mongoose');

const EntrySchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true // Remove whitespace from both ends of a string
  },
  content: {
    type: String,
    required: true
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'], // Restrict sentiment to these values
    required: true
  },
  date: {
    type: Date,
    default: Date.now // Set the default date to the current time
  },
  // If you implement users later, you might add a user field:
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User' // Assuming you have a User model
  // }
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps automatically
});

const Entry = mongoose.model('Entry', EntrySchema);

module.exports = Entry;