import React, { useContext, useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { authDataContext } from '../context/AuthContext';
import axios from 'axios';
import { RxCross1 } from "react-icons/rx";
import dp from "../assets/dp.webp";
import { userDataContext } from '../context/UserContext';

function Notification() {
  const { serverUrl } = useContext(authDataContext);
  const { userData } = useContext(userDataContext);
  const [notificationData, setNotificationData] = useState([]);

  const handleGetNotification = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/notification/get`, { withCredentials: true });
      setNotificationData(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await axios.delete(`${serverUrl}/api/notification/deleteone/${id}`, { withCredentials: true });
      handleGetNotification();
    } catch (error) {
      console.log(error);
    }
  };

  const handleClearAllNotification = async () => {
    try {
      await axios.delete(`${serverUrl}/api/notification`, { withCredentials: true });
      handleGetNotification();
    } catch (error) {
      console.log(error);
    }
  };

  const handleMessage = (type) => {
    if (type === "like") return "liked your post";
    else if (type === "comment") return "commented on your post";
    else return "accepted your connection";
  };

  useEffect(() => {
    handleGetNotification();
  }, []);

  return (
    <div className='w-screen min-h-screen bg-[#f0efe7] pt-[100px] px-4 md:px-[40px] flex flex-col items-center gap-6'>
      <Nav />
      
      {/* Header */}
      <div className='w-full max-w-[900px] bg-white shadow-lg rounded-lg flex flex-col md:flex-row md:items-center justify-between p-4 text-[20px] text-gray-600'>
        <div>Notifications ({notificationData.length})</div>
        {notificationData.length > 0 && (
          <button 
            className='mt-2 md:mt-0 min-w-[100px] h-[40px] rounded-full border-2 border-[#ec4545] text-[#ec4545] hover:bg-[#ec4545] hover:text-white transition duration-200'
            onClick={handleClearAllNotification}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Notification List */}
      {notificationData.length > 0 && (
        <div className='w-full max-w-[900px] bg-white shadow-lg rounded-lg flex flex-col gap-4 p-4'>
          {notificationData.map((noti, index) => (
            <div key={index} className='w-full flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-4 gap-4'>
              <div className='flex-1'>
                <div className='flex items-center gap-4'>
                  <div className='w-[50px] h-[50px] rounded-full overflow-hidden bg-white border border-gray-300'>
                    <img 
                      src={noti.relatedUser.profileImage || dp} 
                      alt="User" 
                      className='w-full h-full object-contain' 
                    />
                  </div>
                  <div className='text-[16px] md:text-[18px] font-semibold text-gray-700 break-words'>
                    {`${noti.relatedUser.firstName} ${noti.relatedUser.lastName} ${handleMessage(noti.type)}`}
                  </div>
                </div>

                {noti.relatedPost && (
                  <div className='flex items-center gap-3 ml-[60px] mt-3 flex-wrap'>
                    <div className='w-[80px] h-[50px] overflow-hidden rounded-md flex-shrink-0'>
                      <img src={noti.relatedPost.image} alt="Post" className='w-full h-full object-cover' />
                    </div>
                    <div className='text-sm text-gray-600 break-words max-w-[calc(100%-100px)]'>
                      {noti.relatedPost.description}
                    </div>
                  </div>
                )}
              </div>

              <div onClick={() => handleDeleteNotification(noti._id)} className='cursor-pointer'>
                <RxCross1 className='w-[20px] h-[20px] text-gray-800 hover:text-red-500 transition duration-150' />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notification;
