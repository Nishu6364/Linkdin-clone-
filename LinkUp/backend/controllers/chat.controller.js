// Import required models
import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import User from '../models/user.model.js';

// Import socket.io instance and user-socket mapping
import { io, userSocketMap } from '../index.js';

/* =========================================================
   GET ALL CHATS OF LOGGED-IN USER
========================================================= */
export const getUserChats = async (req, res) => {
    try {
        // Logged-in user ID (set by auth middleware)
        const userId = req.userId;
        
        // Find chats where user is a participant
        const chats = await Chat.find({
            participants: { $in: [userId] }
        })
        // Populate participant details
        .populate({
            path: 'participants',
            select: 'firstName lastName userName profileImage isOnline lastSeen'
        })
        // Populate last message
        .populate('lastMessage')
        // Latest chats first
        .sort({ updatedAt: -1 });

        // Convert profileImage -> profilePicture (frontend requirement)
        const transformedChats = chats.map(chat => {
            const chatObj = chat.toObject();
            return {
                ...chatObj,
                participants: chatObj.participants.map(participant => ({
                    ...participant,
                    profilePicture: participant.profileImage
                }))
            };
        });

        res.status(200).json(transformedChats);
    } catch (error) {
        console.error('Error fetching user chats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/* =========================================================
   CREATE NEW CHAT OR RETURN EXISTING CHAT
========================================================= */
export const createOrGetChat = async (req, res) => {
    try {
        const { participantId } = req.body;
        const userId = req.userId;

        // Validation checks
        if (!participantId) {
            return res.status(400).json({ success: false, message: 'participantId is required' });
        }

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Prevent self-chat
        if (participantId === userId) {
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

        if (!currentUser || !otherUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if chat already exists
        let chat = await Chat.findOne({
            participants: { $all: [userId, participantId] }
        })
        .populate({
            path: 'participants',
            select: 'firstName lastName userName profileImage isOnline lastSeen'
        })
        .populate('lastMessage');

        // If chat does not exist, create a new one
        if (!chat) {
            // Sort IDs to avoid duplicate chat entries
            const sortedParticipants = [userId, participantId].sort();

            chat = new Chat({
                participants: sortedParticipants,
                lastMessageTime: new Date()
            });

            await chat.save();

            // Populate participants after creation
            await chat.populate({
                path: 'participants',
                select: 'firstName lastName userName profileImage isOnline lastSeen'
            });
        }

        // Find the other participant (not logged-in user)
        let otherParticipant = chat.participants.find(
            p => p._id.toString() !== userId
        );

        // Prepare response structure for frontend
        const transformedChat = {
            _id: chat._id,
            participant: {
                ...otherParticipant.toObject(),
                profilePicture: otherParticipant.profileImage
            },
            lastMessage: chat.lastMessage,
            lastMessageTime: chat.lastMessage?.createdAt || chat.updatedAt,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt
        };

        res.status(200).json({
            success: true,
            chat: transformedChat
        });
    } catch (error) {
        console.error('Error creating/fetching chat:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

/* =========================================================
   GET MESSAGES OF A CHAT (PAGINATED)
========================================================= */
export const getChatMessages = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId } = req.params;

        // Pagination params
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Ensure user is part of the chat
        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found or access denied' });
        }

        // Fetch messages (latest first)
        const messages = await Message.find({
            chat: chatId,
            isDeleted: false
        })
        .populate('sender', 'firstName lastName userName profileImage')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

        // Mark messages as read
        await Message.updateMany(
            {
                chat: chatId,
                sender: { $ne: userId },
                'readBy.user': { $ne: userId }
            },
            {
                $push: {
                    readBy: { user: userId, readAt: new Date() }
                }
            }
        );

        res.status(200).json({
            messages: messages.reverse(), // Oldest first
            pagination: {
                page,
                limit,
                hasMore: messages.length === limit
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
};

/* =========================================================
   SEND MESSAGE
========================================================= */
export const sendMessage = async (req, res) => {
    try {
        const userId = req.userId;
        const { chatId, content, messageType = 'text' } = req.body;

        if (!chatId || !content) {
            return res.status(400).json({ message: 'Chat ID and content are required' });
        }

        // Verify user is chat participant
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
            readBy: [{ user: userId, readAt: new Date() }]
        });

        await message.save();

        // Update last message info in chat
        chat.lastMessage = message._id;
        chat.lastMessageTime = new Date();
        await chat.save();

        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName userName profileImage');

        // Emit real-time message via socket
        io.to(chatId).emit('receiveMessage', populatedMessage);

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Failed to send message' });
    }
};

/* =========================================================
   DELETE MESSAGE (SOFT DELETE)
========================================================= */
export const deleteMessage = async (req, res) => {
    try {
        const userId = req.userId;
        const { messageId } = req.params;

        // Only sender can delete their message
        const message = await Message.findOne({
            _id: messageId,
            sender: userId
        });

        if (!message) {
            return res.status(404).json({ message: 'Message not found or access denied' });
        }

        // Soft delete
        message.isDeleted = true;
        await message.save();

        // Notify all chat participants via socket
        const chat = await Chat.findById(message.chat);
        chat.participants.forEach(participantId => {
            const socketId = userSocketMap.get(participantId.toString());
            if (socketId) {
                io.to(socketId).emit('messageDeleted', {
                    chatId: message.chat,
                    messageId
                });
            }
        });

        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete message' });
    }
};
