// controllers/chatController.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/chat'); // NEW: Import the Chat model

// Initialize Google Generative AI client outside the function for efficiency
// Ensure process.env.GOOGLE_API_KEY is loaded (e.g., using dotenv in your server.js)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

// Function to handle sending messages and saving to DB
exports.sendMessage = async (req, res) => {
    // Check if API key is loaded
    if (!process.env.GOOGLE_API_KEY) {
        console.error('FATAL ERROR: GOOGLE_API_KEY is not defined in environment variables!');
        return res.status(500).json({ error: 'Server misconfiguration: GOOGLE_API_KEY missing.' });
    }

    // Validate user input
    const { message, chatId } = req.body; // NEW: Expect chatId for existing conversations
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        console.error('Validation Error: Message content is required or invalid.');
        return res.status(400).json({ error: 'Message content is required' });
    }

    console.log('Received message:', message, 'Chat ID:', chatId || 'New Chat');

    try {
        let chatConversation;

        // If a chatId is provided, find the existing chat
        if (chatId) {
            console.log(`Attempting to find chat with ID: ${chatId}`);
            chatConversation = await Chat.findById(chatId);
            if (!chatConversation) {
                console.error(`Error: Chat conversation with ID ${chatId} not found.`);
                return res.status(404).json({ error: 'Chat conversation not found.' });
            }
            console.log(`Found existing chat: ${chatConversation._id}`);
        } else {
            // If no chatId, this is a new conversation
            console.log('Creating a new chat conversation.');
            chatConversation = new Chat();
            // Set an initial title based on the first message
            chatConversation.title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
        }

        // Add user message to the conversation history
        chatConversation.messages.push({ sender: 'user', text: message });
        console.log('User message added to chat history.');

        // Prepare chat history for the AI model
        // The Gemini API expects roles 'user' and 'model'
        const historyForAI = chatConversation.messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
        console.log('Prepared history for AI:', JSON.stringify(historyForAI));

        // Start a chat session with the model, providing the history
        const chat = model.startChat({
            history: historyForAI,
            generationConfig: {
                maxOutputTokens: 500, // Limit AI response length
            },
        });
        console.log('Gemini chat session started.');

        // Send the new user message to the AI
        console.log('Sending message to Gemini API...');
        const result = await chat.sendMessage(message);
        console.log('Received result from Gemini API.');

        // Get AI response
        const aiResponse = await result.response.text();
        console.log('AI Response:', aiResponse);

        // Add AI response to the conversation history
        chatConversation.messages.push({ sender: 'ai', text: aiResponse });
        console.log('AI response added to chat history.');

        // Update the updatedAt timestamp
        chatConversation.updatedAt = Date.now();
        console.log('Saving chat conversation to database...');
        // Save the updated/new chat conversation to the database
        await chatConversation.save();
        console.log('Chat conversation saved successfully. Chat ID:', chatConversation._id);

        // Send response back to client, including the chat ID
        res.json({ reply: aiResponse, chatId: chatConversation._id });

    } catch (error) {
        console.error('Error in sendMessage function:', error);
        // Log more specific error details
        if (error.response) {
            console.error('Gemini API Error Response Data:', error.response.data);
            console.error('Gemini API Error Response Status:', error.response.status);
            console.error('Gemini API Error Response Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Gemini API Error Request:', error.request);
        } else {
            console.error('General Error Message:', error.message);
        }
        res.status(500).json({
            error: 'Failed to get response from AI or save chat',
            details: error.message // Provide more details to the client
        });
    }
};

// NEW: Function to get a list of all chat conversations
exports.getChatList = async (req, res) => {
    try {
        console.log('Fetching chat list...');
        // Fetch all chats, sorted by last updated, and only include _id, title, and first message
        const chats = await Chat.find({})
                                .select('_id title messages createdAt updatedAt')
                                .sort({ updatedAt: -1 }); // Sort by most recently updated

        // For the list, we only need a summary, so we can pick the first message
        const chatList = chats.map(chat => ({
            _id: chat._id,
            title: chat.title,
            // Provide the first message's text for a preview
            messages: chat.messages.length > 0 ? [{ text: chat.messages[0].text }] : [],
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt
        }));
        console.log(`Found ${chatList.length} chats.`);
        res.json(chatList);
    } catch (error) {
        console.error('Error fetching chat list:', error);
        res.status(500).json({
            error: 'Failed to retrieve chat list',
            details: error.message
        });
    }
};

// NEW: Function to get the full history of a specific chat conversation
exports.getChatHistory = async (req, res) => {
    try {
        const { chatId } = req.params;
        console.log(`Fetching history for chat ID: ${chatId}`);
        const chat = await Chat.findById(chatId);

        if (!chat) {
            console.error(`Chat history for ID ${chatId} not found.`);
            return res.status(404).json({ error: 'Chat conversation not found.' });
        }
        console.log(`Successfully fetched chat history for ID: ${chatId}`);
        res.json(chat); // Return the full chat object
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({
            error: 'Failed to retrieve chat history',
            details: error.message
        });
    }
};

// NEW: Function to delete a specific chat conversation
exports.deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        console.log(`Attempting to delete chat with ID: ${chatId}`);
        const result = await Chat.findByIdAndDelete(chatId);

        if (!result) {
            console.error(`Chat with ID ${chatId} not found for deletion.`);
            return res.status(404).json({ error: 'Chat conversation not found.' });
        }
        console.log(`Chat ${chatId} deleted successfully.`);
        res.status(200).json({ message: 'Chat conversation deleted successfully.' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({
            error: 'Failed to delete chat',
            details: error.message
        });
    }
};
