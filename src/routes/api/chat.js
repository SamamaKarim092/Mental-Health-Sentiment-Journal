// routes/api/chat.js
const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chatController'); // Adjust path if needed

// Define the POST route for sending messages
// The frontend will send a POST request to /api/chat with the message in the body
router.post('/', chatController.sendMessage);

module.exports = router;