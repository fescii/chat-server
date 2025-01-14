const { Message } = require('../models');

class MessageController {
	constructor(ws, message, isBinary) {
		this.conversation = ws.conversation.hex;
		this.sender = message.sender;
		// get participants
		this.participants = ws.conversation.participants;
		this.isBinary = isBinary;
	}
	
	/*
		@name validate
		@description Validates a message
		@type {method}
		@param {object} message The message object
		@returns {boolean} The validation result
	*/
	validate(message) {
		// Validate the message
		return true;
	}
	
	/*
		@name save message
		@description Saves a message to the database
		@type {method}
		@async
		@param {object} message The message object
		@returns {Promise<object>} The saved message object
	*/
	async saveMessage(message) {
		// Validate the message
		if (!this.validate(message)) {
			throw new Error('Invalid message format');
		}
		
		// Save the message
		const savedMessage = await this.store(message);
		
		// Update the conversation
		await this.updateConversation(savedMessage);
		
		return savedMessage;
	}
}