const mongoose = require('mongoose');
/*
	@name User Schema
	@description This schema represents a user in the application
	@type {mongoose.Schema}
	@field {String} hex The hex of the user
	@field {String} avatar The avatar of the user
	@field {Boolean} verified The verification status of the user
	@field {String} status The status of the user
	@field {String} publicKey The public key of the user
	@field {String} encryptedPrivateKey The encrypted private key of the user
	@field {String} privateKeyNonce The nonce for private key encryption
	@field {String} passcodeSalt The salt for passcode-based key derivation
	@field {Date} createdAt The creation date of the user
	@field {Date} updatedAt The last update date of the user
*/
const userSchema = new mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
	hex: { type: String, required: true, unique: true },
	avatar: { type: String, default: 'default.png' },
	verified: { type: Boolean, default: false },
	name: { type: String, required: true },
	status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
	// Base64 encoded public key
	publicKey: { type: String, required: true },
	// Base64 encoded ciphertext of a private key
	encryptedPrivateKey: { type: String, required: true,},
	// Base64 encoded nonce for private key encryption
	privateKeyNonce: { type: String, required: true },
	passcodeSalt: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
})

// Middleware to update the `updatedAt` timestamp on modification
userSchema.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});

/*
	@name Conversations virtual
	@description This virtual property returns all the conversations of a user
	@type {mongoose.Virtual}
	@returns {Promise<Array<Conversation>>} The conversations of the user
*/
userSchema.virtual('conversations', {
	ref: 'Conversation',
	localField: 'hex',
	foreignField: 'participants.user'
});

/*
	@name Messages virtual
	@description This virtual property returns all the messages of a user
	@type {mongoose.Virtual}
	@returns {Promise<Array<Message>>} The messages of the user
*/
userSchema.virtual('messages', {
	ref: 'Message',
	localField: 'hex',
	foreignField: 'user',
	match: { conversation: { $eq: 'messages.conversation' } }
});


// Mongoose Model
module.exports = userSchema;