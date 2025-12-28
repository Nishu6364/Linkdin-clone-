import React, { useState, useEffect, useRef, useContext } from 'react';
import { userDataContext } from '../context/UserContext';
import { authDataContext } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import Nav from '../components/Nav';
import MobileBottomNav from '../components/MobileBottomNav';
import dp from '../assets/dp.webp';
import { IoArrowBack, IoSearch, IoEllipsisHorizontal } from 'react-icons/io5';
import { MdKeyboardArrowDown } from 'react-icons/md';

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
    const [showChatView, setShowChatView] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Focused');
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const filters = ['Focused', 'Jobs', 'Unread', 'Drafts', 'InMail'];

    // Prevent body scroll when chat is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

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
            newSocket.on('receiveMessage', (message) => {
                console.log('Received message:', message);
                if (selectedChat && selectedChat._id === message.chatId) {
                    setMessages(prev => [...prev, message]);
                }
                // Update chat list with new message
                setChats(prev => prev.map(chat => 
                    chat._id === message.chatId 
                        ? { ...chat, lastMessage: message, lastMessageTime: message.createdAt }
                        : chat
                ));
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

    // Fetch user's chats
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const response = await axios.get(`${serverUrl}/api/chat/`, {
                    withCredentials: true
                });
                setChats(response.data);
            } catch (error) {
                console.error('Error fetching chats:', error);
            }
        };

        if (user && serverUrl) {
            fetchChats();
        }
    }, [user, serverUrl]);

    // Check for userId in URL params to auto-select chat
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const userId = searchParams.get('userId');
        
        if (userId && chats.length > 0) {
            const targetChat = chats.find(chat => 
                chat.participant && chat.participant._id === userId
            );
            
            if (targetChat) {
                handleChatSelect(targetChat);
            }
        }
    }, [location.search, chats]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async (chatId) => {
        try {
            const response = await axios.get(`${serverUrl}/api/chat/${chatId}/messages`, {
                withCredentials: true
            });
            
            // Handle different response formats
            if (response.data.messages) {
                setMessages(response.data.messages);
            } else if (Array.isArray(response.data)) {
                setMessages(response.data);
            } else {
                console.error('Unexpected response format:', response.data);
                setMessages([]);
            }
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
        setShowChatView(true);
        fetchMessages(chat._id);
        
        if (socket) {
            socket.emit('joinChat', chat._id);
        }
    };

    const handleBackToList = () => {
        setShowChatView(false);
        setSelectedChat(null);
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
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
                behavior: "smooth",
                block: "end"
            });
        }
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

    const filteredChats = chats.filter(chat => {
        const displayName = chat.participant ? getDisplayName(chat.participant) : '';
        return displayName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="h-screen bg-gray-50 overflow-hidden">
            <Nav />
            <div className="pt-[70px] pb-20 md:pb-0 h-full flex flex-col">
                
                {/* Mobile: Show either chat list or chat view */}
                <div className="md:hidden h-full">
                    {!showChatView ? (
                        /* Messages List View */
                        <div className="h-full flex flex-col bg-white">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h1 className="text-xl font-semibold text-gray-900">Messaging</h1>
                                    <IoEllipsisHorizontal className="w-6 h-6 text-gray-600" />
                                </div>
                                
                                {/* Search Bar */}
                                <div className="relative mb-4">
                                    <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search messages"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex space-x-2 overflow-x-auto">
                                    {filters.map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setActiveFilter(filter)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center ${
                                                activeFilter === filter
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {filter}
                                            {filter === 'Focused' && <MdKeyboardArrowDown className="w-4 h-4 ml-1" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto">
                                {filteredChats.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <p className="text-lg mb-2">No messages found</p>
                                        <p className="text-sm">Start a conversation</p>
                                    </div>
                                ) : (
                                    filteredChats.map((chat) => (
                                        <div
                                            key={chat._id}
                                            onClick={() => handleChatSelect(chat)}
                                            className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="relative">
                                                    <img
                                                        src={chat.participant?.profileImage || dp}
                                                        alt={chat.participant?.name || 'User'}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                    {chat.participant && (onlineUsers.has(chat.participant._id) || chat.participant.isOnline) && (
                                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {chat.participant ? getDisplayName(chat.participant) : 'Unknown User'}
                                                        </p>
                                                        {chat.lastMessageTime && (
                                                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                                {formatTime(chat.lastMessageTime)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {chat.lastMessage && (
                                                        <p className="text-sm text-gray-600 truncate mt-1">
                                                            {chat.lastMessage.content}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Individual Chat View */
                        <div className="h-full flex flex-col bg-white">
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 bg-white">
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={handleBackToList}
                                        className="p-1 hover:bg-gray-100 rounded-full"
                                    >
                                        <IoArrowBack className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <img
                                        src={selectedChat?.participant?.profileImage || dp}
                                        alt={selectedChat?.participant?.name || 'User'}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {selectedChat?.participant ? getDisplayName(selectedChat.participant) : 'Unknown User'}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {selectedChat?.participant && (onlineUsers.has(selectedChat.participant._id) || selectedChat.participant.isOnline) ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                    <IoEllipsisHorizontal className="w-6 h-6 text-gray-600" />
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((message, index) => (
                                    <div
                                        key={message._id || index}
                                        className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                            message.sender._id === user._id
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-900'
                                        }`}>
                                            <p className="text-sm">{message.content}</p>
                                            <p className={`text-xs mt-1 ${
                                                message.sender._id === user._id ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                                {formatTime(message.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {Array.from(typingUsers).filter(userId => userId !== user._id).length > 0 && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                                            <p className="text-sm">Typing...</p>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-gray-200 bg-white">
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
                                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop: Side-by-side layout */}
                <div className="hidden md:flex h-full">
                    {/* Chat List */}
                    <div className="w-1/3 bg-white border-r border-gray-300 flex flex-col">
                        <div className="p-4 border-b border-gray-300">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Messages</h2>
                            <div className="relative">
                                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search messages"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {filteredChats.map((chat) => (
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
                                                src={chat.participant?.profileImage || dp}
                                                alt={chat.participant?.name || 'User'}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            {chat.participant && (onlineUsers.has(chat.participant._id) || chat.participant.isOnline) && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {chat.participant ? getDisplayName(chat.participant) : 'Unknown User'}
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
                                            src={selectedChat.participant?.profileImage || dp}
                                            alt={selectedChat.participant?.name || 'User'}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {selectedChat.participant?.name || getDisplayName(selectedChat.participant) || 'Unknown User'}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {selectedChat.participant && (onlineUsers.has(selectedChat.participant._id) || selectedChat.participant.isOnline) ? 'Online' : 'Offline'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((message, index) => (
                                        <div
                                            key={message._id || index}
                                            className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                message.sender._id === user._id
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 text-gray-900'
                                            }`}>
                                                <p className="text-sm">{message.content}</p>
                                                <p className={`text-xs mt-1 ${
                                                    message.sender._id === user._id ? 'text-blue-100' : 'text-gray-500'
                                                }`}>
                                                    {formatTime(message.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {Array.from(typingUsers).filter(userId => userId !== user._id).length > 0 && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
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
            <MobileBottomNav />
        </div>
    );
};

export default Chat;
