const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const SLOTS = [
    { label: '08:00-12:00', start: '08:00' },
    { label: '12:00-16:00', start: '12:00' },
    { label: '16:00-20:00', start: '16:00' }
];

let currentMonday = getMonday(new Date());

function getMonday(d) {
    const date = new Date(d);
    const offset = (date.getDay() + 6) % 7; // Monday = 0
    date.setDate(date.getDate() - offset);
    return date;
}

function fmt(d) {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
}

function weekDates() {
    return DAYS.map(function (name, i) {
        const d = new Date(currentMonday);
        d.setDate(currentMonday.getDate() + i);
        return { name: name, date: fmt(d) };
    });
}

async function fetchBookings() {
    const res = await fetch('http://localhost:5000/api/bookings', { credentials: "include" });
    const bookings = await res.json();
    renderGrid(bookings);
}

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



fetchBookings();