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
import jobRouter from "./routes/job.routes.js";

import http from "http";
import { Server } from "socket.io";
import notificationRouter from "./routes/notification.routes.js";

dotenv.config();
let app = express();
let server = http.createServer(app);
export const io = new Server(server, {
  cors: { 
    origin: ["https://linkup-frontend-voty.onrender.com", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
  },
});
app.use(express.json());
app.use(cookieParser());

// Serve static files (for resume downloads)
app.use('/public', express.static('public'));

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = ["https://linkup-frontend-voty.onrender.com", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
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
app.use("/api/jobs", jobRouter);

export const userSocketMap = new Map();

io.on("connection",(socket) =>{
    console.log("user connected ",socket.id)
    
    socket.on("register", async (userId)=>{
        userSocketMap.set(userId,socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`)
        
        // Join user to their personal room for direct messaging
        socket.join(userId);
        
        // Update user online status in database
        try {
            const User = (await import('./models/user.model.js')).default;
            await User.findByIdAndUpdate(userId, { 
                isOnline: true, 
                lastSeen: new Date(),
                lastActivity: new Date()
            });
            
            // Send current online users to the newly connected user
            const onlineUserIds = Array.from(userSocketMap.keys());
            socket.emit("initialOnlineUsers", onlineUserIds);
            
            // Broadcast online status to all connected users
            socket.broadcast.emit("userOnline", userId);
            console.log(`User ${userId} is now online`);
        } catch (error) {
            console.error("Error updating online status:", error);
        }
    })

    // Handle user activity updates
    socket.on("userActivity", async (userId) => {
        try {
            const User = (await import('./models/user.model.js')).default;
            await User.findByIdAndUpdate(userId, { 
                lastActivity: new Date(),
                isOnline: true
            });
        } catch (error) {
            console.error("Error updating user activity:", error);
        }
    });
    
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
    socket.on("typing", ({ chatId, userId }) => {
        socket.to(chatId).emit("userTyping", { userId, chatId });
    });
    
    socket.on("stopTyping", ({ chatId, userId }) => {
        socket.to(chatId).emit("userStoppedTyping", { userId, chatId });
    });
    
    // Handle sending messages
    socket.on("sendMessage", (messageData) => {
        console.log("Message received via socket:", messageData);
        
        // Emit to all users in the chat except sender
        if (messageData.chatId) {
            socket.to(messageData.chatId).emit("receiveMessage", messageData);
        }
        
        // Also emit to individual user rooms for direct messaging
        if (messageData.recipientId) {
            socket.to(messageData.recipientId).emit("receiveMessage", messageData);
        }
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
                        lastSeen: new Date(),
                        lastActivity: new Date()
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
