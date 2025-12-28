import express from 'express';
import { signUp, login, logOut, forgotPassword, resetPassword } from '../controllers/auth.controllers.js';

const authRouter = express.Router();

authRouter.post('/signup', signUp);
authRouter.post('/login', login);
authRouter.get('/logout', logOut);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);



export default authRouter;
