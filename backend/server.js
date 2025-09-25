
import express from "express"
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./db/connectDB.js";

import userRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js";
import assistantRoutes from "./routes/assistant.js";
import docRoutes from "./routes/docRoutes.js";
import geminiTestRoutes from "./routes/geminiTest.js";
import learnEnglishRoutes from "./routes/learnEnglish.js";
import cors from "cors";
dotenv.config();
const PORT = process.env.PORT || 8080;

const app=express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/doc", docRoutes);
app.use("/api/gemini", geminiTestRoutes);
app.use("/api/learn-english", learnEnglishRoutes);




app.listen(PORT,()=>{
    connectDB();
    console.log(`Server running on port ${PORT}`);
});
