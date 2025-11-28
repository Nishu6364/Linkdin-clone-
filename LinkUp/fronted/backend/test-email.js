import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const testEmail = async () => {
    try {
        console.log('Testing email configuration...');
        console.log('EMAIL_USER:', process.env.EMAIL_USER);
        console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length || 0);
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Test the connection
        await transporter.verify();
        console.log('✅ Email configuration is working!');
        
        // Send a test email
        const testResult = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to yourself
            subject: 'LinkUp Email Test',
            html: `
                <h2>Email Test Successful!</h2>
                <p>Your LinkUp email configuration is working correctly.</p>
                <p>Test sent at: ${new Date().toLocaleString()}</p>
            `
        });
        
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', testResult.messageId);
        
    } catch (error) {
        console.error('❌ Email configuration error:');
        console.error(error.message);
        
        if (error.code === 'EAUTH') {
            console.log('\n🔧 Fix: You need to use a Google App Password, not your regular Gmail password');
            console.log('1. Enable 2-Factor Authentication on your Google Account');
            console.log('2. Generate an App Password for Mail');
            console.log('3. Use that 16-character password in EMAIL_PASS');
        }
    }
};

testEmail();
