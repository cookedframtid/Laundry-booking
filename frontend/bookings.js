// ===== Configuration =====
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = [
    { label: '08:00-12:00', start: '08:00' },
    { label: '12:00-16:00', start: '12:00' },
    { label: '16:00-20:00', start: '16:00' }
];

let currentMonday = getMonday(new Date());

// ===== Date helpers =====

// Find the Monday of the week containing this date
function getMonday(date) {
    const result = new Date(date);
    const dayIndex = (result.getDay() + 6) % 7; // Mon = 0 ... Sun = 6
    result.setDate(result.getDate() - dayIndex);
    return result;
}

function getMonthName(monthIndex) {
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    return monthNames[monthIndex];
}

// Turn a Date into "2026-09-28" for comparing with the database
function toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Build the 7 real dates for the visible week
function getWeekDates(monday) {
    return DAYS.map(function (dayName, offset) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + offset);
        return { name: dayName, dateString: toDateString(date) };
    });
}

// ===== Matching bookings to slots =====

// Is there a booking for this exact day + time slot?
function findBooking(bookings, dateString, slotStart) {
    return bookings.find(function (booking) {
        const bookingDate = booking.start_time.slice(0, 10);
        const bookingTime = booking.start_time.slice(11, 16);
        return bookingDate === dateString && bookingTime === slotStart;
    });
}

// Decide what a cell should show: text + CSS class
function getCellStatus(booking) {
    if (!booking) {
        return { text: "Ready", className: "status-ready" };
    }
    if (booking.apartment_number === window.myApartment) {
        return { text: "You", className: "status-mine" };
    }
    return { text: "Unavailable", className: "status-unavailable" };
}

// ===== Building the HTML =====

function buildHeaderRow(weekDates) {
    const headerRow = document.getElementById("header-row");
    headerRow.innerHTML = "<th>Time</th>";

    weekDates.forEach(function (day) {
        const th = document.createElement("th");
        th.textContent = day.name;
        headerRow.appendChild(th);
    });
}

function buildSlotRow(slot, weekDates, bookings) {
    const row = document.createElement("tr");

    const timeCell = document.createElement("td");
    timeCell.textContent = slot.label;
    row.appendChild(timeCell);

    weekDates.forEach(function (day) {
        const booking = findBooking(bookings, day.dateString, slot.start);
        const status = getCellStatus(booking);

        const cell = document.createElement("td");
        cell.textContent = status.text;
        cell.className = status.className;
        row.appendChild(cell);
    });

    return row;
}

function renderGrid(bookings) {
    const weekDates = getWeekDates(currentMonday);

    buildHeaderRow(weekDates);

    const tbody = document.getElementById("schedule-body");
    tbody.innerHTML = "";

    SLOTS.forEach(function (slot) {
        const row = buildSlotRow(slot, weekDates, bookings);
        tbody.appendChild(row);
    });
}

const menuToggle = document.getElementById("menu-toggle");
const menuDropdown = document.getElementById("menu-dropdown");

menuToggle.addEventListener("click", function (e) {
    e.stopPropagation(); // stop this click from immediately closing it again (see below)
    menuDropdown.classList.toggle("hidden");
});

// Close the menu if the user clicks anywhere else on the page
document.addEventListener("click", function (e) {
    if (!menuDropdown.contains(e.target) && e.target !== menuToggle) {
        menuDropdown.classList.add("hidden");
    }
});


// ===== Loading data =====

async function fetchBookings() {
    const res = await fetch('http://localhost:5000/api/bookings', { credentials: "include" });
    const bookings = await res.json();
    renderGrid(bookings);
}

<<<<<<< HEAD
function renderGrid(bookings) {
    const dates = weekDates();

    const headerRow = document.getElementById("header-row");
    headerRow.innerHTML = "<th>Time</th>";
    dates.forEach(function (day) {
        const th = document.createElement("th");
        th.textContent = day.name;
        headerRow.appendChild(th);
    });

    const tbody = document.getElementById("schedule-body");
    tbody.innerHTML = "";

    SLOTS.forEach(function (slot) {
        const row = document.createElement("tr");

        const timeCell = document.createElement("td");
        timeCell.textContent = slot.label;
        row.appendChild(timeCell);

        dates.forEach(function (day) {
            const cell = document.createElement("td");

            const booking = bookings.find(b =>
                b.start_time.slice(0, 10) === day.date &&
                b.start_time.slice(11, 16) === slot.start
            );

            if (!booking) {
                cell.textContent = "Ready";
                cell.className = "status-ready";
            } else if (booking.apartment_number === window.myApartment) {
                cell.textContent = "You";
                cell.className = "status-mine";
            } else {
                cell.textContent = "Unavailable";
                cell.className = "status-unavailable";
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}



=======
// ===== Start =====
>>>>>>> 3d04292327e6b4142f1fa12d66c8f92166342882
fetchBookings();