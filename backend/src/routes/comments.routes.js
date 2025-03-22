import { Router } from "express";
import{
addComment,
updateComment,
deleteComment,
getAllComments
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/add-comment").post(verifyJWT, addComment)
router.route("/delete-comment").post(verifyJWT, deleteComment)
router.route("/update-comment").patch(verifyJWT, updateComment)
router.route("").get(verifyJWT, getAllComments)


export default router

