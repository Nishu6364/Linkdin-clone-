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

import PostConnectionButton from './PostConnectionButton';


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
        <div className="w-full min-h-[200px] flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-3 sm:mb-4">

          <div className='flex justify-between items-center p-3 sm:p-4 pb-3'>

            <div className='flex justify-center items-start gap-2 sm:gap-3' onClick={()=>handleGetProfile(author?.userName)}>
                <div className='w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex items-center justify-center cursor-pointer' >
                    <img src={author?.profileImage || dp} alt="" className='w-full h-full object-cover' />
                </div>
                <div className="flex-1">
                <div className='flex items-center gap-2'>
                  <div className='text-sm sm:text-[15px] font-semibold text-gray-900 hover:text-blue-600 cursor-pointer'>{`${author?.firstName || ''} ${author?.lastName || ''}` }</div>
                  {/* Add status indicator if needed */}
                  {author?.isOnline && <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full border border-green-200 hidden sm:inline">Online</span>}
                </div>
                <div className='text-xs sm:text-[13px] text-gray-600'>{author?.headline || ''}</div>
                <div className='flex items-center gap-1 text-[11px] sm:text-[12px] text-gray-500 mt-1'>
                  <span>{moment(createdAt).fromNow()}</span>
                  <span>•</span>
                  {postVisibility === 'public' && <MdPublic className="w-3 h-3" />}
                  {postVisibility === 'connections' && <span>🌐</span>}
                  {postVisibility === 'private' && <MdLock className="w-3 h-3" />}
                </div>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-[10px]">
              {/* Post-specific connection button - only shows Connect/Pending/Respond */}
              {userData?._id !== author?._id && author?._id && (
                <PostConnectionButton 
                  userId={author._id}
                  userName={`${author.firstName} ${author.lastName}`}
                />
              )}
              
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
         <div className="px-3 sm:px-4">
         {isEditing ? (
           <div>
             <textarea
               value={editedDescription}
               onChange={(e) => setEditedDescription(e.target.value)}
               className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-sm sm:text-base"
               placeholder="What's on your mind?"
             />
             <div className="flex gap-2 mt-3">
               <button
                 onClick={handleEditPost}
                 className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium"
               >
                 <MdSave className="w-4 h-4" />
                 Save
               </button>
               <button
                 onClick={handleCancelEdit}
                 className="flex items-center gap-2 bg-gray-300 text-gray-700 px-3 py-2 sm:px-4 rounded-lg hover:bg-gray-400 text-xs sm:text-sm font-medium"
               >
                 Cancel
               </button>
             </div>
           </div>
         ) : (
           <>
             <div className={`w-full ${!more?"max-h-[80px] overflow-hidden":""} text-sm sm:text-[15px] leading-relaxed mb-3`}>
               {description}
             </div>
             {description && description.length > 150 && (
               <div className="text-xs sm:text-[14px] text-gray-600 cursor-pointer hover:text-gray-800 font-medium mb-4" 
                    onClick={()=>setMore(prev=>!prev)}>
                 {more ? "...see less" : "...see more"}
               </div>
             )}
           </>
         )}
         </div>

         {image && 
         <div className='w-full flex justify-center bg-gray-50 rounded-lg border border-gray-200 mb-3 sm:mb-4 overflow-hidden mx-3 sm:mx-4'>
           <img src={image} alt="" className='w-full h-auto object-contain cursor-pointer hover:opacity-95 transition-opacity max-h-[400px] sm:max-h-[600px]'/>
         </div>}

<div className="border-t border-gray-200">
<div className='flex justify-between items-center px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600'>
<div className='flex items-center gap-1'>
    <BiSolidLike className='text-blue-600 w-3 h-3 sm:w-4 sm:h-4'/>
    <span>{likes.length} {likes.length === 1 ? 'like' : 'likes'}</span>
</div>
<div className='cursor-pointer hover:text-gray-800' onClick={()=>setShowComment(prev=>!prev)}>
    {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
</div>
</div>

<div className='flex justify-around items-center border-t border-gray-200 py-2'>
{!likes.includes(userData._id) ? (
  <button className='flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex-1 justify-center' onClick={handleLike}>
    <BiLike className='w-4 h-4 sm:w-5 sm:h-5'/>
    <span className="text-xs sm:text-sm font-medium">Like</span>
  </button>
) : (
  <button className='flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex-1 justify-center' onClick={handleLike}>
    <BiSolidLike className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600'/>
    <span className="text-xs sm:text-sm font-medium text-blue-600">Liked</span>
  </button>
)}

<button className='flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex-1 justify-center' onClick={()=>setShowComment(prev=>!prev)}>
<FaRegCommentDots className='w-4 h-4 sm:w-5 sm:h-5'/>
<span className="text-xs sm:text-sm font-medium">Comment</span>
</button>
</div>

{showComment && <div className="border-t border-gray-200">
    <form className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-gray-100" onSubmit={handleComment}>
        <div className='w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex items-center justify-center'>
            <img src={userData?.profileImage || dp} alt="" className='w-full h-full object-cover' />
        </div>
        <input 
            type="text" 
            placeholder="Add a comment..." 
            className='flex-1 outline-none border border-gray-300 rounded-full px-4 py-2 text-sm focus:border-blue-500' 
            value={commentContent} 
            onChange={(e)=>setCommentContent(e.target.value)}
        />
        <button type="submit" className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
            <LuSendHorizontal className="w-5 h-5"/>
        </button>
    </form>

    <div className='max-h-96 overflow-y-auto'>
       {comments.map((com)=>(
        <div key={com._id} className='flex gap-3 p-4 hover:bg-gray-50' >
            <div className='w-8 h-8 rounded-full overflow-hidden flex items-center justify-center cursor-pointer' >
                <img src={com.user.profileImage || dp} alt="" className='w-full h-full object-cover' />
            </div> 
            <div className='flex-1'>
                <div className='bg-gray-100 rounded-2xl px-3 py-2'>
                    <div className='text-sm font-semibold text-gray-900'>{`${com.user.firstName} ${com.user.lastName}`}</div>
                    <div className='text-sm text-gray-800 mt-1'>{com.content}</div>
                </div>
                <div className='flex items-center gap-4 mt-1 ml-3'>
                    <span className='text-xs text-gray-500'>Like</span>
                    <span className='text-xs text-gray-500'>Reply</span>
                    <span className='text-xs text-gray-500'>{moment(com.createdAt).fromNow()}</span>
                </div>
            </div>
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
