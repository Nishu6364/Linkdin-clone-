import express from "express";
import dotenv from "dotenv";
import { connect } from "mongoose";
import connectDB from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.route.js";
import connectionRouter from "./routes/connection.route.js";

import http from "http";
import { Server } from "socket.io";
import notificationRouter from "./routes/notification.routes.js";

dotenv.config();
let app = express();
let server = http.createServer(app);
export const io = new Server(server, {
  cors: { 
    origin: ["https://linkup-frontend-voty.onrender.com", "http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
});
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["https://linkup-frontend-voty.onrender.com", "http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);
let port = process.env.PORT || 4000;

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/connection", connectionRouter);
app.use("/api/notification",notificationRouter)

export const userSocketMap = new Map();

io.on("connection",(socket) =>{
    console.log("user connected ",socket.id)
    socket.on("register",(userId)=>{
        userSocketMap.set(userId,socket.id);
       // console.log("user socket map",userSocketMap)
    })
    socket.on("disconnected",(socket)=>{
        console.log("user disconnected",socket.id)
    })
})



server.listen(port, () => {
  connectDB();
  console.log("Server is Started");
});

//http:llocalhost:8000/api/auth/signup
