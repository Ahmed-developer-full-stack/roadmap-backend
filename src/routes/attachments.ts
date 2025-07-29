import express from "express";
import { supabase } from "../lib/supabase";

export const attachmentsRouter = express.Router();

// GET all attachments
attachmentsRouter.get("/", async (_, res) => {
  const { data, error } = await supabase.from("attachments").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST new attachment
attachmentsRouter.post("/", async (req, res) => {
  const { title, fileUrl, addedAt } = req.body;
  const { data, error } = await supabase
    .from("attachments")
    .insert([{ title, file_url: fileUrl, added_at: addedAt }]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});
