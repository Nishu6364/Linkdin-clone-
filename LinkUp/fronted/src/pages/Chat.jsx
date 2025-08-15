import React, { useState, useEffect, useRef, useContext } from 'react';
import { userDataContext } from '../context/UserContext';
import { authDataContext } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import Nav from '../components/Nav';
import MobileBottomNav from '../components/MobileBottomNav';
import dp from '../assets/dp.webp';
import { IoArrowBack, IoSearch, IoEllipsisVertical, IoStar, IoStarOutline } from 'react-icons/io5';
import { FaPlus, FaMicrophone, FaPaperPlane } from 'react-icons/fa';

const Chat = () => {
    const { userData: user } = useContext(userDataContext);
    const { serverUrl } = useContext(authDataContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [userActivityStatus, setUserActivityStatus] = useState(new Map()); // Store user activity details
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [isTyping, setIsTyping] = useState(false);
    const [showChatView, setShowChatView] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Focused');
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [showChatOptions, setShowChatOptions] = useState(false);
    const [showDesktopSettings, setShowDesktopSettings] = useState(false);
    const [showDesktopChatOptions, setShowDesktopChatOptions] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const filters = ['Focused', 'Jobs', 'Unread', 'Drafts', 'InMail'];

    // Navigate to search page to find new users to chat with
    const startNewChat = () => {
        navigate('/search');
    };

    // Track user activity and send to server
    const updateUserActivity = () => {
        if (socket && user) {
            socket.emit('userActivity', user._id);
        }
    };

    // Get user activity status for LinkedIn-style display
    const getUserActivityDisplay = (userId) => {
        const activityData = userActivityStatus.get(userId);
        const isOnline = onlineUsers.has(userId);
        
        if (!activityData) {
            return isOnline ? 'Online' : 'Offline';
        }

        // If user is online and was active in last 5 minutes, show as "Online"
        if (isOnline && activityData.isActivelyOnline) {
            return 'Online';
        }

        // Otherwise show time ago
        const lastSeen = new Date(activityData.lastSeen || activityData.lastActivity);
        const now = new Date();
        const diffInMinutes = Math.floor((now - lastSeen) / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) {
            return 'Online';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else if (diffInDays < 7) {
            return `${diffInDays}d ago`;
        } else {
            return 'Last week';
        }
    };

    // Fetch user activity status for chat participants
    const fetchUserActivityStatus = async (userIds) => {
        try {
            const promises = userIds.map(async (userId) => {
                const response = await axios.get(`${serverUrl}/api/user/activity/${userId}`, {
                    withCredentials: true
                });
                return { userId, data: response.data };
            });
            
            const results = await Promise.all(promises);
            const newActivityMap = new Map(userActivityStatus);
            
            results.forEach(({ userId, data }) => {
                newActivityMap.set(userId, data);
            });
            
            setUserActivityStatus(newActivityMap);
        } catch (error) {
            console.error('Error fetching user activity status:', error);
        }
    };

    // Prevent body scroll when chat is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Handle mobile keyboard and viewport adjustments
    useEffect(() => {
        const handleResize = () => {
            // Scroll to bottom when keyboard appears/disappears
            if (messagesEndRef.current) {
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        };

        const handleKeyboardShow = () => {
            // Auto scroll to latest message when keyboard shows
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        };

        // Listen for viewport changes (keyboard show/hide)
        window.addEventListener('resize', handleResize);
        
        // Listen for input focus (keyboard show)
        const inputs = document.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            input.addEventListener('focus', handleKeyboardShow);
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            inputs.forEach(input => {
                input.removeEventListener('focus', handleKeyboardShow);
            });
        };
    }, [selectedChat, messages]);

    // Track user activity
    useEffect(() => {
        let activityTimer;
        
        const handleActivity = () => {
            updateUserActivity();
            // Update activity every 2 minutes while user is active
            clearTimeout(activityTimer);
            activityTimer = setTimeout(updateUserActivity, 2 * 60 * 1000);
        };

        // Add activity listeners
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        // Initial activity update
        handleActivity();

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });
            clearTimeout(activityTimer);
        };
    }, [socket, user]);

    // Socket connection
    useEffect(() => {
        if (user) {
            const newSocket = io(serverUrl);
            setSocket(newSocket);

            newSocket.emit('register', user._id);

            newSocket.on('initialOnlineUsers', (onlineUserIds) => {
                setOnlineUsers(new Set(onlineUserIds));
                console.log('Initial online users:', onlineUserIds);
            });

            newSocket.on('userOnline', (userId) => {
                setOnlineUsers(prev => new Set([...prev, userId]));
                console.log('User came online:', userId);
            });

            newSocket.on('userOffline', (userId) => {
                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    console.log('User went offline:', userId);
                    return newSet;
                });
            });

            newSocket.on('receiveMessage', (message) => {
                console.log('Received message via socket:', message);
                
                // Only add messages from other users (our own messages are added immediately)
                if (message.senderId !== user._id) {
                    setMessages(prev => {
                        // Check if message already exists to avoid duplicates
                        const messageExists = prev.some(msg => msg._id === message._id);
                        if (messageExists) return prev;
                        return [...prev, message];
                    });
                }
                
                // Update chat list to reflect new message
                fetchChats();
            });

            newSocket.on('userTyping', ({ userId, chatId }) => {
                if (selectedChat && chatId === selectedChat._id && userId !== user._id) {
                    setTypingUsers(prev => new Set([...prev, userId]));
                }
            });

            newSocket.on('userStoppedTyping', ({ userId, chatId }) => {
                if (selectedChat && chatId === selectedChat._id) {
                    setTypingUsers(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(userId);
                        return newSet;
                    });
                }
            });

            return () => {
                newSocket.disconnect();
            };
        }
    }, [user, serverUrl]);

    // Join/leave chat room when selectedChat changes
    useEffect(() => {
        if (socket && selectedChat) {
            socket.emit('joinChat', selectedChat._id);
            console.log('Joined chat room:', selectedChat._id);
            
            return () => {
                socket.emit('leaveChat', selectedChat._id);
                console.log('Left chat room:', selectedChat._id);
            };
        }
    }, [socket, selectedChat]);

    // Fetch chats
    const fetchChats = async () => {
        try {
            const response = await axios.get(`${serverUrl}/api/chat/`, {
                withCredentials: true
            });
            const chats = response.data || [];
            setChats(chats);
            
            // Get user IDs from chat participants to fetch their activity status
            const userIds = [];
            chats.forEach(chat => {
                if (chat.participants) {
                    chat.participants.forEach(participant => {
                        if (participant._id !== user._id) {
                            userIds.push(participant._id);
                        }
                    });
                }
            });
            
            // Fetch activity status for all chat participants
            if (userIds.length > 0) {
                fetchUserActivityStatus([...new Set(userIds)]); // Remove duplicates
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    };

    // Fetch messages for selected chat
    const fetchMessages = async (chatId) => {
        try {
            const response = await axios.get(`${serverUrl}/api/chat/${chatId}/messages`, {
                withCredentials: true
            });
            const responseData = response.data;
            
            // Handle different response formats
            if (Array.isArray(responseData)) {
                // Direct array response
                setMessages(responseData);
            } else if (responseData && Array.isArray(responseData.messages)) {
                // Object with messages array
                setMessages(responseData.messages);
            } else {
                console.warn('Messages data is not in expected format:', responseData);
                setMessages([]);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setMessages([]); // Reset to empty array on error
        }
    };

    useEffect(() => {
        if (user) {
            fetchChats();
        }
    }, [user]);

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat._id);
        }
    }, [selectedChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (newMessage.trim() && selectedChat && socket) {
            const tempMessage = {
                _id: `temp_${Date.now()}`,
                content: newMessage,
                senderId: user._id,
                createdAt: new Date().toISOString(),
                chatId: selectedChat._id
            };

            // Immediately add message to local state for instant UI update
            setMessages(prev => [...prev, tempMessage]);
            const messageContent = newMessage;
            setNewMessage('');

            try {
                const messageData = {
                    chatId: selectedChat._id,
                    content: messageContent,
                    senderId: user._id
                };

                const response = await axios.post(`${serverUrl}/api/chat/message`, messageData, {
                    withCredentials: true
                });

                // Replace temp message with actual message from server
                setMessages(prev => prev.map(msg => 
                    msg._id === tempMessage._id ? response.data : msg
                ));

                console.log('Message sent successfully:', response.data);
                
                // Stop typing indicator
                if (isTyping) {
                    socket.emit('stopTyping', { chatId: selectedChat._id, userId: user._id });
                    setIsTyping(false);
                }
                
                // Update chat list
                fetchChats();
            } catch (error) {
                console.error('Error sending message:', error);
                // Remove temp message on error
                setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
                setNewMessage(messageContent); // Restore message content
            }
        }
    };

    const handleTyping = () => {
        if (!isTyping && socket && selectedChat) {
            setIsTyping(true);
            socket.emit('typing', { chatId: selectedChat._id, userId: user._id });
        }

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (socket && selectedChat) {
                socket.emit('stopTyping', { chatId: selectedChat._id, userId: user._id });
                setIsTyping(false);
            }
        }, 1000);
    };

    const selectChat = (chat) => {
        setSelectedChat(chat);
        setShowChatView(true);
    };

    const goBackToChats = () => {
        setShowChatView(false);
        setSelectedChat(null);
    };

    const goBack = () => {
        navigate('/');
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMs = now - date;
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffInDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else if (diffInDays < 365) {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    const getLastMessage = (chat) => {
        if (!chat || !chat.lastMessage) return 'No messages yet';
        
        const isMe = chat.lastMessage.senderId === user._id;
        const content = chat.lastMessage.content;
        
        if (isMe) {
            return `You: ${content}`;
        }
        return content;
    };

    const getOtherParticipant = (chat) => {
        if (!chat || !chat.participants || !Array.isArray(chat.participants)) {
            return null;
        }
        return chat.participants.find(p => p._id !== user._id);
    };

    const filteredChats = chats.filter(chat => {
        if (!chat || !chat.participants) {
            return false;
        }
        const otherParticipant = getOtherParticipant(chat);
        if (!otherParticipant) {
            return false;
        }
        
        const matchesSearch = !searchQuery || 
            (otherParticipant?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             otherParticipant?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             getLastMessage(chat).toLowerCase().includes(searchQuery.toLowerCase()));
        
        // For now, show all chats in Focused (you can add more filter logic)
        return matchesSearch;
    });

    // Mobile Chat List View
    const renderChatList = () => (
        <div className="h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-3">
                    <button onClick={goBack} className="p-1">
                        <IoArrowBack className="w-5 h-5 text-gray-700" />
                    </button>
                    
                    <div className="flex-1 relative">
                        <div className="relative">
                            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search messages"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm border-none outline-none focus:bg-gray-200"
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                        className="p-1 relative"
                    >
                        <IoEllipsisVertical className="w-5 h-5 text-gray-700" />
                        
                        {/* Settings Dropdown */}
                        {showSettingsMenu && (
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48">
                                <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-100">
                                    Manage settings
                                </button>
                                <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50">
                                    Help
                                </button>
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white border-b border-gray-200 px-4 py-2">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                                activeFilter === filter
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {filter} {filter === 'Focused' && '▼'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                {filteredChats.map((chat) => {
                    const otherParticipant = getOtherParticipant(chat);
                    const isOnline = onlineUsers.has(otherParticipant?._id);
                    const activityData = userActivityStatus.get(otherParticipant?._id);
                    const isActivelyOnline = isOnline && activityData?.isActivelyOnline;
                    
                    return (
                        <div
                            key={chat._id}
                            onClick={() => selectChat(chat)}
                            className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                        >
                            <div className="relative">
                                <img
                                    src={otherParticipant?.profilePicture || dp}
                                    alt={`${otherParticipant?.firstName} ${otherParticipant?.lastName}`}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                {isActivelyOnline && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                            </div>
                            
                            <div className="ml-3 flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                        {otherParticipant?.firstName} {otherParticipant?.lastName}
                                    </h3>
                                    <span className="text-xs text-gray-500">
                                        {chat.lastMessage && formatTime(chat.lastMessage.createdAt)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 truncate mt-1">
                                    {getLastMessage(chat)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Floating Action Button */}
            <div className="absolute bottom-6 right-6">
                <button 
                    onClick={startNewChat}
                    className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                >
                    <FaPlus className="w-5 h-5 text-white" />
                </button>
            </div>
        </div>
    );

    // Mobile Individual Chat View
    const renderChatView = () => {
        const otherParticipant = getOtherParticipant(selectedChat);
        const isOnline = onlineUsers.has(otherParticipant?._id);

        return (
            <div className="h-screen bg-white flex flex-col relative">
                {/* Chat Header - Fixed at top */}
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={goBackToChats} className="p-1">
                                <IoArrowBack className="w-5 h-5 text-gray-700" />
                            </button>
                            
                            <div className="flex items-center gap-3">
                                <img
                                    src={otherParticipant?.profilePicture || dp}
                                    alt={`${otherParticipant?.firstName} ${otherParticipant?.lastName}`}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">
                                        {otherParticipant?.firstName} {otherParticipant?.lastName}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {getUserActivityDisplay(otherParticipant?._id)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button className="p-2">
                                <IoStarOutline className="w-5 h-5 text-gray-700" />
                            </button>
                            <button 
                                onClick={() => setShowChatOptions(!showChatOptions)}
                                className="p-2 relative"
                            >
                                <IoEllipsisVertical className="w-5 h-5 text-gray-700" />
                                
                                {/* Chat Options Dropdown */}
                                {showChatOptions && (
                                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48">
                                        <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-100">
                                            Mark as unread
                                        </button>
                                        <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-100">
                                            Archive
                                        </button>
                                        <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 text-red-600">
                                            Block
                                        </button>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile Section - Collapsible */}
                <div className="bg-white px-4 py-6 border-b border-gray-200 text-center flex-shrink-0">
                    <img
                        src={otherParticipant?.profilePicture || dp}
                        alt={`${otherParticipant?.firstName} ${otherParticipant?.lastName}`}
                        className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
                    />
                    <h2 className="text-lg font-semibold text-gray-900">
                        {otherParticipant?.firstName} {otherParticipant?.lastName}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Software Developer | GenAI | Cloud & AI Enthusiast | MERN | Next.js | JS | C++ |
                    </p>
                </div>

                {/* Messages - Scrollable area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-safe">
                    {Array.isArray(messages) && messages.map((message, index) => {
                        // Handle both senderId and sender._id (for compatibility after refresh)
                        const actualSenderId = message.senderId || message.sender?._id;
                        const isMe = actualSenderId === user._id;
                        const showDate = index === 0 || 
                            new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();

                        // Check if this is the first message from this sender in a sequence (LinkedIn-style)
                        const prevSenderId = messages[index - 1]?.senderId || messages[index - 1]?.sender?._id;
                        const isFirstFromSender = index === 0 || prevSenderId !== actualSenderId;

                        // Debug logging to see message structure
                        if (index === 0) {
                            console.log('Debug - First message structure:', {
                                messageId: message._id,
                                content: message.content,
                                isMe: isMe,
                                senderId: message.senderId || message.sender?._id,
                                currentUserId: user._id,
                                sender: message.sender,
                                senderProfileImage: message.sender?.profileImage,
                                senderProfilePicture: message.sender?.profilePicture,
                                otherParticipant: otherParticipant
                            });
                        }

                        return (
                            <div key={message._id}>
                                {showDate && (
                                    <div className="text-center text-xs text-gray-500 mb-4">
                                        {new Date(message.createdAt).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}
                                    </div>
                                )}
                                
                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                                    {/* Show other user's profile only on first message in sequence */}
                                    {!isMe && isFirstFromSender && (
                                        <img
                                            src={message.sender?.profileImage || message.sender?.profilePicture || otherParticipant?.profilePicture || dp}
                                            alt=""
                                            className="w-6 h-6 rounded-full mr-2 mt-1"
                                        />
                                    )}
                                    {/* Spacer for non-first messages to maintain alignment */}
                                    {!isMe && !isFirstFromSender && (
                                        <div className="w-6 mr-2"></div>
                                    )}
                                    
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                        isMe 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-100 text-gray-900'
                                    }`}>
                                        <p className="text-sm">{message.content}</p>
                                        <p className={`text-xs mt-1 ${
                                            isMe ? 'text-blue-100' : 'text-gray-500'
                                        }`}>
                                            {formatTime(message.createdAt)}
                                        </p>
                                    </div>
                                    
                                    {/* Spacer for non-first messages to maintain alignment */}
                                    {isMe && !isFirstFromSender && (
                                        <div className="w-6 ml-2"></div>
                                    )}
                                    {/* Show your profile only on first message in sequence */}
                                    {isMe && isFirstFromSender && (
                                        <img
                                            src={user?.profileImage || user?.profilePicture || dp}
                                            alt=""
                                            className="w-6 h-6 rounded-full ml-2 mt-1"
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Typing indicator */}
                    {typingUsers.size > 0 && (
                        <div className="flex justify-start mb-2">
                            <img
                                src={otherParticipant?.profilePicture || dp}
                                alt=""
                                className="w-6 h-6 rounded-full mr-2 mt-1"
                            />
                            <div className="bg-gray-100 px-4 py-2 rounded-lg">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input - Fixed at bottom with keyboard support */}
                <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0 sticky bottom-0 z-10 safe-area-inset-bottom">
                    <div className="flex items-center gap-3">
                        <button className="p-2 flex-shrink-0">
                            <FaPlus className="w-5 h-5 text-blue-600" />
                        </button>
                        
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Write a message..."
                                className="w-full px-4 py-2 pr-12 bg-gray-100 rounded-full text-sm border-none outline-none focus:bg-gray-200 focus:ring-2 focus:ring-blue-500"
                                style={{ fontSize: '16px' }} // Prevents zoom on iOS
                            />
                            {newMessage.trim() && (
                                <button 
                                    onClick={handleSendMessage}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-blue-600 rounded-full hover:bg-blue-700"
                                >
                                    <FaPaperPlane className="w-3 h-3 text-white" />
                                </button>
                            )}
                        </div>
                        
                        <button className="p-2 flex-shrink-0">
                            <FaMicrophone className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showSettingsMenu || showChatOptions || showDesktopSettings || showDesktopChatOptions) {
                setShowSettingsMenu(false);
                setShowChatOptions(false);
                setShowDesktopSettings(false);
                setShowDesktopChatOptions(false);
            }
        };

        if (showSettingsMenu || showChatOptions || showDesktopSettings || showDesktopChatOptions) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showSettingsMenu, showChatOptions, showDesktopSettings, showDesktopChatOptions]);

    if (!user) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Please log in</h2>
                    <p className="text-gray-600">You need to be logged in to access messages.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden">
            {/* Mobile View */}
            <div className="md:hidden">
                {showChatView ? renderChatView() : renderChatList()}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block h-screen">
                <Nav />
                <div className="flex h-full pt-16">
                    {/* Chat List */}
                    <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
                        {/* Desktop Header */}
                        <div className="bg-white border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-xl font-semibold">Messaging</h1>
                                <button 
                                    onClick={() => setShowDesktopSettings(!showDesktopSettings)}
                                    className="p-2 hover:bg-gray-100 rounded-full relative"
                                >
                                    <IoEllipsisVertical className="w-5 h-5 text-gray-700" />
                                    
                                    {/* Desktop Settings Dropdown */}
                                    {showDesktopSettings && (
                                        <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48">
                                            <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-100">
                                                Manage settings
                                            </button>
                                            <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50">
                                                Help
                                            </button>
                                        </div>
                                    )}
                                </button>
                            </div>
                            
                            <div className="relative">
                                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search messages"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm border-none outline-none focus:bg-gray-200"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {filteredChats.map((chat) => {
                                const otherParticipant = getOtherParticipant(chat);
                                const isOnline = onlineUsers.has(otherParticipant?._id);
                                const activityData = userActivityStatus.get(otherParticipant?._id);
                                const isActivelyOnline = isOnline && activityData?.isActivelyOnline;
                                
                                return (
                                    <div
                                        key={chat._id}
                                        onClick={() => selectChat(chat)}
                                        className={`flex items-center px-6 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                                            selectedChat?._id === chat._id ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="relative">
                                            <img
                                                src={otherParticipant?.profilePicture || dp}
                                                alt={`${otherParticipant?.firstName} ${otherParticipant?.lastName}`}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                            {isActivelyOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </div>
                                        
                                        <div className="ml-3 flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                                    {otherParticipant?.firstName} {otherParticipant?.lastName}
                                                </h3>
                                                <span className="text-xs text-gray-500">
                                                    {chat.lastMessage && formatTime(chat.lastMessage.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 truncate mt-1">
                                                {getLastMessage(chat)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Desktop Chat View */}
                    <div className="flex-1 flex flex-col">
                        {selectedChat ? (
                            <>
                                {/* Desktop Chat Header */}
                                <div className="bg-white border-b border-gray-200 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={getOtherParticipant(selectedChat)?.profilePicture || dp}
                                                alt=""
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {getOtherParticipant(selectedChat)?.firstName} {getOtherParticipant(selectedChat)?.lastName}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {getUserActivityDisplay(getOtherParticipant(selectedChat)?._id)}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => setShowDesktopChatOptions(!showDesktopChatOptions)}
                                            className="p-2 hover:bg-gray-100 rounded-full relative"
                                        >
                                            <IoEllipsisVertical className="w-5 h-5 text-gray-700" />
                                            
                                            {/* Desktop Chat Options Dropdown */}
                                            {showDesktopChatOptions && (
                                                <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48">
                                                    <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-100">
                                                        Mark as unread
                                                    </button>
                                                    <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-100">
                                                        Archive
                                                    </button>
                                                    <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 text-red-600">
                                                        Block
                                                    </button>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Desktop Messages */}
                                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                    {Array.isArray(messages) && messages.map((message, index) => {
                                        // Handle both senderId and sender._id (for compatibility after refresh)
                                        const actualSenderId = message.senderId || message.sender?._id;
                                        const isMe = actualSenderId === user._id;
                                        const showDate = index === 0 || 
                                            new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();

                                        // Check if this is the first message from this sender in a sequence (LinkedIn-style)
                                        const prevSenderId = messages[index - 1]?.senderId || messages[index - 1]?.sender?._id;
                                        const isFirstFromSender = index === 0 || prevSenderId !== actualSenderId;

                                        return (
                                            <div key={message._id}>
                                                {showDate && (
                                                    <div className="text-center text-xs text-gray-500 mb-4">
                                                        {new Date(message.createdAt).toLocaleDateString('en-US', { 
                                                            year: 'numeric', 
                                                            month: 'short', 
                                                            day: 'numeric' 
                                                        })}
                                                    </div>
                                                )}
                                                
                                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                                                    {/* Show other user's profile only on first message in sequence */}
                                                    {!isMe && isFirstFromSender && (
                                                        <img
                                                            src={getOtherParticipant(selectedChat)?.profilePicture || getOtherParticipant(selectedChat)?.profileImage || dp}
                                                            alt=""
                                                            className="w-8 h-8 rounded-full mr-3 mt-1"
                                                        />
                                                    )}
                                                    {/* Spacer for non-first messages to maintain alignment */}
                                                    {!isMe && !isFirstFromSender && (
                                                        <div className="w-8 mr-3"></div>
                                                    )}
                                                    
                                                    <div className={`max-w-md px-4 py-2 rounded-lg ${
                                                        isMe 
                                                            ? 'bg-blue-600 text-white' 
                                                            : 'bg-gray-100 text-gray-900'
                                                    }`}>
                                                        <p className="text-sm">{message.content}</p>
                                                        <p className={`text-xs mt-1 ${
                                                            isMe ? 'text-blue-100' : 'text-gray-500'
                                                        }`}>
                                                            {formatTime(message.createdAt)}
                                                        </p>
                                                    </div>
                                                    
                                                    {/* Spacer for non-first messages to maintain alignment */}
                                                    {isMe && !isFirstFromSender && (
                                                        <div className="w-8 ml-3"></div>
                                                    )}
                                                    {/* Show your profile only on first message in sequence */}
                                                    {isMe && isFirstFromSender && (
                                                        <img
                                                            src={user?.profileImage || user?.profilePicture || dp}
                                                            alt=""
                                                            className="w-8 h-8 rounded-full ml-3 mt-1"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Typing indicator */}
                                    {typingUsers.size > 0 && (
                                        <div className="flex justify-start mb-2">
                                            <img
                                                src={getOtherParticipant(selectedChat)?.profilePicture || dp}
                                                alt=""
                                                className="w-8 h-8 rounded-full mr-3 mt-1"
                                            />
                                            <div className="bg-gray-100 px-4 py-2 rounded-lg">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Desktop Message Input */}
                                <div className="bg-white border-t border-gray-200 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => {
                                                setNewMessage(e.target.value);
                                                handleTyping();
                                            }}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Write a message..."
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FaPaperPlane className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                                    <p className="text-gray-600">Choose from your existing conversations or start a new one</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <MobileBottomNav />
            </div>
        </div>
    );
};

export default Chat;