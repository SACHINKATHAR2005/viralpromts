import request from 'supertest';
import { User } from '../models/User';
import { Prompt } from '../models/Prompt';
import { app } from '../app';

describe('Prompts API', () => {
    let authToken: string;
    let userId: string;
    let promptId: string;

    beforeEach(async () => {
        // Create and login user for authenticated tests
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });

        userId = (registerResponse.body.data.user as any)?._id;

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
    }); describe('POST /api/prompts', () => {
        it('should create a new prompt successfully', async () => {
            const promptData = {
                title: 'Test AI Prompt',
                description: 'This is a comprehensive test prompt for AI assistance',
                promptText: 'Write a detailed guide about testing Node.js APIs with Jest and Supertest',
                category: 'Code',
                proofType: 'text',
                tags: ['AI', 'Testing', 'Node.js'],
                privacy: 'public'
            };

            const response = await request(app)
                .post('/api/prompts')
                .set('Cookie', [`authToken=${authToken}`])
                .send(promptData);

            expect(response.status).toBe(201);

            expect(response.body).toMatchObject({
                success: true,
                message: 'Prompt created successfully',
                data: {
                    prompt: {
                        title: promptData.title,
                        description: promptData.description,
                        category: promptData.category,
                        tags: ['ai', 'testing', 'node.js'], // Tags are converted to lowercase by model
                        privacy: promptData.privacy,
                        creator: expect.any(Object)
                    }
                }
            });

            promptId = response.body.data.prompt._id;

            // Verify prompt was saved in database
            const prompt = await Prompt.findById(promptId);
            expect(prompt).toBeTruthy();
            expect(prompt?.title).toBe(promptData.title);
        });

        it('should not create prompt without authentication', async () => {
            const promptData = {
                title: 'Test Prompt',
                description: 'This is a test prompt description',
                promptText: 'This is a test prompt',
                category: 'Code',
                proofType: 'text'
            };

            const response = await request(app)
                .post('/api/prompts')
                .send(promptData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access token required');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/prompts')
                .set('Cookie', [`authToken=${authToken}`])
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation failed');
            expect(response.body.errors).toBeDefined();
        });

        it('should create private prompt', async () => {
            const promptData = {
                title: 'Private AI Prompt',
                description: 'This is a private prompt description',
                promptText: 'This is a private prompt content for personal use',
                category: 'Other',
                proofType: 'text',
                privacy: 'private'
            };

            const response = await request(app)
                .post('/api/prompts')
                .set('Cookie', [`authToken=${authToken}`])
                .send(promptData)
                .expect(201);

            expect(response.body.data.prompt.privacy).toBe('private');
        });

        it('should create paid prompt if monetization is unlocked', async () => {
            // First unlock monetization for the user
            await User.findByIdAndUpdate(userId, { monetizationUnlocked: true });

            const promptData = {
                title: 'Premium AI Prompt',
                description: 'This is a premium prompt for sale',
                promptText: 'This is a premium prompt content worth paying for',
                category: 'Marketing',
                proofType: 'text',
                isPaid: true,
                price: 9.99,
                privacy: 'public'
            };

            const response = await request(app)
                .post('/api/prompts')
                .set('Cookie', [`authToken=${authToken}`])
                .send(promptData)
                .expect(201);

            expect(response.body.data.prompt.isPaid).toBe(true);
            expect(response.body.data.prompt.price).toBe(9.99);
        });

        it('should reject paid prompt if monetization is not unlocked', async () => {
            const promptData = {
                title: 'Premium AI Prompt',
                description: 'This is a premium prompt for sale',
                promptText: 'This is a premium prompt content',
                category: 'Marketing',
                proofType: 'text',
                isPaid: true,
                price: 9.99
            };

            const response = await request(app)
                .post('/api/prompts')
                .set('Cookie', [`authToken=${authToken}`])
                .send(promptData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Monetization not unlocked');
        });
    });

    describe('GET /api/prompts', () => {
        beforeEach(async () => {
            // Create multiple test prompts
            const prompts = [
                {
                    title: 'Public Code Prompt',
                    description: 'Description for coding prompt',
                    promptText: 'Write clean JavaScript code',
                    category: 'Code',
                    tags: ['JavaScript'],
                    privacy: 'public',
                    creator: userId,
                    proofType: 'text'
                },
                {
                    title: 'Public Marketing Prompt',
                    description: 'Description for marketing prompt',
                    promptText: 'Create a marketing campaign',
                    category: 'Marketing',
                    tags: ['SEO', 'Social Media'],
                    privacy: 'public',
                    creator: userId,
                    proofType: 'text'
                },
                {
                    title: 'Private Design Prompt',
                    description: 'Description for private design prompt',
                    promptText: 'Design a modern website layout',
                    category: 'Art & Design',
                    privacy: 'private',
                    creator: userId,
                    proofType: 'text'
                }
            ];

            await Prompt.insertMany(prompts);
        });

        it('should get all public prompts without authentication', async () => {
            const response = await request(app)
                .get('/api/prompts')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.prompts).toHaveLength(2); // Only public prompts
            expect(response.body.data.prompts.every((p: any) => p.privacy === 'public')).toBe(true);
        });

        it('should get prompts with pagination', async () => {
            const response = await request(app)
                .get('/api/prompts?page=1&limit=1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.prompts).toHaveLength(1);
            expect(response.body.pagination).toMatchObject({
                currentPage: 1,
                totalPages: 2,
                itemsPerPage: 1
            });
        });

        it('should filter prompts by category', async () => {
            const response = await request(app)
                .get('/api/prompts?category=Code')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.prompts).toHaveLength(1);
            expect(response.body.data.prompts[0].category).toBe('Code');
        });

        it('should search prompts by query', async () => {
            const response = await request(app)
                .get('/api/prompts?search=JavaScript')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.prompts.length).toBeGreaterThan(0);
        });

        it('should sort prompts by different criteria', async () => {
            const response = await request(app)
                .get('/api/prompts?sortBy=createdAt&sortOrder=desc')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.prompts).toHaveLength(2);
        });
    });

    describe('GET /api/prompts/:id', () => {
        let publicPromptId: string;
        let privatePromptId: string;

        beforeEach(async () => {
            // Create test prompts
            const publicPrompt = await Prompt.create({
                title: 'Public Test Prompt',
                description: 'Public test description',
                promptText: 'Public test content for everyone',
                category: 'Code',
                privacy: 'public',
                creator: userId,
                proofType: 'text'
            });

            const privatePrompt = await Prompt.create({
                title: 'Private Test Prompt',
                description: 'Private test description',
                promptText: 'Private test content for owner only',
                category: 'Other',
                privacy: 'private',
                creator: userId,
                proofType: 'text'
            });

            publicPromptId = (publicPrompt as any)._id.toString();
            privatePromptId = (privatePrompt as any)._id.toString();
        });

        it('should get public prompt by ID', async () => {
            const response = await request(app)
                .get(`/api/prompts/${publicPromptId}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.prompt.title).toBe('Public Test Prompt');
            expect(response.body.data.prompt.privacy).toBe('public');
        });

        it('should get private prompt with authentication (owner)', async () => {
            const response = await request(app)
                .get(`/api/prompts/${privatePromptId}`)
                .set('Cookie', [`authToken=${authToken}`])
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.prompt.title).toBe('Private Test Prompt');
        });

        it('should not get private prompt without authentication', async () => {
            const response = await request(app)
                .get(`/api/prompts/${privatePromptId}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent prompt', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const response = await request(app)
                .get(`/api/prompts/${fakeId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });

        it('should increment view count on access', async () => {
            // Get initial view count
            const initialPrompt = await Prompt.findById(publicPromptId);
            const initialViews = (initialPrompt as any)?.stats?.views || 0;

            const response = await request(app)
                .get(`/api/prompts/${publicPromptId}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Check if view count increased
            const updatedPrompt = await Prompt.findById(publicPromptId);
            const newViews = (updatedPrompt as any)?.stats?.views || 0;
            expect(newViews).toBe(initialViews + 1);
        });
    });

    describe('GET /api/prompts/my', () => {
        beforeEach(async () => {
            // Create test prompts for the user
            await Prompt.insertMany([
                {
                    title: 'My Public Prompt',
                    description: 'My public prompt description',
                    promptText: 'My public prompt content',
                    category: 'Code',
                    privacy: 'public',
                    creator: userId,
                    proofType: 'text'
                },
                {
                    title: 'My Private Prompt',
                    description: 'My private prompt description',
                    promptText: 'My private prompt content',
                    category: 'Other',
                    privacy: 'private',
                    creator: userId,
                    proofType: 'text'
                }
            ]);
        });

        it('should get all user prompts with authentication', async () => {
            const response = await request(app)
                .get('/api/prompts/my')
                .set('Cookie', [`authToken=${authToken}`])
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.prompts).toHaveLength(2); // Both public and private
        });

        it('should not get user prompts without authentication', async () => {
            const response = await request(app)
                .get('/api/prompts/my')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/prompts/:id', () => {
        let testPromptId: string;
        let otherUserId: string;
        let otherUserToken: string;

        beforeEach(async () => {
            // Create test prompt
            const testPrompt = await Prompt.create({
                title: 'Original Title',
                description: 'Original description',
                promptText: 'Original content for testing updates',
                category: 'Code',
                privacy: 'public',
                creator: userId,
                proofType: 'text'
            });
            testPromptId = (testPrompt as any)._id.toString();

            // Create another user for non-owner tests
            const otherUserResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'otheruser',
                    email: 'other@example.com',
                    password: 'password123'
                });

            otherUserId = (otherUserResponse.body.data.user as any)?._id;

            const otherLoginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'other@example.com',
                    password: 'password123'
                });

            const cookieHeader = otherLoginResponse.headers['set-cookie'];
            const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
            const authCookie = cookies.find((cookie: string) => cookie.startsWith('authToken='));
            otherUserToken = authCookie ? authCookie.split(';')[0].split('=')[1] : '';
        });

        it('should update prompt by owner', async () => {
            const updateData = {
                title: 'Updated Title',
                description: 'Updated description'
            };

            const response = await request(app)
                .put(`/api/prompts/${testPromptId}`)
                .set('Cookie', [`authToken=${authToken}`])
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.prompt.title).toBe('Updated Title');
            expect(response.body.data.prompt.description).toBe('Updated description');
        });

        it('should not update prompt without authentication', async () => {
            const updateData = {
                title: 'Updated Title'
            };

            const response = await request(app)
                .put(`/api/prompts/${testPromptId}`)
                .send(updateData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should not update prompt by non-owner', async () => {
            const updateData = {
                title: 'Updated Title'
            };

            const response = await request(app)
                .put(`/api/prompts/${testPromptId}`)
                .set('Cookie', [`authToken=${otherUserToken}`])
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/prompts/:id', () => {
        let testPromptId: string;
        let otherUserToken: string;

        beforeEach(async () => {
            // Create test prompt
            const testPrompt = await Prompt.create({
                title: 'Prompt to Delete',
                description: 'This prompt will be deleted',
                promptText: 'Content to delete for testing purposes',
                category: 'Code',
                privacy: 'public',
                creator: userId,
                proofType: 'text'
            });
            testPromptId = (testPrompt as any)._id.toString();

            // Create another user for non-owner tests
            const otherUserResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'deleteuser',
                    email: 'delete@example.com',
                    password: 'password123'
                });

            const otherLoginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'delete@example.com',
                    password: 'password123'
                });

            const cookieHeader = otherLoginResponse.headers['set-cookie'];
            const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
            const authCookie = cookies.find((cookie: string) => cookie.startsWith('authToken='));
            otherUserToken = authCookie ? authCookie.split(';')[0].split('=')[1] : '';
        });

        it('should delete prompt by owner', async () => {
            const response = await request(app)
                .delete(`/api/prompts/${testPromptId}`)
                .set('Cookie', [`authToken=${authToken}`])
                .expect(200);

            expect(response.body.success).toBe(true);

            // Verify prompt was deleted
            const deletedPrompt = await Prompt.findById(testPromptId);
            expect(deletedPrompt).toBeNull();
        });

        it('should not delete prompt without authentication', async () => {
            const response = await request(app)
                .delete(`/api/prompts/${testPromptId}`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should not delete prompt by non-owner', async () => {
            const response = await request(app)
                .delete(`/api/prompts/${testPromptId}`)
                .set('Cookie', [`authToken=${otherUserToken}`])
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/prompts/:id/copy', () => {
        let sourcePromptId: string;

        beforeEach(async () => {
            // Create a source prompt to copy through the API to ensure proper encryption
            const createResponse = await request(app)
                .post('/api/prompts')
                .set('Cookie', [`authToken=${authToken}`])
                .send({
                    title: 'Source Prompt',
                    description: 'This is the original prompt to be copied',
                    promptText: 'Original prompt content for copying',
                    category: 'Code',
                    privacy: 'public',
                    proofType: 'text'
                });

            sourcePromptId = createResponse.body.data.prompt._id;
        });

        it('should copy a public prompt', async () => {
            const response = await request(app)
                .post(`/api/prompts/${sourcePromptId}/copy`)
                .set('Cookie', [`authToken=${authToken}`])
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('copied');
        });

        it('should not copy prompt without authentication', async () => {
            const response = await request(app)
                .post(`/api/prompts/${sourcePromptId}/copy`)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });
});
