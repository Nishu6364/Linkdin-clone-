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
        const { otherUserId } = req.params;
        const userId = req.userId;

        let chat = await Chat.findOne({
            participants: { $all: [userId, otherUserId] }
        }).populate({
            path: 'participants',
            match: { _id: { $ne: userId } },
            select: 'name profileImage isOnline lastSeen'
        }).populate('lastMessage');

        if (!chat) {
            chat = new Chat({
                participants: [userId, otherUserId]
            });
            await chat.save();
            
            await chat.populate({
                path: 'participants',
                match: { _id: { $ne: userId } },
                select: 'name profileImage isOnline lastSeen'
            });
        }

        // Transform to match frontend expectations
        const transformedChat = {
            _id: chat._id,
            participant: chat.participants[0],
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
            .populate('sender', 'name profileImage');

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
