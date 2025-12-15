
// Main JS for When2meet Lite event page
(function() {
	// Elements
	const configDiv = document.getElementById('event-config');
	if (!configDiv) return;
	const eventId = configDiv.getAttribute('data-event-id');
	const numDays = parseInt(configDiv.getAttribute('data-num-days'), 10);
	const numTimes = parseInt(configDiv.getAttribute('data-num-times'), 10);
	const usernameInput = document.getElementById('username-input');
	const btnUpdate = document.getElementById('btn-update-schedule');
	const btnCalendar = document.getElementById('btn-use-calendar');
	const btnManual = document.getElementById('btn-set-manual');
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

	// Save availability
	function saveAvailability() {
		if (!participantId) return;
		fetch(`/events/${eventId}/participants/${participantId}/availability`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ availability: availabilityMatrix })
		})
			.then(r => r.json())
			.then(data => {
				if (data.success) setStatus('Saved');
				else setStatus('Failed to save', true);
				refreshMergedAvailability();
			})
			.catch(() => setStatus('Failed to save', true));
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

	// Manual editing
	function enableManualEdit() {
		manualEditMode = true;
		setStatus('Manual edit enabled. Click or drag to mark your availability.');
		// Enable grid interaction
		if (!grid) return;
		grid.classList.add('manual-edit');
	}

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

	// Calendar submit
	function submitCalendar() {
		if (!participantId) {
			setStatus('Please enter your name and update schedule first.', true);
			hideModal();
			return;
		}
		const url = calendarLinkInput.value.trim();
		if (!url) {
			setStatus('Please enter a calendar link.', true);
			return;
		}
		setStatus('Importing calendar...');
		fetch(`/events/${eventId}/participants/${participantId}/calendar`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ calendar_link_url: url })
		})
			.then(r => r.json())
			.then(data => {
				if (data.availabilityMatrix) {
					setMatrixFromResponse(data.availabilityMatrix);
					renderGridFromMatrix();
					setStatus('Calendar imported!');
					hideModal();
					saveAvailability();
				} else {
					setStatus(data.error || 'Failed to import calendar', true);
				}
			})
			.catch(() => setStatus('Failed to import calendar', true));
	}

	// Attach event handlers
	if (btnUpdate) btnUpdate.addEventListener('click', function(e) {
		e.preventDefault();
		createOrLoadParticipant(() => saveAvailability());
	});
	if (btnManual) btnManual.addEventListener('click', function(e) {
		e.preventDefault();
		enableManualEdit();
	});
	if (btnCalendar) btnCalendar.addEventListener('click', function(e) {
		e.preventDefault();
		if (!participantId) {
			createOrLoadParticipant(() => showModal());
		} else {
			showModal();
		}
	});
	if (calendarSubmit) calendarSubmit.addEventListener('click', function(e) {
		e.preventDefault();
		submitCalendar();
	});
	if (calendarCancel) calendarCancel.addEventListener('click', function(e) {
		e.preventDefault();
		hideModal();
	});

	// Grid cell handlers
	if (grid) {
		grid.addEventListener('click', onCellClick);
		grid.addEventListener('mousedown', onCellMouseDown);
		grid.addEventListener('mouseover', onCellMouseOver);
		document.addEventListener('mouseup', onMouseUp);
	}

	// Initial render
	renderGridFromMatrix();
	refreshMergedAvailability();
})();