import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { connectDB } from './config/database';
import { User, Prompt } from './models';
import { testEncryption } from './utils/encryption';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Test route for models
app.get('/test-models', async (req: Request, res: Response) => {
    try {
        // Test 1: Encryption functionality
        console.log('🔒 Testing encryption...');
        const encryptionWorks = testEncryption();

        // Test 2: Create a test user
        const testUser = new User({
            username: 'testuser_' + Date.now(),
            email: `test${Date.now()}@example.com`,
            password: 'password123',
            bio: 'This is a test user for prompt testing'
        });
        await testUser.save();

        // Test 3: Create a test prompt with encryption
        const testPrompt = new Prompt({
            title: 'Test AI Prompt for Image Generation',
            description: 'This is a test prompt to verify our encryption system works correctly',
            promptText: 'Create a beautiful sunset landscape with mountains in the background, photorealistic style, 4K quality',
            proofImages: ['https://example.com/sunset.jpg'],
            proofType: 'image',
            category: 'Art & Design',
            tags: ['sunset', 'landscape', 'photorealistic'],
            creator: testUser._id,
            aiPlatform: ['Midjourney', 'DALL-E']
        });
        await testPrompt.save();

        // Test 4: Retrieve and decrypt prompt
        const foundPrompt = await Prompt.findById(testPrompt._id).select('+promptText');
        const decryptedPrompt = foundPrompt?.getDecryptedPrompt();

        // Test 5: Test prompt methods
        await foundPrompt?.incrementViews();
        await foundPrompt?.incrementCopies();

        // Test 6: Test rating update
        foundPrompt?.updateRatings({
            effectiveness: 5,
            clarity: 4,
            creativity: 5,
            value: 4
        });
        await foundPrompt?.save();

        // Test 7: Test static methods
        const publicPrompts = await Prompt.findPublic().limit(5);
        const trendingPrompts = await Prompt.findTrending(3);

        // Test 8: Clean up - delete test data
        await User.findByIdAndDelete(testUser._id);
        await Prompt.findByIdAndDelete(testPrompt._id);

        res.json({
            success: true,
            message: 'All model tests passed!',
            tests: {
                encryptionWorks,
                userCreated: !!testUser._id,
                promptCreated: !!testPrompt._id,
                promptEncrypted: testPrompt.promptText !== 'Create a beautiful sunset landscape with mountains in the background, photorealistic style, 4K quality',
                promptDecrypted: decryptedPrompt === 'Create a beautiful sunset landscape with mountains in the background, photorealistic style, 4K quality',
                viewsIncremented: foundPrompt?.stats.views === 1,
                copiesIncremented: foundPrompt?.stats.copies === 1,
                ratingsCalculated: (foundPrompt?.ratings.average || 0) > 0,
                publicPromptsQuery: publicPrompts.length >= 0,
                trendingPromptsQuery: trendingPrompts.length >= 0
            },
            promptStructure: {
                title: foundPrompt?.title,
                category: foundPrompt?.category,
                tags: foundPrompt?.tags,
                ratings: foundPrompt?.ratings,
                stats: foundPrompt?.stats,
                aiPlatform: foundPrompt?.aiPlatform
            }
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Model tests failed',
            error: error.message
        });
    }
});// Basic health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        message: 'ViralPrompt API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Start server
const startServer = async () => {
    try {
        await connectDB();

        app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
            console.log(`🔗 Test Models: http://localhost:${port}/test-models`);
            console.log(`📊 Health Check: http://localhost:${port}/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();