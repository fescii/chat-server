// use env variables for production
require('dotenv').config();

// mongo db connection
module.exports = {
	uri: process.env.MONGO_URI,
	options: {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false
	}
}