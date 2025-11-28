import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropChatIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');
        
        const chatCollection = mongoose.connection.collection('chats');
        
        // Get all indexes
        const indexes = await chatCollection.indexes();
        console.log('Current indexes:', indexes);
        
        // Drop the unique index on participants
        try {
            await chatCollection.dropIndex({ participants: 1 });
            console.log('Dropped participants index');
        } catch (error) {
            console.log('Error dropping participants index:', error.message);
        }
        
        // Drop the compound unique index
        try {
            await chatCollection.dropIndex({ 'participants.0': 1, 'participants.1': 1 });
            console.log('Dropped compound participants index');
        } catch (error) {
            console.log('Error dropping compound participants index:', error.message);
        }
        
        // Get indexes after dropping
        const newIndexes = await chatCollection.indexes();
        console.log('Indexes after dropping:', newIndexes);
        
        mongoose.disconnect();
        console.log('Done');
    } catch (error) {
        console.error('Error:', error);
    }
};

dropChatIndexes();
