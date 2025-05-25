// controllers/chatController.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.sendMessage = async (req, res) => {
  // ✅ Check if API key is loaded
  if (!process.env.GOOGLE_API_KEY) {
    console.error('FATAL ERROR: GOOGLE_API_KEY is not defined!');
    return res.status(500).json({ error: 'Server misconfiguration: GOOGLE_API_KEY missing.' });
  }

  // ✅ Initialize the Google Generative AI client
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" }); // or "gemini-pro"

  // ✅ Validate user input
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  console.log('Received message:', message);

  try {
    // Start a chat session
    const chat = model.startChat({});

    // Send user message
    const result = await chat.sendMessage(message);

    // Get AI response
    const aiResponse = await result.response.text();

    console.log('AI Response:', aiResponse);

    // Send response back to client
    res.json({ reply: aiResponse });

  } catch (error) {
    console.error('Error calling Google Gemini API:', error);
    res.status(500).json({
      error: 'Failed to get response from AI',
      details: error.message
    });
  }
};
