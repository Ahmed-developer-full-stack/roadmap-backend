// 📁 src/routes/authRouter.ts

import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase";
import { ADMIN_NAMES } from "../middleware/auth";

const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secretKey";

// 🟢 Student Registration
authRouter.post("/register", async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const { data: existingUser } = await supabase
    .from("students")
    .select("*")
    .eq("name", name)
    .single();

  if (existingUser) {
    return res.status(409).json({ error: "Name already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase.from("students").insert({
    name,
    password: hashedPassword,
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ message: "Student registered successfully" });
});

// 🟢 Login (Admin & Student)
authRouter.post("/login", async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // ✅ Admin
  if (ADMIN_NAMES.includes(name)) {
    const isValid = password === process.env.ADMIN_PASSWORD;
    if (!isValid) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const token = jwt.sign({ name, role: "admin" }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({ token, role: "admin" });
  }

  // ✅ Student
  const { data: student, error } = await supabase
    .from("students")
    .select("*")
    .eq("name", name)
    .single();

  if (error || !student) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, student.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: student.id, name: student.name, role: "student" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.status(200).json({ token, role: "student" });
});

export default authRouter;
