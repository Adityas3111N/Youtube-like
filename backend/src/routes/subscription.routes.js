import Router from "express"
import {
    getAllChannels,
    getAllSubscribers,
    userSubscribes,
    userUnsubscribes
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/subscribe/:channel").post(verifyJWT, userSubscribes)
router.route("/unsubscribe/:channel").post(verifyJWT, userUnsubscribes)
router.route("/get-all-subscribers/:channel").get(verifyJWT, getAllSubscribers)
router.route("/get-all-channels/:channel").get(verifyJWT, getAllChannels)

export default router