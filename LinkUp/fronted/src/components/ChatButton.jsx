import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authDataContext } from '../context/AuthContext';
import axios from 'axios';

const ChatButton = ({ userId, userName, className = "" }) => {
    const navigate = useNavigate();
    const { serverUrl } = useContext(authDataContext);

    const startChat = async () => {
        try {
            console.log('Starting chat with:', { userId, userName, serverUrl });
            const response = await axios.post(`${serverUrl}/api/chat/create`, {
                participantId: userId
            }, {
                withCredentials: true
            });
            
            console.log('Chat created successfully:', response.data);
            // Navigate to chat page with the chat selected
            navigate('/chat', { state: { selectedChat: response.data.chat } });
        } catch (error) {
            console.error('Error creating chat:', error.response?.data || error.message);
            // Still navigate to chat page even if error
            navigate('/chat');
        }
    };

    return (
        <button
            onClick={startChat}
            className={`flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ${className}`}
        >
            <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
            </svg>
            <span>Message</span>
        </button>
    );
};

export default ChatButton;
