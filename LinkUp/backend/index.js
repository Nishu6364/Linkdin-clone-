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
import savedPostRouter from "./routes/savedPost.routes.js";

import http from "http";
import { Server } from "socket.io";
import notificationRouter from "./routes/notification.routes.js";

dotenv.config();
let app = express();
let server = http.createServer(app);
export const io = new Server(server, {
  cors: { 
    origin: ["https://linkup-frontend-voty.onrender.com", "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST"]
  },
});
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = ["https://linkup-frontend-voty.onrender.com", "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
let port = process.env.PORT || 4000;

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/connection", connectionRouter);
app.use("/api/notification",notificationRouter)
app.use("/api/saved", savedPostRouter);

export const userSocketMap = new Map();

io.on("connection",(socket) =>{
    console.log("user connected ",socket.id)
    
    socket.on("register",(userId)=>{
        userSocketMap.set(userId,socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`)
    })
    
    socket.on("disconnect",()=>{
        console.log("user disconnected",socket.id)
        // Remove user from socket map on disconnect
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                console.log(`User ${userId} removed from socket map`)
                break;
            }
        }
    })
})



server.listen(port, () => {
  connectDB();
  console.log("Server is Started");
});

//http:llocalhost:8000/api/auth/signup
