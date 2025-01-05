const jwt = require("jsonwebtoken");
const { security: { jwtExpiry, jwtSecret, refreshExpiry} } = require('../configs')

/**
 * @function generateToken
 * @name generateToken
 * @description A utility function for generating a jwt token
 * @param {Object} userClaims - The user claims
 * @returns {String} - The jwt token
*/
const generateToken = async (userClaims) => {
	return jwt.sign({ user: userClaims }, jwtSecret, {
		expiresIn: jwtExpiry
	});
}

/**
 * @function validateToken
 * @name validateToken
 * @description A utility function for validating a jwt token
 * @param {String} token - The jwt token
 * @returns {Object} - The user object
*/
const validateToken = async (token) => {
	return  jwt.verify(token, jwtSecret, (err, decoded) => {
		if (err) {
			return { user: null, error: err}
		}
		return {user: decoded.user, error: null};
	});
}

module.exports = { generateToken, validateToken }