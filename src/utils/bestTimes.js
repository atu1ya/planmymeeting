// src/utils/bestTimes.js
// Find best meeting times from merged availability

function findBestTimes(options) {
  const {
    mergedAvailability,
    meetingDurationMinutes = 30,
    intervalMinutes = 30,
    dateBlocks,
    timeBlocks,
    participantCount
  } = options;
  if (!Array.isArray(mergedAvailability) || !Array.isArray(dateBlocks) || !Array.isArray(timeBlocks)) return [];
  const windowSize = Math.max(1, Math.round(meetingDurationMinutes / intervalMinutes));
  const candidates = [];
  for (let dayIndex = 0; dayIndex < mergedAvailability.length; dayIndex++) {
    const row = mergedAvailability[dayIndex];
    for (let startTimeIndex = 0; startTimeIndex <= row.length - windowSize; startTimeIndex++) {
      let minAvail = Infinity;
      for (let w = 0; w < windowSize; w++) {
        minAvail = Math.min(minAvail, row[startTimeIndex + w]);
      }
      const availableCount = minAvail;
      const conflictCount = participantCount - availableCount;
      const endTimeIndex = startTimeIndex + windowSize - 1;
      candidates.push({
        dayIndex,
        startTimeIndex,
        endTimeIndex,
        availableCount,
        conflictCount,
        labelDay: dateBlocks[dayIndex] ? dateBlocks[dayIndex].label : '',
        labelStart: timeBlocks[startTimeIndex] ? timeBlocks[startTimeIndex].label : '',
        labelEnd: timeBlocks[endTimeIndex + 1] ? timeBlocks[endTimeIndex + 1].label : (timeBlocks[endTimeIndex] ? timeBlocks[endTimeIndex].label : '')
      });
    }
  }
  // Sort by availableCount desc, conflictCount asc, dayIndex asc, startTimeIndex asc
  candidates.sort((a, b) => {
    if (b.availableCount !== a.availableCount) return b.availableCount - a.availableCount;
    if (a.conflictCount !== b.conflictCount) return a.conflictCount - b.conflictCount;
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
    return a.startTimeIndex - b.startTimeIndex;
  });
  // Only keep those with at least one available
  const filtered = candidates.filter(c => c.availableCount > 0);
  return filtered.slice(0, 5);
}

module.exports = { findBestTimes };