import React, { useContext, useEffect, useState } from 'react'
import logo2 from "../assets/logo2.jpg"
import { IoSearchSharp } from "react-icons/io5";
import { TiHome } from "react-icons/ti";
import { FaUserGroup } from "react-icons/fa6";
import { IoNotificationsSharp } from "react-icons/io5";
import { FaRegBookmark } from "react-icons/fa";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { FaBriefcase } from "react-icons/fa";
import dp from "../assets/dp.webp"
import { userDataContext } from '../context/UserContext';
import { authDataContext } from '../context/AuthContext';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';
import ChatButton from './ChatButton';
function Nav() {
    let [activeSearch,setActiveSearch]=useState(false)
    let {userData,setUserData,handleGetProfile,notificationCount}=useContext(userDataContext)
    let [showPopup,setShowPopup]=useState(false)
    let navigate=useNavigate()
let {serverUrl}=useContext(authDataContext)
let [searchInput,setSearchInput]=useState("")
let [searchData,setSearchData]=useState([])
const handleSignOut=async ()=>{
    try {
        let result =await axios.get(serverUrl+"/api/auth/logout",{withCredentials:true})
        setUserData(null)
        navigate("/login")
        console.log(result);
      
    } catch (error) {
        console.log(error);
    }
}

const handleSearch=async ()=>{
try {
  let result=await axios.get(`${serverUrl}/api/user/search?query=${searchInput}`,{withCredentials:true})
setSearchData(result.data)
} catch (error) {
  setSearchData([])
  console.log(error)
}
}

useEffect(()=>{
  if(searchInput.trim() !== "") {
    handleSearch()
  } else {
    setSearchData([])
  }
},[searchInput])


  return (
    <div className='w-full h-[64px] bg-white fixed top-0 shadow-sm border-b border-gray-200 flex justify-center items-center px-4 left-0 z-[80]'>
      <div className='max-w-[1200px] w-full flex justify-between items-center'>
        
        {/* Left side - Logo and Search */}
        <div className='flex justify-center items-center gap-3'>
          <div onClick={()=>{
            setActiveSearch(false)
            navigate("/")
          }} className="cursor-pointer">
            <div className="w-8 h-8 bg-blue-700 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">in</span>
            </div>
          </div>
          
          {searchData.length>0 && (
            <div className='absolute top-[70px] h-[400px] left-4 lg:left-[200px] shadow-xl w-[calc(100%-32px)] lg:w-[400px] bg-white rounded-lg flex flex-col gap-2 p-4 overflow-auto z-50 border border-gray-200'>
              {searchData.map((sea)=>(
                <div key={sea._id} className='flex gap-3 items-center justify-between border-b border-gray-100 p-3 hover:bg-gray-50 rounded-lg'>
                  <div className='flex gap-3 items-center cursor-pointer flex-1' onClick={()=>handleGetProfile(sea.userName)}>
                    <div className='w-12 h-12 rounded-full overflow-hidden'>
                        <img src={sea.profileImage || dp} alt="" className='w-full h-full object-cover'/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className='text-sm font-semibold text-gray-900 truncate'>{`${sea.firstName} ${sea.lastName}`}</div>
                      <div className='text-xs text-gray-600 truncate'>{sea.headline}</div>
                    </div>
                  </div>
                  <ChatButton 
                    userId={sea._id} 
                    userName={`${sea.firstName} ${sea.lastName}`}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                  />
                </div>
              ))}
            </div>
          )}
         
          <form className='w-[200px] sm:w-[280px] lg:w-[350px] h-[36px] bg-blue-50 flex items-center gap-2 px-3 rounded'>
            <IoSearchSharp className='w-4 h-4 text-gray-600'/>
            <input 
              type="text" 
              className='flex-1 h-full bg-transparent outline-none border-0 text-sm placeholder-gray-600' 
              placeholder='Search' 
              onChange={(e)=>setSearchInput(e.target.value)} 
              value={searchInput}
            />
          </form>
        </div>

        {/* Right side - Navigation Icons */}
        <div className='flex justify-center items-center gap-2 sm:gap-4 lg:gap-6'>

          {showPopup && (
            <div className='w-[280px] min-h-[300px] bg-white shadow-xl absolute top-[60px] rounded-lg flex flex-col items-center p-5 gap-4 right-4 border border-gray-200'>
              <div className='w-16 h-16 rounded-full overflow-hidden'>
                  <img src={userData.profileImage || dp} alt="" className='w-full h-full object-cover'/>
              </div>
              <div className='text-base font-semibold text-gray-900 text-center'>{`${userData.firstName} ${userData.lastName}`}</div>
              <button className='w-full h-10 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium' onClick={()=>handleGetProfile(userData.userName)}>
                View Profile
              </button>
              <div className='w-full h-px bg-gray-200'></div>
              
              <div className='flex w-full items-center justify-start text-gray-700 gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded' onClick={()=>navigate("/network")}>
                <FaUserGroup className='w-5 h-5'/>
                <div className="text-sm">My Network</div>
              </div>
              <div className='flex w-full items-center justify-start text-gray-700 gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded' onClick={()=>{navigate("/saved-posts"); setShowPopup(false)}}>
                <FaRegBookmark className='w-5 h-5'/>
                <div className="text-sm">Saved Posts</div>
              </div>
              <div className='flex w-full items-center justify-start text-gray-700 gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded' onClick={()=>{navigate("/chat"); setShowPopup(false)}}>
                <IoChatbubbleEllipses className='w-5 h-5'/>
                <div className="text-sm">Messages</div>
              </div>
              
              <div className='w-full h-px bg-gray-200'></div>
              <button className='w-full h-10 rounded-lg border border-red-500 text-red-500 hover:bg-red-50 font-medium' onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          )}

          {/* Home - Hidden on mobile since we have bottom nav */}
          <div className='hidden md:flex flex-col items-center justify-center cursor-pointer text-gray-600 hover:text-gray-900' onClick={()=>navigate("/")}>
            <TiHome className='w-5 h-5 sm:w-6 sm:h-6'/>
            <div className="text-[10px] sm:text-xs">Home</div>
          </div>
          
          {/* My Network - Hidden on mobile since we have bottom nav */}
          <div className='hidden md:flex flex-col items-center justify-center text-gray-600 hover:text-gray-900 cursor-pointer' onClick={()=>navigate("/network")}>
            <FaUserGroup className='w-5 h-5 sm:w-6 sm:h-6'/>
            <div className="text-[10px] sm:text-xs">Network</div>
          </div>
          
          {/* Messaging - Always visible */}
          <div className='flex flex-col items-center justify-center text-gray-600 hover:text-gray-900 cursor-pointer' onClick={()=>navigate("/chat")}>
            <IoChatbubbleEllipses className='w-5 h-5 sm:w-6 sm:h-6'/>
            <div className='text-[10px] sm:text-xs'>Messaging</div>
          </div>
          
          {/* Jobs - Always visible on desktop */}
          <div className='hidden md:flex flex-col items-center justify-center text-gray-600 hover:text-gray-900 cursor-pointer' onClick={()=>navigate("/jobs")}>
            <FaBriefcase className='w-5 h-5 sm:w-6 sm:h-6'/>
            <div className='text-[10px] sm:text-xs'>Jobs</div>
          </div>
          
          {/* Notifications - Hidden on mobile since we have bottom nav */}
          <div className='hidden md:flex flex-col items-center justify-center text-gray-600 hover:text-gray-900 cursor-pointer relative' onClick={()=>navigate("/notification")}>
            <div className='relative'>
              <IoNotificationsSharp className='w-5 h-5 sm:w-6 sm:h-6'/>
              {notificationCount > 0 && (
                <div className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-1'>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </div>
              )}
            </div>
            <div className='text-[10px] sm:text-xs'>Notifications</div>
          </div>
          
          {/* Profile - Always visible */}
          <div className='flex flex-col items-center justify-center cursor-pointer min-w-[50px]' onClick={()=>setShowPopup(prev=>!prev)}>
            <div className='w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-gray-300 bg-gray-100'>
                <img src={userData.profileImage || dp} alt="" className='w-full h-full object-cover'/>
            </div>
            <div className='text-[10px] sm:text-xs text-gray-600 hover:text-gray-900 mt-1'>Me</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Nav
