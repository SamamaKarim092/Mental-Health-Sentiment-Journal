// src/app.js
const express = require('express');
const path = require('path'); // Node.js built-in module for path manipulation

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files (your HTML, CSS, JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'journal.html'));
});

app.get('/trend', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'trend.html'));
});

app.get('/quote', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'quote.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'chat.html'));
});


// TODO: Mount API routes here later
const entryRoutes = require('./routes/api/entries');
const quoteRoutes = require('./routes/api/quotes'); 
const chatRoutes = require('./routes/api/chat');

app.use('/api/entries', require('./routes/api/entries')); 
// Example: app.use('/api/entries', require('./routes/api/entries'))
app.use('/api/quotes', require('./routes/api/quotes')); 
app.use('/api/chat',require('./routes/api/chat'));
// TODO: Add error handling middleware here later


module.exports = app;