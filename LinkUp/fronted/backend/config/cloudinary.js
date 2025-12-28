import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) {
      console.error("No file path provided!");
      return null;
    }

    // Check if required environment variables are present
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Missing Cloudinary environment variables!");
      return null;
    }

    // Configure Cloudinary with the loaded environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    if (!fs.existsSync(filePath)) {
      console.error("File not found at:", filePath);
      return null;
    }

    console.log("Uploading file to Cloudinary:", filePath);

    // Upload the image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      folder: "linkup_uploads" // Organize uploads in a folder
    });
    
    console.log("Upload successful:", uploadResult.secure_url);

    // Clean up the file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Return the URL of the uploaded image
    return uploadResult.secure_url;

  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
    console.error("Full error:", error);

    // Clean up the file even if upload fails
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (unlinkError) {
      console.error("Error cleaning up file:", unlinkError.message);
    }

    return null;
  }
};

export default uploadOnCloudinary;
