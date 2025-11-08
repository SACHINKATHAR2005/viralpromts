"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const User_1 = require("../models/User");
const register = async (req, res) => {
    try {
        const { username, email, password, role, bio, website } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({
                success: false,
                message: 'Username, email, and password are required',
                errors: ['Missing required fields']
            });
            return;
        }
        const existingUser = await User_1.User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });
        if (existingUser) {
            const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
            res.status(409).json({
                success: false,
                message: `User with this ${field} already exists`,
                errors: [`${field} already taken`]
            });
            return;
        }
        const userData = {
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: role || 'user',
            ...(bio && { bio: bio.trim() }),
            ...(website && { website: website.trim() })
        };
        const user = new User_1.User(userData);
        await user.save();
        const token = user.generateAuthToken();
        user.lastLoginAt = new Date();
        await user.save();
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        };
        res.cookie('authToken', token, cookieOptions);
        const userResponse = user.toJSON();
        delete userResponse.password;
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userResponse,
                token
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
            return;
        }
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            res.status(409).json({
                success: false,
                message: `User with this ${field} already exists`,
                errors: [`${field} already taken`]
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Registration failed']
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required',
                errors: ['Missing required fields']
            });
            return;
        }
        const user = await User_1.User.findOne({
            email: email.toLowerCase().trim()
        }).select('+password');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                errors: ['Authentication failed']
            });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({
                success: false,
                message: 'Account is deactivated',
                errors: ['Account access denied']
            });
            return;
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                errors: ['Authentication failed']
            });
            return;
        }
        const token = user.generateAuthToken();
        user.lastLoginAt = new Date();
        await user.save();
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        };
        res.cookie('authToken', token, cookieOptions);
        const userResponse = user.toJSON();
        delete userResponse.password;
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Login failed']
        });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated',
                errors: ['Authentication required']
            });
            return;
        }
        const user = await User_1.User.findById(req.authenticatedUser.userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
                errors: ['User does not exist']
            });
            return;
        }
        const userResponse = user.toJSON();
        delete userResponse.password;
        res.status(200).json({
            success: true,
            message: 'User profile retrieved successfully',
            data: {
                user: userResponse
            }
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Failed to retrieve profile']
        });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        if (!req.authenticatedUser) {
            res.status(401).json({
                success: false,
                message: 'Not authenticated',
                errors: ['Authentication required']
            });
            return;
        }
        const { bio, website, username } = req.body;
        const updateData = {};
        if (bio !== undefined)
            updateData.bio = bio.trim();
        if (website !== undefined)
            updateData.website = website.trim();
        if (username !== undefined)
            updateData.username = username.trim();
        if (username && username !== req.authenticatedUser.username) {
            const existingUser = await User_1.User.findOne({
                username: username.toLowerCase(),
                _id: { $ne: req.authenticatedUser.userId }
            });
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: 'Username already taken',
                    errors: ['Username not available']
                });
                return;
            }
        }
        const updatedUser = await User_1.User.findByIdAndUpdate(req.authenticatedUser.userId, updateData, { new: true, runValidators: true });
        if (!updatedUser) {
            res.status(404).json({
                success: false,
                message: 'User not found',
                errors: ['User does not exist']
            });
            return;
        }
        const userResponse = updatedUser.toJSON();
        delete userResponse.password;
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: userResponse
            }
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            errors: ['Profile update failed']
        });
    }
};
exports.updateProfile = updateProfile;
const logout = async (req, res) => {
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    });
    res.status(200).json({
        success: true,
        message: 'Logout successful',
        data: {
            message: 'Authentication cookie has been cleared'
        }
    });
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map