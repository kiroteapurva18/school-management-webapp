import fs from "fs";
import path from "path";
import multer from "multer";

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const createPdfUploader = (subfolder) => {
  const root = path.resolve();
  const uploadDir = path.join(root, "uploads", subfolder);
  ensureDir(uploadDir);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || ".pdf");
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  });

  const fileFilter = (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
      return;
    }
    cb(null, true);
  };

  return multer({ storage, fileFilter });
};

export const resultPdfUpload = createPdfUploader("results");
export const homeworkPdfUpload = createPdfUploader("homework");
