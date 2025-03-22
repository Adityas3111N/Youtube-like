import mongoose from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const owner = req?.user._id

    if(!name || !description){
        throw new ApiError(400, "either name or description is missing")
    } 

    if(!owner){
        throw new ApiError(400, "owner is necessary for making a playlist")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner
    })

    if(!playlist){
        throw new ApiError(500, "server error, playlist can't be created.")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "playlist has been successfully created."
    ))

})
const updatePlaylist = asyncHandler(async (req, res) => {
    const playlistId = req.params.playlistId
    const {name, description} = req.body

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "playlist doesn't exist")
    }
    
    if(name)playlist.name = name
    if(description)playlist.description = description
    
    await playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "playlist updated successfully."
        )
    )

})
const addVideo = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.body
    
    if(!playlistId || !videoId){
        throw new ApiError(400, "both playlistId and videoid is necessary")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "playlist doesn't exist")
    }
    
    if(playlist.videos.includes(videoId)){
        throw new ApiError(400, "video already exist in playlist")
    }

    playlist.videos.push(videoId)
    await playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "video added in playlist successfully."
        )
    )
})
const removeVideo = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.body
    
    if(!playlistId || !videoId){
        throw new ApiError(400, "both playlistId and videoid is necessary")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "playlist doesn't exist")
    }
    
    if(!playlist.videos.includes(videoId)){
        throw new ApiError(400, "video doesn't exist in playlist")
    }

    playlist.videos = playlist.videos.filter(id => id.toString() !== videoId)
    await playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "video removed successfully."
        )
    )
})

const listAllPlaylists = asyncHandler(async (req, res) => {
    //list all playlist created by a user
    const owner = req?.user._id
    
    if(!owner){
        throw new ApiError(400, "user doesn,t exist")
    }

    const playlists = await Playlist.find({owner})
    .sort({createdAt: -1})
    .select("name description videos createdAt owner")

    if(!playlists){
        throw new ApiError(400, "user hasn't created any playlist.")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlists,
        "all playlists are listed successfully"
    ))
})
const deletePlaylist = asyncHandler(async (req, res) => {
    const playlistId = req.params.playlistId

    if(!playlistId){
        throw new ApiError(400, "playlistId is necessary")
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletePlaylist,
            "playlist has been successfully deleted"
        )
    )
    
})

export {
    createPlaylist,
    updatePlaylist,
    addVideo,
    removeVideo,
    deletePlaylist,
    listAllPlaylists
}