const {
	app, security
} = require('./app');
const {
	mongo, redis
} = require('./data');

module.exports = {
	app,
	security,
	mongo,
	redis
}