import axios from 'axios';

const testChatCreate = async () => {
    try {
        console.log('Testing chat creation...');
        
        // Replace these with actual user IDs from your database
        const response = await axios.post('http://localhost:4000/api/chat/create', {
            participantId: '669a2dff7d277ce4a485dcb6' // Replace with a real user ID
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'token=your_jwt_token_here' // Replace with a real JWT token
            }
        });
        
        console.log('Success:', response.data);
    } catch (error) {
        console.log('Error response:', error.response?.data);
        console.log('Error status:', error.response?.status);
        console.log('Error message:', error.message);
    }
};

testChatCreate();
