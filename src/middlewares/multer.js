import multer from "multer";

// Store files in memory (since we'll upload to Cloudinary directly)
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;
