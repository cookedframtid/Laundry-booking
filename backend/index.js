// backend/index.js
import express from "express";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import db from "./db.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// helper function to hash passwords
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// ==========================================
// 1. MIDDLEWARE: AUTHENTICATION AND AUTHORIZATION
// ==========================================

// Checks if the user is logged in via their cookie
const requireAuth = (req, res, next) => {
    const token = req.cookies.session_token;
    if (!token) return res.status(401).json({ error: "You must be logged in." });

    const stmt = db.prepare(`
        SELECT u.apartment_number, u.role 
        FROM sessions s
        JOIN users u ON s.apartment_number = u.apartment_number
        WHERE s.token = ? AND s.expires_at > ?
    `);
    const user = stmt.get(token, Date.now());

    if (!user) return res.status(401).json({ error: "Invalid or expired session." });

    req.user = user; // Save the user in the request so other routes can see who made the call
    next();
};

// Checks if the user is an admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Endast administratörer har tillgång." });
    }
    next();
};


// ==========================================
// 2. ROUTES: AUTENTISERING (Registrera/Logga in)
// ==========================================

app.post('/api/register', (req, res) => {
    const { apartment_number, password, role } = req.body;
    const userRole = role === 'admin' ? 'admin' : 'resident'; // Default is resident

    try {
        const stmt = db.prepare("INSERT INTO users (apartment_number, password_hash, role) VALUES (?, ?, ?)");
        stmt.run(apartment_number, hashPassword(password), userRole);
        res.json({ message: "User created successfully!" });
    } catch (error) {
        res.status(400).json({ error: "The apartment number is already registered." });
    }
});

app.post('/api/login', (req, res) => {
    const { apartment_number, password } = req.body;
    
    const stmt = db.prepare("SELECT * FROM users WHERE apartment_number = ? AND password_hash = ?");
    const user = stmt.get(apartment_number, hashPassword(password));

    if (!user) {
        return res.status(401).json({ error: "Incorrect apartment number or password." });
    }

    // Create a secure session
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // Valid for 24 hours

    db.prepare("INSERT INTO sessions (token, apartment_number, expires_at) VALUES (?, ?, ?)").run(token, apartment_number, expiresAt);

    // Send the session as an httpOnly cookie
    res.cookie('session_token', token, { httpOnly: true });
    res.json({ message: "Inloggad!", role: user.role });
});

app.post('/api/logout', (req, res) => {
    const token = req.cookies.session_token;
    if (token) {
        db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    }
    res.clearCookie('session_token');
    res.json({ message: "Logged out successfully!" });
});


// ==========================================
// 3. 3. ROUTES: LAUNDRY ROOMS (Only admin can create/delete)
// ==========================================

app.get('/api/rooms', (req, res) => {
    const rooms = db.prepare("SELECT * FROM laundry_Rooms").all();
    res.json(rooms);
});

app.post('/api/rooms', requireAuth, requireAdmin, (req, res) => {
    const { building_id, room_name } = req.body;
    try {
        const info = db.prepare("INSERT INTO laundry_Rooms (building_id, room_name) VALUES (?, ?)").run(building_id, room_name);
        res.json({ message: "Laundry room created!", room_id: info.lastInsertRowid });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/rooms/:id', requireAuth, requireAdmin, (req, res) => {
    const info = db.prepare("DELETE FROM laundry_Rooms WHERE room_id = ?").run(req.params.id);
    if (info.changes > 0) res.json({ message: "Laundry room deleted!" });
    else res.status(404).json({ error: "Room not found." });
});


// ==========================================
// 4. ROUTES: BOOKINGS (Search, Create, Update, Delete)
// ==========================================

// Search, Filter and Sort bookings
app.get('/api/bookings/search', (req, res) => {
    const { room_id, apartment_number, sort_by } = req.query;
    
    let sql = "SELECT * FROM bookings WHERE 1=1";
    let params = [];

    if (room_id) {
        sql += " AND room_id = ?";
        params.push(room_id);
    }
    if (apartment_number) {
        sql += " AND apartment_number = ?";
        params.push(apartment_number);
    }

    if (sort_by === 'time_asc') {
        sql += " ORDER BY start_time ASC";
    } else {
        sql += " ORDER BY start_time DESC";
    }

    const bookings = db.prepare(sql).all(...params);
    res.json(bookings);
});

app.get('/api/bookings', (req, res) => {
    const bookings = db.prepare("SELECT * FROM bookings").all();
    res.json(bookings);
});

app.post('/api/bookings', requireAuth, (req, res) => {
    const { room_id, start_time, end_time } = req.body;
    // Use the logged-in apartment number directly from the session for security
    const apartment_number = req.user.apartment_number; 

    try {
        const info = db.prepare(`
            INSERT INTO bookings (room_id, apartment_number, start_time, end_time) 
            VALUES (?, ?, ?, ?)
        `).run(room_id, apartment_number, start_time, end_time);
        
        res.json({ message: "Booking created successfully!", booking_id: info.lastInsertRowid });
    } catch (error) {
        res.status(400).json({ error: "Could not create booking." });
    }
});

app.put('/api/bookings/:id', requireAuth, (req, res) => {
    const { start_time, end_time } = req.body;
    
    // Only allow if you own the booking, or if you are an admin
    const booking = db.prepare("SELECT apartment_number FROM bookings WHERE booking_id = ?").get(req.params.id);
    
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (booking.apartment_number !== req.user.apartment_number && req.user.role !== 'admin') {
        return res.status(403).json({ error: "You can only update your own bookings." });
    }

    try {
        db.prepare("UPDATE bookings SET start_time = ?, end_time = ? WHERE booking_id = ?").run(start_time, end_time, req.params.id);
        res.json({ message: "Booking updated successfully!" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/bookings/:id', requireAuth, (req, res) => {
    const booking = db.prepare("SELECT apartment_number FROM bookings WHERE booking_id = ?").get(req.params.id);
    
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    if (booking.apartment_number !== req.user.apartment_number && req.user.role !== 'admin') {
        return res.status(403).json({ error: "You can only delete your own bookings." });
    }

    db.prepare("DELETE FROM bookings WHERE booking_id = ?").run(req.params.id);
    res.json({ message: "Booking canceled successfully!" });
});


// ==========================================
// START SERVER
// ==========================================
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Express, SQLite & Auth running' });
});

app.listen(5000, () => console.log(`Server running on http://localhost:5000`));