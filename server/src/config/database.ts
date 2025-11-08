import mongoose from "mongoose";

 export const connectDB = async ()=>{
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(` MongoDB connected: ${connection.connection.host}`);
        return connection;
    } catch (error) {
        console.error(" MongoDB connection error:", error);
        throw error;
    }
}