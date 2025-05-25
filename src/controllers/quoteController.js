// src/controllers/quoteController.js
const Quote = require('../models/quote'); // Import the Quote model

// @desc    Get a random quote or tip
// @route   GET /api/quotes/random
// @access  Public
exports.getRandomQuote = async (req, res) => {
  try {
    // TODO: Implement logic to fetch a random quote/tip from MongoDB
    console.log('Fetching a random quote/tip...');

    // Example of how to get a random document using Mongoose aggregation:
    // const count = await Quote.countDocuments();
    // const random = Math.floor(Math.random() * count);
    // const randomQuote = await Quote.findOne().skip(random);

    // More efficient for larger collections if MongoDB version supports $sample:
    const randomQuotes = await Quote.aggregate([{ $sample: { size: 1 } }]);
    const randomQuote = randomQuotes.length > 0 ? randomQuotes[0] : null;


    if (!randomQuote) {
        // If no quotes are in the database
        return res.status(404).json({ message: 'No quotes or tips found' });
    }

    res.json(randomQuote); // Send the fetched quote

  } catch (error) {
    console.error('Error fetching random quote:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// If you uncommented the GET /api/quotes route, add this function:
// exports.getQuotes = async (req, res) => {
//   try {
//     // TODO: Implement logic to fetch all quotes/tips from MongoDB
//     console.log('Fetching all quotes/tips...');
//     const quotes = await Quote.find({});
//     res.json(quotes);
//   } catch (error) {
//     console.error('Error fetching all quotes:', error);
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// };

// If you uncommented the admin CRUD routes, add these functions:
// exports.createQuote = async (req, res) => { /* ... */ };
// exports.updateQuote = async (req, res) => { /* ... */ };
// exports.deleteQuote = async (req, res) => { /* ... */ };