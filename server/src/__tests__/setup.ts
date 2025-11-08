import mongoose from 'mongoose';

// Setup before all tests - Connect to real database
beforeAll(async () => {
    try {
        // Set test environment 
        process.env.NODE_ENV = 'test';

        // Use a separate test database to avoid affecting production data
        const baseUri = "mongodb+srv://katharsachin95:katharsachin95@cluster0.p5aktie.mongodb.net/"
        const testDbUri = baseUri.endsWith('/') ? baseUri + 'viral-prompts-test' : baseUri + '/viral-prompts-test';

        // Disconnect any existing connections
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        // Connect to the test database
        await mongoose.connect(testDbUri, {
            bufferCommands: false,
        });

        console.log('✅ Test database connected successfully');
    } catch (error) {
        console.error('❌ Test database connection failed:', error);
        throw error;
    }
}, 60000);

// Cleanup after all tests
afterAll(async () => {
    try {
        // Clean up test data and close connection
        if (mongoose.connection.readyState !== 0) {
            // Drop all collections to clean up test data
            const collections = mongoose.connection.collections;
            for (const key in collections) {
                await collections[key].deleteMany({});
            }
            await mongoose.connection.close();
        }
        console.log('✅ Test cleanup completed');
    } catch (error) {
        console.error('❌ Test cleanup failed:', error);
    }
}, 60000);

// Clear data between tests
afterEach(async () => {
    try {
        // Clean up data between tests
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    } catch (error) {
        // Ignore cleanup errors between tests
        console.warn('Warning: Test cleanup between tests failed:', (error as Error).message);
    }
});