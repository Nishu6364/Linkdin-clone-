import React, { useContext, useEffect, useState } from 'react'
import dp from "../assets/dp.webp"
import moment from "moment"
import { FaRegCommentDots } from "react-icons/fa";
import { BiLike } from "react-icons/bi";
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';
import { socket, userDataContext } from '../context/UserContext';
import { BiSolidLike } from "react-icons/bi";
import { LuSendHorizontal } from "react-icons/lu";
import { BsThreeDots } from "react-icons/bs";
import { MdDelete, MdEdit, MdSave, MdLink, MdCode, MdLock, MdPublic } from "react-icons/md";
import { FaRegBookmark, FaBookmark } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

import ConnectionButton from './ConnectionButton';


function Post({ id, author, like, comment, description, image,createdAt }) {
    
    // Early return if author data is not available yet
    if (!author) {
        return (
            <div className="w-full bg-white p-4 rounded-lg shadow-md">
                <div className="animate-pulse">
                    <div className="flex items-center space-x-4">
                        <div className="rounded-full bg-gray-300 h-16 w-16"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-300 rounded w-32"></div>
                            <div className="h-3 bg-gray-300 rounded w-24"></div>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="h-4 bg-gray-300 rounded"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        );
    }
    
    let [more,setMore]=useState(false)
  let {serverUrl}=useContext(authDataContext)
  let {userData,setUserData,getPost,handleGetProfile}=useContext(userDataContext)
  let [likes,setLikes]=useState([])
  let [commentContent,setCommentContent]=useState("")
  let [comments,setComments]=useState([])
  let [showComment,setShowComment]=useState(false)
  let [showOptions, setShowOptions] = useState(false)
  let [isDeleted, setIsDeleted] = useState(false)
  let [isSaved, setIsSaved] = useState(false)
  let [isEditing, setIsEditing] = useState(false)
  let [editedDescription, setEditedDescription] = useState(description)
  let [showPrivacyMenu, setShowPrivacyMenu] = useState(false)
  let [showCommentPrivacyMenu, setShowCommentPrivacyMenu] = useState(false)
  let [postVisibility, setPostVisibility] = useState('public') // public, connections, private
  let [commentPermission, setCommentPermission] = useState('everyone') // everyone, connections, nobody
  const navigate = useNavigate()
    const handleLike=async ()=>{
      try {
        let result=await axios.get(serverUrl+`/api/post/like/${id}`,{withCredentials:true})
       setLikes(result.data.like)
      } catch (error) {
        console.log(error)
      }
    }
    const handleComment=async (e)=>{
       e.preventDefault()
        try {
          let result=await axios.post(serverUrl+`/api/post/comment/${id}`,{
            content:commentContent
          },{withCredentials:true})
          setComments(result.data.comment)
        setCommentContent("")
        } catch (error) {
          console.log(error)
        }
      }

      const handleDeletePost = async () => {
        try {
          await axios.delete(serverUrl + `/api/post/delete/${id}`, { withCredentials: true });
          setIsDeleted(true);
          // Refresh posts to remove the deleted one from the UI
          getPost();
        } catch (error) {
          console.log("Delete post error:", error);
          alert("Failed to delete post. Please try again.");
        }
      }

      const handleSavePost = async () => {
        try {
          const result = await axios.post(serverUrl + `/api/saved/toggle/${id}`, {}, { withCredentials: true });
          setIsSaved(result.data.saved);
        } catch (error) {
          console.log("Save post error:", error);
          alert("Failed to save/unsave post. Please try again.");
        }
      }

      const handleCopyLink = () => {
        const postUrl = `${window.location.origin}/post/${id}`;
        navigator.clipboard.writeText(postUrl).then(() => {
          alert("Post link copied to clipboard!");
        }).catch(err => {
          console.error('Failed to copy: ', err);
          alert("Failed to copy link");
        });
      }

      const handleEmbedPost = () => {
        const embedCode = `<iframe src="${window.location.origin}/embed/post/${id}" width="500" height="400" frameborder="0"></iframe>`;
        navigator.clipboard.writeText(embedCode).then(() => {
          alert("Embed code copied to clipboard!");
        }).catch(err => {
          console.error('Failed to copy embed code: ', err);
          alert("Failed to copy embed code");
        });
      }

      const handleEditPost = async () => {
        if (isEditing) {
          try {
            await axios.put(serverUrl + `/api/post/edit/${id}`, {
              description: editedDescription
            }, { withCredentials: true });
            setIsEditing(false);
            getPost(); // Refresh posts to show updated content
          } catch (error) {
            console.log("Edit post error:", error);
            alert("Failed to update post. Please try again.");
          }
        } else {
          setIsEditing(true);
        }
      }

      const handleCancelEdit = () => {
        setEditedDescription(description);
        setIsEditing(false);
      }

      const handleVisibilityChange = async (visibility) => {
        try {
          await axios.put(serverUrl + `/api/post/edit/${id}`, {
            visibility: visibility
          }, { withCredentials: true });
          setPostVisibility(visibility);
          setShowPrivacyMenu(false);
        } catch (error) {
          console.log("Visibility change error:", error);
          alert("Failed to update post visibility. Please try again.");
        }
      }

      const handleCommentPermissionChange = async (permission) => {
        try {
          await axios.put(serverUrl + `/api/post/edit/${id}`, {
            commentPermission: permission
          }, { withCredentials: true });
          setCommentPermission(permission);
          setShowCommentPrivacyMenu(false);
        } catch (error) {
          console.log("Comment permission change error:", error);
          alert("Failed to update comment permission. Please try again.");
        }
      }


      useEffect(()=>{
        socket.on("likeUpdated",({postId,likes})=>{
          if(postId==id){
            console.log("Like updated for post:", postId, "New likes:", likes)
            setLikes(likes)
          }
        })
        socket.on("commentAdded",({postId,comm})=>{
          if(postId==id){
            console.log("Comment added for post:", postId, "New comments:", comm)
            setComments(comm)
          }
        })
        socket.on("postDeleted", ({postId}) => {
          if(postId == id) {
            setIsDeleted(true);
          }
        })
        socket.on("postUpdated", ({postId, updatedPost}) => {
          if(postId == id) {
            setEditedDescription(updatedPost.description);
            setIsEditing(false);
          }
        })

        return ()=>{
socket.off("likeUpdated")
socket.off("commentAdded")
socket.off("postDeleted")
socket.off("postUpdated")
        }
      },[id])


      useEffect(()=>{
        setLikes(like)
        setComments(comment)
      },[like,comment])

      // Check if post is saved when component loads
      useEffect(() => {
        const checkSavedStatus = async () => {
          try {
            const result = await axios.get(serverUrl + `/api/saved/check/${id}`, { withCredentials: true });
            setIsSaved(result.data.saved);
          } catch (error) {
            console.log("Check saved status error:", error);
            setIsSaved(false); // Default to false if check fails
          }
        };
        
        // Only check saved status if user is logged in and we haven't checked before
        if (userData?._id && id) {
          checkSavedStatus();
        }
      }, [id]); // Remove userData._id and serverUrl from dependencies to prevent excessive calls

      // Close options menu when clicking outside
      useEffect(() => {
        const handleClickOutside = (event) => {
          if (showOptions && !event.target.closest('.options-menu')) {
            setShowOptions(false);
          }
          if (showPrivacyMenu && !event.target.closest('.privacy-menu')) {
            setShowPrivacyMenu(false);
          }
          if (showCommentPrivacyMenu && !event.target.closest('.comment-privacy-menu')) {
            setShowCommentPrivacyMenu(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }, [showOptions, showPrivacyMenu, showCommentPrivacyMenu]);
  //  useEffect(()=>{
  //   getPost()
    
  //   },[likes,comments])


    return (
        <>
        {!isDeleted && (
        <div className="w-full min-h-[200px] flex flex-col gap-[10px] bg-white rounded-lg shadow-lg  p-[20px] ">

          <div className='flex justify-between items-center'>

            <div className='flex justify-center items-start gap-[10px]' onClick={()=>handleGetProfile(author?.userName)}>
                <div className='w-[70px] h-[70px] rounded-full overflow-hidden flex items-center justify-center  cursor-pointer' >
                    <img src={author?.profileImage || dp} alt="" className='h-full' />
                </div>
                <div>
                <div className='text-[22px] font-semibold'>{`${author?.firstName || ''} ${author?.lastName || ''}` }</div>
                <div className='text-[16px]'>{author?.headline || ''}</div>
                <div className='flex items-center gap-[5px] text-[14px] text-gray-500'>
                  <span>{moment(createdAt).fromNow()}</span>
                  {postVisibility === 'public' && <MdPublic className="w-[14px] h-[14px]" />}
                  {postVisibility === 'connections' && <span>• Connections</span>}
                  {postVisibility === 'private' && <MdLock className="w-[14px] h-[14px]" />}
                </div>
                </div>
            </div>
            <div className="flex items-center gap-[10px]">
              {userData?._id !== author?._id && author?._id && <ConnectionButton userId={author._id}/>}
              
              {/* Universal three-dot menu for all users */}
              <div className="relative options-menu">
                <BsThreeDots 
                  className="w-[24px] h-[24px] cursor-pointer text-gray-600 hover:text-gray-800" 
                  onClick={() => setShowOptions(!showOptions)}
                />
                {showOptions && (
                  <div className="absolute right-0 top-[30px] bg-white border border-gray-300 rounded-lg shadow-lg z-20 w-[200px]">
                    
                    {/* Save/Unsave Post option for all users */}
                    <button
                      className="flex items-center gap-[8px] px-[16px] py-[8px] text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                      onClick={() => {
                        handleSavePost();
                        setShowOptions(false);
                      }}
                    >
                      {isSaved ? (
                        <>
                          <FaBookmark className="w-[16px] h-[16px] text-blue-600" />
                          Unsave Post
                        </>
                      ) : (
                        <>
                          <FaRegBookmark className="w-[16px] h-[16px]" />
                          Save Post
                        </>
                      )}
                    </button>

                    {/* Saved Posts option for all users */}
                    <button
                      className="flex items-center gap-[8px] px-[16px] py-[8px] text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                      onClick={() => {
                        navigate('/saved-posts');
                        setShowOptions(false);
                      }}
                    >
                      <FaRegBookmark className="w-[16px] h-[16px]" />
                      Saved Posts
                    </button>

                    <button
                      className="flex items-center gap-[8px] px-[16px] py-[8px] text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                      onClick={() => {
                        handleCopyLink();
                        setShowOptions(false);
                      }}
                    >
                      <MdLink className="w-[16px] h-[16px]" />
                      Copy link to post
                    </button>
                    
                    <button
                      className="flex items-center gap-[8px] px-[16px] py-[8px] text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                      onClick={() => {
                        handleEmbedPost();
                        setShowOptions(false);
                      }}
                    >
                      <MdCode className="w-[16px] h-[16px]" />
                      Embed this post
                    </button>

                    {/* Author-only options */}
                    {userData?._id === author?._id && (
                      <>
                        <hr className="my-[4px]" />
                        
                        <button
                          className="flex items-center gap-[8px] px-[16px] py-[8px] text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                          onClick={() => {
                            handleEditPost();
                            setShowOptions(false);
                          }}
                        >
                          <MdEdit className="w-[16px] h-[16px]" />
                          Edit post
                        </button>

                        <div className="relative comment-privacy-menu">
                          <button
                            className="flex items-center gap-[8px] px-[16px] py-[8px] text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                            onClick={() => setShowCommentPrivacyMenu(!showCommentPrivacyMenu)}
                          >
                            <FaRegCommentDots className="w-[16px] h-[16px]" />
                            Who can comment?
                          </button>
                          {showCommentPrivacyMenu && (
                            <div className="absolute left-full top-0 ml-1 bg-white border border-gray-300 rounded-lg shadow-lg z-30 w-[150px]">
                              <button
                                className="px-[12px] py-[6px] text-sm hover:bg-gray-50 w-full text-left"
                                onClick={() => handleCommentPermissionChange('everyone')}
                              >
                                Everyone
                              </button>
                              <button
                                className="px-[12px] py-[6px] text-sm hover:bg-gray-50 w-full text-left"
                                onClick={() => handleCommentPermissionChange('connections')}
                              >
                                Connections only
                              </button>
                              <button
                                className="px-[12px] py-[6px] text-sm hover:bg-gray-50 w-full text-left"
                                onClick={() => handleCommentPermissionChange('nobody')}
                              >
                                Nobody
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="relative privacy-menu">
                          <button
                            className="flex items-center gap-[8px] px-[16px] py-[8px] text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                            onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                          >
                            {postVisibility === 'public' ? <MdPublic className="w-[16px] h-[16px]" /> : <MdLock className="w-[16px] h-[16px]" />}
                            Who can see this post?
                          </button>
                          {showPrivacyMenu && (
                            <div className="absolute left-full top-0 ml-1 bg-white border border-gray-300 rounded-lg shadow-lg z-30 w-[150px]">
                              <button
                                className="px-[12px] py-[6px] text-sm hover:bg-gray-50 w-full text-left"
                                onClick={() => handleVisibilityChange('public')}
                              >
                                Public
                              </button>
                              <button
                                className="px-[12px] py-[6px] text-sm hover:bg-gray-50 w-full text-left"
                                onClick={() => handleVisibilityChange('connections')}
                              >
                                Connections only
                              </button>
                              <button
                                className="px-[12px] py-[6px] text-sm hover:bg-gray-50 w-full text-left"
                                onClick={() => handleVisibilityChange('private')}
                              >
                                Only me
                              </button>
                            </div>
                          )}
                        </div>

                        <hr className="my-[4px]" />
                        
                        <button
                          className="flex items-center gap-[8px] px-[16px] py-[8px] text-red-600 hover:bg-red-50 rounded-lg w-full text-left"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this post?")) {
                              handleDeletePost();
                            }
                            setShowOptions(false);
                          }}
                        >
                          <MdDelete className="w-[16px] h-[16px]" />
                          Delete post
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            </div>
         
         {/* Post description with edit functionality */}
         {isEditing ? (
           <div className="pl-[50px]">
             <textarea
               value={editedDescription}
               onChange={(e) => setEditedDescription(e.target.value)}
               className="w-full min-h-[100px] p-[10px] border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500"
               placeholder="What's on your mind?"
             />
             <div className="flex gap-[10px] mt-[10px]">
               <button
                 onClick={handleEditPost}
                 className="flex items-center gap-[5px] bg-blue-600 text-white px-[12px] py-[6px] rounded-lg hover:bg-blue-700"
               >
                 <MdSave className="w-[16px] h-[16px]" />
                 Save
               </button>
               <button
                 onClick={handleCancelEdit}
                 className="flex items-center gap-[5px] bg-gray-300 text-gray-700 px-[12px] py-[6px] rounded-lg hover:bg-gray-400"
               >
                 Cancel
               </button>
             </div>
           </div>
         ) : (
           <>
             <div className={`w-full ${!more?"max-h-[100px] overflow-hidden":""} pl-[50px]`}>{description}</div>
             <div className="pl-[50px] text-[19px] font-semibold cursor-pointer" onClick={()=>setMore(prev=>!prev)}>{more?"read less...":"read more..."}</div>
           </>
         )}

         {image && 
         <div className='w-full h-[300px] overflow-hidden flex justify-center rounded-lg'>
<img src={image} alt="" className='h-full rounded-lg'/>
</div>}

