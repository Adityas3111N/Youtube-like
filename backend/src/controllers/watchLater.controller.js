import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

// Add a video to Watch Later
export const addToWatchLater = async (req, res) => {
    try {
        const userId = req.user._id; // assuming you use auth middleware to attach user
        const { videoId } = req.params;

        // validate video exists
        const videoExists = await Video.findById(videoId);
        if (!videoExists) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        const user = await User.findById(userId);

        if (user.watchLater.includes(videoId)) {
            return res.status(400).json({ success: false, message: "Already in Watch Later" });
        }

        user.watchLater.push(videoId);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Video added to Watch Later",
            data: user.watchLater,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove a video from Watch Later
export const removeFromWatchLater = async (req, res) => {
    try {
        const userId = req.user._id;
        const { videoId } = req.params;

        const user = await User.findById(userId);

        if (!user.watchLater.includes(videoId)) {
            return res.status(400).json({ success: false, message: "Video not in Watch Later" });
        }

        user.watchLater = user.watchLater.filter(
            (id) => id.toString() !== videoId.toString()
        );

        await user.save();

        res.status(200).json({
            success: true,
            message: "Video removed from Watch Later",
            data: user.watchLater,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all Watch Later videos
export const getWatchLater = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).populate(
            {
                path: "watchLater",
                populate: {
                    path: "owner",            // populate the video's owner
                    select: "userName avatar fullName", // only pick required fields
                },
            }
        );

        //reverse to show latest added first
        const latestFirst = [...user.watchLater].reverse();

        res.status(200).json({
            success: true,
            data: latestFirst,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


