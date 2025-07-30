import express from "express";
import multer from "multer";
import { supabase } from "../lib/supabase";
import { randomUUID } from "crypto";

export const attachmentsRouter = express.Router();

// إعداد multer لتخزين الملفات مؤقتًا في الذاكرة
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Get all attachments
attachmentsRouter.get("/", async (_, res) => {
  const { data, error } = await supabase.from("attachments").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ✅ Upload new attachment
attachmentsRouter.post("/", upload.single("file"), async (req, res) => {
  const { title } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "File is required" });

  const fileExt = file.originalname.split(".").pop();
  const fileName = `${randomUUID()}.${fileExt}`;
  const filePath = `attachments/${fileName}`;

  // رفع الملف إلى Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (uploadError)
    return res.status(500).json({ error: uploadError.message });

  // الحصول على رابط الملف
  const { data: urlData } = supabase.storage
    .from("attachments")
    .getPublicUrl(filePath);

  // حفظ البيانات في جدول attachments
  const { data, error } = await supabase
    .from("attachments")
    .insert([
      {
        title,
        file_url: urlData?.publicUrl,
        added_at: new Date().toISOString(),
      },
    ]);

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json(data);
});

// ✅ Update attachment
attachmentsRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  const { data, error } = await supabase
    .from("attachments")
    .update({ title })
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Attachment updated", data });
});

// ✅ Delete attachment
attachmentsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  // 1. نجيب الـ file_url علشان نحذف الملف من الـ Storage
  const { data: attachment, error: fetchError } = await supabase
    .from("attachments")
    .select("file_url")
    .eq("id", id)
    .single();

  if (fetchError)
    return res.status(500).json({ error: fetchError.message });

  // 2. نجيب اسم الملف من الرابط
  const filePath = attachment.file_url.split("/storage/v1/object/public/attachments/")[1];

  // 3. نحذف الملف من Storage
  await supabase.storage.from("attachments").remove([filePath]);

  // 4. نحذف من الجدول
  const { error } = await supabase.from("attachments").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Attachment deleted successfully" });
});
