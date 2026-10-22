// ===== Configuration =====
const SLOTS = [
    { label: '08:00-12:00', start: '08:00', end: '12:00' },
    { label: '12:00-16:00', start: '12:00', end: '16:00' },
    { label: '16:00-20:00', start: '16:00', end: '20:00' }
];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

let currentMonday = getMonday(new Date());

// ===== Date helpers =====
function getMonday(date) {
    const result = new Date(date);
    const dayIndex = (result.getDay() + 6) % 7;
    result.setDate(result.getDate() - dayIndex);
    return result;
}

function toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getWeekDates(monday) {
    const result = [];
    for (let offset = 0; offset < DAYS.length; offset++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + offset);
        result.push({ name: DAYS[offset], dateString: toDateString(date) });
    }
    return result;
}

// ISO week number
function getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

// Are we looking at this week (or earlier)?
function isCurrentWeek() {
    return toDateString(currentMonday) <= toDateString(getMonday(new Date()));
}

// Has this slot already started?
function isPastSlot(dateString, slot) {
    return new Date(`${dateString}T${slot.start}`) < new Date();
}

// ===== Matching bookings to slots =====
function findBooking(bookings, dateString, slotStart) {
    return bookings.find(function (booking) {
        const bookingDate = booking.start_time.slice(0, 10);
        const bookingTime = booking.start_time.slice(11, 16);
        return bookingDate === dateString && bookingTime === slotStart;
    });
}

