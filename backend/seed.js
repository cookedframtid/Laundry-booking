import crypto from "crypto";
import db from "./db.js";

function hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}

console.log("Seeding database with initial data...");

// 1. Prepare initial users (with building_id included)
const initialUsers = [
    { apartment: "0000", password: "password", role: "admin", building_id: 1 },
    { apartment: "1001", password: "password", role: "resident", building_id: 1 },
    { apartment: "1002", password: "password", role: "resident", building_id: 1 },
    { apartment: "2001", password: "password", role: "resident", building_id: 2 },
    { apartment: "2002", password: "password", role: "resident", building_id: 2 },
];

const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (apartment_number, password_hash, role, building_id) 
    VALUES (?, ?, ?, ?)
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

for (const user of initialUsers) {
    insertUser.run(user.apartment, hashPassword(user.password), user.role, user.building_id);
}

console.log("Database seeded successfully!");
console.log("\n--- Accounts Available for Testing ---");
initialUsers.forEach(u => {
    console.log(`Apartment: ${u.apartment} | Role: ${u.role.padEnd(8)} | Bldg: ${u.building_id} | Temp Password: ${u.password}`);
});