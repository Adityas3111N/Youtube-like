import mongoose from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"

const userSubscribes = asyncHandler(async (req, res) => {
    const channelId = req.query.channelId;
    const subscriberId = req.user._id;

    if (!channelId) {
        throw new ApiError(400, "Channel id is required in query.");
    }

    const channel = await User.findById(channelId).select("-password -refreshToken");
    const subscriber = await User.findById(subscriberId).select("-password -refreshToken");

    if (!channel || !subscriber) {
        throw new ApiError(400, "Both channel and subscriber must exist.");
    }

    // ✅ Check if already subscribed
    const existing = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    if (existing) {
        throw new ApiError(400, "You are already subscribed to this channel.");
    }

    const subscribed = await Subscription.create({
        subscriber: subscriberId,
        channel: channelId,
    });

    if (!subscribed) {
        throw new ApiError(500, "Something went wrong in Subscription controller");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribed,
                "User has successfully subscribed."
            )
        );
});

const checkSubscriptionStatus = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    if (!channelId) {
        throw new ApiError(400, "Channel id is required in query.");
    }

    const subscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isSubscribed: !!subscription },
            "Subscription status fetched successfully."
        )
    );
});


const userUnsubscribes = asyncHandler(async (req, res) => {
    const channelId = req.query.channelId;  // 👈 same as subscribe
    const subscriberId = req.user._id;

    if (!channelId) {
        throw new ApiError(400, "Channel id is required in query.");
    }

    const channel = await User.findById(channelId).select("-password -refreshToken");
    const subscriber = await User.findById(subscriberId).select("-password -refreshToken");

    if (!channel || !subscriber) {
        throw new ApiError(400, "Both channel and subscriber must exist.");
    }

    const subscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    });

    if (!subscription) {
        throw new ApiError(400, "You are not subscribed to this channel.");
    }

    const unsubscribed = await Subscription.findByIdAndDelete(subscription._id);

    return res.status(200).json(
        new ApiResponse(
            200,
            unsubscribed,
            "User has successfully unsubscribed."
        )
    );
});

const getAllChannels = asyncHandler(async (req, res) => {
    //get all channels a user has subscribed.
    const subscriber = req?.user._id
    const limit = req.query.limit || 10
    const page = req.query.page || 1
    const sortBy = req.query.sortBy || "createdAt"
    const order = req.query.order === "asc" ? 1 : -1
    const skip = (page - 1) * limit

    const sort = {}
    sort[sortBy] = order

    if (!subscriber) {
        throw new ApiError(400, "User hasn't logged in")
    }

    const filter = {
        subscriber: subscriber._id
    }
    const channels = await Subscription.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)

    const totalChannels = await Subscription.countDocuments(filter)
    const totalPages = Math.ceil(totalChannels / limit)

    if (!channels) {
        throw new ApiError(500, "server isn't responding")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    channels,
                    totalChannels,
                    totalPages
                },
                "all channels fetched successfully"
            )
        )
})
const getAllSubscribers = asyncHandler(async (req, res) => {
    const channel = req.params.channel
    const limit = req.query.limit || 10
    const page = req.query.page || 1
    const sortBy = req.query.sortBy || "createdAt"
    const order = req.query.order === "asc" ? 1 : -1
    const skip = (page - 1) * limit

    const sort = {}
    sort[sortBy] = order

    if (!channel) {
        throw new ApiError(400, "User hasn't logged in")
    }

    const filter = {
        channel
    }
    const subscribers = await Subscription.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)

    const totalSubscribers = await Subscription.countDocuments(filter)
    const totalPages = Math.ceil(totalSubscribers / limit)

    if (!subscribers) {
        throw new ApiError(500, "server isn't responding")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    subscribers,
                    totalSubscribers,
                    totalPages
                },
                "all channels fetched successfully"
            )
        )
})

export {
    userSubscribes,
    checkSubscriptionStatus,
    userUnsubscribes,
    getAllChannels,
    getAllSubscribers
}