import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";

// Backend (e.g., Node.js with Mongoose)
const addComment = async (req, res) => {
  try {
    const { content, video } = req.body;
    const userId = req.user._id; // Assuming you have middleware to attach the authenticated user

    const comment = await Comment.create({
      content,
      video,
      owner: userId,
    });

    // Populate the owner field
    const populatedComment = await Comment.findById(comment._id).populate('owner', 'userName avatar fullName');

    res.status(201).json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteComment = asyncHandler(async (req, res) => {
    const commentId = req.query.commentId

    const comment = await Comment.findById(commentId)

    if (String(comment.owner) !== String(req.user._id)) {
        throw new ApiError(407, "user is not allowed to delete comment")
    }
    if (!comment) {
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

const updateComment = asyncHandler(async (req, res) => {
    const commentId = req.query.commentId
    const { content } = req.body

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

const getAllComments = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const order = req.query.order === "asc" ? 1 : -1; // ✅ fixed
    const videoId = req.query.videoId || "";
    const sortBy = req.query.sortBy || "createdAt";

    const skip = (page - 1) * limit;

    // ✅ Only fetch top-level comments (replies handled separately)
    const filter = videoId ? { video: videoId, parentComment: null } : {};

    const sort = {};
    if (sortBy) {
        sort[sortBy] = order;
    }

    const comments = await Comment.find(filter)
        .populate("owner", "userName avatar") // ✅ fetch user details
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(); // lean = better perf since no mongoose overhead

    const totalComments = await Comment.countDocuments(filter);
    const pages = Math.ceil(totalComments / limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                totalComments,
                pages,
                currentPage: page,
            },
            "All comments successfully fetched"
        )
    );
});


export {
    addComment,
    deleteComment,
    updateComment,
    getAllComments
}