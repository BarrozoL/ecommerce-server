import express from "express";
import dotenv from "dotenv";
import pool from "./db.js";
import authRouter from "./routes/auth.js";

dotenv.config();
const app = express();
app.use(express.json());

// 1) Public auth endpoints
app.use("/auth", authRouter);

// 2) Existing product test endpoint
app.get("/products", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 3) Start server
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
