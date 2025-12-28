import React, { createContext, useContext, useEffect, useState } from 'react'
import { authDataContext } from './AuthContext'
import axios from 'axios'
 import { useNavigate } from 'react-router-dom'
export const userDataContext=createContext()
import {io} from "socket.io-client"

// Initialize socket with proper configuration
export let socket = io(import.meta.env.VITE_SERVER_URL || "https://linkup-backend-blwa.onrender.com", {
  withCredentials: true,
  transports: ['websocket', 'polling'],
  autoConnect: false // Prevent auto connection until user is authenticated
})

function UserContext({children}) {
let [userData,setUserData]=useState(null)
let {serverUrl}=useContext(authDataContext)
let [edit,setEdit]=useState(false)
 let [postData,setPostData]=useState([])
let [profileData,setProfileData]=useState([])
let [notificationCount,setNotificationCount]=useState(0)
let [savedPostsData, setSavedPostsData] = useState([])
let [uploadPost,setUploadPost]=useState(false)
 let navigate=useNavigate()
const getCurrentUser=async ()=>{
    try {
        let result=await axios.get(serverUrl+"/api/user/currentuser",{withCredentials:true})
        setUserData(result.data)
        return true
    } catch (error) {
        console.log("Authentication failed:", error);
        setUserData(null)
        return false
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
    console.log("Failed to get posts:", error)
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
    console.log("Failed to get notification count:", error)
    setNotificationCount(0)
  }
}

const getSavedPosts = async () => {
  try {
    let result = await axios.get(serverUrl + "/api/saved", { withCredentials: true })
    setSavedPostsData(result.data)
  } catch (error) {
    console.log("Failed to get saved posts:", error)
    setSavedPostsData([])
  }
}

const logout = async () => {
  try {
    await axios.get(serverUrl + "/api/auth/logout", { withCredentials: true });
    // Clear user data first, which will trigger socket disconnect in useEffect
    setUserData(null);
    navigate("/login");
  } catch (error) {
    console.log("Logout error:", error);
  }
}

// Initial load effect - runs only once
useEffect(() => {
  const initializeApp = async () => {
    const isAuthenticated = await getCurrentUser();
    if (isAuthenticated) {
      getPost();
      getNotificationCount();
    }
  };
  
  initializeApp();
}, []) // Empty dependency array ensures this runs only once

// Separate effect for socket registration to prevent re-registration
useEffect(() => {
 // Register socket connection when user data is available
 if(userData && userData._id) {
   console.log("Connecting and registering socket for user:", userData._id)
   
   // Connect socket if not already connected
   if (!socket.connected) {
     socket.connect();
   }
   
   socket.emit("register", userData._id)
   
   // Listen for new notifications
   const handleNewNotification = () => {
     console.log("New notification received")
     getNotificationCount()
   }

   // Listen for deleted posts and update the post list
   const handlePostDeleted = ({ postId }) => {
     console.log("Post deleted:", postId)
     setPostData(prevPosts => prevPosts.filter(post => post._id !== postId))
   }

   // Listen for updated posts and update the post list
   const handlePostUpdated = ({ postId, updatedPost }) => {
     console.log("Post updated:", postId)
     setPostData(prevPosts => prevPosts.map(post => 
       post._id === postId ? updatedPost : post
     ))
   }
   
   socket.on("newNotification", handleNewNotification)
   socket.on("postDeleted", handlePostDeleted)
   socket.on("postUpdated", handlePostUpdated)
   
   return () => {
     socket.off("newNotification", handleNewNotification)
     socket.off("postDeleted", handlePostDeleted)
     socket.off("postUpdated", handlePostUpdated)
   }
 } else {
   // Disconnect socket when user logs out
   if (socket.connected) {
     socket.disconnect();
   }
 }
}, [userData?._id]) // Only re-run when user ID changes


    const value={
        userData,setUserData,edit,setEdit,postData,setPostData,getPost,handleGetProfile,profileData,setProfileData,notificationCount,setNotificationCount,getNotificationCount,logout,savedPostsData,setSavedPostsData,getSavedPosts,uploadPost,setUploadPost
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

