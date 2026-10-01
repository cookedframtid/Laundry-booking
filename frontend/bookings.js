const container = document.getElementById('bookings-container');

const morningCell = document.createElement('div');
morningCell.className = "morning-cell";
morningCell.textContent = "Morning: No bookings available.";
container.appendChild(morningCell);

const afternoonCell = document.createElement('div');
afternoonCell.className = "afternoon-cell";
afternoonCell.textContent = "Afternoon: No bookings available.";
container.appendChild(afternoonCell);

const nightCell = document.createElement('div');
nightCell.className = "night-cell";
nightCell.textContent = "Night: No bookings available.";
container.appendChild(nightCell);