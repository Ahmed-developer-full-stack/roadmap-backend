import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Register student
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required" });

  const { data: existing } = await supabase
    .from("students")
    .select("id")
    .eq("email", email)
    .single();

  if (existing)
    return res.status(409).json({ error: "Email is already registered" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase.from("students").insert([
    {
      name,
      email,
      password_hash: hashedPassword,
    },
  ]);

  if (error)
    return res.status(500).json({ error: "Failed to register student" });

  return res.status(201).json({ message: "Student registered successfully" });
});

// Login student
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  const { data: student, error } = await supabase
    .from("students")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !student)
    return res.status(401).json({ error: "Invalid email or password" });

  const match = await bcrypt.compare(password, student.password_hash);
  if (!match)
    return res.status(401).json({ error: "Invalid email or password" });

  const token = jwt.sign({ studentId: student.id }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    message: "Login successful",
    token,
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
    },
  });
});

export default router;
