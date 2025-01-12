const {
	app, security, chat
} = require('./app');
const {
	mongo, redis
} = require('./data');

module.exports = {
	app, chat,
	security,
	mongo,
	redis
}