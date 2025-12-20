import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixApplicationIndexes = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('applications');

        // List existing indexes
        console.log('📋 Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach(index => {
            console.log(`  - ${index.name}:`, index.key);
        });

        // Drop the problematic index if it exists
        try {
            await collection.dropIndex('jobId_1_applicantId_1');
            console.log('✅ Dropped old index: jobId_1_applicantId_1');
        } catch (error) {
            console.log('ℹ️  Old index jobId_1_applicantId_1 not found (this is OK)');
        }

        // Create the correct index
        await collection.createIndex({ job: 1, applicant: 1 }, { unique: true });
        console.log('✅ Created new index: job_1_applicant_1');

        // Create other indexes
        await collection.createIndex({ job: 1, status: 1 });
        console.log('✅ Created index: job_1_status_1');

        await collection.createIndex({ applicant: 1 });
        console.log('✅ Created index: applicant_1');

        await collection.createIndex({ status: 1 });
        console.log('✅ Created index: status_1');

        // List indexes again
        console.log('📋 Updated indexes:');
        const updatedIndexes = await collection.indexes();
        updatedIndexes.forEach(index => {
            console.log(`  - ${index.name}:`, index.key);
        });

        console.log('✅ Index migration completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error fixing indexes:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    }
};

fixApplicationIndexes();