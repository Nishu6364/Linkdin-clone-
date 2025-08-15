import express from "express"
import { getCurrentUser, getprofile, getSuggestedUser, search, updateProfile, getAllUsers, getUserActivityStatus } from "../controllers/user.controller.js"
import isAuth from "../middlewares/isAuth.js"
import upload from "../middlewares/multer.js"

let userRouter=express.Router()

userRouter.get("/currentuser",isAuth,getCurrentUser)

// Add error handling middleware for multer
userRouter.put("/updateprofile",isAuth,(req, res, next) => {
  upload.fields([
    {name:"profileImage",maxCount:1} ,
    {name:"coverImage",maxCount:1}
  ])(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ message: `File upload error: ${err.message}` });
    }
    next();
  });
}, updateProfile)

userRouter.get("/profile/:userName",isAuth,getprofile)
userRouter.get("/search",isAuth,search)
userRouter.get("/suggestedusers",isAuth,getSuggestedUser)
userRouter.get("/allusers",isAuth,getAllUsers)
userRouter.get("/activity/:userId",isAuth,getUserActivityStatus)
export default userRouter