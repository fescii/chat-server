const sodium = require('libsodium-wrappers');
const mongoose = require('mongoose');
const { User, Conversation, Message } = require('../models');

class CryptoServer {
	async constructor() {
		this.initialized = false;
		await this.init();
	}
	
	async init() {
		if (!this.initialized) {
			await sodium.ready;
			this.initialized = true;
		}
	}
	
	async generateHex(length = 20) {
		await this.init();
		const randomBytes = sodium.randombytes_buf(length);
		// return first 20hex
		return sodium.to_hex(randomBytes).substring(0, length);
	}
	
	async validateKeyPair(publicKey, encryptedPrivateKey) {
		await this.init();
		try {
			const pubKeyBytes = sodium.from_base64(publicKey);
			return pubKeyBytes.length === sodium.crypto_box_PUBLICKEYBYTES;
		} catch (error) {
			return false;
		}
	}
	
	async createUser(userData) {
		await this.init();
		
		// Validate the public key format
		if (!await this.validateKeyPair(userData.publicKey)) {
			throw new Error('Invalid public key format');
		}
		
		const { hex, email, name, publicKey, encryptedPrivateKey, privateKeyNonce,
			passcodeSalt, recoveryPhraseEncrypted, recoveryPhraseNonce } = userData;
		
		const user = new User({
			hex,
			email,
			name,
			publicKey,
			encryptedPrivateKey,
			privateKeyNonce,
			passcodeSalt,
			recoveryPhraseEncrypted,
			recoveryPhraseNonce
		});
		
		return await user.save();
	}
	
	async createConversation(participants) {
		await this.init();
		
		const conversation = new Conversation({
			hex: await this.generateHex(),
			participants: participants.map(participant => ({
				kind: 'user',
				status: 'active',
				user: participant,
				online: false,
				group: null,
				role: 'member',
				joinedAt: new Date()
			})
		)});
		
		return await conversation.save();
	}
	
	async validateEncryptedMessage(encryptedData) {
		await this.init();
		try {
			const nonceBytes = sodium.from_base64(encryptedData.nonce);
			return nonceBytes.length === sodium.crypto_box_NONCEBYTES;
		} catch (error) {
			return false;
		}
	}
	
	async storeMessage(conversationHex, senderHex, encryptedData) {
		await this.init();
		
		// Validate the encrypted message format
		if (!await this.validateEncryptedMessage(encryptedData)) {
			throw new Error('Invalid encrypted message format');
		}
		
		const message = new Message({
			conversation: conversationHex,
			user: senderHex,
			encryptedData,
			createdAt: new Date()
		});
		
		const savedMessage = await message.save();
		
		// Update conversation
		await mongoose.model('Conversation').updateOne(
			{ hex: conversationHex },
			{
				$set: { last: savedMessage._id },
				$inc: { total: 1 }
			}
		);
		
		return savedMessage;
	}
	
	async getConversationParticipants(conversationHex) {
		const conversation = await mongoose.model('Conversation')
			.findOne({ hex: conversationHex })
			.populate('participants.user', 'hex publicKey');
		
		if (!conversation) {
			throw new Error('Conversation not found');
		}
		
		return conversation.participants;
	}
	
	async getUserPublicKey(userHex) {
		const user = await mongoose.model('User')
			.findOne({ hex: userHex })
			.select('publicKey');
		
		if (!user) {
			throw new Error('User not found');
		}
		
		return user["publicKey"];
	}
	
	// Utility method to verify hex strings
	async verifyHex(hex) {
		await this.init();
		try {
			return sodium.from_hex(hex).length > 0;
		} catch (error) {
			return false;
		}
	}
}

module.exports = CryptoServer;