<div>
<div className='w-full flex justify-between items-center p-[20px] border-b-2 border-gray-500'>
<div className='flex items-center justify-center gap-[5px] text-[18px]'>
    <BiLike className='text-[#1ebbff] w-[20px] h-[20px]'/><span >{likes.length}</span></div>
<div className='flex items-center justify-center gap-[5px] text-[18px] cursor-pointer' onClick={()=>setShowComment(prev=>!prev)}><span>{comments.length}</span><span>comments</span></div>
</div>
<div className='flex justify-start items-center w-full p-[20px] gap-[20px]'>
{!likes.includes(userData._id) &&  <div className='flex justify-center items-center gap-[5px] cursor-pointer' onClick={handleLike}>
<BiLike className=' w-[24px] h-[24px]'/>
<span>Like</span>
</div>}
{likes.includes(userData._id) &&  <div className='flex justify-center items-center gap-[5px] cursor-pointer' onClick={handleLike}>
<BiSolidLike className=' w-[24px] h-[24px] text-[#07a4ff]'/>
<span className="text-[#07a4ff] font-semibold">Liked</span>
</div>}

<div className='flex justify-center items-center gap-[5px] cursor-pointer' onClick={()=>setShowComment(prev=>!prev)}>
<FaRegCommentDots className=' w-[24px] h-[24px]'/>
<span>comment</span>
</div>
</div>

{showComment && <div>
    <form className="w-full flex justify-between items-center border-b-2 border-b-gray-300 p-[10px] 
    " onSubmit={handleComment}>
    <input type="text" placeholder={"leave a comment"} className='outline-none  border-none' value={commentContent} onChange={(e)=>setCommentContent(e.target.value)}/>
    <button><LuSendHorizontal className="text-[#07a4ff] w-[22px] h-[22px]"/></button>
    </form>

    <div className='flex flex-col gap-[10px]'>
       {comments.map((com)=>(
        <div key={com._id} className='flex flex-col gap-[10px] border-b-2 p-[20px] border-b-gray-300' >
            <div className="w-full flex justify-start items-center gap-[10px]">
            <div className='w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center  cursor-pointer' >
                    <img src={com.user.profileImage || dp} alt="" className='h-full' />
                </div> 
                
                <div className='text-[16px] font-semibold'>{`${com.user.firstName} ${com.user.lastName}` }</div>
              
                
            </div>
            <div className='pl-[50px]'>{com.content}</div>
        </div>
       ))} 
    </div>
</div>}

</div>
         
        </div>
        )}
        </>
    )
}

export default Post
