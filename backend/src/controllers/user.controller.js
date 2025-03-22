import { asyncHandler } from "../utils/asyncHandler.js"; // we have created a utility
//that take a function as a parameter and wrapped in try catch so no tension of handling error etc.
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js" //tis can have direct contact with db. as it  is created by mongoose.
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
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
    await user.save({validateBeforeSave: false}) //save the changes before validating password etc.

    return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access Token and refresh Tokens.")
    }
}

//const registerUser = asyncHandler(fn)
const registerUser = asyncHandler(
    //step 1 - get user details from frontend.
   async (req, res) => {
    const {userName, email, fullName, password, isAdmin} = req.body
    
    //step 2 - validate user has given all the details and his email and username is unique.
    if([userName, fullName, email, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({ //check kiya ki is email ya username se koi user hai ya nahi.
        $or: [{userName}, {email}] //or operator from mongoose. so check in mongodb.
    })
    if(existedUser){
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
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){ //checks if req.files exist then if coverImage in req.files is an array? then if its length is greater than 0. if all yes then take the path and put on cloudinary.
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar is required");
    }
    //step 4 - upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath): null;//wait until uploaded.

    if(!avatar){
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
        isAdmin: isAdmin
    })

    //step 6 - check if user is creeated and if created then remove password and refreshToken fileds.
    const createdUser = await User.findById(newUser._id).select("-password -refreshToken")
    if(!createdUser){
        throw new ApiError(500, "Couldn't upload the images. try again later.")
    }

    //step 7 - send response that user is successfully registered.
    return res.status(201).json(
        new ApiResponse (200, createdUser, "User is registered successfully.")//apiResponse is a utility here.
    )
    }) //ab ye method to hamne bana diya ab ye method run kab hoga. to koi url agar hit
//  hoga to run hoga. to iske liye hm routes banate hai. 

const loginUser = asyncHandler(
    async (req, res) => {
        //step 1 - get data from frontend(formdata).
        const {email, userName, password} = req.body

        if(!userName && !email){
            throw new ApiError(400, "username or email is required.")
        }

        //step 2 - check if user exist or not.(if any of email or username is found.)
        const user = await User.findOne({ //y method mongoDb ke mongoose ki wjh se available h.
            $or: [{email}, {userName}]
        })

        if(!user){
            throw new ApiError(404, "user doesn't exist")
        }

        //step 3 - check password. in userSchema we have used bcrypt to compare encrypted password. isPasswordCorrect function.
       const isPasswordvalid =  await user.isPasswordCorrect(password) //this is not mongoode User. this is our user which we got from response of findOne.
       
       if(!isPasswordvalid){
        throw new ApiError(401, "Invalid user credentials")
    }

    //step 4 - generate access and refresh Tokens.
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id); //destructure and store both values in variables.

    //here either update the user object or make another call to db if that doesn't seem expensive.
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //step 5 - send cookies & send response that user logged in.
    const options = { //by default cookies can be modified by anyone. but doing these two now itsonly modifiable from server. altrough frontend can see it.
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser //if you just write accessToken, refreshtoken here. it will give both twice in reponse. i solved that bug.
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
            $set: {refreshToken: undefined}
        },
        {
            new: true //response me new updated value milegi.
        },
    )

    const options = { //by default cookies can be modified by anyone. but doing these two now itsonly modifiable from server. altrough frontend can see it.
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse (200, {}, "user logged out successfully.")
    )
    }
)

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;  
    //when frontend sees a 401, it automatically calls refresh endpoint.
    //refresh token will be stored in form cookies in browser so easily accessed by req.cookies.
    //then we have cookie-parser.
    // "/refresh-token" by "axios.post('api/v1/auth/refresh-token', {}, { withCredentials: true });"

    if(!incomingRefreshToken){
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
     if(!user){
         throw new ApiError(401, "invalid refresh token")
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401, "refresh token is expired or used")
     }
 
     //if refreshToken matched.
 
     const options = {
         httpOnly: true,
         secure: true
     }
     const{accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id) 
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
         new ApiResponse
         (200,
         {accessToken, refreshToken: newRefreshToken},
         "access token refreshed successfully")
     )
   } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token")
   }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
   
    const {oldPassword, newPassword} = req.body //varify jwt middleware phle chal chuka hai to check wheather user is logged in or not. so in req we will have access to user field.
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "invalid password")
    }

    user.password = newPassword //update password
    user.save({validateBeforeSave: false}) //save without validating other fields etc to db.

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
    const {fullName, email} = req.body

    const user = await User.findByIdAndUpdate(
        req.user._id,   //verify jwt before this. so req have access to user object.
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true} //in user you will get updated user.
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
    const fileName = avatarUrl.substring(avatarUrl.lastIndexOf("/")+1); 
    //"avatarUrl.lastIndexOf("/")+1 -> this means last index of slash + 1"
    //i.e - if 61 is last index of "/". then 62
    //and fileName will store whole substring from 62 to end.

    const public_id = fileName.split(".")[0];//cloudinary need public_id (last part of url) to delete any cloudinary file.
    //this will split in parts at every dot. and public will store first part.

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    const response = await deleteFromCloudinary(public_id);

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            {user, response},
            "avatar updated successfully & old avatar deleted successfully."
        )
    )
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path //multer ne avatar ko local pe upload kiya. ye usi ka path hai.
    const coverImageUrl = req.user?.coverImage;

    const fileName = coverImageUrl.substring(coverImageUrl.lastIndexOf("/")+1)
    const public_id = fileName.split(".")[0];


    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "error while uploading coverImage")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    const response = await deleteFromCloudinary(public_id);


    return res
    .status(200)
    .json(
        new ApiResponse(200,
           {user, response},
            "coverImage updated successfully & old coverImage deleted successfully from cloudinary."
        )
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params  //bcz param key is username not userName. in url we generally use smallcase for clarity.
    //this was a bug i was trying to use "userName" and this threw error. bcz param is giving 
    //{ username: 'eleven' }


    //note - param se lete hue hamesa jo param me define hoga usi naam se data lenge.
    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    //now you have 2 options either use User.find({userName}) then apply aggregation pipeline on its _id.
    //or second option use $match from aggregation features.

    const channel = await User.aggregate([ //output jo channel me store hoga vo array hoga.
        {
            $match: {//stage 1 - ab hamare pas keval ek document hai jiske pas vo username hai jo ki frontend ko chahiye.
                userName: username?.toLowerCase() 
            }
        },
        {
            $lookup: {
                from: "subscriptions", //mongo me sare feilds lowercase aur plural ho jati h.
                localField: "_id",
                foreignField: "channel",
                as: "subscribers" //it will return all documents which subscribes _id.
            },
        },
        {
            $lookup: {
                from: "subscriptions", //mongo me sare feilds lowercase aur plural ho jati h.
                localField: "_id",
                foreignField: "subscriber",  //check in each document in subscriptions it will look for subscriber feild with _id value.
                as: "subscriberedTo" //it will return all documents which is subscribed by _id.
            }
        }, 
        {
            $addFields: {//add additional fields.
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscriberedTo"
                },

                isSubscribed: {
                   $cond: {
                    if: {$in: [req.user?._id, "$subscribers.subscriber"]}, //check if _id of user is in subscribers.subscriber or not.
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
                avvatar: 1,
                subscribersCount: 1,
                isSubscribed: 1,
                channelSubscribedToCount:1,
                createdAt: 1,
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exist.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel[0],
            "user channel fetched successfully"
        )
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


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
    getWatchHistory
   } //exported registerUser object.