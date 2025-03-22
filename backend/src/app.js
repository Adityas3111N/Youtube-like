import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

 // Birth of the ultimate powerful app.
 //This creates an instance of the Express app — your backend’s heart. 
 // It’s like a command center that listens for incoming requests and sends 
 // responses.
const app = express();

//When an error is emitted by the app, the error details are logged to the console
//with console.log("error", error).
app.on("error", (error) => {  
    console.log("error", error);
    throw error;
})

//After logging the error, the code rethrows the error using throw error;.
//This is often done to make sure the application stops running if a critical 
//issue occurs (instead of silently failing).

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
//That code is like a friendly doorman for your backend. It decides which websites (origins) are allowed to enter and talk to your backend (like your API).

// origin: This is the list of websites the doorman lets in (e.g., your frontend app).
// credentials: true: It also allows these websites to bring cookies or tokens with them, like IDs for who they are.
// So basically, it’s just saying, “Hey backend, let this website in and talk to you safely.”

app.use(express.json()) //Helps your app understand JSON data sent in requests.
app.use(express.urlencoded({extended: true}))//Helps your app understand form data (like when you submit a form on a website).
app.use(express.static("public"))//Lets your app serve files like images, CSS, or JavaScript from the "public" folder.
app.use(cookieParser())//Helps your app read cookies (small pieces of data stored in the browser).
 

//routes import
//by importing here we are seggregrating the code in sections.
import userRouter from "./routes/user.routes.js"

app.use("/api/v1/users", userRouter)  //app.use ka use middlewares ke liye hota h.
//it means jaise hi path "/api/v1/users" ho, ap userRouter me chale jao aage ka 
// rasta wha se pta chalega. similarily we will make for videoRouter, etc.

import videoRouter from "./routes/video.routes.js"
app.use("/api/v1/videos", videoRouter)

import commentRouter from "./routes/comments.routes.js"
app.use("/api/v1/comments", commentRouter)

import subscriptionRouter from "./routes/subscription.routes.js"
app.use("/api/v1/subscription", subscriptionRouter)

import playlistRouter from "./routes/playlist.routes.js"
app.use("/api/v1/playlist", playlistRouter)

export {app}  //have to export powerful app to use express in different files.