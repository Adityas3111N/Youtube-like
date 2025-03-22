// require('dotenv').config({path: "./env"})
import dotenv from "dotenv" 
import { connectDB } from "./db/index.js" //imported connectDB function connecting DB in the starting of (entry point - i.e index.js) of code.
import { app } from "./app.js"; //import app to use app.

dotenv.config("./env"); //dotenv ko config kiya. aur package.json me kuch scripts bhi add krni padi.
//dotenv.config({ path: "../.env" });


//after database is connected. then listen the event at port.
connectDB() //connectDB is a async function so it will return a promise which can later .then & .catch
.then(() => {
    app.listen(process.env.PORT || 8000, "0.0.0.0", ()=> {
        console.log(`server is running at Port: ${process.env.PORT}`)
    })
})
.catch((error)=> {
    console.log("Mongo connection failed", error)
}
)



 





/*

import express from "express"
const app = express() //now app has superpowers of express.
const port = process.env.PORT




//database is far. so async await.
//may be can't access so wrap in try catch.

;( async ()=> {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("error", (error) => {
            console.log("error", error);
            throw(error);
        })

        app.listen(port, () => {
            console.log(`app is listening on  port ${port}`);
        })
    } catch (error) {
        console.log("error", error)
        throw error
    }

})()//iife

*/