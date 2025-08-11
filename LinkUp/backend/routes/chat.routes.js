import express from 'express';
import { 
    getUserChats, 
    createOrGetChat, 
    getChatMessages, 
    sendMessage, 
    deleteMessage 
} from '../controllers/chat.controller.js';
import isAuth from '../middlewares/isAuth.js';

const chatRouter = express.Router();

// Get all chats for authenticated user
chatRouter.get('/', isAuth, getUserChats);

// Create or get existing chat with another user
chatRouter.post('/create', isAuth, createOrGetChat);

// Get messages for a specific chat
chatRouter.get('/:chatId/messages', isAuth, getChatMessages);

// Send a message
chatRouter.post('/message', isAuth, sendMessage);

// Delete a message
chatRouter.delete('/message/:messageId', isAuth, deleteMessage);

export default chatRouter;
