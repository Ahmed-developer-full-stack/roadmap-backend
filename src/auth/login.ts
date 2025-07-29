import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase";
import studentsRouter from "../routes/students";
import { ADMIN_NAMES } from "../middleware/auth"; // لو عايز تحدد الـAdmins بالاسم

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

studentsRouter.post("/login", async ({ body, set }) => {
  const { name, password } = body as { name: string; password: string };

  if (!name || !password) {
    set.status = 400;
    return { error: "Name and password are required" };
  }

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("name", name)
    .single();

  if (error || !data) {
    set.status = 401;
    return { error: "Invalid name or password" };
  }

  const match = await bcrypt.compare(password, data.password_hash);

  if (!match) {
    set.status = 401;
    return { error: "Invalid name or password" };
  }

  const token = jwt.sign(
    {
      id: data.id,
      role: ADMIN_NAMES?.includes(data.name) ? "admin" : "student",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    message: "Login successful",
    token,
    student: {
      id: data.id,
      name: data.name,
      role: ADMIN_NAMES?.includes(data.name) ? "admin" : "student",
    },
  };
});
