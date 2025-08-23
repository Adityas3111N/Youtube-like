import Router from "express"
import {
    checkSubscriptionStatus,
    getAllChannels,
    getAllSubscribers,
    userSubscribes,
    userUnsubscribes
} from "../controllers/subscription.controller.js"
import { optionalJWT, verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/subscribe").post(verifyJWT, userSubscribes)
router.route("/status/:channelId").get(verifyJWT, checkSubscriptionStatus)
router.route("/unsubscribe").post(verifyJWT, userUnsubscribes)
router.route("/get-all-subscribers/:channel").get(verifyJWT, getAllSubscribers)
router.route("/get-all-channels/:channel").get(verifyJWT, getAllChannels)

export default router