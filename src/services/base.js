const { tokenUtils: { validateToken }} = require('../utils');

class BaseService {
	constructor(app, api) {
		this.app = app;
		this.api = api;
	}
	
	/**
	 * @name registerRoutes
	 * @description Should be implemented by child classes to register their specific routes
	 * @type {method}
	 */
	registerRoutes() {
		throw new Error('registerRoutes must be implemented by child class');
	}
	
	/**
	 * @name registerRoute
	 * @description Registers a single route and applies the middleware
	 * @type {method}
	 * @param {string} method HTTP method
	 * @param {string} url Route URL
	 * @param {function} handler Route handler
	 */
	registerRoute(method, url, handler) {
		this.app[method](url, (res, req) => {
			let jsonString = '';
			res.onData((chunk, isLast) => {
				jsonString += Buffer.from(chunk).toString();
				if (isLast) {
					try {
						const body = jsonString ? JSON.parse(jsonString) : {};
						const enhancedReq = {
							...req,
							body,
							getHeader: (header) => req.getHeader(header.toLowerCase()),
						};
						
						// Call middleware before the handler
						this.middleware(enhancedReq, res, () => handler({ req: enhancedReq, res }));
					} catch (err) {
						console.error('Error parsing JSON or handling middleware:', err);
						this.jsonResponse(res, 400, { error: 'Invalid request', success: false });
					}
				}
			});
		});
	}
	
	/**
	 * @name middleware
	 * @description Middleware to decode JWT and attach user to the request
	 * @type {method}
	 * @param {object} req Enhanced request object
	 * @param {object} res Response object
	 * @param {function} next Callback to proceed to the next handler
	 */
	async middleware(req, res, next) {
		const token = req.getHeader('cookie')
			?.split('; ')
			?.find(cookie => cookie.startsWith('x-access-token='))
			?.split('=')[1];
		
		if (!token) {
			return this.jsonResponse(res, 401, {
				error: 'Missing or invalid Authorization header',
				success: false
			});
		}
		
		try {
			const { user, error } = await validateToken(token);
			
			if (error || !user) {
				return this.jsonResponse(res, 401, {
					error: 'Invalid token',
					success: false
				});
			}
			
			req.user = user;
			next();
		} catch (err) {
			console.error('JWT verification failed:', err);
			this.jsonResponse(res, 401, {
				error: 'Invalid token',
				success: false
			});
		}
	}
	
	/**
	 * @name jsonResponse
	 * @description Sends a JSON response
	 * @type {method}
	 * @param {object} res uWebSockets.js response object
	 * @param {number} status HTTP status code
	 * @param {object} data JSON data to send
	 */
	jsonResponse(res, status, data) {
		res.writeStatus(`${status} ${this.getStatusText(status)}`)
			.writeHeader('Content-Type', 'application/json')
			.end(JSON.stringify(data));
	}
	
	/**
	 * @name getStatusText
	 * @description Converts HTTP status codes to standard status texts
	 * @type {method}
	 * @param {number} status HTTP status code
	 * @returns {string} HTTP status text
	 */
	getStatusText(status) {
		const statuses = {
			200: 'OK',
			201: 'Created',
			209: 'Content',
			300: 'Multiple Choices',
			301: 'Moved Permanently',
			400: 'Bad Request',
			401: 'Unauthorized',
			404: 'Not Found',
			409: 'Conflict',
			500: 'Internal Server Error',
			501: 'Not Implemented',
			502: 'Bad Gateway',
		};
		return statuses[status] || 'Unknown';
	}
}
module.exports = BaseService;