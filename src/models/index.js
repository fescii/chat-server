// import all mongoose models here
const UserSchema = require('./user');
const SettingsSchema = require('./settings');
const ConversationSchema = require('./conversation');
const MessageSchema = require('./chat');
const mongoose = require("mongoose");

const { tokenUtils: { generateToken } } = require('../utils');

const User = mongoose.model('User', UserSchema);
const Settings = mongoose.model('Settings', SettingsSchema);
const Conversation = mongoose.model('Conversation', ConversationSchema);
const Message = mongoose.model('Message', MessageSchema);

// create initial two users:
const user1 = new User({
	hex: 'U0HAB65ABC3',
	email: 'user11@example.com',
	avatar: 'default.png',
	verified: true,
	status: 'active',
	name: 'Jane Doe',
	publicKey: 'sample key',
	encryptedPrivateKey: 'sample encrypted key',
	privateKeyNonce: 'sample nonce',
	recoveryPhraseEncrypted:  'sample encrypted recovery phrase',
	recoveryPhraseNonce: 'sample recovery phrase nonce'
});

const user2 = new User({
	hex: 'U0HAB65ABD3',
	email: 'user22@example.com',
	avatar: 'default.png',
	verified: true,
	status: 'active',
	name: 'John Doe',
	publicKey: 'sample key',
	encryptedPrivateKey:  'sample encrypted key',
	privateKeyNonce: 'sample nonce',
	recoveryPhraseEncrypted: 'sample encrypted recovery phrase',
	recoveryPhraseNonce: 'sample recovery phrase nonce'
});

// generate token
const token  = generateToken({
	hex: 'U0HAB65ABD3',
	email: 'user22@example.com',
	avatar: 'default.png',
	verified: true,
	status: 'active',
	name: 'John Doe',
	publicKey: 'sample key',
})

console.log(token)

// create initial two conversations:
const conversation1 = new Conversation({
	hex: 'C0HAB65ABC1',
	participants: [
		{
			kind: 'user',
			status: 'active',
			user: 'U0HAB65ABC3',
			online: false,
			group: null,
			role: 'member',
			joinedAt: new Date()
		},
		{
			kind: 'user',
			status: 'active',
			user: 'U0HAB65ABD3',
			online: false,
			group: null,
			role: 'member',
			joinedAt: new Date()
		}
	],
	kind: 'trusted',
	last: null,
	unread: 0,
	total: 0,
	createdAt: new Date(),
	updatedAt: new Date()
});

// sync the users and conversations
// user1.save().then(r => 'User 1 created').catch(e => console.error(e));
// user2.save().then(r => 'User 2 created').catch(e => console.error(e));
// conversation1.save().then(r => 'Conversation 1 created').catch(e => console.error(e));


/* Export all models */
module.exports = { User, Settings, Conversation, Message }