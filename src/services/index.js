const ConversationService = require('./conversation');

// export all services
module.exports = (app, api) => {
	// Conversation service
	new ConversationService(app, api);
}