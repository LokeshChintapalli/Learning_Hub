import express from "express"
import dotenv from "dotenv";

console.log("Starting server test...");

try {
    dotenv.config();
    console.log("✓ dotenv loaded");
    
    const app = express();
    console.log("✓ Express app created");
    
    // Test basic middleware
    app.use(express.json());
    console.log("✓ JSON middleware added");
    
    // Test basic route
    app.get('/test', (req, res) => {
        res.json({ message: 'Server is working!' });
    });
    console.log("✓ Test route added");
    
    const PORT = process.env.PORT || 4000;
    console.log(`Attempting to start server on port ${PORT}...`);
    
    app.listen(PORT, () => {
        console.log(`✓ Server running on port ${PORT}`);
    });
    
} catch (error) {
    console.error("❌ Error starting server:", error);
}
