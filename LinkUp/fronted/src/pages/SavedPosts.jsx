import React, { useContext, useEffect, useState } from 'react'
import Nav from '../components/Nav'
import Post from '../components/Post'
import { userDataContext } from '../context/UserContext'
import { authDataContext } from '../context/AuthContext'
import axios from 'axios'
import { FaRegBookmark } from "react-icons/fa";

function SavedPosts() {
  const { userData, savedPostsData, getSavedPosts } = useContext(userDataContext)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSavedPosts = async () => {
      if (userData?._id) {
        setLoading(true)
        await getSavedPosts()
        setLoading(false)
      }
    }
    
    loadSavedPosts()
  }, [userData?._id])

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <div className="max-w-4xl mx-auto pt-[80px] px-4">
        
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <FaRegBookmark className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Saved Posts</h1>
          </div>
          <p className="text-gray-600 mt-2">
            {savedPostsData.length} saved {savedPostsData.length === 1 ? 'post' : 'posts'}
          </p>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : savedPostsData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FaRegBookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No saved posts yet</h2>
            <p className="text-gray-600">
              Save posts that interest you by clicking the bookmark icon on any post.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedPostsData.map((post) => (
              <Post
                key={post._id}
                id={post._id}
                author={post.author}
                like={post.like}
                comment={post.comment}
                description={post.description}
                image={post.image}
                createdAt={post.createdAt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedPosts
