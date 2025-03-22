import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"; //this is by default provided by node js. file system helps tto manage files. we are using to unlink from server once uploaded on cloudinary.
import { ApiError } from './ApiError.js';
import { ApiResponse } from './ApiResponse.js';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_CLOUD_KEY, 
    api_secret: process.env.CLOUDINARY_CLOUD_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => { //upload krne ke liye keval localFile Path chahiye.
    try {
        if(!localFilePath){
            console.error("cloudinary.js :: no local file path given", error);
            return null;
        }

        const response = await cloudinary.uploader.upload(localFilePath, {resource_type: "auto"});
        //to check if files are geting uploaded. and if yes then how to get the url.
        // console.log("file is uploaded on cloudinary", response.url); 
        fs.unlinkSync(localFilePath) //it will delete file from local storage after being uploaded on cloudinary. and even if some error occur it will delete in that case also.
        return response;

    } catch (error) {
        // fs.unlinkSync(localFilePath) //remove locally stored file as upload failed.
        // Good Practice: Avoid synchronous operations (unlinkSync) in a non-blocking 
        // environment like Node.js. Use fs.promises.unlink() instead, as it’s
        //  asynchronous and won’t block the event loop.
        await fs.promises.unlink(localFilePath);
        return null
    }
}

const deleteFromCloudinary = async(localFilePath) => {//delete krne ke liye kevl public_id chahiye - cloudinary url ke last ka. extension chod ke.
    try {
        if(!localFilePath){
            throw new ApiError(400, "no old file to delete from cloudinary")
        }

        const response = await cloudinary.uploader.destroy(localFilePath)


        if (response.result !== 'ok') {
            throw new ApiError(400, 'Failed to delete file from Cloudinary');
        }
        //Since this is a helper function, it should just return the response 
        // or an error — and let the controller handle the response.

        return response;
        
    } catch (error) {
        throw new ApiError(401, "something went wrong while deleting old file from cloudinary after updating")
    }
}


export {
    uploadOnCloudinary,
    deleteFromCloudinary
};