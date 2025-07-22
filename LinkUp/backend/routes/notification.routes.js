import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { clearAllNotification, deleteNotification, getNotifications, getNotificationCount } from "../controllers/notifications.controller.js"

let notificationRouter=express.Router()

notificationRouter.get("/get",isAuth,getNotifications)
notificationRouter.get("/count",isAuth,getNotificationCount)
notificationRouter.delete("/deleteone/:id",isAuth,deleteNotification)
notificationRouter.delete("/",isAuth,clearAllNotification)
export default notificationRouter 