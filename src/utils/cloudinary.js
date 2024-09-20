import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


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
        console.log(`file uploaded successfully! \n ${response.url}`);
        return response;
        
    } catch (error) {
        fs.unlinkSync(filePath);
        return null;
    }
}

export default uploadOnCloudinary