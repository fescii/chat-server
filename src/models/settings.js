const mongoose = require('mongoose');

// System Settings Schema
const settingsSchema = new mongoose.Schema({
	// Ensure each setting is unique (e.g., "encryptionSalt", "jwtSecret")
	name: { type: String, required: true, unique: true },
	// Store sensitive data (like salts) as a Base64-encoded string
	value: { type: String, required: true },
	// Optional field to describe the setting
	description: { type: String, default: '' },
	updatedAt: { type: Date, default: Date.now },
});

// Middleware to update the `updatedAt` timestamp on modification
settingsSchema.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});

// Mongoose Model
module.exports = settingsSchema;
