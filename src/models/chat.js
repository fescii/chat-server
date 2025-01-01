const mongoose = require('mongoose');
/*
	@name Attachment Schema
	@description This schema represents an attachment in a message
	@type {mongoose.Schema}
	@field {String} name The name of the attachment
	@field {String} size The size of the attachment
	@field {String} type The type of the attachment
	@field {String} link The link to the attachment
*/
const attachment = new mongoose.Schema({
	name: { type: String, required: true },
	size: { type: String, required: true },
	type: { type: String, required: true },
	link: { type: String, required: true }
});

/*
	@name Reactions Schema
	@description This schema represents a reaction to a message
	@type {mongoose.Schema}
	@field {String} from The reaction from
	@field {String} to The reaction to
*/
const reactions = new mongoose.Schema({
	from: { type: String, required: true, enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry'] },
	to: { type: String, required: true, enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry'] },
})

/*
	@name Message Schema
	@description This schema represents a message in a chat
	@type {mongoose.Schema}
	@field {String} conversation the message belongs to
	@field {String} kind The kind of message
	@field {String} type The type of message
	@field {String} parent The parent message
	@field {String} user The user that sent the message
	@field {String} encryptedContent The encrypted content of the message
	@field {Date} timestamp The timestamp of the message
	@field {String} status The status of the message
	@field {Array<Attachment>} attachments The attachments of the message
	@field {Array<String>} images The images in the message
	@field {Array<String>} videos The videos in the message
	@field {Array<Reactions>} reactions The reactions to the message
	@field {String} audio The audio in the message
*/
const messageSchema = new mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
	conversation: { type: String, required: true, ref: 'Conversation' },
	kind: { type: String, enum: ['message', 'reply', 'forward'], default: 'message',},
	type: { type: String, enum: ['all', 'audio'], default: 'all' },
	parent: { type: String, ref: 'Message', default: null, },
	user: { type: String, ref: 'User', required: true },
	encryptedContent: { type: String, required: true },
	timestamp: { type: Date, default: Date.now },
	status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
	attachments: { type: [attachment], default: [] },
	images: { type: [String], default: [] },
	videos: { type: [String], default: [] },
	reactions: { type: [reactions], default: [] },
	audio: { type: String, default: null },
});

/*
	@name Replies virtual
	@description This virtual property returns all the replies to a message
	@type {mongoose.Virtual}
	@returns {Promise<Array<Message>>} The replies to the message
*/
messageSchema.virtual('replies', {
	ref: 'Message',
	localField: '_id',
	foreignField: 'parent'
});

/*
	@name RepliesCount virtual
	@description This virtual property returns the number of replies to a message
	@type {mongoose.Virtual}
	@returns {Promise<Number>} The number of replies to the message
*/
messageSchema.virtual('repliesCount', {
	ref: 'Message',
	localField: '_id',
	foreignField: 'parent',
	count: true
});

// Export Message model
module.exports = mongoose.model('Message', messageSchema);