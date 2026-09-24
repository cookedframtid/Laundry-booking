// backend/index.js
import express from "express";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import db from "./db.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Express + SQLite running' });
});








app.listen(5000, () => console.log(`Server running on http://localhost:5000`));