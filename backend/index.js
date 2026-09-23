const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware för att automatiskt hantera JSON-data och tillåta anrop (CORS)
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// 1. Koppla till databasen
const dbPath = path.join(__dirname, '../database/app.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('SQLite connection error:', err.message);
    else console.log(`Connected to SQLite database at ${dbPath}`);
});

// 2. Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Express + SQLite running' });
});



// 3. Starta servern
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});