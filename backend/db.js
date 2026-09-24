// backend/db.js
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "app.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    apartment_number varchar(255) PRIMARY KEY,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'resident'
  );

  CREATE TABLE IF NOT EXISTS laundry_Rooms (
    room_id INTEGER PRIMARY KEY AUTOINCREMENT,
    Building_id INTEGER NOT NULL,
    room_name TEXT NOT NULL
    unique(building_id, room_name)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL REFERENCES laundry_Rooms(room_id),
    apartment_number varchar(255) NOT NULL REFERENCES users(apartment_number),
    start_time INTEGER NOT NULL,
    end_time INTEGER NOT NULL,
    UNIQUE(room_id, start_time, end_time)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    apartment_number varchar(255) NOT NULL REFERENCES users(apartment_number),
    expires_at INTEGER NOT NULL
  );

`);

export default db;