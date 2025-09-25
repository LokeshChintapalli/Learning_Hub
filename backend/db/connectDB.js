import mongoose from "mongoose";


const connectDB = async () => {
    try{
        

        const con=await mongoose.connect(process.env.MONGO_URL)
        console.log(`MongoDB connected`);
    }
    catch(error){
        console.log(`error connection to MongoDB : ${error}`)
       
    }
};
export default connectDB;