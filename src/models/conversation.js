const mongoose = require('mongoose');
/*
	@name Participant Schema
	@description This schema represents a participant in a conversation
	@type {mongoose.Schema}
	@field {String} type The type of the participant
	@field {String} status The status of the participant
	@field {String} user The user in the participant
	@field {Boolean} online The online status of the participant
	@field {String} group The group in the participant
	@field {String} role The role of the participant
	@field {Date} joinedAt The join date of the participant
*/
const participant = new mongoose.Schema({
	status: { type: String, enum: ['active', 'inactive', 'suspended', 'blocked'], default: 'active' },
	kind: { type: String, enum: ['user', 'group'], required: true },
	user: { type: String, ref: 'User' },
	online: { type: Boolean, default: false },
	group: { type: String, ref: 'Group', default: null },
	role: { type: String, enum: ['admin', 'moderator', 'member'], required: true , default: 'member' },
	joinedAt: { type: Date, default: Date.now },
	updateAt: { type: Date, default: Date.now }
});

// Middleware to update the `updatedAt` timestamp on modification
participant.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});

/*
	@name Conversation Schema
	@description This schema represents a conversation in a chat
	@type {mongoose.Schema}
	@field {String} hex The hex of the conversation
	@field {Array<Participant>} participants The participants in the conversation
	@field {String} last The last message in the conversation
	@field {Number} unread The number of unread messages in the conversation
	@field {Date} createdAt The creation date of the conversation
	@field {Date} updatedAt The last update date of the conversation
*/
const conversationSchema =  new mongoose.Schema({
	hex: { type: String, required: true, unique: true },
	participants: { type: [participant], required: true },
	kind: { type: String, enum: ['user', 'group'], required: true },
	last: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
	unread: { type: Number, default: 0 },
	total: { type: Number, default: 0 },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

// Middleware to update the `updatedAt` timestamp on modification
conversationSchema.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});


/*
	@name Messages virtual
	@description This virtual property returns all the messages in a conversation
	@type {mongoose.Virtual}
	@returns {Promise<Array<Message>>} The messages in the conversation
*/
conversationSchema.virtual('messages', {
	ref: 'Message',
	localField: 'hex',
	foreignField: 'conversation'
});

/*
	@name MessagesCount virtual
	@description This virtual property returns the number of messages in a conversation
	@type {mongoose.Virtual}
	@returns {Promise<Number>} The number of messages in the conversation
*/
conversationSchema.virtual('messagesCount', {
	ref: 'Message',
	localField: 'hex',
	foreignField: 'conversation',
	count: true
});


//export the model
module.exports = conversationSchema;