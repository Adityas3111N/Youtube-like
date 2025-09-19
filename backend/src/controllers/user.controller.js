import { asyncHandler } from "../utils/asyncHandler.js"; // we have created a utility
//that take a function as a parameter and wrapped in try catch so no tension of handling error etc.
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js" //tis can have direct contact with db. as it  is created by mongoose.
import { Video } from "../models/video.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { json } from "express";
import { Subscription } from "../models/subscription.model.js";




//we always need to generate access Token and refresh Tokens so instead i made a method for doing this.

const generateAccessAndRefreshTokens = async (userId) => {//just enter userId and both will be generated.

    try {

        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken() //Tokens are generated and stored.

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }) //save the changes before validating password etc.

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access Token and refresh Tokens.")
    }
}

//const registerUser = asyncHandler(fn)
const registerUser = asyncHandler(
    //step 1 - get user details from frontend.
    async (req, res) => {
        const { userName, email, fullName, password } = req.body

        //step 2 - validate user has given all the details and his email and username is unique.
        if ([userName, fullName, email, password].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required")
        }

        const existedUser = await User.findOne({ //check kiya ki is email ya username se koi user hai ya nahi.
            $or: [{ userName }, { email }] //or operator from mongoose. so check in mongodb.
        })
        if (existedUser) {
            throw new ApiError(409, "User with same email or username already exist")
        }

        //step 3 - take path of locally stored avatar and coverImage
        // console.log("Received files:", req.files);
        // console.log("Avatar file:", req.files?.avatar);
        // console.log("CoverImage file:", req.files?.coverImage); 
        //just checking is everything fine.

        const avatarLocalPath = req?.files?.avatar[0].path; //kai bar dusri file postman me dal ke check kr leni chahiye(register me phle se jo file thi bs user name aur email change kr ke). abhi aisa hus mai aadhe ghante se paresan tha nya user register nhi ho rha tha.
        //koi bhi file upload krte hai jb multer se to us file ke naam ko ek array return krta hai jisme at 0th index ek object hota hai jo ki uska path aur other fields store krta hai.
        // const coverImageLocalPath = req?.files?.coverImage[0]?.path;
        //this was throwing error in case when there was no cover image given by user. becz if you don't have an array coverImage coming, how can you access coverImage[0].
        let coverImageLocalPath;
        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) { //checks if req.files exist then if coverImage in req.files is an array? then if its length is greater than 0. if all yes then take the path and put on cloudinary.
            coverImageLocalPath = req.files.coverImage[0].path;
        }

        if (!avatarLocalPath) {
            throw new ApiError(400, "avatar is required");
        }
        //step 4 - upload on cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;//wait until uploaded.

        if (!avatar) {
            throw new ApiError(400, "avatar can't be uploaded on cloudinary");
        }

        //step 5 - create user object and create it's entry in db.
        const newUser = await User.create({
            fullName, //in js  fullName: fullName can be written like this.
            avatar: avatar.url,
            coverImage: coverImage?.url,
            email,
            password,
            userName: userName.toLowerCase(),
        })

        //step 6 - check if user is creeated and if created then remove password and refreshToken fileds.
        const createdUser = await User.findById(newUser._id).select("-password -refreshToken")
        if (!createdUser) {
            throw new ApiError(500, "Couldn't upload the images. try again later.")
        }

        // ✅ Step 7 - create token (auto-login)
        const token = jwt.sign(
            { id: createdUser._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        );

        // Step 8 - send response with token and user data
        return res.status(201).json(
            new ApiResponse(200, { user: createdUser, token }, "User is registered and logged in successfully.")
        );
    }) //ab ye method to hamne bana diya ab ye method run kab hoga. to koi url agar hit
//  hoga to run hoga. to iske liye hm routes banate hai. 

