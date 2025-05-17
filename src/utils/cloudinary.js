import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const streamUpload = (
  buffer,
  folder,
  resourceType = "auto",
  publicId = null
) => {
  return new Promise((resolve, reject) => {
    const options = { folder, resource_type: resourceType };
    if (publicId) options.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary Upload Error:", error);
          return reject(new Error("Cloudinary upload failed"));
        }
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};

export default cloudinary;
