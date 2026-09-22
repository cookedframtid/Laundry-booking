const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to SQLite database file inside mounted volume
const db = new sqlite3.Database('/app/data/app.db', (err) => {
  if (err) console.error('SQLite connection error:', err.message);
  else console.log('Connected to SQLite database at /app/data/app.db');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend and SQLite are running!' });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));