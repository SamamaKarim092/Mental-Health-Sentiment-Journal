// src/routes/api/entries.js
const express = require('express');
const router = express.Router();
const entryController = require('../../controllers/entryController'); // We will create this next

// @route   POST /api/entries
// @desc    Create a new journal entry
// @access  Public (or Private if implementing auth)
router.post('/', entryController.createEntry);

// @route   GET /api/entries
// @desc    Get all journal entries (or filtered/paginated)
// @access  Public (or Private if implementing auth)
router.get('/', entryController.getEntries);

// @route   GET /api/entries/trends
// @desc    Get data for emotional trends chart
// @access  Public (or Private if implementing auth)
router.get('/trends', entryController.getEmotionalTrendsData); // New route for trends data

// @route   GET /api/entries/:id
// @desc    Get a single journal entry by ID
// @access  Public (or Private if implementing auth)
router.get('/:id', entryController.getEntryById);

// @route   PUT /api/entries/:id
// @desc    Update a journal entry by ID
// @access  Public (or Private if implementing auth)
router.put('/:id', entryController.updateEntry);

// @route   DELETE /api/entries/:id
// @desc    Delete a journal entry by ID
// @access  Public (or Private if implementing auth)
router.delete('/:id', entryController.deleteEntry);

module.exports = router;