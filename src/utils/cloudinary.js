import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import ApiError from "./ApiError.js";


// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (filePath) => {
    try {
        if (!filePath) return null;

        // upload files to cloudinary
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        });
        // file is uploaded
        // console.log(`file uploaded successfully! \n ${response.url}`);
        fs.unlinkSync(filePath)
        return response;
        
    } catch (error) {
        fs.unlinkSync(filePath);
        return null;
    }
}

const deleteFromCloudinary = async (imageUrl) => {
    try {
      // Extract the public_id from the image URL
      const publicId = imageUrl.split('/').pop().split('.')[0];
  
      // Delete the image from Cloudinary
      const response = await cloudinary.uploader.destroy(publicId);
  
      // Check if the image was deleted successfully
      if (response.result !== 'ok') {
        throw new ApiError( 400, 'Failed to delete image from Cloudinary' );
      }
  
      return response;
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      return null;
    }
  }

export {
    uploadOnCloudinary,
    deleteFromCloudinary
}