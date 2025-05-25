// src/controllers/entryController.js
const Entry = require('../models/entry');
const mongoose = require('mongoose');

// Helper function to check for valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Create a new journal entry
// @route   POST /api/entries
// @access  Public (will be private with auth later)
exports.createEntry = async (req, res) => {
  try {
    const { title, content, sentiment } = req.body;

    if (!title || !content || !sentiment) {
      return res.status(400).json({ message: 'Please include a title, content, and sentiment' });
    }

    if (!['positive', 'neutral', 'negative'].includes(sentiment)) {
      return res.status(400).json({ message: 'Invalid sentiment value' });
    }

    const newEntry = new Entry({
      title,
      content,
      sentiment
    });

    const savedEntry = await newEntry.save();
    res.status(201).json(savedEntry);

  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all journal entries (with optional filters)
// @route   GET /api/entries
// @access  Public (will be private with auth later)
exports.getEntries = async (req, res) => {
  try {
    const { sentiment, startDate, endDate } = req.query;
    const filter = {};

    if (sentiment && ['positive', 'neutral', 'negative'].includes(sentiment)) {
      filter.sentiment = sentiment;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lt = new Date(endDate);
      }
    }

    console.log('Applying backend filter:', filter);
    const entries = await Entry.find(filter).sort({ date: -1 });
    res.json(entries);

  } catch (error) {
    console.error('Error fetching entries with filters:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get data for emotional trends chart AND summary stats
// @route   GET /api/entries/trends
// @access  Public (will be private with auth later)
exports.getEmotionalTrendsData = async (req, res) => {
  try {
    const { period } = req.query;

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate.setDate(now.getDate() - 365);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
      default:
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    console.log(`Workspaceing trends data for period: ${period || 'month'} from ${startDate} to ${endDate}`);

    const results = await Entry.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $facet: {
          dailyTrends: [
            {
              $project: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                numericMood: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$sentiment", "positive"] }, then: 8 },
                      { case: { $eq: ["$sentiment", "neutral"] }, then: 5 },
                      { case: { $eq: ["$sentiment", "negative"] }, then: 2 }
                    ],
                    default: 0
                  }
                }
              }
            },
            {
              $group: {
                _id: "$date",
                averageMood: { $avg: "$numericMood" }
              }
            },
            {
              $sort: {
                _id: 1
              }
            }
          ],
          summaryStats: [
            {
              $group: {
                _id: null,
                totalEntries: { $sum: 1 },
                positiveCount: { $sum: { $cond: [{ $eq: ["$sentiment", "positive"] }, 1, 0] } },
                neutralCount: { $sum: { $cond: [{ $eq: ["$sentiment", "neutral"] }, 1, 0] } },
                negativeCount: { $sum: { $cond: [{ $eq: ["$sentiment", "negative"] }, 1, 0] } }
              }
            },
            {
              $project: {
                _id: 0,
                totalEntries: 1,
                positiveCount: 1,
                neutralCount: 1,
                negativeCount: 1
              }
            }
          ]
        }
      }
    ]);

    const formattedResults = {
      dailyTrends: results[0]?.dailyTrends || [],
      summaryStats: results[0]?.summaryStats[0] || {
        totalEntries: 0,
        positiveCount: 0,
        neutralCount: 0,
        negativeCount: 0
      }
    };

    res.json(formattedResults);

  } catch (error) {
    console.error('Error fetching trends data:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get a single journal entry by ID
// @route   GET /api/entries/:id
// @access  Public (will be private with auth later)
exports.getEntryById = async (req, res) => {
  try {
    const entryId = req.params.id;

    if (!isValidObjectId(entryId)) {
      return res.status(400).json({ message: 'Invalid entry ID format' });
    }

    const entry = await Entry.findById(entryId);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json(entry);

  } catch (error) {
    console.error('Error fetching entry by ID:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update a journal entry by ID
// @route   PUT /api/entries/:id
// @access  Public (will be private with auth later)
exports.updateEntry = async (req, res) => {
  try {
    const entryId = req.params.id;
    const updates = req.body;

    if (!isValidObjectId(entryId)) {
      return res.status(400).json({ message: 'Invalid entry ID format' });
    }

    const entry = await Entry.findByIdAndUpdate(entryId, updates, { new: true });

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json(entry);

  } catch (error) {
    console.error('Error updating entry by ID:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a journal entry by ID
// @route   DELETE /api/entries/:id
// @access  Public (will be private with auth later)
exports.deleteEntry = async (req, res) => {
  try {
    const entryId = req.params.id;

    if (!isValidObjectId(entryId)) {
      return res.status(400).json({ message: 'Invalid entry ID format' });
    }

    const entry = await Entry.findByIdAndDelete(entryId);

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.json({ message: 'Entry successfully deleted', deletedEntry: entry });

  } catch (error) {
    console.error('Error deleting entry by ID:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
