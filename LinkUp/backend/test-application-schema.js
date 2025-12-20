import mongoose from 'mongoose';
import Application from './models/application.model.js';
import dotenv from 'dotenv';

dotenv.config();

const testApplication = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        // Try to create a test application
        const testApp = new Application({
            job: new mongoose.Types.ObjectId('69107b78de7e6b55e47ddcaa'),
            applicant: new mongoose.Types.ObjectId('690d7a3a8dbc5c5384aa9b5b'),
            fullName: 'Test Application',
            email: 'test@test.com',
            phone: '1234567890'
        });

        await testApp.save();
        console.log('✅ Successfully created application:', testApp._id);

        // Clean up
        await Application.findByIdAndDelete(testApp._id);
        console.log('✅ Cleaned up test application');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating application:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    }
};

testApplication();