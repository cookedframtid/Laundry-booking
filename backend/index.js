const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 1. Connect to SQLite database file locally
const dbPath = path.join(__dirname, '../database/app.db');  
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('SQLite connection error:', err.message);
  else console.log(`Connected to SQLite database at ${dbPath}`);
});

const PORT = 5000;

// 2. Minimal HTTP Server
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check route to test if the server works
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', message: 'Native Node + SQLite running' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

// 3. Start listening
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));