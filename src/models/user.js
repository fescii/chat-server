const mongoose = require('mongoose');
/*
	@name User Schema
	@description This schema represents a user in the application
	@type {mongoose.Schema}
	@field {String} hex The hex of the user
	@field {String} email The email of the user
	@field {String} avatar The avatar of the user
	@field {Boolean} verified The verification status of the user
	@field {String} status The status of the user
	@field {String} publicKey The public key of the user
	@field {String} encryptedPrivateKey The encrypted private key of the user
	@field {String} privateKeyNonce The nonce for private key encryption
	@field {String} passcodeSalt The salt for passcode-based key derivation
	@field {String} recoveryPhraseEncrypted The encrypted recovery phrase of the user
	@field {String} recoveryPhraseNonce The nonce for recovery phrase encryption
	@field {Date} createdAt The creation date of the user
	@field {Date} updatedAt The last update date of the user
*/
const userSchema = new mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
	hex: { type: String, required: true, unique: true },
	email: { type: String, required: true, unique: true },
	avatar: { type: String, default: 'default.png' },
	verified: { type: Boolean, default: false },
	status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
	// Base64 encoded public key
	publicKey: { type: String, required: true },
	// Base64 encoded ciphertext of a private key
	encryptedPrivateKey: { type: String, required: true,},
	// Base64 encoded nonce for private key encryption
	privateKeyNonce: { type: String, required: true },
	// Base64 encoded salt for passcode-based key derivation
	passcodeSalt: { type: String, required: true },
	// Optional: Base64 encoded ciphertext of encrypted recovery phrase
	recoveryPhraseEncrypted: { type: String, default: null },
	// Optional: Base64 encoded nonce for recovery phrase encryption
	recoveryPhraseNonce: { type: String, default: null },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
})

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