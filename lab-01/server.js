const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Request logging middleware
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url} - Status: ${res.statusCode}`);
  });
  next();
});

// JSON body parser (good practice)
app.use(express.json());

// Routes
// 1. GET / - Welcome message
app.get('/', (req, res) => {
  res.status(200).send('Welcome to BDF Lab 1 - Node.js and Express Server!');
});

// 2. GET /about - Student info
app.get('/about', (req, res) => {
  res.status(200).json({
    name: "Narala Sai Manuharsha",
    section: "CSE-QE-2B-204"
  });
});

// 3. GET /time - Current date and time
app.get('/time', (req, res) => {
  res.status(200).send(new Date().toString());
});

// 4. Catch-all middleware for 404 Not Found
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
});

module.exports = { app, server };

