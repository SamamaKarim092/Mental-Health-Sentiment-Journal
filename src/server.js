// src/server.js
const dotenv = require('dotenv');
console.log('Loading environment variables from .env file');
const app = require('./app'); // Import your Express app
const connectDB = require('./config/db'); // Import your DB connection function

// Load environment variables from .env file

dotenv.config();

// Connect to Database

connectDB();

const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

app.listen(PORT, () => {

console.log(`Server running on port ${PORT}`);

});