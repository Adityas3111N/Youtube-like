import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadVideo,
         getAllVideos, 
         getSingleVideo,
         deleteVideo,
         updateVideo,
         likeAVideo,
         dislikeAVideo
        } from "../controllers/video.controller.js";
const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

//app.use("/api/v1/users", userRouter) app users us path pe bhejta hai default. uske age jo path mile users me.
//so similarily we will make one for video routes. app.use("/api/v1/videos", videoRouter)
router.route("/upload-video")

.post(upload.fields([
    {
        name: "thumbnail", //ye naam string me dena tha. ""
        maxCount: 1
    },
    {
        name: "video",
        maxCount: 1
    }
]) ,uploadVideo)

router.route("").get(getAllVideos)
router.route("/watch/:id").get(getSingleVideo)
router.route("/delete-video/:id").post(verifyJWT, deleteVideo)
router.route("/update-video/:id").patch(verifyJWT, updateVideo)
router.route("/like-video/:id").patch(likeAVideo)
router.route("/dislike-video/:id").patch(dislikeAVideo)

export default router // ab is router ko kisi bhi naam se import kr skte hai.