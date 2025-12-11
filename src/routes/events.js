// src/routes/events.js
const express = require('express');
const router = express.Router();

// GET / - render home.ejs
router.get('/', (req, res) => {
  res.render('home');
});

// Dummy POST /events - just redirect to /
router.post('/events', (req, res) => {
  // In the future, create event logic goes here
  res.redirect('/');
});

module.exports = router;