import React, { useContext, useEffect ,useState} from 'react';
import { authDataContext } from '../context/AuthContext';
import axios from 'axios';
import { userDataContext, socket } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import WithdrawModal from './WithdrawModal';
import { HiOutlineUserPlus, HiOutlineClock, HiOutlineArrowUturnLeft } from "react-icons/hi2";

function PostConnectionButton({ userId, userName }) {
    let { serverUrl } = useContext(authDataContext);
    let {userData,setUserData} = useContext(userDataContext);
    let [status, setStatus] = useState("");
    let [showWithdrawModal, setShowWithdrawModal] = useState(false);
    let navigate = useNavigate();   

    const handleSendConnection = async () => {
        try {
            let result =await axios.post(`${serverUrl}/api/connection/send/${userId}`, {}, { withCredentials: true });
            console.log(result);
            handleGetStatus(); // Refresh status after sending connection
        } catch (error) {
            console.error("Error connecting:", error);
        }
    } 

    const handleRemoveConnection = async () => {
        try {
            let result = await axios.delete(`${serverUrl}/api/connection/remove/${userId}`, { withCredentials: true });
            console.log(result);
            handleGetStatus(); // Refresh status after removing connection
        } catch (error) {
            console.error("Error receiving connection:", error);
        }
    }

    const handleGetStatus = async () => {
        try {
            let result = await axios.get(
                `${serverUrl}/api/connection/getstatus/${userId}`,
                { withCredentials: true } // ✅ correct position
            );
            console.log("Connection status:", result.data);
            setStatus(result.data.status);
        } catch (error) {
            console.error("Error getting connection status:", error);
        }
    };

    useEffect(() => {
        handleGetStatus();
        
        socket.on("statusUpdate", ({updatedUserId, newStatus}) => {
            if (updatedUserId === userId) {
                setStatus(newStatus);
            }
        })
        
        return () => {
            socket.off("statusUpdate");
        }
    }, [userId]);

    const handleClick=async () => {
        if (status === "pending") {
            setShowWithdrawModal(true); // Show withdraw confirmation modal
        }
        else if (status === "received") {
            navigate("/network"); // Go to network to accept/reject
        }
        else {
            await handleSendConnection(); // Send new connection request
        }
    }

    const handleWithdrawConfirm = async () => {
        await handleRemoveConnection();
        setShowWithdrawModal(false);
    }

    const getButtonText = () => {
        switch(status) {
            case "Connect": return "Connect";
            case "pending": return "Pending";
            case "received": return "Respond";
            default: return "Connect";
        }
    }

    const getButtonIcon = () => {
        switch(status) {
            case "Connect": return <HiOutlineUserPlus className="w-4 h-4" />;
            case "pending": return <HiOutlineClock className="w-4 h-4" />;
            case "received": return <HiOutlineArrowUturnLeft className="w-4 h-4" />;
            default: return <HiOutlineUserPlus className="w-4 h-4" />;
        }
    }

    // Only show button for Connect, Pending, and Received states
    // Hide for "disconnect" (already connected users)
    if (status === "disconnect" || status === "") {
        return null;
    }

    return (
        <div>
            <button 
                className={`min-w-[100px] h-[40px] rounded-full border-2 border-[#2dc0ff] text-[#2dc0ff] hover:bg-[#2dc0ff] hover:text-white transition-colors flex items-center justify-center gap-2 px-4 ${
                    status === "received" ? "bg-blue-50" : ""
                } ${
                    status === "pending" ? "bg-gray-100 border-gray-400 text-gray-600 hover:bg-gray-200 hover:text-gray-700" : ""
                }`} 
                onClick={handleClick}
            >
                {getButtonIcon()}
                <span className="text-sm font-medium">{getButtonText()}</span>
            </button>

            <WithdrawModal 
                isOpen={showWithdrawModal}
                onClose={() => setShowWithdrawModal(false)}
                onConfirm={handleWithdrawConfirm}
                userName={userName}
            />
        </div>
    );
}

export default PostConnectionButton;
