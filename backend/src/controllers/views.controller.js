// controllers/view.controller.js
import { View } from "../models/views.model.js";
import { Video } from "../models/video.model.js";

export const addView = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id; // assuming user is authenticated

    // Check if already viewed (optional, depends on whether you want duplicate views)
    const existingView = await View.findOne({ video: videoId, user: userId });
    if (!existingView) {
      await View.create({ video: videoId, user: userId });

      // increment video views
      await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    }

    res.status(200).json({ message: "View added successfully" });
  } catch (error) {
    console.error("Error adding view:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
