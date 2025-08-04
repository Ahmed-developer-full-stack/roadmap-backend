import multer from "multer";

// إعداد التخزين في الذاكرة
const storage = multer.memoryStorage();

// السماح فقط بـ PDF و JPEG و PNG
const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, and PDF files are allowed."));
    }
    cb(null, true);
  },
});
