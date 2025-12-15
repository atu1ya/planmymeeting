// src/app.js
const express = require('express');
const path = require('path');
const eventsRouter = require('./routes/events');
const participantsRouter = require('./routes/participants');
const availabilityRouter = require('./routes/availability');
const db = require('./db');

const app = express();

// Set up EJS with ejs-mate for layout support
app.engine('ejs', require('ejs-mate'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware: JSON and URL-encoded with size limits
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: false }));

// Serve static files from /public (relative path)
app.use(express.static(path.join(__dirname, '../public')));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).type('text').send('ok');
});

// Use routes
app.use('/', eventsRouter);
app.use('/events/:id', participantsRouter);
app.use('/events/:id', availabilityRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('An unexpected error occurred. Please try again later.');
});

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const ENV = process.env.NODE_ENV || 'development';
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} [env: ${ENV}]`);
});

// Graceful shutdown
function shutdown() {
  console.log('Server shutting down');
  server.close(() => {
    db.close && db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);