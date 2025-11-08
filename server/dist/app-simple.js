"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var dotenv = require("dotenv");
// Load environment variables
dotenv.config();
var app = express();
var PORT = process.env.PORT || 5000;
// Basic middleware
app.use(express.json());
// Simple test route
app.get('/health', function (req, res) {
    res.status(200).json({
        status: 'OK',
        message: 'TypeScript Node.js server is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// Start server
app.listen(PORT, function () {
    console.log("\uD83D\uDE80 Server running on port ".concat(PORT));
    console.log("\uD83C\uDF0D Environment: ".concat(process.env.NODE_ENV || 'development'));
    console.log("\uD83D\uDCCA Health check: http://localhost:".concat(PORT, "/health"));
});
exports.default = app;
