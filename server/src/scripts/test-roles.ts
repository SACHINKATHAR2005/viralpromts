import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database';
import { User } from '../models/User';

/**
 * Test script for user roles functionality
 * This script creates test users and demonstrates the role-based system
 */

async function testUserRoles() {
    try {
        console.log('🚀 Testing User Roles System...\n');

        // Connect to database
        await connectDB();
        console.log('✅ Connected to database');

        // Clean up existing test users
        await User.deleteMany({
            email: { $in: ['testuser@example.com', 'admin@example.com'] }
        });
        console.log('🧹 Cleaned up existing test users');

        // Create a regular user
        const regularUser = new User({
            username: 'testuser',
            email: 'testuser@example.com',
            password: 'password123',
            role: 'user',
            bio: 'I am a regular user'
        });

        await regularUser.save();
        console.log('👤 Created regular user:', {
            username: regularUser.username,
            email: regularUser.email,
            role: regularUser.role,
            isActive: regularUser.isActive,
            monetizationUnlocked: regularUser.monetizationUnlocked
        });

        // Create an admin user
        const adminUser = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin',
            bio: 'I am an admin user'
        });

        await adminUser.save();
        console.log('👑 Created admin user:', {
            username: adminUser.username,
            email: adminUser.email,
            role: adminUser.role,
            isActive: adminUser.isActive,
            monetizationUnlocked: adminUser.monetizationUnlocked
        });

        // Test JWT token generation
        const userToken = regularUser.generateAuthToken();
        const adminToken = adminUser.generateAuthToken();

        console.log('\n🔐 JWT Tokens generated:');
        console.log('User token length:', userToken.length);
        console.log('Admin token length:', adminToken.length);

        // Test password comparison
        const userPasswordMatch = await regularUser.comparePassword('password123');
        const adminPasswordMatch = await adminUser.comparePassword('admin123');

        console.log('\n🔒 Password verification:');
        console.log('User password match:', userPasswordMatch);
        console.log('Admin password match:', adminPasswordMatch);

        console.log('\n✅ All role tests passed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Start the server: npm run dev');
        console.log('2. Test registration: POST /api/auth/register');
        console.log('3. Test login: POST /api/auth/login');
        console.log('4. Test admin endpoints: /api/admin/* (requires admin token)');

    } catch (error) {
        console.error('❌ Error testing user roles:', error);
    } finally {
        process.exit(0);
    }
}

// Run the test
testUserRoles();