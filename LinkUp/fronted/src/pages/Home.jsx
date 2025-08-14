import React, { useContext, useEffect, useRef, useState } from 'react'
import Nav from '../components/Nav'
import dp from "../assets/dp.webp"
import { FiPlus } from "react-icons/fi";
import { FiCamera } from "react-icons/fi";
import { FaUserGroup } from "react-icons/fa6";
import { userDataContext } from '../context/UserContext';
import { HiPencil } from "react-icons/hi2";
import EditProfile from '../components/EditProfile';
import { RxCross1 } from "react-icons/rx";
import { BsImage } from "react-icons/bs";
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';
import Post from '../components/Post';
import ChatButton from '../components/ChatButton';
import { useNavigate } from 'react-router-dom';
import MobileBottomNav from '../components/MobileBottomNav';
function Home() {
  const navigate = useNavigate();

  let {userData,setUserData,edit,setEdit,postData,setPostData,getPost,handleGetProfile,uploadPost,setUploadPost}=useContext(userDataContext)
let {serverUrl}=useContext(authDataContext)
  let [frontendImage,setFrontendImage]=useState("")
  let [backendImage,setBackendImage]=useState("")
  let [description,setDescription]=useState("")
let image=useRef()
let [posting,setPosting]=useState(false)
let [suggestedUser,setSuggestedUser]=useState([])
function handleImage(e){
let file=e.target.files[0]
setBackendImage(file)
setFrontendImage(URL.createObjectURL(file))

}

async function handleUploadPost(){
  setPosting(true)
  try {
    let formdata=new FormData()
    formdata.append("description",description)
    if(backendImage){
      formdata.append("image",backendImage)
    }
let result=await axios.post(serverUrl+"/api/post/create",formdata,{withCredentials:true})
console.log(result)
setPosting(false)
setUploadPost(false)
setDescription("")
setFrontendImage("")
setBackendImage("")
// Refresh posts to show the new post
getPost()
  } catch (error) {
    setPosting(false)
    console.log(error);
    
  }
}
const handleSuggestedUsers=async ()=>{
  try {
    let result=await axios.get(serverUrl+"/api/user/suggestedusers",{withCredentials:true})
    console.log(result.data)
    setSuggestedUser(result.data)
  } catch (error) {
    console.log(error)
  }
}

useEffect(()=>{
handleSuggestedUsers()
},[])

useEffect(()=>{
getPost()
},[uploadPost])


  return (
    <div className='w-full min-h-screen bg-gray-50 pt-[70px] pb-16 md:pb-0'>
      <div className='max-w-[1200px] mx-auto px-2 sm:px-4'>
        <div className='flex gap-2 sm:gap-4 lg:gap-6 pt-2 sm:pt-4 lg:pt-6 relative'>
          {edit && <EditProfile/>}
          
          <Nav/>
          <MobileBottomNav/>
          
          {/* Left Sidebar - Profile Card - Hidden on mobile */}
          <div className='w-[280px] hidden lg:block shrink-0'>
            <div className='bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden sticky top-[90px]'>
              <div className='h-[54px] bg-gradient-to-r from-blue-400 to-blue-600 relative cursor-pointer' onClick={()=>setEdit(true)}>
                <img src={userData.coverImage || ""} alt="" className='w-full h-full object-cover'/>
                <FiCamera className='absolute right-3 top-3 w-4 h-4 text-white cursor-pointer'/>
              </div>
              
              <div className='px-4 pb-4 -mt-6 relative'>
                <div className='w-16 h-16 rounded-full overflow-hidden border-2 border-white cursor-pointer relative' onClick={()=>setEdit(true)}>
                  <img src={userData.profileImage || dp} alt="" className='w-full h-full object-cover'/>
                </div>
                <div className='w-4 h-4 bg-blue-600 absolute top-12 left-16 rounded-full flex justify-center items-center cursor-pointer'>
                  <FiPlus className='text-white text-xs'/>
                </div>

                <div className='mt-3'>
                  <h3 className='text-base font-semibold text-gray-900 hover:text-blue-600 cursor-pointer' onClick={()=>handleGetProfile(userData.userName)}>
                    {`${userData.firstName} ${userData.lastName}`}
                  </h3>
                  <p className='text-sm text-gray-600 mt-1'>{userData.headline || ""}</p>
                </div>
                
                <div className='mt-4 pt-3 border-t border-gray-200'>
                  <div className='flex justify-between items-center text-xs text-gray-600 hover:bg-gray-50 p-2 -mx-2 rounded cursor-pointer'>
                    <span>Profile viewers</span>
                    <span className='text-blue-600 font-semibold'>12</span>
                  </div>
                  <div className='flex justify-between items-center text-xs text-gray-600 hover:bg-gray-50 p-2 -mx-2 rounded cursor-pointer'>
                    <span>Post impressions</span>
                    <span className='text-blue-600 font-semibold'>1,204</span>
                  </div>
                </div>
                
                <div className='mt-3 pt-3 border-t border-gray-200'>
                  <p className='text-xs text-gray-600 mb-2'>Grow your network</p>
                  <div className='flex items-center gap-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 p-2 -mx-2 rounded cursor-pointer' onClick={()=>navigate("/network")}>
                    <FaUserGroup className='w-4 h-4'/>
                    <span>My Network</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Feed */}
          <div className='flex-1 w-full lg:max-w-[540px] mx-auto lg:mx-0'>
            {/* Create Post */}
            <div className='bg-white shadow-sm border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden cursor-pointer'>
                  <img src={userData.profileImage || dp} alt="" className='w-full h-full object-cover'/>
                </div>
                <button 
                  className='flex-1 h-10 sm:h-12 border border-gray-300 rounded-full flex items-center justify-start px-3 sm:px-4 hover:bg-gray-50 text-gray-600 text-left text-sm' 
                  onClick={()=>setUploadPost(true)}
                >
                  Start a post
                </button>
              </div>
              
              <div className='flex items-center justify-around mt-3 pt-3 border-t border-gray-200'>
                <button className='flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 hover:bg-gray-50 rounded cursor-pointer flex-1 justify-center' onClick={()=>setUploadPost(true)}>
                  <BsImage className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600'/>
                  <span className='text-xs sm:text-sm font-medium text-gray-700'>Photo</span>
                </button>
                <button className='flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 hover:bg-gray-50 rounded cursor-pointer flex-1 justify-center'>
                  <span className='text-xs sm:text-sm font-medium text-gray-700'>📹 Video</span>
                </button>
                <button className='flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 hover:bg-gray-50 rounded cursor-pointer flex-1 justify-center'>
                  <span className='text-xs sm:text-sm font-medium text-gray-700'>📝 Article</span>
                </button>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-3 sm:space-y-4">
              {postData.map((post,index)=>(
                <Post key={index} id={post._id} description={post.description} author={post.author} image={post.image} like={post.like} comment={post.comment} createdAt={post.createdAt}/>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className='w-[300px] hidden xl:block shrink-0'>
            <div className='bg-white shadow-sm border border-gray-200 rounded-lg p-4 sticky top-[90px] mb-4'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-base font-semibold text-gray-900'>LinkedIn News</h2>
                <span className='text-xs text-gray-500'>ℹ️</span>
              </div>
              
              <div className='space-y-3'>
                <div className='cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded'>
                  <h3 className='text-sm font-medium text-gray-900'>Tech industry updates</h3>
                  <p className='text-xs text-gray-500 mt-1'>2h ago • 1,234 readers</p>
                </div>
                <div className='cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded'>
                  <h3 className='text-sm font-medium text-gray-900'>AI developments in 2025</h3>
                  <p className='text-xs text-gray-500 mt-1'>4h ago • 5,678 readers</p>
                </div>
                <div className='cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded'>
                  <h3 className='text-sm font-medium text-gray-900'>Remote work trends</h3>
                  <p className='text-xs text-gray-500 mt-1'>6h ago • 3,456 readers</p>
                </div>
              </div>
            </div>

            <div className='bg-white shadow-sm border border-gray-200 rounded-lg p-4 sticky top-[90px]'>
              <h2 className='text-base font-semibold text-gray-900 mb-4'>People you may know</h2>
              <div className='space-y-3'>
                {suggestedUser.length > 0 ? (
                  suggestedUser.slice(0, 3).map((su)=>(
                    <div key={su._id} className='flex items-center gap-3 p-2 hover:bg-gray-50 rounded'>
                      <div className='w-12 h-12 rounded-full overflow-hidden cursor-pointer' onClick={()=>handleGetProfile(su.userName)}>
                        <img src={su.profileImage || dp} alt="" className='w-full h-full object-cover'/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className='text-sm font-semibold text-gray-900 truncate cursor-pointer' onClick={()=>handleGetProfile(su.userName)}>
                          {`${su.firstName} ${su.lastName}`}
                        </div>
                        <div className='text-xs text-gray-600 truncate'>{su.headline}</div>
                        <button className='text-xs text-blue-600 hover:text-blue-800 font-medium mt-1'>
                          Connect
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 text-sm py-4">
                    No suggestions available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Backdrop */}
          {uploadPost && <div className='w-full h-full bg-black fixed top-0 z-[100] left-0 opacity-50'></div>}

          {/* Create Post Modal */}
          {uploadPost && (
            <div className='w-[90%] max-w-[600px] max-h-[80vh] bg-white shadow-2xl top-[10%] rounded-lg fixed z-[200] p-6 flex items-start justify-start flex-col gap-4 border border-gray-200 left-1/2 transform -translate-x-1/2'>
              <div className='flex justify-between items-center w-full border-b border-gray-200 pb-4'>
                <h2 className='text-xl font-semibold text-gray-900'>Create post</h2>
                <RxCross1 className='w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-800' onClick={()=>setUploadPost(false)}/>
              </div>
              
              <div className='flex justify-start items-center gap-3'>
                <div className='w-12 h-12 rounded-full overflow-hidden flex items-center justify-center cursor-pointer'>
                  <img src={userData.profileImage || dp} alt="" className='w-full h-full object-cover'/>
                </div>
                <div>
                  <div className='text-base font-semibold text-gray-900'>{`${userData.firstName} ${userData.lastName}`}</div>
                  <div className='text-sm text-gray-600'>Post to anyone</div>
                </div>
              </div>
              
              <textarea 
                className={`w-full ${frontendImage?"h-32":"h-40"} outline-none border-none p-0 resize-none text-base placeholder-gray-500`} 
                placeholder='What do you want to talk about?' 
                value={description} 
                onChange={(e)=>setDescription(e.target.value)}
              />
              
              <input type="file" ref={image} hidden onChange={handleImage}/>
              {frontendImage && (
                <div className='w-full max-h-80 flex justify-center items-center rounded-lg border border-gray-200 relative bg-gray-50 overflow-hidden' >
                  <img src={frontendImage} alt="" className='w-full h-auto object-contain max-h-80 rounded-lg'/>
                  <button 
                    className='absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg'
                    onClick={() => {setFrontendImage(""); setBackendImage("")}}
                  >
                    <RxCross1 className='w-4 h-4 text-gray-600'/>
                  </button>
                </div>
              )}

              <div className='w-full flex items-center justify-between border-t border-gray-200 pt-4'>
                <div className='flex items-center gap-4'>
                  <BsImage className='w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-800' onClick={()=>image.current.click()}/>
                </div>
                
                <button 
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    (description.trim() || backendImage) 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`} 
                  disabled={posting || (!description.trim() && !backendImage)} 
                  onClick={handleUploadPost}
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
