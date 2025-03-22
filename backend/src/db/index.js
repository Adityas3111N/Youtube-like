import mongoose from "mongoose"
import {DB_NAME} from "../constants.js"

export const connectDB = async () => {

    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) //after connection mongoose returns an object.

        console.log(`/n MongoDB connected!! DB Host: ${connectionInstance.connection.host}`)  // so that you know which host you are connecting to.
    } catch (error) {
        console.log("MongoDB connection FAILED :: src :: db :: index.js", error);
        process.exit(1)
    }
}