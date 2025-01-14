const { validationUtils: { validate } } = require('../utils');

// Validator: function to validate message data before saving
const validateMessage = (values, conversation) => {
	// add conversation to values
	values.conversation = conversation;
	
	const schema = {
		conversation: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
		kind: {
			type: 'enum',
			enum: ['message', 'reply', 'forward'],
			required: true,
		},
		type: {
			type: 'enum',
			enum: ['all', 'audio'],
			required: true,
		},
		user: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
		recipientContent: {
			type: 'content',
			required: true,
			encrypted: 'string',
			nonce: 'string',
		},
		senderContent: {
			type: 'content',
			required: true,
			encrypted: 'string',
			nonce: 'string',
		},
		status: {
			type: 'enum',
			enum: ['sent', 'delivered', 'read'],
			required: true,
		},
		attachments: {
			type: 'array',
			required: false,
			maxLength: 10,
		},
		images: {
			type: 'array',
			required: false,
			maxLength: 10,
		},
		videos: {
			type: 'array',
			required: false,
			maxLength: 10,
		},
		reactions: {
			type: 'array',
			required: false,
			maxLength: 2,
		},
		audio: {
			type: 'string',
			required: false,
			maxLength: 500,
		},
	};
	
	return validate(values, schema);
}


// validate reply function to validate form fields
const validateReply = (values, conversation) => {
	// add conversation to values
	values.conversation = conversation;
	
	const schema = {
		conversation: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
		parent: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
		kind: {
			type: 'enum',
			enum: ['message', 'reply', 'forward'],
			required: true,
		},
		type: {
			type: 'enum',
			enum: ['all', 'audio'],
			required: true,
		},
		user: {
			type: 'string',
			required: true,
			maxLength: 32,
		},
		recipientContent: {
			type: 'content',
			required: true,
			encrypted: 'string',
			nonce: 'string',
		},
		senderContent: {
			type: 'content',
			required: true,
			encrypted: 'string',
			nonce: 'string',
		},
		status: {
			type: 'enum',
			enum: ['sent', 'delivered', 'read'],
			required: true,
		},
		attachments: {
			type: 'array',
			required: false,
			maxLength: 10,
		},
		images: {
			type: 'array',
			required: false,
			maxLength: 10,
		},
		videos: {
			type: 'array',
			required: false,
			maxLength: 10,
		},
		reactions: {
			type: 'array',
			required: false,
			maxLength: 2,
		},
		audio: {
			type: 'string',
			required: false,
			maxLength: 500,
		},
	};
	
	return validate(values, schema);
}

// validate sender content and recipient content
const validateContent = values => {
	const schema = {
		senderContent: {
			type: 'content',
			required: true,
			encrypted: 'string',
			nonce: 'string',
		},
		recipientContent: {
			type: 'content',
			required: true,
			encrypted: 'string',
			nonce: 'string',
		},
	};
	
	return validate(values, schema);
}

// export all validators
module.exports = {
	validateMessage, validateContent, validateReply
};