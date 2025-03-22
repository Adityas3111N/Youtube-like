import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new Schema (
    {
        videoFile: {
            type: String, //from cloudinary
            required: true
        },
        thumbnail: {
            type: String, //from cloudinary
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number,
            required: true
        }, //ye to cloudinary se hi milega. jaha pe bhi videos upload kro vo kuch 
        // info dete hai video ke bare me. unme access link aur duration bhi hoti
        // hai.
        views: {
            type: Number,
            default: 0
        },

        likes: {
            count: { type: Number, default: 0 }, // Total number of likes
            users: [
                {
                    type: mongoose.Types.ObjectId,
                    ref: "User"
                }
            ]
        },
        dislikes: {
            count: { type: Number, default: 0 }, // Total number of dislikes
            users: [
                {
                    type: mongoose.Types.ObjectId,
                    ref: "User"
                }
            ]
        },
        

        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }//ref always in quotes. takes name of owner channel from User.
    },

    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema)