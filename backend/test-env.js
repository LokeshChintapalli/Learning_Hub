import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import http from 'node:http';

console.log("🔍 Testing environment setup...");

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
console.log("Checking for .env file at:", envPath);

if (fs.existsSync(envPath)) {
    console.log("✅ .env file exists");
    
    // Load and check environment variables
    dotenv.config();
    
    console.log("Environment variables:");
    console.log("- PORT:", process.env.PORT || "not set (will use 4000)");
    console.log("- MONGO_URL:", process.env.MONGO_URL ? "set" : "not set");
    console.log("- GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "set" : "not set");
    console.log("- JWT_SECRET:", process.env.JWT_SECRET ? "set" : "not set");
    
} else {
    console.log("❌ .env file not found!");
    console.log("Please create a .env file in the backend directory with the following content:");
    console.log(`
# Gemini AI Configuration
GEMINI_API_KEY=your_actual_gemini_api_key

# MongoDB Configuration
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Server Configuration
PORT=4000

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_key
    `);
}

// Test basic server startup without database connection
console.log("\n🔍 Testing basic server startup...");

try {
    const app = express();
    
    app.get('/test', (req, res) => {
        res.json({ message: 'Server is working!' });
    });
    
    const PORT = process.env.PORT || 4000;
    const server = app.listen(PORT, () => {
        console.log(`✅ Basic server started successfully on port ${PORT}`);
        
        // Test the endpoint
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: '/test',
            method: 'GET'
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log('✅ Test endpoint response:', data);
                server.close(() => {
                    console.log('🔚 Test server closed');
                    process.exit(0);
                });
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Test request error:', error);
            server.close(() => process.exit(1));
        });
        
        req.end();
    });
    
    server.on('error', (error) => {
        console.error('❌ Server error:', error);
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} is already in use. Try a different port.`);
        }
        process.exit(1);
    });
    
} catch (error) {
    console.error('❌ Error starting basic server:', error);
    process.exit(1);
}
