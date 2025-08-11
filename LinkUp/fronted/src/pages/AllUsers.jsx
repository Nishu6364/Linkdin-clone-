import React, { useContext, useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/UserContext';
import axios from 'axios';
import dp from "../assets/dp.webp";
import ChatButton from '../components/ChatButton';
import ConnectionButton from '../components/ConnectionButton';

function AllUsers() {
    const { serverUrl } = useContext(authDataContext);
    const { userData } = useContext(userDataContext);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAllUsers = async () => {
        try {
            setLoading(true);
            const result = await axios.get(`${serverUrl}/api/user/allusers`, { 
                withCredentials: true 
            });
            console.log('All users response:', result.data);
            setAllUsers(result.data.users || []);
        } catch (error) {
            console.error("Error fetching all users:", error);
            setAllUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userData) {
            fetchAllUsers();
        }
    }, [userData]);

    const filteredUsers = allUsers.filter(user => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            (user.firstName?.toLowerCase().includes(searchLower)) ||
            (user.lastName?.toLowerCase().includes(searchLower)) ||
            (user.userName?.toLowerCase().includes(searchLower)) ||
            (user.headline?.toLowerCase().includes(searchLower))
        );
    });

    return (
        <div className="w-screen min-h-[100vh] bg-[#f0efe7] pt-[100px] px-[20px] flex flex-col items-center">
            <Nav />
            
            <div className='w-full max-w-[1000px]'>
                {/* Header */}
                <div className='w-full bg-white shadow-lg rounded-lg flex flex-col p-[20px] mb-[30px]'>
                    <h1 className='text-[24px] text-gray-700 font-semibold mb-[20px]'>
                        Message Anyone - All Users ({allUsers.length})
                    </h1>
                    
                    {/* Search Bar */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-[10px]">
                        <input
                            type="text"
                            placeholder="Search users by name, username, or headline..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-gray-700"
                        />
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Users Grid */}
                {loading ? (
                    <div className="flex justify-center items-center p-[40px]">
                        <div className="text-gray-600 text-lg">Loading users...</div>
                    </div>
                ) : filteredUsers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
                        {filteredUsers.map((user, index) => (
                            <div key={user._id || index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-[20px]">
                                {/* User Profile Section */}
                                <div className="flex flex-col items-center text-center mb-[15px]">
                                    <div className="relative mb-[10px]">
                                        <img
                                            src={user.profileImage || dp}
                                            alt={`${user.firstName} ${user.lastName}`}
                                            className="w-[80px] h-[80px] rounded-full object-cover"
                                        />
                                        {user.isOnline && (
                                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                    
                                    <h3 className="text-[18px] font-semibold text-gray-800 mb-[5px]">
                                        {`${user.firstName} ${user.lastName}`}
                                    </h3>
                                    
                                    <p className="text-[14px] text-gray-600 mb-[5px]">
                                        @{user.userName}
                                    </p>
                                    
                                    {user.headline && (
                                        <p className="text-[12px] text-gray-500 mb-[10px] line-clamp-2">
                                            {user.headline}
                                        </p>
                                    )}
                                    
                                    {user.location && (
                                        <p className="text-[11px] text-gray-400 mb-[10px]">
                                            📍 {user.location}
                                        </p>
                                    )}
                                    
                                    <p className="text-[10px] text-gray-400">
                                        {user.isOnline ? 'Online now' : `Last seen: ${user.lastSeen ? new Date(user.lastSeen).toLocaleDateString() : 'Recently'}`}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-[10px]">
                                    <ChatButton 
                                        userId={user._id} 
                                        userName={`${user.firstName} ${user.lastName}`}
                                        className="w-full py-[8px] text-[14px] font-medium"
                                    />
                                    <ConnectionButton 
                                        userId={user._id}
                                        className="w-full py-[6px] text-[12px]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full bg-white shadow-lg rounded-lg mt-[20px] p-[40px] text-center">
                        <div className="text-gray-500 text-[18px] mb-[10px]">
                            {searchTerm ? `No users found matching "${searchTerm}"` : "No users found"}
                        </div>
                        <div className="text-gray-400 text-[14px]">
                            {searchTerm ? "Try searching with different keywords" : "Try refreshing the page"}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AllUsers;
