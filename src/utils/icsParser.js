// src/utils/icsParser.js
const ical = require('node-ical');
const { DateTime, Interval } = require('luxon');

// Helper: parse time string "HH:MM" to minutes from midnight
function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Helper: get all days between start and end (inclusive)
function getDateList(startDate, endDate) {
  const days = [];
  let d = DateTime.fromISO(startDate);
  const end = DateTime.fromISO(endDate);
  while (d <= end) {
    days.push(d);
    d = d.plus({ days: 1 });
  }
  return days;
}

// Main function
function buildAvailabilityFromICS(options) {
  const {
    icsText,
    eventStartDate,
    eventEndDate,
    minTime,
    maxTime,
    intervalMinutes,
    timezone
  } = options;

  // Build grid
  const days = getDateList(eventStartDate, eventEndDate);
  const numDays = days.length;
  const minMins = timeToMinutes(minTime);
  const maxMins = timeToMinutes(maxTime);
  const numTimes = Math.ceil((maxMins - minMins) / intervalMinutes);
  // busyMatrix: true = busy
  const busyMatrix = Array.from({ length: numDays }, () => Array(numTimes).fill(false));


  // Parse ICS with guard
  let events = {};
  try {
    events = ical.parseICS(icsText);
  } catch (err) {
    console.error('ICS parse error:', err && err.message ? err.message : err);
    // Return all free if ICS is bad
    return Array.from({ length: numDays }, () => Array(numTimes).fill(true));
  }
  for (const k in events) {
    const ev = events[k];
    if (!ev || ev.type !== 'VEVENT' || !ev.start || !ev.end) continue;
    // Use Luxon for timezone handling
    let start = DateTime.fromJSDate(ev.start, { zone: timezone });
    let end = DateTime.fromJSDate(ev.end, { zone: timezone });
    // Clip to event date range
    if (end <= days[0].startOf('day') || start >= days[numDays - 1].endOf('day')) continue;
    // For each day in event range
    for (let dayIdx = 0; dayIdx < numDays; dayIdx++) {
      const day = days[dayIdx];
      // Check overlap
      const dayStart = day.set({ hour: 0, minute: 0, second: 0 });
      const dayEnd = day.endOf('day');
      const overlap = Interval.fromDateTimes(start, end).overlaps(Interval.fromDateTimes(dayStart, dayEnd));
      if (!overlap) continue;
      // For each time block
      for (let t = 0; t < numTimes; t++) {
        const blockStart = day.plus({ minutes: minMins + t * intervalMinutes });
        const blockEnd = blockStart.plus({ minutes: intervalMinutes });
        const blockInterval = Interval.fromDateTimes(blockStart, blockEnd);
        if (Interval.fromDateTimes(start, end).overlaps(blockInterval)) {
          busyMatrix[dayIdx][t] = true;
        }
      }
    }
  }
  // Invert to availability
  const availabilityMatrix = busyMatrix.map(row => row.map(cell => !cell));
  return availabilityMatrix;
}

module.exports = { buildAvailabilityFromICS };