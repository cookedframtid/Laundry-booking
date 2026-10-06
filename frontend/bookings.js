// ===== Configuration =====
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS = [
    { label: '08:00-12:00', start: '08:00', end: '12:00' },
    { label: '12:00-16:00', start: '12:00', end: '16:00' },
    { label: '16:00-20:00', start: '16:00', end: '20:00' }
];

let currentMonday = getMonday(new Date());

// ===== Date helpers =====

function getMonday(date) {
    const result = new Date(date);
    const dayIndex = (result.getDay() + 6) % 7;
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

function toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getWeekDates(monday) {
    return DAYS.map(function (dayName, offset) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + offset);
        return { name: dayName, dateString: toDateString(date) };
    });
}

// ===== Matching bookings to slots =====

function findBooking(bookings, dateString, slotStart) {
    return bookings.find(function (booking) {
        const bookingDate = booking.start_time.slice(0, 10);
        const bookingTime = booking.start_time.slice(11, 16);
        return bookingDate === dateString && bookingTime === slotStart;
    });
}

function getCellStatus(booking) {
    if (!booking) {
        return { text: "Available", className: "status-ready" };
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

        if (status.text === "Available") {
            cell.style.cursor = "pointer";
            cell.addEventListener("click", function () {
                openBookingConfirm(day.dateString, slot);
            });
        }
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

// ===== Dropdown menu =====

const menuToggle = document.getElementById("menu-toggle");
const menuDropdown = document.getElementById("menu-dropdown");

menuToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    menuDropdown.classList.toggle("hidden");
});

document.addEventListener("click", function (e) {
    if (!menuDropdown.contains(e.target) && e.target !== menuToggle) {
        menuDropdown.classList.add("hidden");
    }
});

// ===== Booking confirmation popup =====

let pendingBooking = null;

function openBookingConfirm(dateString, slot) {
    pendingBooking = { dateString: dateString, slot: slot };
    document.getElementById("confirm-text").textContent =
        `Book ${slot.label} on ${dateString}?`;
    document.getElementById("confirm-overlay").classList.remove("hidden");
}

function closeBookingConfirm() {
    pendingBooking = null;
    document.getElementById("confirm-overlay").classList.add("hidden");
}

document.getElementById("confirm-no").addEventListener("click", closeBookingConfirm);

document.getElementById("confirm-yes").addEventListener("click", function () {
    if (!pendingBooking) return;
    bookSlot(pendingBooking.dateString, pendingBooking.slot.start, pendingBooking.slot.end);
    closeBookingConfirm();
});

async function bookSlot(dateString, startTime, endTime) {
    const roomId = document.getElementById("room-select").value;

    try {
        const res = await fetch('http://localhost:5000/api/bookings', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                room_id: roomId,
                start_time: `${dateString}T${startTime}`,
                end_time: `${dateString}T${endTime}`
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error);
            return;
        }

        fetchBookings();
    } catch (err) {
        alert("Could not reach the server.");
    }
}

// ===== Loading data =====

async function fetchBookings() {
    const res = await fetch('http://localhost:5000/api/bookings', { credentials: "include" });
    const bookings = await res.json();
    renderGrid(bookings);
}

// ===== Start =====
fetchBookings();