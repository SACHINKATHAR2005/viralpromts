import { app } from './app';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';

const port = process.env.PORT as string || "6000";

// Connect to database and Redis
Promise.all([
    connectDB(),
    connectRedis()
]).then(() => {
    app.listen(port, () => {
        console.log(`✅ Server is running on port ${port}`);
        console.log(`🌐 API Health: http://localhost:${port}/api/health`);
        console.log(`📚 API Base: http://localhost:${port}/api`);
        console.log(`⚡ Redis Cache: Connected`);
    });
}).catch((error) => {
    console.error('❌ Failed to connect to services:', error);
    process.exit(1);
});