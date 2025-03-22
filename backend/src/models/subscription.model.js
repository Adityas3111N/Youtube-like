import mongoose, {Schema} from "mongoose"
import { User } from "./user.model.js"

const subscriptionSchema = new Schema({
   subscriber: {
    type: Schema.Types.ObjectId, //the one who is subscribing.
    ref: User
   } ,

   channel: {
    type: Schema.Types.ObjectId, //"channel" whom user is subscribing.
    ref: User
   } ,


}, {timestamps: true})



export const Subscription = mongoose.model("Subscription", subscriptionSchema)