// src/utils/timeBlocks.js
// Utilities for building time and date blocks for the event grid

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

// minTime, maxTime: "HH:MM", intervalMinutes: number
function buildTimeBlocks(minTime, maxTime, intervalMinutes) {
  // Parse minTime and maxTime
  const [minH, minM] = minTime.split(':').map(Number);
  const [maxH, maxM] = maxTime.split(':').map(Number);
  const minMinutes = minH * 60 + minM;
  const maxMinutes = maxH * 60 + maxM;
  const timeBlocks = [];
  let idx = 0;
  for (let mins = minMinutes; mins < maxMinutes; mins += intervalMinutes) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    timeBlocks.push({
      index: idx,
      label: pad(h) + ':' + pad(m),
      minutesFromMidnight: mins
    });
    idx++;
  }
  return timeBlocks;
}

// startDate, endDate: "YYYY-MM-DD"
function buildDateBlocks(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateBlocks = [];
  let idx = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Day of week short name
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    dateBlocks.push({
      index: idx,
      label: `${dayName} ${dayNum}`,
      date: d.toISOString().slice(0, 10)
    });
    idx++;
  }
  return dateBlocks;
}

// event: { start_date, end_date, min_time, max_time }
function buildGridConfig(event) {
  const intervalMinutes = 30; // Default interval
  const dateBlocks = buildDateBlocks(event.start_date, event.end_date);
  const timeBlocks = buildTimeBlocks(event.min_time, event.max_time, intervalMinutes);
  return {
    dateBlocks,
    timeBlocks,
    numDays: dateBlocks.length,
    numTimes: timeBlocks.length
  };
}

module.exports = {
  buildTimeBlocks,
  buildDateBlocks,
  buildGridConfig
};