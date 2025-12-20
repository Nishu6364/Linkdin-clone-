import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Job from './models/job.model.js';

dotenv.config();

async function testJobApplication() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');
        
        // Find the first job to test with
        const job = await Job.findOne();
        
        if (!job) {
            console.log('No jobs found in database');
            return;
        }
        
        console.log('Found job:', job._id, job.title);
        
        // Test the application endpoint
        const response = await fetch(`http://localhost:4000/api/jobs/${job._id}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'token=test-token' // This will fail auth but we can see the error
            },
            body: JSON.stringify({
                fullName: 'Test User',
                email: 'test@example.com',
                phone: '1234567890',
                experience: '2',
                skills: 'JavaScript, React'
            })
        });
        
        const result = await response.text();
        console.log('Response status:', response.status);
        console.log('Response:', result);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testJobApplication();