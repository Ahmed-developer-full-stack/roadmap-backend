// 📁 src/routes/studentsRouter.ts

import { Router } from "express";
import { supabase } from "../lib/supabase";

const studentsRouter = Router();

// ✅ Get all students
studentsRouter.get("/", async (req, res) => {
  const { data, error } = await supabase.from("students").select("*");
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ data });
});

// ✅ Add new student
studentsRouter.post("/", async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password)
    return res.status(400).json({ error: "Missing name or password" });

  const { data, error } = await supabase
    .from("students")
    .insert([{ name, password }]);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ message: "Student added", data });
});

// ✅ Update student
studentsRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, password } = req.body;

  if (!name && !password)
    return res.status(400).json({ error: "Nothing to update" });

  const updates: any = {};
  if (name) updates.name = name;
  if (password) updates.password = password;

  const { data, error } = await supabase
    .from("students")
    .update(updates)
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: "Student updated", data });
});

// ✅ Delete student
studentsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("students").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: "Student deleted" });
});

export default studentsRouter;
