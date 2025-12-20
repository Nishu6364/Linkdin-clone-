import fetch from 'node-fetch';

// Test the job application endpoint with a valid request
async function testJobApplication() {
    try {
        // First, let's get a valid job ID from the database
        const jobsResponse = await fetch('http://localhost:4000/api/jobs');
        const jobsData = await jobsResponse.json();
        
        if (!jobsData.jobs || jobsData.jobs.length === 0) {
            console.log('No jobs found in the database');
            return;
        }
        
        const testJob = jobsData.jobs[0];
        console.log('Testing with job:', testJob._id, testJob.title);
        
        // Create FormData for the request (similar to what the frontend does)
        const formData = new FormData();
        formData.append('fullName', 'Test User');
        formData.append('email', 'test@example.com');
        formData.append('phone', '1234567890');
        formData.append('experience', '2');
        formData.append('skills', 'JavaScript, React');
        formData.append('coverLetter', 'Test cover letter');
        
        // Simulate the exact request the frontend makes
        const response = await fetch(`http://localhost:4000/api/jobs/${testJob._id}/applications`, {
            method: 'POST',
            body: formData,
            headers: {
                // Include authentication cookie
                'Cookie': 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODlhMmRmZjdkMjc3Y2U0YTQ4NWRjYjYiLCJpYXQiOjE3NjI2ODk0MzMsImV4cCI6MTc2MzI5NDIzM30.vIw0zBIvBB48SOJ9HuYe1CxA99ra85r_eiI1oftvgFQ'
            }
        });
        
        const result = await response.text();
        console.log('Response status:', response.status);
        console.log('Response:', result);
        
        if (!response.ok) {
            console.log('ERROR DETECTED!');
            console.log('Status:', response.status);
            console.log('Response:', result);
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testJobApplication();