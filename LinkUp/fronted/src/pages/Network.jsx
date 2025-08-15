import React, { useContext, useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/UserContext';
import axios from 'axios';
import dp from "../assets/dp.webp";
import { FaRegCheckCircle } from "react-icons/fa";
import { RxCrossCircled } from "react-icons/rx";
import { HiOutlineUserGroup, HiOutlineUsers } from "react-icons/hi2";
import ChatButton from '../components/ChatButton';
import ConnectionButton from '../components/ConnectionButton';
import MobileBottomNav from '../components/MobileBottomNav';
function Network() {
    let { serverUrl } = useContext(authDataContext);
    let [connectionRequests, setConnectionRequests] = useState([]);
    let [suggestedUsers, setSuggestedUsers] = useState([]);
    let [myConnections, setMyConnections] = useState([]);
    let { userData } = useContext(userDataContext);

    const handleGetRequests = async () => {
        try {
            let result = await axios.get(`${serverUrl}/api/connection/requests`, { withCredentials: true });
            setConnectionRequests(result.data);
        }
        catch (error) {
            console.error("Error fetching connection requests:", error);
        }
    }

    const handleGetSuggestedUsers = async () => {
        try {
            let result = await axios.get(`${serverUrl}/api/user/suggestedusers`, { withCredentials: true });
            console.log("Suggested users:", result.data);
            setSuggestedUsers(result.data || []);
        }
        catch (error) {
            console.error("Error fetching suggested users:", error);
        }
    }

    const handleGetMyConnections = async () => {
        try {
            let result = await axios.get(`${serverUrl}/api/connection/`, { withCredentials: true });
            console.log("My connections:", result.data);
            setMyConnections(result.data || []);
        }
        catch (error) {
            console.error("Error fetching connections:", error);
        }
    }

    const handleAcceptConnection = async (requestId) => {
        try{
            let result = await axios.put(`${serverUrl}/api/connection/accept/${requestId}`, {}, { withCredentials: true });
            setConnectionRequests(connectionRequests.filter((con) => con._id !== requestId));
            // Refresh connections list
            handleGetMyConnections();
        }
        catch(error){
            console.log("Error accepting connection:", error);
        }
    }
    
    const handleRejectConnection = async (requestId) => {
        try{
            let result = await axios.put(`${serverUrl}/api/connection/reject/${requestId}`, {}, { withCredentials: true });
            setConnectionRequests(connectionRequests.filter((con) => con._id !== requestId));
        }
        catch(error){
            console.log("Error rejecting connection:", error);
        }
    }

    useEffect(() => {
        handleGetRequests();
        handleGetSuggestedUsers();
        handleGetMyConnections();
    }, []);

    return (
        <div className="w-screen min-h-screen bg-gray-100 pt-[100px] pb-20 md:pb-0">
            <Nav />
            <MobileBottomNav />
            
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Header Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">My Network</h1>
                    <p className="text-gray-600">Keep in touch with your professional network</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                            <h3 className="font-semibold text-gray-900 mb-4">Manage my network</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <HiOutlineUsers className="w-5 h-5 text-gray-600" />
                                        <span className="text-sm">Connections</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{myConnections.length}</span>
                                </div>
                                {connectionRequests.length > 0 && (
                                    <div className="flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <HiOutlineUserGroup className="w-5 h-5 text-gray-600" />
                                            <span className="text-sm">Invitations</span>
                                        </div>
                                        <span className="text-sm font-medium text-blue-600">{connectionRequests.length}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Connection Requests */}
                        {connectionRequests.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="p-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Invitations ({connectionRequests.length})
                                    </h2>
                                </div>
                                <div className="p-4 space-y-4">
                                    {connectionRequests.map((request) => (
                                        <div key={request._id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full overflow-hidden">
                                                    <img
                                                        src={request.sender?.profileImage || dp}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {`${request.sender.firstName} ${request.sender.lastName}`}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">{request.sender.headline || 'Professional'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <ChatButton 
                                                    userId={request.sender._id} 
                                                    userName={`${request.sender.firstName} ${request.sender.lastName}`}
                                                    className="text-sm px-3 py-1"
                                                />
                                                <button 
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                                    onClick={() => handleAcceptConnection(request._id)}
                                                    title="Accept"
                                                >
                                                    <FaRegCheckCircle className="w-6 h-6" />
                                                </button>
                                                <button 
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    onClick={() => handleRejectConnection(request._id)}
                                                    title="Decline"
                                                >
                                                    <RxCrossCircled className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* People You May Know - Suggestions */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    People you may know
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">Based on your profile and activity</p>
                            </div>
                            <div className="p-4">
                                {suggestedUsers.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {suggestedUsers.slice(0, 6).map((user) => (
                                            <div key={user._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-14 h-14 rounded-full overflow-hidden">
                                                        <img
                                                            src={user.profileImage || dp}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900 text-sm">
                                                            {`${user.firstName} ${user.lastName}`}
                                                        </h3>
                                                        <p className="text-xs text-gray-600 line-clamp-2">
                                                            {user.headline || 'Professional'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <ConnectionButton 
                                                        userId={user._id}
                                                        userName={`${user.firstName} ${user.lastName}`}
                                                        className="flex-1 text-sm py-2"
                                                    />
                                                    <ChatButton 
                                                        userId={user._id} 
                                                        userName={`${user.firstName} ${user.lastName}`}
                                                        className="text-sm px-4 py-2"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-600 text-center py-8">No suggestions available</p>
                                )}
                            </div>
                        </div>

                        {/* My Connections */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Your connections ({myConnections.length})
                                </h2>
                            </div>
                            <div className="p-4">
                                {myConnections.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {myConnections.map((connection) => (
                                            <div key={connection._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden">
                                                        <img
                                                            src={connection.profileImage || dp}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900 text-sm">
                                                            {`${connection.firstName} ${connection.lastName}`}
                                                        </h3>
                                                        <p className="text-xs text-gray-600">
                                                            {connection.headline || 'Professional'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChatButton 
                                                    userId={connection._id} 
                                                    userName={`${connection.firstName} ${connection.lastName}`}
                                                    className="w-full text-sm py-2"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-600 text-center py-8">No connections yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Network;
