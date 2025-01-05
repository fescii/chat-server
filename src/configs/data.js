// mongo db connection
module.exports = {
	mongo: {
		uri: process.env.MONGO_URI,
		options: {
			autoIndex: true,
			autoCreate: false,
			maxPoolSize: 10,
			minPoolSize: 5,
		}
	},
	redis: {
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT,
		uri: process.env.REDIS_URI,
	}
}