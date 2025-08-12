import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import { io, userSocketMap } from '../index.js';

// Get all chats for a user
export const getUserChats = async (req, res) => {
    try {
        const userId = req.userId;
        
        const chats = await Chat.find({
            participants: { $in: [userId] }
        }).populate({
            path: 'participants',
            match: { _id: { $ne: userId } },
            select: 'firstName lastName userName profileImage isOnline lastSeen'
        }).populate('lastMessage')
        .sort({ updatedAt: -1 });

        const filteredChats = chats.filter(chat => chat.participants.length > 0);

        // Transform the data to match frontend expectations
        const transformedChats = filteredChats.map(chat => ({
            _id: chat._id,
            participant: chat.participants[0], // Get the other participant
            lastMessage: chat.lastMessage,
            lastMessageTime: chat.lastMessage?.createdAt || chat.updatedAt,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt
        }));

        res.status(200).json(transformedChats);
    } catch (error) {
        console.error('Error fetching user chats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Create or get existing chat
export const createOrGetChat = async (req, res) => {
    try {
        const { participantId } = req.body;
        const userId = req.userId;
        
        console.log('createOrGetChat called with:', { participantId, userId, body: req.body });
        
        if (!participantId) {
            console.log('Missing participantId');
            return res.status(400).json({
                success: false,
                message: 'participantId is required'
            });
        }

        if (!userId) {
            console.log('Missing userId from auth middleware');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (participantId === userId) {
            console.log('User trying to chat with themselves');
            return res.status(400).json({
                success: false,
                message: 'Cannot create chat with yourself'
            });
        }

        // Check if both users exist
        const [currentUser, otherUser] = await Promise.all([
            User.findById(userId),
            User.findById(participantId)
        ]);

        if (!currentUser) {
            console.log('Current user not found:', userId);
            return res.status(404).json({
                success: false,
                message: 'Current user not found'
            });
        }

        if (!otherUser) {
            console.log('Other user not found:', participantId);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('Both users found:', { currentUser: currentUser.userName, otherUser: otherUser.userName });

        // Check if chat already exists
        let chat = await Chat.findOne({
            participants: { $all: [userId, participantId] }
        }).populate({
            path: 'participants',
            select: 'firstName lastName userName profileImage isOnline lastSeen'
        }).populate('lastMessage');

        console.log('Existing chat found:', chat ? 'Yes' : 'No');

        if (!chat) {
            console.log('Creating new chat...');
            
            // Sort participants to ensure consistent ordering
            const sortedParticipants = [userId, participantId].sort();
            
            // Create new chat
            chat = new Chat({
                participants: sortedParticipants,
                lastMessageTime: new Date()
            });
            
            await chat.save();
            
            // Populate the participants after creation
            await chat.populate({
                path: 'participants',
                select: 'firstName lastName userName profileImage isOnline lastSeen'
            });
            
            console.log('Chat created with ID:', chat._id);
        }

        // Get the other participant (not the current user)
        let otherParticipant = chat.participants.find(p => p._id.toString() !== userId);
        
        if (!otherParticipant) {
            console.log('No other participant found, fetching directly...');
            otherParticipant = await User.findById(participantId).select('firstName lastName userName profileImage isOnline lastSeen');
            if (!otherParticipant) {
                throw new Error('Other participant not found');
            }
            console.log('Direct other user found:', otherParticipant.userName);
        }

        // Transform to match frontend expectations
        const transformedChat = {
            _id: chat._id,
            participant: otherParticipant,
            lastMessage: chat.lastMessage,
            lastMessageTime: chat.lastMessage?.createdAt || chat.updatedAt,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt
        };

        console.log('Transformed chat being returned:', {
            chatId: transformedChat._id,
            participantName: transformedChat.participant?.userName || 'unknown',
            participantId: transformedChat.participant?._id
        });

        res.status(200).json({
            success: true,
            chat: transformedChat
        });
    } catch (error) {
        console.error('Error creating/fetching chat:', {
            message: error.message,
            stack: error.stack,
            userId: req.userId,
            participantId: req.body?.participantId,
            errorName: error.name,
            errorCode: error.code
        });
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                name: error.name,
                code: error.code
            } : undefined
        });
    }
};

// Get messages for a specific chat
export const getChatMessages = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Verify user is participant in this chat
        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found or access denied' });
        }

        const messages = await Message.find({
            chat: chatId,
            isDeleted: false
        })
        .populate('sender', 'firstName lastName userName profileImage')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

        console.log('Messages found:', messages.length);
        if (messages.length > 0) {
            console.log('Sample message sender:', JSON.stringify({
                _id: messages[0].sender._id,
                firstName: messages[0].sender.firstName,
                lastName: messages[0].sender.lastName,
                userName: messages[0].sender.userName,
                profileImage: messages[0].sender.profileImage
            }, null, 2));
        }

        // Mark messages as read
        await Message.updateMany(
            {
                chat: chatId,
                sender: { $ne: userId },
                'readBy.user': { $ne: userId }
            },
            {
                $push: {
                    readBy: {
                        user: userId,
                        readAt: new Date()
                    }
                }
            }
        );

        res.status(200).json({
            messages: messages.reverse(), // Reverse to show oldest first
            pagination: {
                page,
                limit,
                hasMore: messages.length === limit
            }
        });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
    }
};

// Send a message
export const sendMessage = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId, content, messageType = 'text' } = req.body;

        if (!chatId || !content) {
            return res.status(400).json({ message: 'Chat ID and content are required' });
        }

        // Verify user is participant in this chat
        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found or access denied' });
        }

        // Create new message
        const message = new Message({
            chat: chatId,
            sender: userId,
            content: content.trim(),
            messageType,
            readBy: [{
                user: userId,
                readAt: new Date()
            }]
        });

        await message.save();

        // Update chat's last message
        chat.lastMessage = message._id;
        chat.lastMessageTime = new Date();
        await chat.save();

        // Populate message for response
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName userName profileImage');

        // Emit message to all participants via Socket.IO
        const otherParticipants = chat.participants.filter(p => p.toString() !== userId);
        
        otherParticipants.forEach(participantId => {
            const participantSocketId = userSocketMap.get(participantId.toString());
            if (participantSocketId) {
                io.to(participantSocketId).emit('newMessage', {
                    chatId: chatId,
                    message: populatedMessage
                });
            }
        });

        // Also emit to sender for confirmation
        const senderSocketId = userSocketMap.get(userId);
        if (senderSocketId) {
            io.to(senderSocketId).emit('messageSent', {
                chatId: chatId,
                message: populatedMessage
            });
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
};

// Delete a message
export const deleteMessage = async (req, res) => {
    try {
        const userId = req.userId;
        const { messageId } = req.params;

        const message = await Message.findOne({
            _id: messageId,
            sender: userId
        });

        if (!message) {
            return res.status(404).json({ message: 'Message not found or access denied' });
        }

        message.isDeleted = true;
        await message.save();

        // Emit message deletion to chat participants
        const chat = await Chat.findById(message.chat);
        chat.participants.forEach(participantId => {
            const participantSocketId = userSocketMap.get(participantId.toString());
            if (participantSocketId) {
                io.to(participantSocketId).emit('messageDeleted', {
                    chatId: message.chat,
                    messageId: messageId
                });
            }
        });

        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Failed to delete message', error: error.message });
    }
};
