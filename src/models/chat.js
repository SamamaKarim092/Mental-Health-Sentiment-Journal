// src/models/chat.js
const mongoose = require('mongoose');

// Define the schema for a single message within a chat
const messageSchema = new mongoose.Schema({
    sender: {
        type: String, // 'user' or 'ai'
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now // Automatically set the time the message was added
    }
}, { _id: false }); // Do not create an _id for subdocuments (messages)

// Define the main Chat schema
const chatSchema = new mongoose.Schema({
    // An array to store all messages in this conversation
    messages: [messageSchema],
    // Optional: A summary or title for the chat, useful for display in history
    title: {
        type: String,
        default: 'New Chat' // Default title, can be updated later
    },
    // Timestamp for when the chat conversation was initiated
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Timestamp for when the chat was last updated (e.g., a new message was added)
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create a Mongoose model from the schema
const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;