import genToken from "../config/token.js"
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendWelcomeEmail, sendResetPasswordEmail } from "../config/email.js"
export const signUp=async (req,res)=>{
    try {
        const {firstName,lastName,userName,email,password}=req.body
       let existEmail=await User.findOne({email})
       if(existEmail){
        return res.status(400).json({message:"email already exist !"})
       }
       let existUsername=await User.findOne({userName})
       if(existUsername){
        return res.status(400).json({message:"userName already exist !"})
       }
       if(password.length<8){
        return res.status(400).json({message:"password must be at least 8 characters"})
       }
      
       let hassedPassword=await bcrypt.hash(password,10)
      
       const user=await User.create({
        firstName,
        lastName,
        userName,
        email,
        password:hassedPassword
       })

       let token=await genToken(user._id)
       res.cookie("token",token,{
        httpOnly:true,
        maxAge:7*24*60*60*1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? undefined : "localhost"
       })

       // Send welcome email
       try {
           await sendWelcomeEmail(user.email, user.firstName);
       } catch (emailError) {
           console.error('Failed to send welcome email:', emailError);
           // Don't fail registration if email fails
       }

      return res.status(201).json(user)

    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"signup error"})
   
    }
}

export const login=async (req,res)=>{
    try {
        const {email,password}=req.body
        let user=await User.findOne({email})
        if(!user){
         return res.status(400).json({message:"user does not exist !"})
        }

       const isMatch=await bcrypt.compare(password,user.password)
       if(!isMatch){
        return res.status(400).json({message:"incorrect password"})
       }
   
        let token=await genToken(user._id)
        res.cookie("token",token,{
         httpOnly:true,
         maxAge:7*24*60*60*1000,
         sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
         secure: process.env.NODE_ENV === "production",
         domain: process.env.NODE_ENV === "production" ? undefined : "localhost"
        })
       return res.status(200).json(user)
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"login error"})
    }
}

export const logOut=async (req,res)=>{
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            secure: process.env.NODE_ENV === "production",
            domain: process.env.NODE_ENV === "production" ? undefined : "localhost"
        })
        return res.status(200).json({message:"log out successfully"})
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"logout error"})
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        console.log('🔧 FORGOT PASSWORD DEBUG:');
        console.log('- Request for email:', email);
        console.log('- NODE_ENV:', process.env.NODE_ENV || 'Not set');
        console.log('- EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'NOT SET');
        console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'NOT SET');
        console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
        
        if (!email) {
            console.log('❌ No email provided in request');
            return res.status(400).json({ message: "Email is required" });
        }

        // Check if environment variables are set
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Email configuration missing. EMAIL_USER or EMAIL_PASS not set');
            return res.status(500).json({ message: "Email service is not configured properly" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found with email:', email);
            return res.status(404).json({ message: "User not found with this email" });
        }

        console.log('User found, generating reset token for:', email);

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Save reset token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        console.log('Reset token saved, attempting to send email...');

        // Send reset email
        try {
            await sendResetPasswordEmail(user.email, resetToken, user.firstName);
            console.log('Reset email sent successfully to:', user.email);
            return res.status(200).json({ 
                message: "Password reset email sent successfully",
                email: user.email 
            });
        } catch (emailError) {
            console.error('Failed to send reset email:', emailError);
            console.error('Email error details:', {
                message: emailError.message,
                code: emailError.code,
                command: emailError.command
            });
            
            // Clear the reset token if email fails
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();
            
            return res.status(500).json({ 
                message: "Failed to send reset email. Please check email configuration.",
                error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
            });
        }

    } catch (error) {
        console.error('Server error in forgot password:', error);
        return res.status(500).json({ 
            message: "Server error in forgot password",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password and clear reset token
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error in reset password" });
    }
};