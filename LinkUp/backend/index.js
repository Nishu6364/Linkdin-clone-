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
import chatRouter from "./routes/chat.routes.js";

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
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"]
  })
);
let port = process.env.PORT || 4000;

// Add health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ 
        message: "Server is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        cors: {
            origin: req.get('Origin'),
            credentials: req.get('Cookie') ? 'present' : 'not present'
        }
    });
});

// Add email configuration check endpoint
app.get("/api/email-config", (req, res) => {
    res.json({
        emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        emailUser: process.env.EMAIL_USER ? 'Set' : 'Not set',
        emailPass: process.env.EMAIL_PASS ? 'Set (hidden)' : 'Not set',
        frontendUrl: process.env.FRONTEND_URL || 'Not set (using default)',
        nodeEnv: process.env.NODE_ENV || 'Not set'
    });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/connection", connectionRouter);
app.use("/api/notification",notificationRouter)
app.use("/api/saved", savedPostRouter);
app.use("/api/chat", chatRouter);

export const userSocketMap = new Map();

io.on("connection",(socket) =>{
    console.log("user connected ",socket.id)
    
    socket.on("register",(userId)=>{
        userSocketMap.set(userId,socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`)
        
        // Join user to their personal room for direct messaging
        socket.join(userId);
    })
    
    // Handle joining chat rooms
    socket.on("joinChat", (chatId) => {
        socket.join(chatId);
        console.log(`Socket ${socket.id} joined chat ${chatId}`);
    });
    
    // Handle leaving chat rooms
    socket.on("leaveChat", (chatId) => {
        socket.leave(chatId);
        console.log(`Socket ${socket.id} left chat ${chatId}`);
    });
    
    // Handle typing indicators
    socket.on("typing", ({ chatId, userId, isTyping }) => {
        socket.to(chatId).emit("userTyping", { userId, isTyping });
    });
    
    // Handle user online status
    socket.on("updateOnlineStatus", async (userId) => {
        try {
            const User = (await import('./models/user.model.js')).default;
            await User.findByIdAndUpdate(userId, { 
                isOnline: true, 
                lastSeen: new Date() 
            });
            
            // Broadcast online status to all connected users
            socket.broadcast.emit("userOnline", userId);
        } catch (error) {
            console.error("Error updating online status:", error);
        }
    });
    
    socket.on("disconnect",()=>{
        console.log("user disconnected",socket.id)
        
        // Update user offline status
        let disconnectedUserId = null;
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                disconnectedUserId = userId;
                userSocketMap.delete(userId);
                console.log(`User ${userId} removed from socket map`)
                break;
            }
        }
        
        // Update user offline status in database
        if (disconnectedUserId) {
            (async () => {
                try {
                    const User = (await import('./models/user.model.js')).default;
                    await User.findByIdAndUpdate(disconnectedUserId, { 
                        isOnline: false, 
                        lastSeen: new Date() 
                    });
                    
                    // Broadcast offline status
                    socket.broadcast.emit("userOffline", disconnectedUserId);
                } catch (error) {
                    console.error("Error updating offline status:", error);
                }
            })();
        }
    })
})



server.listen(port, () => {
  connectDB();
  console.log("Server is Started");
});

//http:llocalhost:8000/api/auth/signup
