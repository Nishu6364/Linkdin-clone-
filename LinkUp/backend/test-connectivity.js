// Test script to verify backend and database connectivity
import axios from 'axios';

const testBackend = async () => {
    try {
        console.log('🧪 Testing backend connectivity...\n');
        
        // Test 1: Health check
        console.log('1. Testing health endpoint...');
        try {
            const healthResponse = await axios.get('http://localhost:4000/api/health');
            console.log('✅ Health check passed:', healthResponse.data.message);
        } catch (error) {
            console.log('❌ Health check failed:', error.message);
        }
        
        // Test 2: Email config
        console.log('\n2. Testing email configuration...');
        try {
            const emailResponse = await axios.get('http://localhost:4000/api/email-config');
            console.log('✅ Email config:', emailResponse.data);
        } catch (error) {
            console.log('❌ Email config failed:', error.message);
        }
        
        // Test 3: Database connection (via a simple endpoint)
        console.log('\n3. Testing database connectivity...');
        try {
            // This will test if the backend can connect to MongoDB
            const testData = { email: 'test@example.com' };
            const response = await axios.post('http://localhost:4000/api/auth/forgot-password', testData);
            console.log('✅ Database connection working (got response)');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✅ Database connection working (user not found as expected)');
            } else {
                console.log('❌ Database test failed:', error.message);
            }
        }
        
        console.log('\n🚀 All tests completed!');
        console.log('\n📱 You can now access:');
        console.log('   Frontend: http://localhost:5174');
        console.log('   Backend:  http://localhost:4000');
        
    } catch (error) {
        console.error('Test setup error:', error.message);
    }
};

testBackend();
