import express from "express"
import { acceptConnection, getConnectionRequests, getConnectionStatus, getUserConnections, rejectConnectiont, removeConnection, sendConnection } from "../controllers/connection.controller.js";
// import connectionController from "../controllers/connection.controller.js";

import isAuth from "../middlewares/isAuth.js"
let connectionRouter=express.Router()

connectionRouter.post("/send/:id",isAuth,sendConnection)
connectionRouter.put("/accept/:connectionId",isAuth,acceptConnection)
connectionRouter.put("/reject/:connectionId",isAuth,rejectConnectiont)
connectionRouter.get("/getstatus/:userId",isAuth,getConnectionStatus)
connectionRouter.delete("/remove/:userId",isAuth,removeConnection)
connectionRouter.get("/requests",isAuth,getConnectionRequests)
connectionRouter.get("/",isAuth,getUserConnections)


export default connectionRouter