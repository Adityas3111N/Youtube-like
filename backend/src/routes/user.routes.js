import { Router } from "express"
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory, 
    updateAccountDetails
} from "../controllers/user.controller.js"

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";



const router = Router();

router.route("/register").post(  //is path pe jate hi ye files locally store ho jayengi temp folder me public ke under. aur multer usi naam ka ek array with one object at 0th index return karega jisme ki file ka path aur details hongi.
    upload.fields([//aur uploadOnCloudinary method me code likh diya hai jis se cloudinary pe upload krne ke baad local se delete kr de file.
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage", // in postman i just used smallcase 'c' instead of this and it threw error "unexpected field." i.e- they don't know what i am uploading.
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

//secure routes - login is necessary
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken) //made endpoint for refreshing access token.
//ye route "/register" path pe jate hi hame registerUser controller pe le jata hai.
//  ab us controller me jo bhi likha hoga vo ho jaega.

router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

//note - hamesa postman se jb check kro file upload to multer(here upload)
//me jo naam dala ho use key rkhna hoga. aur frontend se bhi dilwao to usi naam se.

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar) //post me sari details update ho jaengi isliye patch use kiya.
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage) //upload.single isliye kyuki multer ka use krke update krne ke liye file keval ek bar upload krne ki permission denge.

router.route("/channel/:username").get(verifyJWT, getUserChannelProfile) //: is important. bcz we are taking username from params(url). before that write c or channel doesn't matter.
//ways to give route in postman
//{{server}}users/channel/eleven
//
router.route("/history").get(verifyJWT, getWatchHistory)


export default router