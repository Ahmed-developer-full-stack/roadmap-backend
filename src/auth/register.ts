import { Elysia } from "elysia";
import bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase";

const studentsRouter = new Elysia({ prefix: "/api/students" });

studentsRouter.post("/register", async ({ body, set }) => {
  const { name, password } = body as {
    name: string;
    password: string;
  };

  if (!name || !password) {
    set.status = 400;
    return { error: "Name and password are required" };
  }

  const { data: existing, error: findError } = await supabase
    .from("students")
    .select("id")
    .eq("name", name)
    .single();

  if (existing) {
    set.status = 409;
    return { error: "Name is already registered" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase.from("students").insert({
    name,
    password_hash: hashedPassword,
  });

  if (error) {
    set.status = 500;
    return { error: "Failed to register student" };
  }

  set.status = 201;
  return { message: "Student registered successfully" };
});