function getCellStatus(booking, past) {
    const mine = booking && booking.apartment_number === window.myApartment;
    const isAdmin = window.userRole === "admin";

    if (booking && past) {
        return mine
            ? { text: "My booking", className: "status-past-booked", action: "none" }
            : (isAdmin ? { text: `Apt ${booking.apartment_number}`, className: "status-past-booked", action: "none" }
                       : { text: "Unavailable", className: "status-past-booked", action: "none" });
    }
    if (past) {
        return { text: "Book", className: "status-past", action: "none" };
    }
    if (!booking) {
        return { text: "Book", className: "status-ready", action: "book" };
    }
    if (mine) {
        return { text: "My booking", className: "status-mine", action: "cancel-mine" };
    }
    if (isAdmin) {
        // Show apartment number and allow admin to cancel
        return { text: `Apt ${booking.apartment_number}`, className: "status-unavailable", action: "cancel-admin", apt: booking.apartment_number };
    }
    return { text: "Unavailable", className: "status-unavailable", action: "none" };
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

function addCellClickBehavior(cell, status, booking, day, slot) {
    if (status.action === "book") {
        cell.style.cursor = "pointer";
        cell.addEventListener("click", () => openBookingConfirm(day.dateString, slot));
    } else if (status.action === "cancel-mine") {
        cell.style.cursor = "pointer";
        cell.addEventListener("click", () => {
            if (confirm(`Cancel your booking for ${slot.label} on ${day.dateString}?`)) {
                cancelBooking(booking.booking_id);
            }
        });
    } else if (status.action === "cancel-admin") {
        cell.style.cursor = "pointer";
        cell.addEventListener("click", () => {
            if (confirm(`ADMIN: Cancel booking for Apartment ${status.apt} on ${day.dateString}?`)) {
                cancelBooking(booking.booking_id);
            }
        });
    }
}


function buildSlotRow(slot, weekDates, bookings) {
    const row = document.createElement("tr");

    const timeCell = document.createElement("td");
    timeCell.textContent = slot.label;
    row.appendChild(timeCell);

    weekDates.forEach(function (day) {
        const booking = findBooking(bookings, day.dateString, slot.start);
        const past = isPastSlot(day.dateString, slot);
        const status = getCellStatus(booking, past);

        const cell = document.createElement("td");
        cell.textContent = status.text;
        cell.className = status.className;
        row.appendChild(cell);

        if (!past) {
            addCellClickBehavior(cell, status, booking, day, slot);
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
        tbody.appendChild(buildSlotRow(slot, weekDates, bookings));
    });

    updateWeekDisplay();
    updateNavButtons();
}

// ===== Week navigation =====
function updateWeekDisplay() {
    document.getElementById("week-display").textContent = `Week ${getWeekNumber(currentMonday)}`;
}

function updateNavButtons() {
    document.getElementById("prev-week").disabled = isCurrentWeek();
}

document.getElementById("prev-week").addEventListener("click", function () {
    if (isCurrentWeek()) return; // can't go to past weeks
    currentMonday.setDate(currentMonday.getDate() - 7);
    fetchBookings();
});

document.getElementById("next-week").addEventListener("click", function () {
    currentMonday.setDate(currentMonday.getDate() + 7);
    fetchBookings();
});


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
 
// make a secret button that only admins can see that gives a popup that lets them control the rooms and bookings
async function loadCurrentUser() {
    try {
        const res = await fetch('http://localhost:5000/api/me', { credentials: "include" });
        if (!res.ok) {
            window.location.href = "index.html";
            return false;
        }

        const user = await res.json();
        window.myApartment = String(user.apartment_number);
        window.userRole = user.role; // Save role globally

        // Safely unhide the admin link only if it exists in the HTML
        if (user.role === "admin") {
            const adminLink = document.getElementById("admin-link");
            if (adminLink) {
                adminLink.classList.remove("hidden");
            }
        }
        return true;
    } catch (err) {
        console.error("Profile load error:", err);
        alert("An error occurred while loading your profile. Check the console for details.");
        return false;
    }
}

// --- NEW Dynamic Room Loading ---
async function loadRooms() {
    try {
        // ADDED credentials: 'include'
        const res = await fetch('http://localhost:5000/api/rooms', { credentials: 'include' });
        const rooms = await res.json();
        
        const select = document.getElementById("room-select");
        select.innerHTML = "";
        
        rooms.forEach(room => {
            const opt = document.createElement("option");
            opt.value = room.room_id;
            opt.textContent = room.room_name;
            select.appendChild(opt);
        });
        
        if(rooms.length > 0) fetchBookings();
    } catch (err) {
        console.error("Failed to load rooms");
    }
}

// ===== Booking confirmation popup =====
let pendingBooking = null;

async function openBookingConfirm(dateString, slot) {
    try {
        // 1. Fetch the user's current bookings
        const res = await fetch('http://localhost:5000/api/bookings/mine', { credentials: "include" });
        const myBookings = await res.json();
        
        // 2. Check if any booking ends in the future
        const now = new Date();
        const hasActiveBooking = myBookings.some(booking => new Date(booking.end_time) > now);

        // 3. Block booking if an active one exists (allow admins to bypass)
        if (hasActiveBooking && window.userRole !== "admin") {
            alert("You already have an active booking! Please wait until it finishes or cancel it to book a new time.");
            return; // Stops the code here so the popup never opens
        }
    } catch (err) {
        alert("Could not verify your current bookings. Please try again.");
        return;
    }

    // 4. If no active bookings, show the confirmation popup as normal
    pendingBooking = { dateString: dateString, slot: slot };
    document.getElementById("confirm-text").textContent = `Book ${slot.label} on ${dateString}?`;
    document.getElementById("confirm-overlay").classList.remove("hidden");
}

function closeBookingConfirm() {
    pendingBooking = null;
    document.getElementById("confirm-overlay").classList.add("hidden");
}

document.getElementById("confirm-no").addEventListener("click", closeBookingConfirm);

document.getElementById("confirm-yes").addEventListener("click", async function () {
    if (!pendingBooking) return;
    await bookSlot(pendingBooking.dateString, pendingBooking.slot.start, pendingBooking.slot.end);
    closeBookingConfirm();
});

// ===== Talking to the backend =====
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

async function cancelBooking(bookingId) {
    try {
        const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
            method: "DELETE",
            credentials: "include"
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

// Only load bookings for the selected room
async function fetchBookings() {
    const roomId = document.getElementById("room-select").value;
    if (!roomId) return; // Prevent searching if no rooms exist
    
    const res = await fetch(
        `http://localhost:5000/api/bookings/search?room_id=${roomId}`,
        { credentials: "include" }
    );
    const bookings = await res.json();
    renderGrid(bookings);
}


// make it so that the log out button logs the user out and redirects to the login page
document.getElementById("Logout").addEventListener("click", async function () {
    try {
        const res = await fetch('http://localhost:5000/api/logout', {
            method: "POST",
            credentials: "include"
        });
        if (res.ok) {
            window.location.href = "index.html";
        }
        else {
            alert("Logout failed. Please try again.");
        }
    } catch (err) {
        alert("Could not reach the server.");
    }
});

// ===== My bookings popup =====
const myBookingsDialog = document.getElementById("mybookings-dialog");

async function loadMyBookings() {
    const res = await fetch('http://localhost:5000/api/bookings/mine', { credentials: "include" });
    const bookings = await res.json();

    const list = document.getElementById("mybookings-list");
    list.innerHTML = "";

    if (bookings.length === 0) {
        list.textContent = "You have no bookings.";
    }

    bookings.forEach(function (booking) {
        const item = document.createElement("li");
        item.textContent = `${booking.room_name}: ${booking.start_time.replace("T", " ")} - ${booking.end_time.slice(11, 16)} `;

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.addEventListener("click", async function () {
            await cancelBooking(booking.booking_id); // also refreshes the calendar
            loadMyBookings();                        // refresh this list
        });

        item.appendChild(cancelButton);
        list.appendChild(item);
    });
}

document.getElementById("my-bookings-link").addEventListener("click", async function (e) {
    e.preventDefault();
    menuDropdown.classList.add("hidden");
    await loadMyBookings();
    if (!myBookingsDialog.open) myBookingsDialog.showModal();
});

document.getElementById("mybookings-close").addEventListener("click", function () {
    myBookingsDialog.close();
});

document.getElementById("room-select").addEventListener("change", fetchBookings);

// ===== Start =====
loadCurrentUser().then(isLoggedIn => {
    if(isLoggedIn) loadRooms();
});



async function renderAdminRooms() {
    const res = await fetch('http://localhost:5000/api/rooms', { credentials: 'include' });
    const rooms = await res.json();
    const list = document.getElementById("admin-rooms-list");
    list.innerHTML = "";
    
    rooms.forEach(room => {
        const div = document.createElement("div");
        div.textContent = `${room.room_name} (Bldg: ${room.building_id})`;
        
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.onclick = async () => {
            if(confirm(`Delete ${room.room_name}? This will remove all associated bookings!`)) {
                await fetch(`http://localhost:5000/api/rooms/${room.room_id}`, {
                    method: 'DELETE', credentials: 'include'
                });
                renderAdminRooms(); // refresh list
            }
        };
        div.appendChild(delBtn);
        list.appendChild(div);
    });
}

document.getElementById("add-room-btn")?.addEventListener("click", async function() {
    const bId = document.getElementById("new-building-id").value;
    const rName = document.getElementById("new-room-name").value;
    
    if(!bId || !rName) return alert("Please fill in both building ID and room name.");
    
    const res = await fetch('http://localhost:5000/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ building_id: bId, room_name: rName })
    });
    
    if(res.ok) {
        document.getElementById("new-building-id").value = "";
        document.getElementById("new-room-name").value = "";
        renderAdminRooms();
    } else {
        const data = await res.json();
        alert(data.error || "Could not add room");
    }
});
