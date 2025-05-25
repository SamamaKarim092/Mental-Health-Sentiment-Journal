// routes/api/chat.js
const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chatController'); // Adjust path if needed

// Define the POST route for sending messages (existing, now handles saving)
router.post('/', chatController.sendMessage);

// NEW: Define the GET route for fetching the list of chat conversations
router.get('/list', chatController.getChatList);

// NEW: Define the GET route for fetching a specific chat's history
router.get('/history/:chatId', chatController.getChatHistory);

// NEW: Define the DELETE route for deleting a specific chat conversation
router.delete('/:chatId', chatController.deleteChat);

module.exports = router;