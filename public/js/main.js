			// Tooltip for cell availability
			let cellTooltip = null;
			let tooltipData = {};

			function hideTooltip() {
				if (cellTooltip) {
					cellTooltip.remove();
					cellTooltip = null;
				}
			}

			function showTooltipForCell(d, t, cell) {
				hideTooltip();
				const key = `${d},${t}`;
				const data = tooltipData[key];
				if (!data) return;
				cellTooltip = document.createElement('div');
				cellTooltip.className = 'cell-tooltip';
				cellTooltip.innerHTML = `<div class="ct-header"><b>${data.available.length} / ${data.total} available</b></div>` +
					`<div class="ct-list"><span class="ct-label">Available:</span> ${data.available.length ? data.available.join(', ') : '<i>None</i>'}</div>` +
					`<div class="ct-list ct-unavail-collapsed"><span class="ct-label">Unavailable:</span> <span class="ct-unavail-names" style="display:none;">${data.unavailable.length ? data.unavailable.join(', ') : '<i>None</i>'}</span> <button class="ct-toggle">Show</button></div>`;
				document.body.appendChild(cellTooltip);
				// Position
				const rect = cell.getBoundingClientRect();
				cellTooltip.style.position = 'fixed';
				cellTooltip.style.left = (rect.left + rect.width/2) + 'px';
				cellTooltip.style.top = (rect.top - 8) + 'px';
				cellTooltip.style.zIndex = 10000;
				// Toggle unavailable
				const toggleBtn = cellTooltip.querySelector('.ct-toggle');
				const unavailNames = cellTooltip.querySelector('.ct-unavail-names');
				let expanded = false;
				toggleBtn.addEventListener('click', function(e) {
					e.stopPropagation();
					expanded = !expanded;
					unavailNames.style.display = expanded ? '' : 'none';
					toggleBtn.textContent = expanded ? 'Hide' : 'Show';
				});
				// Mobile tap outside
				setTimeout(() => {
					document.addEventListener('touchstart', hideTooltip, { once: true });
				}, 0);
			}

			// Fetch event summary (participants, totals, bestSlots, cellParticipants)
			function fetchEventSummary() {
				fetch(`/events/${eventId}/summary`)
					.then(r => r.json())
					.then(data => {
						if (data.bestSlots) renderBestTimesList(data.bestSlots);
						if (data.cellParticipants) {
							tooltipData = {};
							for (const key in data.cellParticipants) {
								tooltipData[key] = {
									available: data.cellParticipants[key].available,
									unavailable: data.cellParticipants[key].unavailable,
									total: (data.cellParticipants[key].available.length + data.cellParticipants[key].unavailable.length)
								};
							}
						}
					});
			}
		// Helper: render best times (new summary version)
		function renderBestTimesList(bestSlots) {
			const bestTimesListDiv = document.getElementById('best-times-list');
			if (!bestTimesListDiv) return;
			if (!Array.isArray(bestSlots) || bestSlots.length === 0) {
				bestTimesListDiv.innerHTML = '<div class="best-times-empty">No best times found.</div>';
				return;
			}
			const list = bestSlots.map((slot, idx) => {
				const label = `${slot.labelDay}, ${slot.labelStart} - ${slot.labelEnd} <span class="bt-count">(${slot.availableCount} available)</span>`;
				return `<li class="bt-slot" data-day="${slot.dayIndex}" data-time="${slot.startTimeIndex}">${label}</li>`;
			}).join('');
			bestTimesListDiv.innerHTML = '<b>Best times:</b><ul class="bt-list" style="margin:0.5em 0 0 1em; padding:0;">' + list + '</ul>';
			// Add click handlers
			bestTimesListDiv.querySelectorAll('.bt-slot').forEach(function(el) {
				el.addEventListener('click', function() {
					const d = parseInt(el.getAttribute('data-day'), 10);
					const t = parseInt(el.getAttribute('data-time'), 10);
					const cell = grid.querySelector(`td.slot[data-day-index="${d}"][data-time-index="${t}"]`);
					if (cell) {
						cell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
						cell.classList.add('bt-highlight');
						setTimeout(() => cell.classList.remove('bt-highlight'), 1500);
					}
				});
			});
		}

		// Add highlight style for best time slot
		const style = document.createElement('style');
		style.innerHTML = `.bt-highlight { outline: 2px solid #2d7cff; box-shadow: 0 0 0 3px #2d7cff55; } .bt-list { list-style: none; padding: 0; } .bt-slot { cursor: pointer; margin-bottom: 0.2em; } .bt-slot:hover { background: #e6f0ff; } .bt-count { color: #1a5dcc; font-weight: bold; }`;
		document.head.appendChild(style);
	// Helper: render best times (new summary version)
	function renderBestTimesList(bestSlots) {
		const bestTimesListDiv = document.getElementById('best-times-list');
		if (!bestTimesListDiv) return;
		if (!Array.isArray(bestSlots) || bestSlots.length === 0) {
			bestTimesListDiv.innerHTML = '<div class="best-times-empty">No best times found.</div>';
			return;
		}
		const list = bestSlots.map((slot, idx) => {
			const label = `${slot.labelDay}, ${slot.labelStart} - ${slot.labelEnd} <span class="bt-count">(${slot.availableCount} available)</span>`;
			return `<li class="bt-slot" data-day="${slot.dayIndex}" data-time="${slot.startTimeIndex}">${label}</li>`;
		}).join('');
		bestTimesListDiv.innerHTML = '<b>Best times:</b><ul class="bt-list" style="margin:0.5em 0 0 1em; padding:0;">' + list + '</ul>';
		// Add click handlers
		bestTimesListDiv.querySelectorAll('.bt-slot').forEach(function(el) {
			el.addEventListener('click', function() {
				const d = parseInt(el.getAttribute('data-day'), 10);
				const t = parseInt(el.getAttribute('data-time'), 10);
				const cell = grid.querySelector(`td.slot[data-day-index="${d}"][data-time-index="${t}"]`);
				if (cell) {
					cell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
					cell.classList.add('bt-highlight');
					setTimeout(() => cell.classList.remove('bt-highlight'), 1500);
				}
			});
		});
	}

	// Fetch event summary (participants, totals, bestSlots)
	function fetchEventSummary() {
		fetch(`/events/${eventId}/summary`)
			.then(r => r.json())
			.then(data => {
				if (data.bestSlots) renderBestTimesList(data.bestSlots);
			});
	}
