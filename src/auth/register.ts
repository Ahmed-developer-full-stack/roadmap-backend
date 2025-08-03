import { Elysia } from "elysia";
import bcrypt from "bcryptjs";
import { supabase } from "../lib/supabase";

const studentsRouter = new Elysia({ prefix: "/api/students" });

studentsRouter.post("/register", async ({ body, set }) => {
  const { name, password } = body as {
    name: string;
    password: string;
  };

  const errorResponse = (status: number, error: string) => {
    set.status = status;
    return { error };
  };

  if (!name || !password)
    return errorResponse(400, "Name and password are required");

  if (!/^[a-zA-Z0-9_]+$/.test(name))
    return errorResponse(400, "Name must contain only letters, numbers, or underscores");

  if (name.length < 3 || name.length > 20)
    return errorResponse(400, "Name must be between 3 and 20 characters");

  if (password.length < 8)
    return errorResponse(400, "Password must be at least 8 characters long");

  const { data: existing, error: findError } = await supabase
    .from("students")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (findError) {
    console.error("Error checking student:", findError.message);
    return errorResponse(500, "Unexpected server error");
  }

  if (existing) {
    console.warn("Duplicate name attempt:", name);
    return errorResponse(400, "Unable to register student, try a different name.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase.from("students").insert({
    name,
    password_hash: hashedPassword,
  });

  if (error) {
    console.error("Insert error:", error.message);
    return errorResponse(500, "Failed to register student");
  }

  set.status = 201;
  return { message: "Student registered successfully" };
});
