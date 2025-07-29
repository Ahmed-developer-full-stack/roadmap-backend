import jwt from "jsonwebtoken";
import { Elysia } from "elysia";

const JWT_SECRET = process.env.JWT_SECRET || "secretKey";

export const ADMIN_NAMES = ["admin"];

interface UserPayload {
  id?: string;
  name: string;
  role: "admin" | "student";
}

export const authMiddleware = new Elysia().derive(({ headers, set }) => {
  const token = headers.authorization?.split(" ")[1];

  if (!token) {
    set.status = 401;
    throw new Error("Unauthorized: No token provided");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;

    return {
      user: decoded,
      isAdmin: decoded.role === "admin",
    };
  } catch {
    set.status = 401;
    throw new Error("Unauthorized: Invalid token");
  }
});

// 🟢 Middleware for Express
export const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized: No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;

    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Not an admin" });
    }

    req.user = decoded; // attach to request
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
