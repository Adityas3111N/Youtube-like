import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {Comment} from "../models/comment.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";

const addComment = asyncHandler(async(req, res) => {
    const {content, video} = req.body
    const owner = req.user._id
    
    if(!video || !content || !owner){
        throw new ApiError(400, "All fields are required")
    }

    const comment = await Comment.create({content, video, owner})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "comment added successfully"
        )
    )
})

const deleteComment = asyncHandler(async(req, res) => {
    const commentId = req.query.commentId

    const comment = await Comment.findById(commentId)
    
    if(String(comment.owner) !== String(req.user._id)){
        throw new ApiError(407, "user is not allowed to delete comment")
    }
    if(!comment) {
        return new ApiError(400, "comment not found")
    }

    await comment.deleteOne()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "user comment deleted successfully"
        )
    )

})

const updateComment = asyncHandler(async(req, res) => {
    const commentId = req.query.commentId
    const {content} = req.body  

    const comment = await Comment.findById(commentId)

    comment.content = content;
    await comment.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "comment has been successfully updated"
        )
    )


})

const getAllComments = asyncHandler(async(req, res) => {
    const page = Number(req.query.page) || 1  //i was destructuring {page} = Number() like this but this wont work.
    const limit = Number(req.query.limit) || 10// js can destructure only from primitives like object etc.
    const order = "asc"?1:-1
    const videoId = req.query.videoId || ""
    const sortBy = req.query.sortBy || "createdAt"

    const skip = (page-1)* limit

    const filter = videoId?{video: videoId}: {}
    const sort = {}  //this will create object {createdAt : -1}
    if (sortBy && order !== undefined) {
        sort[sortBy] = order;
    }

    const comments = await Comment.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)

    const totalComments = await Comment.countDocuments(filter)
    const pages = Math.ceil(totalComments/limit)
  
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                comments,
                totalComments,
                pages
            },
            "All comments successfully fetched"
        )
    )
})

export{
    addComment,
    deleteComment,
    updateComment,
    getAllComments
}