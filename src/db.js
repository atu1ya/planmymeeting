// src/db.js
const path = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

// Open or create the database file
const db = new Database(path.join(__dirname, '../data.db'));

// Create tables if they do not exist
db.exec(`
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT,
  start_date TEXT,
  end_date TEXT,
  min_time TEXT,
  max_time TEXT,
  timezone TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  username TEXT,
  calendar_link_url TEXT,
  created_at TEXT,
  UNIQUE(event_id, username)
);

CREATE TABLE IF NOT EXISTS availability (
  participant_id TEXT,
  day_index INTEGER,
  time_index INTEGER,
  is_available INTEGER,
  PRIMARY KEY(participant_id, day_index, time_index)
);
`);

// Helper: get current ISO string
function now() {
  return new Date().toISOString();
}

// Exported functions will be added below...


// Create a new event
function createEvent(eventData) {
  const id = eventData.id || uuidv4();
  const stmt = db.prepare(`
    INSERT INTO events (id, name, start_date, end_date, min_time, max_time, timezone, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    eventData.name,
    eventData.start_date,
    eventData.end_date,
    eventData.min_time,
    eventData.max_time,
    eventData.timezone,
    now()
  );
  return getEventById(id);
}

// Get event by id
function getEventById(eventId) {
  const stmt = db.prepare('SELECT * FROM events WHERE id = ?');
  return stmt.get(eventId);
}


// List participants for an event (id, username)
function listParticipantsForEvent(eventId) {
  const stmt = db.prepare('SELECT id, username FROM participants WHERE event_id = ? ORDER BY created_at ASC');
  return stmt.all(eventId);
}

// Create or get participant by (event_id, username)
function createOrGetParticipant(eventId, username) {
  // Try to find existing
  let stmt = db.prepare('SELECT * FROM participants WHERE event_id = ? AND username = ?');
  let participant = stmt.get(eventId, username);
  if (participant) return participant;
  // Insert new
  const id = uuidv4();
  stmt = db.prepare('INSERT INTO participants (id, event_id, username, created_at) VALUES (?, ?, ?, ?)');
  stmt.run(id, eventId, username, now());
  return db.prepare('SELECT * FROM participants WHERE id = ?').get(id);
}


// Save or update a participant's calendar link URL
function saveParticipantCalendarLink(participantId, url) {
  const stmt = db.prepare('UPDATE participants SET calendar_link_url = ? WHERE id = ?');
  stmt.run(url, participantId);
}


// Save a participant's availability matrix (2D array of booleans)
function saveAvailabilityMatrix(participantId, matrix) {
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO availability (participant_id, day_index, time_index, is_available)
    VALUES (?, ?, ?, ?)
  `);
  const deleteStmt = db.prepare('DELETE FROM availability WHERE participant_id = ?');
  // Remove old availability for this participant
  deleteStmt.run(participantId);
  // Insert new matrix
  for (let day = 0; day < matrix.length; day++) {
    for (let time = 0; time < matrix[day].length; time++) {
      insertStmt.run(participantId, day, time, matrix[day][time] ? 1 : 0);
    }
  }
}

// Get a participant's availability matrix as 2D boolean array
function getAvailabilityMatrixForParticipant(participantId, numDays, numTimes) {
  const stmt = db.prepare('SELECT day_index, time_index, is_available FROM availability WHERE participant_id = ?');
  const rows = stmt.all(participantId);
  // Initialize matrix
  const matrix = Array.from({ length: numDays }, () => Array(numTimes).fill(false));
  for (const row of rows) {
    if (row.day_index < numDays && row.time_index < numTimes) {
      matrix[row.day_index][row.time_index] = !!row.is_available;
    }
  }
  return matrix;
}


// Get all participants and merged availability matrix for an event
function getAllAvailabilityForEvent(eventId, numDays, numTimes) {
  // Get participants
  const participants = listParticipantsForEvent(eventId);
  // Initialize merged matrix
  const merged = Array.from({ length: numDays }, () => Array(numTimes).fill(0));
  // For each participant, add their availability
  const stmt = db.prepare('SELECT id FROM participants WHERE event_id = ?');
  const participantRows = stmt.all(eventId);
  const availStmt = db.prepare('SELECT day_index, time_index, is_available FROM availability WHERE participant_id = ?');
  for (const p of participantRows) {
    const rows = availStmt.all(p.id);
    for (const row of rows) {
      if (row.day_index < numDays && row.time_index < numTimes && row.is_available) {
        merged[row.day_index][row.time_index] += 1;
      }
    }
  }
  return {
    participants,
    mergedAvailability: merged
  };
}

module.exports = {
  createEvent,
  getEventById,
  listParticipantsForEvent,
  createOrGetParticipant,
  saveParticipantCalendarLink,
  saveAvailabilityMatrix,
  getAvailabilityMatrixForParticipant,
  getAllAvailabilityForEvent
};