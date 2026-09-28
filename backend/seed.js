import crypto from "crypto";
import db from "./db.js";

function hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}

console.log("Seeding database with initial data...");

// 1. Prepare initial users (apartment numbers and temporary passwords)
const initialUsers = [
    { apartment: "0000", password: "Admin1234", role: "admin" },
    { apartment: "1001", password: "Welcome1001!", role: "resident" },
    { apartment: "1002", password: "Welcome1002!", role: "resident" },
    { apartment: "1003", password: "Welcome1003!", role: "resident" },
    { apartment: "1101", password: "Welcome1101!", role: "resident" },
];

const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (apartment_number, password_hash, role) 
    VALUES (?, ?, ?)
`);

// 2. Prepare sample laundry rooms
const initialRooms = [
    { building_id: 1, room_name: "Laundry Room A (Building 1)" },
    { building_id: 1, room_name: "Laundry Room B (Building 1)" },
    { building_id: 2, room_name: "Laundry Room North (Building 2)" },
];

const insertRoom = db.prepare(`
    INSERT OR IGNORE INTO laundry_Rooms (building_id, room_name) 
    VALUES (?, ?)
`);

for (const room of initialRooms) {
    insertRoom.run(room.building_id, room.room_name);
}

console.log("Database seeded successfully!");
console.log("\n--- Accounts Available for Testing ---");
initialUsers.forEach(u => {
    console.log(`Apartment: ${u.apartment} | Role: ${u.role.padEnd(8)} | Temporary Password: ${u.password}`);
});