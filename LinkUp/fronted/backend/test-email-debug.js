import { sendResetPasswordEmail } from './config/email.js';
import dotenv from 'dotenv';

dotenv.config();

const testEmail = async () => {
    console.log('Testing email configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set (hidden)' : 'Not set');
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set (using default)');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Email configuration incomplete!');
        console.log('Required environment variables:');
        console.log('- EMAIL_USER: Your Gmail address');
        console.log('- EMAIL_PASS: Your Gmail app-specific password (16 characters)');
        process.exit(1);
    }
    
    try {
        // Test with a sample email (replace with your email for testing)
        const testEmailAddress = process.env.EMAIL_USER; // Send to yourself for testing
        const testToken = 'test-token-123';
        const testName = 'Test User';
        
        console.log('Sending test email to:', testEmailAddress);
        await sendResetPasswordEmail(testEmailAddress, testToken, testName);
        console.log('✅ Test email sent successfully!');
        
    } catch (error) {
        console.error('❌ Email test failed:', error.message);
        
        if (error.code === 'EAUTH') {
            console.log('\n🔧 Authentication failed. Common solutions:');
            console.log('1. Make sure you\'re using an App-Specific Password, not your regular Gmail password');
            console.log('2. Enable 2-Factor Authentication on your Gmail account');
            console.log('3. Generate a new App-Specific Password in Google Account Settings');
        }
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNECTION') {
            console.log('\n🔧 Connection failed. Check your internet connection.');
        }
        
        process.exit(1);
    }
};

testEmail();
