import multer from "multer";
import { nanoid } from "nanoid";
import fs from "fs";

export const fileTypes = {
  image: ["image/png", "image/jpeg", "image/jpg"],
  video: ["video/mp4", "video/ogg", "video/webm"],
  audio: ["audio/mpeg", "audio/ogg", "audio/webm"],
  pdf: ["application/pdf"],
};

export const multerLocal = (customValidationType = [], customPath = "generals") => {
  const fullPath = `uploads/${customPath}`;

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, fullPath);
    },
    filename: function (req, file, cb) {
      cb(null, nanoid(4) + "-" + file.originalname);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (customValidationType.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Error("invalid file type"), false);
    }
  };

  const upload = multer({ storage, fileFilter });

  return upload;
};

export const multerHost = (customValidationType = []) => {
  const storage = multer.diskStorage({});

  const fileFilter = (req, file, cb) => {
    if (customValidationType.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Error("invalid file type"), false);
    }
  };

  const upload = multer({ storage, fileFilter });

  return upload;
};
