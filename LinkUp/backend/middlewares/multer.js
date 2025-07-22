import multer from "multer"
import fs from "fs"
import path from "path"

// Ensure public directory exists
const publicDir = "./public";
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public")
  },
  filename: (req, file, cb) => {
    // Use timestamp to avoid filename conflicts
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName)
  },
});

const upload=multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
})

export default upload



