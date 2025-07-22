import React, { createContext, useContext, useEffect, useState } from 'react'
import { authDataContext } from './AuthContext'
import axios from 'axios'
 import { useNavigate } from 'react-router-dom'
export const userDataContext=createContext()
import {io} from "socket.io-client"

// Initialize socket with proper configuration
export let socket = io(import.meta.env.VITE_SERVER_URL || "https://linkup-backend-blwa.onrender.com", {
  withCredentials: true,
  transports: ['websocket', 'polling']
})

function UserContext({children}) {
let [userData,setUserData]=useState(null)
let {serverUrl}=useContext(authDataContext)
let [edit,setEdit]=useState(false)
 let [postData,setPostData]=useState([])
let [profileData,setProfileData]=useState([])
let [notificationCount,setNotificationCount]=useState(0)
 let navigate=useNavigate()
const getCurrentUser=async ()=>{
    try {
        let result=await axios.get(serverUrl+"/api/user/currentuser",{withCredentials:true})
        setUserData(result.data)
        return
    } catch (error) {
        console.log(error);
        setUserData(null)
    }
}

const getPost=async ()=>{
  try {
    let result=await axios.get(serverUrl+"/api/post/getpost",{
      withCredentials:true
    })
    console.log(result)
    setPostData(result.data)
   
  } catch (error) {
    console.log(error)
  }
}



const handleGetProfile=async (userName)=>{
   try {
    let result=await axios.get(serverUrl+`/api/user/profile/${userName}`,{
      withCredentials:true
    })
    setProfileData(result.data)
    navigate("/profile")
   } catch (error) {
    console.log(error)
   }
}

const getNotificationCount=async ()=>{
  try {
    let result=await axios.get(serverUrl+"/api/notification/count",{withCredentials:true})
    setNotificationCount(result.data.count)
  } catch (error) {
    console.log(error)
    setNotificationCount(0)
  }
}



useEffect(() => {
getCurrentUser();
 getPost()
 getNotificationCount()
 
 // Register socket connection when user data is available
 if(userData && userData._id) {
   console.log("Registering socket for user:", userData._id)
   socket.emit("register", userData._id)
   
   socket.on("connect", () => {
     console.log("Socket connected:", socket.id)
   })
   
   socket.on("disconnect", () => {
     console.log("Socket disconnected")
   })

   // Listen for new notifications
   socket.on("newNotification", () => {
     console.log("New notification received")
     getNotificationCount()
   })
 }
 
 return () => {
   socket.off("connect")
   socket.off("disconnect")
   socket.off("newNotification")
 }
}, [userData]);


    const value={
        userData,setUserData,edit,setEdit,postData,setPostData,getPost,handleGetProfile,profileData,setProfileData,notificationCount,setNotificationCount,getNotificationCount
    }
  return (
    <div>
        <userDataContext.Provider value={value}>
      {children}
      </userDataContext.Provider>
    </div>
  )
}

export default UserContext

