// src/routes/availability.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');

// POST /participants/:participantId/availability - save matrix
router.post('/participants/:participantId/availability', express.json(), (req, res) => {
  const participantId = req.params.participantId;
  const matrix = req.body.availability;
  if (!participantId || !Array.isArray(matrix)) {
    return res.status(400).json({ error: 'Missing participantId or invalid matrix' });
  }
  try {
    db.saveAvailabilityMatrix(participantId, matrix);
    // Return updated aggregates for UI refresh
    const eventId = req.params.id;
    const dbEvent = require('../db');
    const event = dbEvent.getEventById(eventId);
    if (!event) return res.json({ success: true });
    const timeBlocksUtil = require('../utils/timeBlocks');
    const bestTimesUtil = require('../utils/bestTimes');
    const gridConfig = timeBlocksUtil.buildGridConfig(event);
    const { dateBlocks, timeBlocks, numDays, numTimes } = gridConfig;
    const { mergedAvailability, participants } = db.getAllAvailabilityForEvent(eventId, numDays, numTimes);
    const participantCount = participants.length;
    const bestTimes = bestTimesUtil.findBestTimes({
      mergedAvailability,
      meetingDurationMinutes: 30,
      intervalMinutes: 30,
      dateBlocks,
      timeBlocks,
      participantCount
    });
    return res.json({ success: true, bestTimes, mergedAvailability });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error saving availability' });
  }
});

// GET /availability - get merged availability, participants, and best times
router.get('/availability', (req, res) => {
  const eventId = req.params.id;
  try {
    // Get event info for grid config
    const dbEvent = require('../db');
    const event = dbEvent.getEventById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const timeBlocksUtil = require('../utils/timeBlocks');
    const bestTimesUtil = require('../utils/bestTimes');
    const gridConfig = timeBlocksUtil.buildGridConfig(event);
    const { dateBlocks, timeBlocks, numDays, numTimes } = gridConfig;
    const { mergedAvailability, participants } = db.getAllAvailabilityForEvent(eventId, numDays, numTimes);
    const participantCount = participants.length;
    const bestTimes = bestTimesUtil.findBestTimes({
      mergedAvailability,
      meetingDurationMinutes: 30,
      intervalMinutes: 30,
      dateBlocks,
      timeBlocks,
      participantCount
    });
    return res.json({ mergedAvailability, participants, bestTimes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error loading availability' });
  }
});

module.exports = router;