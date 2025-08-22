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
        duration: Math.round(video.duration),
        owner: req.user._id,
        owner_userName: req.user.userName,
        avatar: req.avatar,

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
        .populate("owner", "userName fullName avatar")
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
import mongoose from "mongoose";

const getSingleVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?._id; // might be undefined if not logged in

    const video = await Video.findById(id).populate("owner", "_id userName fullName avatar");
    if (!video) throw new ApiError(404, "Video not found");

    let isLiked = false;
    let isDisliked = false;

    if (userId) {
        // Convert userId to string once
        const strUserId = userId.toString();

        isLiked = video.likes.users.some(uid => uid.toString() === strUserId);
        isDisliked = video.dislikes.users.some(uid => uid.toString() === strUserId);
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { ...video.toObject(), isLiked, isDisliked },
            "video fetched successfully"
        )
    );
});
// in get all videos we will get all video so we can map that array in such a way that user sees thumbnail, title ,etc and that whole div behaves as anchor(link).
// <a href={`/video/${video._id}`}> like this now params have => http://yourfrontend.com/video/65d75f8f7c9a4e001234abcd a link like this from which out controller only need the last one.
//now frontend will make a get request(fetch or axios) to the backend for that video of that id in params.


const deleteVideo = asyncHandler(async (req, res) => {

    const { id } = req.params
    const video = await Video.findById(id)

    if (String(video.owner._id) !== String(req.user._id)) {
        throw new ApiError(407, "user is not authorised to delete this video.")
    }
    try {

        const video = await Video.findByIdAndDelete(id)
        if (!video) {
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
            {
                title: title,
                description: description
            }, // Only update these fields
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


const likeAVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const video = await Video.findById(id);
    if (!video) throw new ApiError(404, "Video not found");

    const hasLiked = video.likes.users.includes(userId);
    const hasDisliked = video.dislikes.users.includes(userId);

    let update = {};

    if (hasLiked) {
        // remove like
        update = {
            $pull: { "likes.users": userId },
            $inc: { "likes.count": -1 }
        };
    } else {
        // add like
        update = {
            $addToSet: { "likes.users": userId },
            $inc: { "likes.count": 1 },
        };
        if (hasDisliked) {
            update.$pull = { "dislikes.users": userId };
            update.$inc["dislikes.count"] = -1;
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(id, update, { new: true });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                currentlyLikedBy: userId,
                totalLikes: updatedVideo.likes.count,
                totalDislikes: updatedVideo.dislikes.count,
                isLiked: !hasLiked
            },
            !hasLiked ? "Video liked successfully" : "Like removed successfully"
        )
    );
});


const dislikeAVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const userId = req.user._id;
    const hasDisliked = video.dislikes.users.some(
        (user) => user.toString() === userId.toString()
    );
    const hasLiked = video.likes.users.some(
        (user) => user.toString() === userId.toString()
    );

    if (hasDisliked) {
        // Toggle off dislike
        video.dislikes.users = video.dislikes.users.filter(
            (user) => user.toString() !== userId.toString()
        );
        video.dislikes.count -= 1;
    } else {
        // Add dislike
        video.dislikes.users.push(userId);
        video.dislikes.count += 1;

        // If liked before → remove like
        if (hasLiked) {
            video.likes.users = video.likes.users.filter(
                (user) => user.toString() !== userId.toString()
            );
            video.likes.count -= 1;
        }
    }

    await video.save({ validateBeforeSave: false });

    const isDisliked = video.dislikes.users.some(
        (user) => user.toString() === userId.toString()
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                currentlyDislikedBy: userId,
                totalLikes: video.likes.count,
                totalDislikes: video.dislikes.count,
                isDisliked
            },
            isDisliked
                ? "Video disliked successfully"
                : "Dislike removed successfully"
        )
    );
});





export {
    uploadVideo,
    getAllVideos,
    getSingleVideo,
    deleteVideo,
    updateVideo,
    likeAVideo,
    dislikeAVideo
}