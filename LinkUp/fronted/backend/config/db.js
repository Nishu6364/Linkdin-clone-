import mongoose from "mongoose";

const connectDB = async ()=>{
    try{
        console.log('🔗 Attempting to connect to MongoDB...');
        console.log('MongoDB URL:', process.env.MONGODB_URL ? 'Set (hidden)' : 'NOT SET');
        
        const conn = await mongoose.connect(process.env.MONGODB_URL);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('🔌 MongoDB disconnected');
        });
        
    }catch(error){
        console.error("❌ Database connection failed:");
        console.error('Error details:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}
export default connectDB