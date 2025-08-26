import Router from "express"
import {
    createPlaylist,
    updatePlaylist,
    addVideo,
    removeVideo,
    deletePlaylist,
    listAllPlaylists,
    getPlaylistById
} from "../controllers/playlist.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.route("/create-playlist").post(verifyJWT, createPlaylist)
router.route("/:playlistId").get(verifyJWT, getPlaylistById)
router.route("/update-playlist/:playlistId").patch(verifyJWT, updatePlaylist)
router.route("/:playlistId/videos/:videoId").post(verifyJWT, addVideo)
router.route("/:playlistId/videos/:videoId").delete(verifyJWT, removeVideo) //made restful apis consistant.
router.route("").get(verifyJWT, listAllPlaylists)
router.route("/delete-playlist/:playlistId").post(verifyJWT, deletePlaylist)

export default router

