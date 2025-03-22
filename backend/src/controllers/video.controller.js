import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";

const uploadVideo = asyncHandler(async (req, res) => {
    //steps -> 1) get discription, title (verifyjwt route me lga dena taki agr login ho user tabhi koi video upload kr paye)
    //2)  validate that that user has entered or not. trim().
    //3)get video and thumbnail from req.files
    //4)validate them
    //5)upload on cloudinary
    //6)return response

    const { title, description } = req.body

    if ([title, description].some((feild) => feild?.trim() === "")) {//.some array pe iterate karega. agr uske ander ki condition true hui to true return karega wrna false.
        throw new ApiError(401, "all fields are required")
    }//as soon as .some find an empty field it stops and return true. and if block executes.

    //local pe middleware upload(multer) ke dwara upload ho hi gya hai. to ab use cloudinary pe upload karwa dete hai.
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(401, "thumbnail is necessary")
    }

    const videoLocalPath = req.files?.video[0].path; //multer returns a array [{}] with same name as we uploaded. which have path etc.
    if (!videoLocalPath) {
        throw new ApiError(401, "video is necessary")
    }

    const thumbnail = thumbnailLocalPath ? await uploadOnCloudinary(thumbnailLocalPath) : null
    const video = videoLocalPath ? await uploadOnCloudinary(videoLocalPath) : null

    if (!thumbnail || !video) {
        return new ApiError(401, "both thubnail and video is necessary")
    }
    //jha pe bhi database wagerah se baat karo await lga do. wrna dikkat hoti hai.
    const newVideoUpload = await Video.create({ //waiting until database in another continent stored the data.
        videoFile: video.url,
        thumbnail: thumbnail.url,
        title,
        description: description,
        duration: 10,
        owner: req.user._id

    })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            newVideoUpload,
            "new video uploaded successfully."
        ))
}) //great my first controller completely on my own is now working. on mongo video is getting uploaded.

const getAllVideos = asyncHandler(async (req, res) => {
    // Pagination prevents the frontend from getting overloaded by fetching limited data per page.
    // For example: If there are 1000 videos, loading all at once would slow down the frontend.
    // With pagination, we load only the videos the user needs for the current page.

    const page = Number(req.query.page) || 1; // Convert to number since query params are strings
    const limit = Number(req.query.limit) || 10; // Default to 10 videos per page if no limit is provided
    const sortBy = req.query.sortBy || "createdAt"; // Default sorting field
    const order = req.query.order === "asc" ? 1 : -1; // Default to descending order

    const skip = (page - 1) * limit; // Calculate how many videos to skip based on the page number

    const sortOptions = {};
    sortOptions[sortBy] = order; // Create sorting object like { createdAt: -1 }

    // Fetch paginated and sorted videos
    const videos = await Video.find({})
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

    // Total videos for pagination calculation
    const totalVideos = await Video.countDocuments();
    const totalPages = Math.ceil(totalVideos / limit);

    // Return response
    return res.status(200).json(new ApiResponse(
        200,
        {
            videos,
            totalPages,
            currentPage: page
        },
        `All videos fetched successfully. Total pages: ${totalPages}`
    ));
});
 //working fine. all videos got from database. 10 at a page.
//i can apply more fiters too like sorting according to views or duration or likes.
const getSingleVideo = asyncHandler(async (req, res) => {
    const {id} = req.params

    try {
        const video = await Video.findById(id)

        if(!video){
            return new ApiError(401, "Video not found")
        }

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            video,
            "video fetched successfully"
        ))
    } catch (error) {
        return new ApiError(401, "internal server error")
    }
})// in get all videos we will get all video so we can map that array in such a way that user sees thumbnail, title ,etc and that whole div behaves as anchor(link).
// <a href={`/video/${video._id}`}> like this now params have => http://yourfrontend.com/video/65d75f8f7c9a4e001234abcd a link like this from which out controller only need the last one.
//now frontend will make a get request(fetch or axios) to the backend for that video of that id in params.


const deleteVideo = asyncHandler(async (req, res) => {
    
    const {id} = req.params
    const video = await Video.findById(id)

    if(String(video.owner )!== String(req.user._id)){
        throw new ApiError(407, "user is not authorised to delete this video.")
    }
    try {
        
        const video = await Video.findByIdAndDelete(id)
        if(!video){
            throw new ApiError(401, "video not found")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "video deleted successFully"
            )
        )
    } catch (error) {
        throw new ApiError(500, "internal server error")
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    try {
        const updatedVideo = await Video.findByIdAndUpdate(
            id,
            { title: title,
              description: description }, // Only update these fields
            { new: true, runValidators: true } // Return updated doc, run any schema validators
        );

        if (!updatedVideo) {
            throw new ApiError(404, "Video not found");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedVideo,
                    "Video updated successfully"
                )
            );
    } catch (error) {
        throw new ApiError(500, "Internal server error");
    }
});


const likeAVideo = asyncHandler(async (req, res) => {//verify jwt phle hi ho rha hai bs isi wjh se current user ka access mil raha hai.
    const {id} = req.params

    const video = await Video.findById(id)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    //user can like only if he is not already liked.
    if(video.likes.users.includes(req.user._id)){
        return res
        .status(409)
        .json(
            new ApiResponse(
                409,
                null,
                "user has already liked the video"
            )
        )
    }

    //if user already disliked, remove from dislikes.
    if(video.dislikes.users.includes(req.user._id)){
        video.dislikes.users = video.dislikes.users.filter(
            (user) => user.toString() !== req.user._id.toString() //to covert into string while comparing mongo objects is a good practise. bcz mostly they are objectId type.
        )
        video.dislikes.count-=1
    }//removed the current user from dislike array. if he disliked.

    video.likes.users.push(req.user._id)
    video.likes.count+=1

    await video.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                currentlyLikedBy : req.user._id,
                totalLikes: video.likes.count,
                totalDislikes: video.dislikes.count

            },
            "User like updated successfully"
        )
    )
})

const dislikeAVideo = asyncHandler(async (req, res) => {//verify jwt phle hi ho rha hai bs isi wjh se current user ka access mil raha hai.
    const {id} = req.params

    const video = await Video.findById(id)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    //user can like only if he is not already liked.
    if(video.dislikes.users.includes(req.user._id)){
        return res
        .status(409)
        .json(
            new ApiResponse(
                409,
                null,
                "user has already disliked the video"
            )
        )
    }

    //if user already liked, remove from likes.
    if(video.likes.users.includes(req.user._id)){
        video.likes.users = video.likes.users.filter(
            (user) => user.toString() !== req.user._id.toString() //to covert into string while comparing mongo objects is a good practise. bcz mostly they are objectId type.
        )
        video.likes.count-=1
    }//removed the current user from dislike array. if he disliked.

    video.dislikes.users.push(req.user._id)
    video.dislikes.count+=1

    await video.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                currentlyDislikedBy : req.user._id,
                totalLikes: video.likes.count,
                totalDislikes: video.dislikes.count //bcz we have to update like and dislikes both on frontend each time user interact with both buttons.

            },
            "User dislike updated successfully"
        )
    )
})




export {
    uploadVideo,
    getAllVideos,
    getSingleVideo,
    deleteVideo,
    updateVideo,
    likeAVideo,
    dislikeAVideo
}