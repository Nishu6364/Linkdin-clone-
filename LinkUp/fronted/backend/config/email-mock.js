// Temporary email service for testing without Gmail setup
import dotenv from 'dotenv';

dotenv.config();

export const sendWelcomeEmail = async (email, firstName) => {
    console.log('\n🎉 WELCOME EMAIL (would be sent to:', email, ')');
    console.log('Subject: Welcome to LinkUp - Registration Successful!');
    console.log(`Hi ${firstName}!`);
    console.log('Congratulations! Your registration was successful and you\'re now part of the LinkUp community.');
    console.log('✅ Welcome email simulation complete\n');
    
    // Simulate successful email sending
    return Promise.resolve();
};

export const sendResetPasswordEmail = async (email, resetToken, firstName) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    console.log('\n🔐 PASSWORD RESET EMAIL (would be sent to:', email, ')');
    console.log('Subject: Reset Your LinkUp Password');
    console.log(`Hi ${firstName}!`);
    console.log('Reset URL:', resetUrl);
    console.log('✅ Password reset email simulation complete\n');
    
    // Simulate successful email sending
    return Promise.resolve();
};

export default null;
