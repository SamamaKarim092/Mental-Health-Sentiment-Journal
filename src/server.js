// src/server.js
const dotenv = require('dotenv');
// IMPORTANT: Call dotenv.config() at the very top, before other requires
dotenv.config();

console.log('Loading environment variables from .env file');
// Now, process.env variables are available for all subsequent requires
const app = require('./app'); // Import your Express app
const connectDB = require('./config/db'); // Import your DB connection function


// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Google API Key (first 5 chars): ${process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.substring(0, 5) + '...' : 'Not Set'}`);
    console.log(`MongoDB URI (first 5 chars): ${process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 5) + '...' : 'Not Set'}`);
});
