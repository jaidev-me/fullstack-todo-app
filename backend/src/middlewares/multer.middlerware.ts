// multer middleware to accept avatar

import { Request } from "express";
import multer, { MulterError } from "multer";
import fs from "fs"

const storage = multer.diskStorage({
  destination: (req: Request, file:Express.Multer.File, cb) => {
    const uploadPath = "/tmp/uploads";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req:Request, file: Express.Multer.File, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(" ", "_"));
  },
});

const multerMiddleware = multer({
  storage: storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb) => {
    if (
      !(
        file.mimetype == "image/png" ||
        file.mimetype == "image/jpg" ||
        file.mimetype == "image/jpeg"
      )
    ) {
      cb(null, false);
      return cb(
        new MulterError(
          "LIMIT_UNEXPECTED_FILE",
          "Only .png, .jpg and .jpeg format allowed!"
        )
      );
    }
    cb(null, true);
  },
  limits:{
    fileSize: 1024 * 1024 * 5 // 5MB
  }
});


export default multerMiddleware;
