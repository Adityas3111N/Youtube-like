import Router from "express"
import {
    createPlaylist,
    updatePlaylist,
    addVideo,
    removeVideo,
    deletePlaylist,
    listAllPlaylists
} from "../controllers/playlist.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.route("/create-playlist").post(verifyJWT, createPlaylist)
router.route("/update-playlist/:playlistId").patch(verifyJWT, updatePlaylist)
router.route("/add-video").post(verifyJWT, addVideo)
router.route("/remove-video").post(verifyJWT, removeVideo)
router.route("/list-all-playlists").get(verifyJWT, listAllPlaylists)
router.route("/delete-playlist/:playlistId").post(verifyJWT, deletePlaylist)

export default router

