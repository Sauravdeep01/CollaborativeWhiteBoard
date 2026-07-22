import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected successfully");
    } catch (error) {
        console.error("Error in connecting");
        process.exit(1);
    }
};

export default connectDB;
