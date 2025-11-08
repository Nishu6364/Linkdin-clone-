import React, { useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { TiHome } from "react-icons/ti";
import { FaUserGroup } from "react-icons/fa6";
import { IoNotificationsSharp } from "react-icons/io5";
import { FaBriefcase } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { userDataContext } from '../context/UserContext';

function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notificationCount, setUploadPost } = useContext(userDataContext);

  const isActive = (path) => location.pathname === path;

  const handlePostClick = () => {
    // Navigate to home if not already there
    if (location.pathname !== '/') {
      navigate('/');
    }
    // Open the post modal
    setUploadPost(true);
  };

  return (
    <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden'>
      <div className='flex justify-around items-center py-2'>
        
        {/* Home */}
        <button 
          className={`flex flex-col items-center justify-center py-2 px-3 ${isActive('/') ? 'text-black' : 'text-gray-600'}`}
          onClick={() => navigate('/')}
        >
          <TiHome className={`w-6 h-6 ${isActive('/') ? 'text-black' : 'text-gray-600'}`}/>
          <span className={`text-xs mt-1 ${isActive('/') ? 'text-black font-medium' : 'text-gray-600'}`}>Home</span>
        </button>

        {/* My Network */}
        <button 
          className={`flex flex-col items-center justify-center py-2 px-3 ${isActive('/network') ? 'text-black' : 'text-gray-600'}`}
          onClick={() => navigate('/network')}
        >
          <FaUserGroup className={`w-6 h-6 ${isActive('/network') ? 'text-black' : 'text-gray-600'}`}/>
          <span className={`text-xs mt-1 ${isActive('/network') ? 'text-black font-medium' : 'text-gray-600'}`}>My Network</span>
        </button>

        {/* Post */}
        <button 
          className='flex flex-col items-center justify-center py-2 px-3'
          onClick={handlePostClick}
        >
          <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
            <FiPlus className='w-5 h-5 text-white'/>
          </div>
          <span className='text-xs mt-1 text-gray-600'>Post</span>
        </button>

        {/* Notifications */}
        <button 
          className={`flex flex-col items-center justify-center py-2 px-3 relative ${isActive('/notification') ? 'text-black' : 'text-gray-600'}`}
          onClick={() => navigate('/notification')}
        >
          <div className='relative'>
            <IoNotificationsSharp className={`w-6 h-6 ${isActive('/notification') ? 'text-black' : 'text-gray-600'}`}/>
            {notificationCount > 0 && (
              <div className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1'>
                {notificationCount > 99 ? '99+' : notificationCount}
              </div>
            )}
          </div>
          <span className={`text-xs mt-1 ${isActive('/notification') ? 'text-black font-medium' : 'text-gray-600'}`}>Notifications</span>
        </button>

        {/* Jobs */}
        <button 
          className={`flex flex-col items-center justify-center py-2 px-3 ${isActive('/jobs') ? 'text-black' : 'text-gray-600'}`}
          onClick={() => navigate('/jobs')}
        >
          <FaBriefcase className={`w-6 h-6 ${isActive('/jobs') ? 'text-black' : 'text-gray-600'}`}/>
          <span className={`text-xs mt-1 ${isActive('/jobs') ? 'text-black font-medium' : 'text-gray-600'}`}>Jobs</span>
        </button>

      </div>
    </div>
  )
}

export default MobileBottomNav