const loginUser = asyncHandler(
    async (req, res) => {
        //step 1 - get data from frontend(formdata).
        const { email, userName, password } = req.body

        if (!userName && !email) {
            throw new ApiError(400, "username or email is required.")
        }

        //step 2 - check if user exist or not.(if any of email or username is found.)
        const user = await User.findOne({ //y method mongoDb ke mongoose ki wjh se available h.
            $or: [{ email }, { userName }]
        })

        if (!user) {
            throw new ApiError(404, "user doesn't exist")
        }

        //step 3 - check password. in userSchema we have used bcrypt to compare encrypted password. isPasswordCorrect function.
        const isPasswordvalid = await user.isPasswordCorrect(password) //this is not mongoode User. this is our user which we got from response of findOne.

        if (!isPasswordvalid) {
            throw new ApiError(401, "Invalid user credentials")
        }

        //step 4 - generate access and refresh Tokens.
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id); //destructure and store both values in variables.

        //here either update the user object or make another call to db if that doesn't seem expensive.
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

        //step 5 - send cookies & send response that user logged in.
        const options = { //by default cookies can be modified by anyone. but doing these two now itsonly modifiable from server. altrough frontend can see it.
            httpOnly: true,
            secure: true,
            sameSite: "None",
            domain: "youtube-clone-2w92.onrender.com"
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)// chrome was not letting backend fetch cookies from frontend. (it was cross origin)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser, //if you just write accessToken, refreshtoken here. it will give both twice in reponse. i solved that bug. lolll it was not a bug instead i created a bug due to this which lasted for a whole day.
                        accessToken,
                        refreshToken
                    },
                    "user logged in successfully"
                )
            )
    }
)

const logoutUser = asyncHandler(
    async (req, res) => {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: { refreshToken: undefined }
            },
            {
                new: true //response me new updated value milegi.
            },
        )

        // const options = { //by default cookies can be modified by anyone. but doing these two now itsonly modifiable from server. altrough frontend can see it.
        //     httpOnly: true,
        //     secure: true,
        //     sameSite: "None"
        // } //since i am not using any cookies so commented these lines.

        return res
            .status(200)
            // .clearCookie("accessToken", options) //not using cookies anymore.
            // .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(200, {}, "user logged out successfully.")
            )
    }
)

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    //when frontend sees a 401, it automatically calls refresh endpoint.
    //refresh token will be stored in form cookies in browser so easily accessed by req.cookies.
    //then we have cookie-parser.
    // "/refresh-token" by "axios.post('api/v1/auth/refresh-token', {}, { withCredentials: true });"

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");
    }

    try {//just for safty try catch.
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET  // i used just id as payload to make refreshToken. so in decodedToken i would have that. and i can compare that with id of user in our db.
        )

        console.log(decodedToken);

        const user = await User.findById(decodedToken?._id);
        console.log(user);
        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
        }

        //if refreshToken matched.

        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse
                    (200,
                        { accessToken, refreshToken: newRefreshToken },
                        "access token refreshed successfully")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body //varify jwt middleware phle chal chuka hai to check wheather user is logged in or not. so in req we will have access to user field.
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid password")
    }

    user.password = newPassword //update password
    user.save({ validateBeforeSave: false }) //save without validating other fields etc to db.

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "User has successfully changed password")
        )

})

const getCurrentUser = asyncHandler(
    async (req, res) => {
        return res
            .status(200)
            .json(new ApiResponse(
                200, req.user, "current user fetched successfully"
            ))

    }
)

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    const user = await User.findByIdAndUpdate(
        req.user._id,   //verify jwt before this. so req have access to user object.
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        { new: true } //in user you will get updated user.
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(200,
                user,
                "User account details updated successfully"
            )
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path //multer ne avatar ko local pe upload kiya. ye usi ka path hai.
    const avatarUrl = req.user?.avatar;
    const fileName = avatarUrl.substring(avatarUrl.lastIndexOf("/") + 1);
    //"avatarUrl.lastIndexOf("/")+1 -> this means last index of slash + 1"
    //i.e - if 61 is last index of "/". then 62
    //and fileName will store whole substring from 62 to end.

    const public_id = fileName.split(".")[0];//cloudinary need public_id (last part of url) to delete any cloudinary file.
    //this will split in parts at every dot. and public will store first part.

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    const response = await deleteFromCloudinary(public_id);

    return res
        .status(200)
        .json(
            new ApiResponse(200,
                { user, response },
                "avatar updated successfully & old avatar deleted successfully."
            )
        )
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path //multer ne avatar ko local pe upload kiya. ye usi ka path hai.
    const coverImageUrl = req.user?.coverImage;

    const fileName = coverImageUrl.substring(coverImageUrl.lastIndexOf("/") + 1)
    const public_id = fileName.split(".")[0];


    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "error while uploading coverImage")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    const response = await deleteFromCloudinary(public_id);


    return res
        .status(200)
        .json(
            new ApiResponse(200,
                { user, response },
                "coverImage updated successfully & old coverImage deleted successfully from cloudinary."
            )
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberedTo"
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "allVideosOfAChannel"
            }
        },
        // 👇 enrich each video's owner with avatar + username
        {
            $lookup: {
                from: "users",
                localField: "allVideosOfAChannel.owner",
                foreignField: "_id",
                as: "videoOwners"
            }
        },
        {
            $addFields: {
                allVideosOfAChannel: {
                    $map: {
                        input: "$allVideosOfAChannel",
                        as: "video",
                        in: {
                            $mergeObjects: [
                                "$$video",
                                {
                                    owner: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$videoOwners",
                                                    as: "vo",
                                                    cond: { $eq: ["$$vo._id", "$$video.owner"] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelSubscribedToCount: { $size: "$subscriberedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                email: 1,
                coverImage: 1,
                avatar: 1,
                subscribersCount: 1,
                isSubscribed: 1,
                channelSubscribedToCount: 1,
                createdAt: 1,
                "allVideosOfAChannel._id": 1,
                "allVideosOfAChannel.videoFile": 1,
                "allVideosOfAChannel.thumbnail": 1,
                "allVideosOfAChannel.title": 1,
                "allVideosOfAChannel.description": 1,
                "allVideosOfAChannel.duration": 1,
                "allVideosOfAChannel.views": 1,
                "allVideosOfAChannel.likes": 1,
                "allVideosOfAChannel.dislikes": 1,
                "allVideosOfAChannel.isPublished": 1,
                "allVideosOfAChannel.createdAt": 1,
                "allVideosOfAChannel.updatedAt": 1,
                "allVideosOfAChannel.owner._id": 1,
                "allVideosOfAChannel.owner.userName": 1,
                "allVideosOfAChannel.owner.fullName": 1, 
                "allVideosOfAChannel.owner.avatar": 1
            }
        }

    ]);

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist.");
    }

    return res.status(200).json(
        new ApiResponse(200, channel[0], "user channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(req.user._id) }
        },
        { $unwind: "$watchHistory" },
        // 👇 sort by watchedAt descending so newest first
        { $sort: { "watchHistory.watchedAt": -1 } },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory.video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                { $project: { fullName: 1, username: 1, avatar: 1 } }
                            ]
                        }
                    },
                    { $addFields: { owner: { $first: "$owner" } } }
                ]
            }
        },
        { $addFields: { video: { $first: "$video" } } },
        {
            $project: {
                watchedAt: "$watchHistory.watchedAt",
                video: 1
            }
        },
        {
            $group: {
                _id: "$_id",
                history: { $push: { video: "$video", watchedAt: "$watchedAt" } }
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user.length > 0 ? user[0].history : [],
                "Watch history fetched successfully"
            )
        );
});



// POST /api/v1/history/:videoId
const addToWatchHistory = async (req, res) => {
    try {
        const { videoId } = req.params;
        const userId = req.user._id;

        await User.findByIdAndUpdate(
            userId,
            {
                $pull: { watchHistory: { video: videoId } } // remove old entry if exists
            }
        );

        await User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    watchHistory: {
                        video: videoId,
                        watchedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        res.status(200).json({ message: "Added to watch history" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update history" });
    }
};


const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params; // Get the user ID from the request parameters

    try {
        const user = await User.findById(id).select("-password -refreshToken"); // Find user by ID, exclude sensitive fields

        if (!user) {
            throw new ApiError(404, "User not found"); // If user doesn't exist, throw a 404 error
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    user,
                    "User fetched successfully"
                )
            );
    } catch (error) {
        // Handle cases where the ID format is invalid (e.g., not a valid ObjectId)
        if (error.name === 'CastError') {
            throw new ApiError(400, "Invalid user ID format");
        }
        // Re-throw other potential errors as internal server errors
        throw new ApiError(500, "Internal server error");
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id; // comes from JWT middleware

    const likedVideos = await Video.find({ "likes.users": userId })
        .populate("owner", "userName avatar") // populate channel/owner details
        .select("title thumbnail views createdAt owner likes count") // select only what you need
        .sort({ createdAt: -1 }); // latest uploaded videos first

    return res.status(200).json({
        success: true,
        message: "Liked videos fetched successfully",
        data: likedVideos,
    });
});



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserCoverImage,
    updateUserAvatar,
    getUserChannelProfile,
    getWatchHistory,
    getUserById,
    addToWatchHistory,
    getLikedVideos
} //exported registerUser object.