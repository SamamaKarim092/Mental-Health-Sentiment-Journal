// src/routes/api/quotes.js
const express = require('express');
const router = express.Router();
const quoteController = require('../../controllers/quoteController'); // We will create this next

// @route   GET /api/quotes/random
// @desc    Get a random quote or tip
// @access  Public
router.get('/random', quoteController.getRandomQuote);

// @route   GET /api/quotes
// @desc    Get all quotes/tips (or filtered) - Optional route
// @access  Public
// router.get('/', quoteController.getQuotes); // Uncomment if you need a route to get all quotes

// If you wanted routes to add/edit/delete quotes (e.g., for admin)
// router.post('/', quoteController.createQuote);
// router.put('/:id', quoteController.updateQuote);
// router.delete('/:id', quoteController.deleteQuote);


module.exports = router;