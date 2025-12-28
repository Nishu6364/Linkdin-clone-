import React, { useContext, useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/UserContext';
import axios from 'axios';
import dp from "../assets/dp.webp";
import ChatButton from '../components/ChatButton';

function Friends() {
    const { serverUrl } = useContext(authDataContext);
    const { userData } = useContext(userDataContext);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConnections = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/connection/`, { 
                withCredentials: true 
            });
            setConnections(result.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching connections:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userData) {
            fetchConnections();
        }
    }, [userData]);

    return (
        <div className="w-screen h-[100vh] bg-[#f0efe7] pt-[100px] px-[20px] flex flex-col gap-[40px] items-center">
            <Nav />
            
            <div className='w-full max-w-[900px]'>
                <div className='w-full h-[100px] bg-white shadow-lg rounded-lg flex items-center p-[20px] text-[22px] text-gray-600 font-semibold'>
                    My Connections ({connections.length})
                </div>

                {loading ? (
                    <div className="flex justify-center items-center p-[40px]">
                        <div className="text-gray-600">Loading connections...</div>
                    </div>
                ) : connections.length > 0 ? (
                    <div className="w-full shadow-lg rounded-lg bg-white mt-[20px] p-[20px]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
                            {connections.map((connection, index) => (
                                <div key={index} className="flex flex-col items-center p-[20px] border rounded-lg hover:shadow-md transition-shadow">
                                    <div className="w-[80px] h-[80px] rounded-full overflow-hidden mb-[15px]">
                                        <img
                                            src={connection.profileImage || dp}
                                            alt={`${connection.firstName} ${connection.lastName}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="text-center mb-[15px]">
                                        <div className="text-[18px] font-semibold text-gray-700">
                                            {`${connection.firstName} ${connection.lastName}`}
                                        </div>
                                        {connection.headline && (
                                            <div className="text-[14px] text-gray-500 mt-[5px]">
                                                {connection.headline}
                                            </div>
                                        )}
                                        <div className="text-[12px] text-gray-400 mt-[5px]">
                                            {connection.connection?.length || 0} connections
                                        </div>
                                    </div>
                                    <ChatButton 
                                        userId={connection._id} 
                                        userName={`${connection.firstName} ${connection.lastName}`}
                                        className="text-sm w-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full shadow-lg rounded-lg bg-white mt-[20px] p-[40px] text-center">
                        <div className="text-gray-500 text-[18px]">
                            You don't have any connections yet.
                        </div>
                        <div className="text-gray-400 text-[14px] mt-[10px]">
                            Start connecting with people to chat with them!
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Friends;