// Clear imported availability
function clearAvailability() {
	availabilityMatrix = Array.from({ length: numDays }, () => Array(numTimes).fill(false));
	renderGridFromMatrix();
	saveAvailability();
	setStatus('Availability cleared.');
}

// Add clear button to UI
window.addEventListener('DOMContentLoaded', function() {
	const controls = document.querySelector('.user-controls .button-row');
	if (controls) {
		const clearBtn = document.createElement('button');
		clearBtn.textContent = 'Clear imported availability';
		clearBtn.style.background = '#bbb';
		clearBtn.style.color = '#222';
		clearBtn.style.fontWeight = 'normal';
		clearBtn.style.fontSize = '0.95em';
		clearBtn.style.marginLeft = '0.5em';
		clearBtn.addEventListener('click', function(e) {
			e.preventDefault();
			clearAvailability();
		});
		controls.appendChild(clearBtn);
	}
});

// Main JS for planmymeeting event page

(function() {
	 // Elements
	 const configDiv = document.getElementById('event-config');
	 // --- Event Creation Form Enhancements ---
	 const todayBtn = document.getElementById('today-btn');
	 const startDateInput = document.getElementById('start-date-input');
	 const endDateInput = document.getElementById('end-date-input');
	 const minTimeInput = document.getElementById('min-time-input');
	 const maxTimeInput = document.getElementById('max-time-input');

	 if (todayBtn && startDateInput && endDateInput) {
		 todayBtn.addEventListener('click', function(e) {
			 e.preventDefault();
			 const now = new Date();
			 const yyyy = now.getFullYear();
			 const mm = String(now.getMonth() + 1).padStart(2, '0');
			 const dd = String(now.getDate()).padStart(2, '0');
			 const todayStr = `${yyyy}-${mm}-${dd}`;
			 startDateInput.value = todayStr;
			 // If end date is empty or before start, set to start
			 if (!endDateInput.value || endDateInput.value < todayStr) {
				 endDateInput.value = todayStr;
			 }
			 // Trigger input events for validation/UI
			 startDateInput.dispatchEvent(new Event('input', { bubbles: true }));
			 endDateInput.dispatchEvent(new Event('input', { bubbles: true }));
		 });
	 }

	 // Time input min/max logic
	 if (minTimeInput && maxTimeInput) {
		 minTimeInput.addEventListener('input', function() {
			 if (maxTimeInput.value && minTimeInput.value > maxTimeInput.value) {
				 maxTimeInput.value = minTimeInput.value;
				 maxTimeInput.dispatchEvent(new Event('input', { bubbles: true }));
			 }
			 maxTimeInput.min = minTimeInput.value;
		 });
		 maxTimeInput.addEventListener('input', function() {
			 minTimeInput.max = maxTimeInput.value;
		 });
	 }

	 // --- Event Page Share Link ---
	 const shareInput = document.getElementById('share-link-input');
	 const copyBtn = document.getElementById('copy-link-btn');
	 if (shareInput && copyBtn) {
		 copyBtn.addEventListener('click', function() {
			 // Try navigator.clipboard first
			 if (navigator.clipboard && window.isSecureContext) {
				 navigator.clipboard.writeText(shareInput.value).then(() => {
					 copyBtn.textContent = 'Copied!';
					 setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1200);
				 }, () => fallbackCopy());
			 } else {
				 fallbackCopy();
			 }
			 function fallbackCopy() {
				 shareInput.select();
				 shareInput.setSelectionRange(0, 99999);
				 try {
					 document.execCommand('copy');
					 copyBtn.textContent = 'Copied!';
					 setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1200);
				 } catch (err) {}
			 }
		 });
	 }

	 // --- Existing event page logic ---
	 if (!configDiv) return;
	 const eventId = configDiv.getAttribute('data-event-id');
	 const numDays = parseInt(configDiv.getAttribute('data-num-days'), 10);
	 const numTimes = parseInt(configDiv.getAttribute('data-num-times'), 10);
	 const usernameInput = document.getElementById('username-input');
	 // const btnUpdate = document.getElementById('btn-update-schedule');
	 const btnCalendar = document.getElementById('btn-use-calendar');
	 // const btnManual = document.getElementById('btn-set-manual');
	 const grid = document.getElementById('availability-grid');
	 const statusDiv = document.getElementById('status');
	 const bestTimesDiv = document.getElementById('best-times');
	 const modal = document.getElementById('calendar-modal');
	 const calendarLinkInput = document.getElementById('calendar-link-input');
	 const calendarSubmit = document.getElementById('calendar-submit');
	 const calendarCancel = document.getElementById('calendar-cancel');

	// State
	let availabilityMatrix = Array.from({ length: numDays }, () => Array(numTimes).fill(false));
	let participantId = null;
	let manualEditMode = false;
	let isMouseDown = false;
	let paintValue = null;

	// Helper: show status
	function setStatus(msg, isError) {
		if (statusDiv) {
			statusDiv.textContent = msg;
			statusDiv.style.color = isError ? '#b00' : '#1a5dcc';
		}
	}

	// Helper: set matrix from response
	function setMatrixFromResponse(matrix) {
		if (!Array.isArray(matrix)) return;
		for (let d = 0; d < numDays; d++) {
			for (let t = 0; t < numTimes; t++) {
				availabilityMatrix[d][t] = (matrix[d] && matrix[d][t]) ? true : false;
			}
		}
	}

	// Helper: render grid from matrix
	function renderGridFromMatrix() {
		if (!grid) return;
		for (let t = 0; t < numTimes; t++) {
			for (let d = 0; d < numDays; d++) {
				const cell = grid.querySelector(`td.slot[data-day-index="${d}"][data-time-index="${t}"]`);
				if (cell) {
					cell.classList.toggle('available', !!availabilityMatrix[d][t]);
				}
			}
		}
	}

	// Helper: apply heatmap
	function applyHeatmap(mergedMatrix) {
		if (!Array.isArray(mergedMatrix)) return;
		let max = 0;
		for (let d = 0; d < numDays; d++) {
			for (let t = 0; t < numTimes; t++) {
				if (mergedMatrix[d] && mergedMatrix[d][t] > max) max = mergedMatrix[d][t];
			}
		}
		for (let t = 0; t < numTimes; t++) {
			for (let d = 0; d < numDays; d++) {
				const cell = grid.querySelector(`td.slot[data-day-index="${d}"][data-time-index="${t}"]`);
				if (cell) {
					for (let k = 0; k <= max; k++) cell.classList.remove('heat-' + k);
					if (mergedMatrix[d] && typeof mergedMatrix[d][t] === 'number') {
						cell.classList.add('heat-' + mergedMatrix[d][t]);
					}
				}
			}
		}
	}

	// Helper: render best times
	function renderBestTimes(bestTimes) {
		if (!bestTimesDiv) return;
		if (!Array.isArray(bestTimes) || bestTimes.length === 0) {
			bestTimesDiv.textContent = 'No best times found.';
			return;
		}
		// Format: "Tue 12, 10:00 - 10:30 (5 of 7 available)"
		const list = bestTimes.map(bt => {
			const label = `${bt.labelDay}, ${bt.labelStart} - ${bt.labelEnd} (${bt.availableCount} available${typeof window.participantCount === 'number' ? ' of ' + window.participantCount : ''})`;
			return `<li>${label}</li>`;
		}).join('');
		bestTimesDiv.innerHTML = '<b>Best times:</b><ul style="margin:0.5em 0 0 1em; padding:0;">' + list + '</ul>';
	}

	// Fetch merged availability and best times
	function refreshMergedAvailability() {
		fetch(`/events/${eventId}/availability`)
			.then(r => r.json())
			.then(data => {
				if (data.mergedAvailability) applyHeatmap(data.mergedAvailability);
				if (data.bestTimes) renderBestTimes(data.bestTimes);
			})
			.catch(() => {});
	}

	// Debounced saveAvailability with optimistic UI and error handling
	let lastMatrixSnapshot = null;
	let saveTimeout = null;
	function showToast(msg, isError) {
		const toast = document.createElement('div');
		toast.textContent = msg;
		toast.style.position = 'fixed';
		toast.style.bottom = '24px';
		toast.style.right = '24px';
		toast.style.background = isError ? '#b00' : '#222';
		toast.style.color = '#fff';
		toast.style.padding = '0.7em 1.2em';
		toast.style.borderRadius = '6px';
		toast.style.zIndex = 9999;
		document.body.appendChild(toast);
		setTimeout(() => toast.remove(), 2500);
	}

	function deepCloneMatrix(matrix) {
		return matrix.map(row => row.slice());
	}

	function saveAvailabilityDebounced() {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(saveAvailability, 300);
	}

	function saveAvailability() {
		if (!participantId) return;
		const matrixToSave = deepCloneMatrix(availabilityMatrix);
		lastMatrixSnapshot = lastMatrixSnapshot || deepCloneMatrix(availabilityMatrix);
		fetch(`/events/${eventId}/participants/${participantId}/availability`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ availability: matrixToSave })
		})
			.then(r => r.json())
			.then(data => {
				if (data.success) {
					setStatus('Saved');
					if (data.bestTimes) renderBestTimes(data.bestTimes);
					if (data.mergedAvailability) applyHeatmap(data.mergedAvailability);
					lastMatrixSnapshot = null;
				} else {
					showToast('Failed to save. Reverting.', true);
					if (lastMatrixSnapshot) {
						availabilityMatrix = deepCloneMatrix(lastMatrixSnapshot);
						renderGridFromMatrix();
					}
					lastMatrixSnapshot = null;
				}
			})
			.catch(() => {
				showToast('Failed to save. Reverting.', true);
				if (lastMatrixSnapshot) {
					availabilityMatrix = deepCloneMatrix(lastMatrixSnapshot);
					renderGridFromMatrix();
				}
				lastMatrixSnapshot = null;
			});
	}

	// Create or load participant
	function createOrLoadParticipant(cb) {
		const username = usernameInput.value.trim();
		if (!username) {
			setStatus('Please enter your name.', true);
			return;
		}
		setStatus('Loading...');
		fetch(`/events/${eventId}/participants`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username })
		})
			.then(r => r.json())
			.then(data => {
				if (data.participantId) {
					participantId = data.participantId;
					setMatrixFromResponse(data.availabilityMatrix);
					renderGridFromMatrix();
					setStatus('Loaded. You can now edit your schedule.');
					if (typeof cb === 'function') cb();
				} else {
					setStatus('Failed to load participant', true);
				}
			})
			.catch(() => setStatus('Failed to load participant', true));
	}

	// Manual editing always enabled
	manualEditMode = true;
	if (grid) grid.classList.add('manual-edit');

	// Grid event handlers
	function onCellClick(e) {
		if (!manualEditMode) return;
		const cell = e.target.closest('.slot');
		if (!cell) return;
		const d = parseInt(cell.getAttribute('data-day-index'), 10);
		const t = parseInt(cell.getAttribute('data-time-index'), 10);
		availabilityMatrix[d][t] = !availabilityMatrix[d][t];
		renderGridFromMatrix();
	}
	function onCellMouseDown(e) {
		if (!manualEditMode) return;
		const cell = e.target.closest('.slot');
		if (!cell) return;
		isMouseDown = true;
		const d = parseInt(cell.getAttribute('data-day-index'), 10);
		const t = parseInt(cell.getAttribute('data-time-index'), 10);
		paintValue = !availabilityMatrix[d][t];
		availabilityMatrix[d][t] = paintValue;
		renderGridFromMatrix();
		e.preventDefault();
	}
	function onCellMouseOver(e) {
		if (!manualEditMode || !isMouseDown) return;
		const cell = e.target.closest('.slot');
		if (!cell) return;
		const d = parseInt(cell.getAttribute('data-day-index'), 10);
		const t = parseInt(cell.getAttribute('data-time-index'), 10);
		availabilityMatrix[d][t] = paintValue;
		renderGridFromMatrix();
	}
	function onMouseUp() {
		isMouseDown = false;
		paintValue = null;
	}

	// Calendar modal logic
	function showModal() {
		if (modal) modal.style.display = 'flex';
	}
	function hideModal() {
		if (modal) modal.style.display = 'none';
		if (calendarLinkInput) calendarLinkInput.value = '';
	}

	// Helper: get heat level (0-7) from ratio
	function getHeatLevel(ratio) {
		if (ratio >= 0.99) return 7;
		if (ratio >= 0.85) return 6;
		if (ratio >= 0.7) return 5;
		if (ratio >= 0.55) return 4;
		if (ratio >= 0.4) return 3;
		if (ratio >= 0.25) return 2;
		if (ratio > 0) return 1;
		return 0;
	}

	// Store latest heatmap data
	let latestTotalsPerCell = null;
	let latestTotalParticipants = 1;

	// Helper: render grid from matrix with heatmap
	function renderGridFromMatrix() {
		if (!grid) return;
		for (let t = 0; t < numTimes; t++) {
			for (let d = 0; d < numDays; d++) {
				const cell = grid.querySelector(`td.slot[data-day-index="${d}"][data-time-index="${t}"]`);
				if (cell) {
					// Remove old heat classes
					for (let k = 0; k <= 7; k++) cell.classList.remove('heat-' + k);
					// Compute heat level
					let ratio = 0;
					if (latestTotalsPerCell && latestTotalsPerCell[d] && typeof latestTotalsPerCell[d][t] === 'number') {
						ratio = latestTotalsPerCell[d][t] / Math.max(latestTotalParticipants, 1);
					}
					const heat = getHeatLevel(ratio);
					cell.classList.add('heat-' + heat);
					// User selection
					cell.classList.toggle('available', !!availabilityMatrix[d][t]);
				}
			}
		}
	}

	// Fetch event summary (participants, totals, bestSlots, cellParticipants)
	function fetchEventSummary() {
		fetch(`/events/${eventId}/summary`)
			.then(r => r.json())
			.then(data => {
				if (data.bestSlots) renderBestTimesList(data.bestSlots);
				if (data.cellParticipants) {
					tooltipData = {};
					for (const key in data.cellParticipants) {
						tooltipData[key] = {
							available: data.cellParticipants[key].available,
							unavailable: data.cellParticipants[key].unavailable,
							total: (data.cellParticipants[key].available.length + data.cellParticipants[key].unavailable.length)
						};
					}
				}
				if (data.totalsPerCell && Array.isArray(data.totalsPerCell)) {
					latestTotalsPerCell = data.totalsPerCell;
				}
				if (data.participants && Array.isArray(data.participants)) {
					latestTotalParticipants = data.participants.length;
				}
				renderGridFromMatrix();
			});
	}
			if (!cell) return;
			e.preventDefault();
			const d = parseInt(cell.getAttribute('data-day-index'), 10);
			const t = parseInt(cell.getAttribute('data-time-index'), 10);
			// Tooltip logic
			if (e.pointerType === 'touch') {
				if (cellTooltip) {
					hideTooltip();
				} else {
					showTooltipForCell(d, t, cell);
				}
			} else {
				hideTooltip();
			}
			// Drag logic
			dragMode = true;
			dragTargetState = !availabilityMatrix[d][t];
			setCellState(d, t, dragTargetState);
			lastDragCell = `${d},${t}`;
			saveAvailabilityDebounced();
		});
		grid.addEventListener('pointerenter', function(e) {
			if (!dragMode) return;
			const cell = e.target.closest('.slot');
			if (!cell) return;
			const d = parseInt(cell.getAttribute('data-day-index'), 10);
			const t = parseInt(cell.getAttribute('data-time-index'), 10);
			const key = `${d},${t}`;
			if (key !== lastDragCell) {
				setCellState(d, t, dragTargetState);
				lastDragCell = key;
				saveAvailabilityDebounced();
			}
		}, true);
		document.addEventListener('pointerup', function(e) {
			if (dragMode) {
				dragMode = false;
				dragTargetState = null;
				lastDragCell = null;
			}
		});
		// Single tap/click toggles cell if not dragging
		grid.addEventListener('click', function(e) {
			if (dragMode) return;
			const cell = e.target.closest('.slot');
			if (!cell) return;
			const d = parseInt(cell.getAttribute('data-day-index'), 10);
			const t = parseInt(cell.getAttribute('data-time-index'), 10);
			toggleCell(d, t);
			saveAvailabilityDebounced();
		});
		// Tooltip on hover (desktop)
		grid.addEventListener('mouseover', function(e) {
			const cell = e.target.closest('.slot');
			if (cell && !('ontouchstart' in window)) {
				const d = parseInt(cell.getAttribute('data-day-index'), 10);
				const t = parseInt(cell.getAttribute('data-time-index'), 10);
				showTooltipForCell(d, t, cell);
			}
		});
		grid.addEventListener('mouseout', function(e) {
			if (!('ontouchstart' in window)) hideTooltip();
		});
	}
		// Prevent unwanted selection/dragging
		const gridStyle = document.createElement('style');
		gridStyle.innerHTML = `.availability-grid, .availability-grid td { user-select: none; -webkit-user-select: none; -ms-user-select: none; touch-action: none; }`;
		document.head.appendChild(gridStyle);
	// Tooltip styles
	const tooltipStyle = document.createElement('style');
	tooltipStyle.innerHTML = `.cell-tooltip { background: #fff; border: 1px solid #bbb; border-radius: 6px; box-shadow: 0 2px 8px #0002; padding: 0.7em 1em; font-size: 1em; min-width: 180px; max-width: 320px; pointer-events: auto; }
	.cell-tooltip .ct-header { font-size: 1.08em; margin-bottom: 0.3em; color: #1a5dcc; }
	.cell-tooltip .ct-label { font-weight: bold; color: #333; }
	.cell-tooltip .ct-list { margin-bottom: 0.2em; }
	.cell-tooltip .ct-unavail-collapsed { margin-top: 0.2em; }
	.cell-tooltip .ct-toggle { background: none; border: none; color: #2d7cff; cursor: pointer; font-size: 0.98em; margin-left: 0.5em; }
	@media (max-width: 600px) { .cell-tooltip { font-size: 0.98em; min-width: 120px; } }`;
	document.head.appendChild(tooltipStyle);

	// Heatmap CSS
	const heatmapStyle = document.createElement('style');
	heatmapStyle.innerHTML = `
	.availability-grid td.slot { transition: background 0.18s; position: relative; }
	.heat-0 { background: #f8faff; }
	.heat-1 { background: #e6f0ff; }
	.heat-2 { background: #c7e0ff; }
	.heat-3 { background: #a5d0ff; }
	.heat-4 { background: #7bbcff; }
	.heat-5 { background: #4fa6ff; }
	.heat-6 { background: #218fff; }
	.heat-7 { background: #006be6; }
	.availability-grid td.slot.available { outline: 2.5px solid #2d7cff; box-shadow: 0 0 0 2px #fff inset; z-index: 1; }
	.availability-grid td.slot.available.heat-7 { outline: 2.5px solid #fff; box-shadow: 0 0 0 2px #2d7cff inset; }
	`;
	document.head.appendChild(heatmapStyle);

	// Initial render
	renderGridFromMatrix();
	fetchEventSummary();
})();