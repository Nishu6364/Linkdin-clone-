import Job from './models/job.model.js';
import User from './models/user.model.js';
import Application from './models/application.model.js';

console.log("Testing Application model import...");

// Test if we can create a simple Application object
try {
    const testApp = new Application({
        jobId: "507f1f77bcf86cd799439011",
        applicantId: "507f1f77bcf86cd799439012", 
        fullName: "Test User",
        email: "test@example.com",
        phone: "1234567890"
    });
    
    console.log("Application model creation successful:", testApp);
} catch (error) {
    console.error("Error creating Application:", error);
}