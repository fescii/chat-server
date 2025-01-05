module.exports = {
	app: {
		host: process.env.APP_HOST,
		port: process.env.APP_PORT,
		name: process.env.APP_NAME,
		env:  process.env.APP_ENV,
	},
	security: {
		salt: process.env.AUTH_SALT,
		jwtSecret: process.env.JWT_SECRET,
		jwtExpiry: process.env.JWT_EXPIRY,
		refreshExpiry: process.env.REFRESH_EXPIRY,
	},
}