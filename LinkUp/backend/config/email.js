import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendWelcomeEmail = async (email, firstName) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to LinkUp - Registration Successful!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Welcome to LinkUp!</h1>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; font-size: 22px; margin-bottom: 15px;">Hi ${firstName}!</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            🎉 Congratulations! Your registration was successful and you're now part of the LinkUp community.
                        </p>
                        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            LinkUp is your professional networking platform where you can:
                        </p>
                        <ul style="color: #666; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                            <li>Connect with professionals in your field</li>
                            <li>Share your achievements and insights</li>
                            <li>Discover new opportunities</li>
                            <li>Build your professional network</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
                           style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                            Start Networking
                        </a>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                        <p style="color: #999; font-size: 14px; margin: 0;">
                            Thank you for joining LinkUp!<br>
                            If you have any questions, feel free to contact our support team.
                        </p>
                    </div>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent successfully to:', email);
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw error;
    }
};

export const sendResetPasswordEmail = async (email, resetToken, firstName) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Your LinkUp Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Reset Your Password</h1>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; font-size: 22px; margin-bottom: 15px;">Hi ${firstName}!</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            We received a request to reset your password for your LinkUp account.
                        </p>
                        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            Click the button below to reset your password. This link will expire in 1 hour for security reasons.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <div style="background-color: #fef3cd; border: 1px solid #fbbf24; border-radius: 5px; padding: 15px; margin: 20px 0;">
                        <p style="color: #92400e; font-size: 14px; margin: 0;">
                            <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                        <p style="color: #999; font-size: 14px; margin: 0;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <span style="color: #2563eb; word-break: break-all;">${resetUrl}</span>
                        </p>
                    </div>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Reset password email sent successfully to:', email);
    } catch (error) {
        console.error('Error sending reset password email:', error);
        throw error;
    }
};

export default transporter;
