import React, { useState, useEffect, useRef, useContext } from 'react';
import { userDataContext } from '../context/UserContext';
import { authDataContext } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import Nav from '../components/Nav';
import dp from '../assets/dp.webp';

const Chat = () => {
    const { userData: user } = useContext(userDataContext);
    const { serverUrl } = useContext(authDataContext);
    const location = useLocation();
    const [socket, setSocket] = useState(null);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Initialize socket connection
    useEffect(() => {
        if (user && serverUrl) {
            console.log('Initializing socket connection...', { userId: user._id, serverUrl });
            const newSocket = io(serverUrl, {
                withCredentials: true
            });

            newSocket.on('connect', () => {
                console.log('Socket connected successfully');
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });

            newSocket.emit('register', user._id);
            
            // Socket event listeners
            newSocket.on('newMessage', ({ chatId, message }) => {
                if (selectedChat && selectedChat._id === chatId) {
                    setMessages(prev => [...prev, message]);
                }
                // Update chat list with new message
                setChats(prev => prev.map(chat => 
                    chat._id === chatId 
                        ? { ...chat, lastMessage: message, lastMessageTime: message.createdAt }
                        : chat
                ));
            });

            newSocket.on('messageSent', ({ chatId, message }) => {
                if (selectedChat && selectedChat._id === chatId) {
                    setMessages(prev => [...prev, message]);
                }
            });

            newSocket.on('userOnline', (userId) => {
                console.log('User came online:', userId);
                setOnlineUsers(prev => new Set(prev).add(userId));
            });

            newSocket.on('userOffline', (userId) => {
                console.log('User went offline:', userId);
                setOnlineUsers(prev => {
                    const updated = new Set(prev);
                    updated.delete(userId);
                    return updated;
                });
            });

            newSocket.on('userTyping', ({ userId, isTyping }) => {
                setTypingUsers(prev => {
                    const updated = new Set(prev);
                    if (isTyping) {
                        updated.add(userId);
                    } else {
                        updated.delete(userId);
                    }
                    return updated;
                });
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [user, serverUrl, selectedChat]);

    // Fetch user chats
    useEffect(() => {
        if (user) {
            fetchChats();
        }
    }, [user]);

    // Handle navigation state (when coming from ChatButton)
    useEffect(() => {
        console.log('Chat page navigation state:', location.state);
        if (location.state?.selectedChat) {
            console.log('Setting selected chat from navigation:', location.state.selectedChat);
            setSelectedChat(location.state.selectedChat);
            fetchMessages(location.state.selectedChat._id);
        }
    }, [location.state]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchChats = async () => {
        try {
            console.log('Fetching chats...', { user: user?._id, serverUrl });
            const response = await axios.get(`${serverUrl}/api/chat`, {
                withCredentials: true
            });
            console.log('Chats response:', response.data);
            setChats(response.data);
        } catch (error) {
            console.error('Error fetching chats:', error.response?.data || error.message);
        }
    };

    const fetchMessages = async (chatId) => {
        try {
            const response = await axios.get(`${serverUrl}/api/chat/${chatId}/messages`, {
                withCredentials: true
            });
            console.log('Messages response:', response.data.messages);
            setMessages(response.data.messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedChat) return;

        try {
            await axios.post(`${serverUrl}/api/chat/message`, {
                chatId: selectedChat._id,
                content: newMessage
            }, {
                withCredentials: true
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
        setMessages([]);
        fetchMessages(chat._id);
        
        if (socket) {
            socket.emit('joinChat', chat._id);
        }
    };

    const handleTyping = () => {
        if (!isTyping && selectedChat && socket) {
            setIsTyping(true);
            socket.emit('typing', { 
                chatId: selectedChat._id, 
                userId: user._id, 
                isTyping: true 
            });
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            if (socket && selectedChat) {
                socket.emit('typing', { 
                    chatId: selectedChat._id, 
                    userId: user._id, 
                    isTyping: false 
                });
            }
        }, 1000);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getDisplayName = (user) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user.userName || 'Unknown User';
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Nav />
            <div className="pt-[80px] h-screen flex bg-gray-100">
            {/* Chat List */}
            <div className="w-1/3 bg-white border-r border-gray-300">
                <div className="p-4 border-b border-gray-300">
                    <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                </div>
                <div className="overflow-y-auto h-full">
                    {chats.map((chat) => (
                        <div
                            key={chat._id}
                            onClick={() => handleChatSelect(chat)}
                            className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                                selectedChat?._id === chat._id ? 'bg-blue-50' : ''
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <img
                                        src={chat.participant.profileImage || dp}
                                        alt={chat.participant.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    {(onlineUsers.has(chat.participant._id) || chat.participant.isOnline) && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {getDisplayName(chat.participant)}
                                    </p>
                                    {chat.lastMessage && (
                                        <p className="text-sm text-gray-500 truncate">
                                            {chat.lastMessage.content}
                                        </p>
                                    )}
                                </div>
                                {chat.lastMessageTime && (
                                    <span className="text-xs text-gray-400">
                                        {formatTime(chat.lastMessageTime)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-300 bg-white">
                            <div className="flex items-center space-x-3">
                                <img
                                    src={selectedChat.participant.profileImage || dp}
                                    alt={selectedChat.participant.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {selectedChat.participant.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {(onlineUsers.has(selectedChat.participant._id) || selectedChat.participant.isOnline) ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message._id}
                                    className={`flex ${
                                        message.sender._id === user._id ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    {message.sender._id !== user._id && (
                                        <div className="flex flex-col items-center mr-2">
                                            <img
                                                src={message.sender.profileImage || dp}
                                                alt={getDisplayName(message.sender)}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        {message.sender._id !== user._id && (
                                            <p className="text-xs text-gray-600 mb-1 ml-1 font-medium">
                                                {getDisplayName(message.sender)}
                                            </p>
                                        )}
                                        <div
                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                message.sender._id === user._id
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-300 text-gray-800'
                                            }`}
                                        >
                                            <p className="text-sm">{message.content}</p>
                                            <p className="text-xs mt-1 opacity-70">
                                                {formatTime(message.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Typing indicator */}
                            {typingUsers.size > 0 && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">
                                        <p className="text-sm">Typing...</p>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-gray-300 bg-white">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        handleTyping();
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            sendMessage();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={sendMessage}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500 text-lg">Select a chat to start messaging</p>
                    </div>
                )}
            </div>
        </div>
        </div>
    );
};

export default Chat;
