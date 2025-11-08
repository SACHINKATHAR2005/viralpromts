import request from 'supertest';
import express from 'express';
import { User } from '../models/User';
import { app } from '../app';

describe('Authentication API', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body).toMatchObject({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        username: userData.username,
                        email: userData.email
                    }
                }
            });

            expect(response.body.data.user).not.toHaveProperty('password');

            // Check if user was created in database
            const user = await User.findOne({ email: userData.email });
            expect(user).toBeTruthy();
            expect((user as any)?.username).toBe(userData.username);
        });

        it('should not register user with existing email', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            // Create user first
            await request(app)
                .post('/api/auth/register')
                .send(userData);

            // Try to register again with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already exists');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should validate email format', async () => {
            const userData = {
                username: 'testuser',
                email: 'invalid-email',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should validate password length', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: '123' // Too short
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a test user before each login test
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        email: 'test@example.com',
                        username: 'testuser'
                    }
                }
            });

            expect(response.body.data.user).not.toHaveProperty('password');

            // Check if JWT cookie is set
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            if (cookies && Array.isArray(cookies)) {
                expect(cookies.some((cookie: string) => cookie.includes('authToken='))).toBe(true);
            } else if (typeof cookies === 'string') {
                expect(cookies.includes('authToken=')).toBe(true);
            }
        });

        it('should not login with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'password123'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid email or password');
        });

        it('should not login with invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid email or password');
        });

        it('should validate required fields for login', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('POST /api/auth/logout', () => {
        let authToken: string;

        beforeEach(async () => {
            // Register and login to get auth token
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            const cookieHeader = loginResponse.headers['set-cookie'];
            const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
            const authCookie = cookies.find((cookie: string) => cookie.startsWith('authToken='));
            authToken = authCookie ? authCookie.split(';')[0].split('=')[1] : '';
        });

        it('should logout successfully', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', [`authToken=${authToken}`])
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                message: 'Logout successful'
            });

            // Check if cookie is cleared
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            if (cookies && Array.isArray(cookies)) {
                expect(cookies.some((cookie: string) => cookie.includes('authToken=') && (cookie.includes('Max-Age=0') || cookie.includes('Expires=')))).toBe(true);
            } else if (typeof cookies === 'string') {
                expect(cookies.includes('authToken=') && (cookies.includes('Max-Age=0') || cookies.includes('Expires='))).toBe(true);
            }
        });

        it('should handle logout without token', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/auth/profile', () => {
        let authToken: string;
        let userId: string;

        beforeEach(async () => {
            // Register and login to get auth token
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });

            userId = registerResponse.body.data.user._id;

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            const cookieHeader = loginResponse.headers['set-cookie'];
            const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
            const authCookie = cookies.find((cookie: string) => cookie.startsWith('authToken='));
            authToken = authCookie ? authCookie.split(';')[0].split('=')[1] : '';
        });

        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Cookie', [`authToken=${authToken}`])
                .expect(200);

            expect(response.body).toMatchObject({
                success: true,
                data: {
                    user: {
                        _id: userId,
                        username: 'testuser',
                        email: 'test@example.com'
                    }
                }
            });

            expect(response.body.data.user).not.toHaveProperty('password');
        });

        it('should not get profile without token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Access token required');
        });

        it('should not get profile with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Cookie', ['authToken=invalidtoken'])
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});