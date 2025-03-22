import mongoose, { Schema } from 'mongoose'

const playlistSchema = new Schema({
    videos: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video",
            default: [] //when new playlist created by default it is empty.
        }
    ],

    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
}, {timestamps: true})

export const Playlist = mongoose.model("Playlist", playlistSchema)
