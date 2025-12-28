import express from "express";
import { toggleSavePost, getSavedPosts, checkPostSaved } from "../controllers/savedPost.controller.js";
import isAuth from "../middlewares/isAuth.js";

const savedPostRouter = express.Router();

savedPostRouter.post("/toggle/:id", isAuth, toggleSavePost);
savedPostRouter.get("/", isAuth, getSavedPosts);
savedPostRouter.get("/check/:id", isAuth, checkPostSaved);

export default savedPostRouter;
