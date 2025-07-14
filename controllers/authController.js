import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;

// POST /auth/register
export async function register(req, res) {
  const { username, email, password_hash } = req.body;
  if (!username || !email || !password_hash)
    return res
      .status(400)
      .json({ error: "Username, email & password required" });

  try {
    const hash = await bcrypt.hash(password_hash, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, role`,
      [username, email, hash]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505")
      // unique_violation
      return res.status(409).json({ error: "Email already registered" });
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// POST /auth/login
export async function login(req, res) {
  const { email, password_hash } = req.body;
  if (!email || !password_hash)
    return res.status(400).json({ error: "Email & password required" });

  try {
    const { rows } = await pool.query(
      `SELECT id, password_hash, role FROM users WHERE email = $1`,
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password_hash, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "8h",
    });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
