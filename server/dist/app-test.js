"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const database_1 = require("./config/database");
const models_1 = require("./models");
const encryption_1 = require("./utils/encryption");
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use(express_1.default.json());
app.get('/test-models', async (req, res) => {
    try {
        console.log('🔒 Testing encryption...');
        const encryptionWorks = (0, encryption_1.testEncryption)();
        const testUser = new models_1.User({
            username: 'testuser_' + Date.now(),
            email: `test${Date.now()}@example.com`,
            password: 'password123',
            bio: 'This is a test user for prompt testing'
        });
        await testUser.save();
        const testPrompt = new models_1.Prompt({
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
        const foundPrompt = await models_1.Prompt.findById(testPrompt._id).select('+promptText');
        const decryptedPrompt = foundPrompt?.getDecryptedPrompt();
        await foundPrompt?.incrementViews();
        await foundPrompt?.incrementCopies();
        foundPrompt?.updateRatings({
            effectiveness: 5,
            clarity: 4,
            creativity: 5,
            value: 4
        });
        await foundPrompt?.save();
        const publicPrompts = await models_1.Prompt.findPublic().limit(5);
        const trendingPrompts = await models_1.Prompt.findTrending(3);
        await models_1.User.findByIdAndDelete(testUser._id);
        await models_1.Prompt.findByIdAndDelete(testPrompt._id);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Model tests failed',
            error: error.message
        });
    }
});
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'ViralPrompt API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
const startServer = async () => {
    try {
        await (0, database_1.connectDB)();
        app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
            console.log(`🔗 Test Models: http://localhost:${port}/test-models`);
            console.log(`📊 Health Check: http://localhost:${port}/health`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=app-test.js.map