const { Conversation} = require('../models');
const { sodium } = require('../encryption');
const { tokenUtils: { validateToken }} = require('../utils');
const { chat: { maxPins, perPage }} = require('../configs')

/*
	@name ConversationService
	@description This service handles all the operations related to conversations
	@type {class}
	@method {constructor} The class constructor
	@method {create} Creates a new conversation
*/
class ConversationService {
	constructor(app, api) {
		this.app = app;
		this.api = api;
		this.registerRoutes();
	}
	
	/*
		@name exists
		@description Checks if a conversation exists
		@type {method}
		@async
		@param { Array<String> } hexes of the participants: The participants in the conversation
		@returns {Promise<Boolean>} The conversation exists or not
	*/
	async exists(participants) {
		// where conversation contains both the hexes of the participants
		const conversation = await Conversation.findOne({
			'participants.hex': { $all: participants }
		}).exec();
		
		return !!conversation;
	}
	
	/**
	 * @name registerRoutes
	 * @description Registers all routes for the service dynamically
	 * @type {method}
	 */
	registerRoutes() {
		const routes = [
			{ method: 'post', url: `${this.api}/chat/create`, handler: this.create.bind(this) },
			{ method: 'get', url: `${this.api}/chat/all`, handler: this.all.bind(this) },
			{ method: 'get', url: `${this.api}/chat/requested`, handler: this.requested.bind(this) },
			{ method: 'get', url: `${this.api}/chat/trusted`, handler: this.trusted.bind(this) },
			{ method: 'get', url: `${this.api}/chat/unread`, handler: this.unread.bind(this) },
			{ method: 'post', url: `${this.api}/chat/chat`, handler: this.chat.bind(this) },
			{ method: 'get', url: `${this.api}/chat/pins`, handler: this.pins.bind(this) },
			{ method: 'post', url: `${this.api}/chat/:hex/pin`, handler: this.pin.bind(this) },
			{ method: 'post', url: `${this.api}/chat/:hex/unpin`, handler: this.unpin.bind(this) },
			{ method: 'get', url: `${this.api}/chat/stats`, handler: this.stats.bind(this) },
		];
		
		routes.forEach((route) => {
			this.registerRoute(route.method, route.url, route.handler);
		});
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
						res.writeStatus('400 Bad Request')
							.writeHeader('Content-Type', 'application/json')
							.end(JSON.stringify({ error: 'Invalid request', success: false }));
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
		// get token from a cookie
		const token = req.getHeader('cookie')
			?.split('; ')
			?.find(cookie => cookie.startsWith('x-access-token='))
			?.split('=')[1];
		if (!token) {
			res.writeStatus('401 Unauthorized')
				.writeHeader('Content-Type', 'application/json')
				.end(JSON.stringify({error: 'Missing or invalid Authorization header', success: false}));
			return;
		}
		
		try {
			const {
				user,
				error
			} = await validateToken(token);
			
			// if error or no user found
			if(error || !user) {
				res.writeStatus('401 Unauthorized')
					.writeHeader('Content-Type', 'application/json')
					.end(JSON.stringify({error: 'Invalid token', success: false}));
				return;
			}
			
			req.user = user; // Attach user to the request object
			next(); // Proceed to the route handler
		} catch (err) {
			console.error('JWT verification failed:', err);
			res.writeStatus('401 Unauthorized')
				.writeHeader('Content-Type', 'application/json')
				.end(JSON.stringify({error: 'Invalid token', success: false}));
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
	
	/*
		@name post create
		@description Creates a new conversation
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@returns {Promise<Conversation>} The created chat/conversation
	*/
	async create({ res, body }) {
		const { participants, kind } = body;
		if (!participants || participants.length < 2) {
			return this.jsonResponse(res, 400, { error: 'Invalid participants', success: false });
		}
		
		try {
			// check if the conversation already exists
			const exists = await this.exists([participants[0].hex, participants[1].hex]);
			
			if (exists) {
				return this.jsonResponse(res, 400, {error: 'Conversation already exists', success: false});
			}
			
			// create a new conversation
			const conversation = new Conversation({
				participants,
				kind: kind || 'request',
				hex: await sodium.generateHex(20)
			});
			
			await conversation.save();
			
			return this.jsonResponse(res, 201, {conversation, success: true});
		} catch (e) {
			console.error('Error creating conversation:', e);
			return this.jsonResponse(res, 500, {error: 'Error creating conversation', success: false});
		}
	}
	
	/*
		@name get all
		@description Fetches all conversations by user hex: in which a user is a participant in a paginated manner
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@returns {Promise<Array<Conversation>>} Paginated conversations by sorted by the last message
	*/
	async all({ res, req }) {
		const { user: { hex } } = req;
		const { page = 1 } = req.query;
		
		try {
			const conversations = await Conversation.find({
				'participants.hex': { $in: [hex] }
			}).sort({ updatedAt: -1 }).skip((page - 1) * perPage).limit(perPage).exec();
			
			return this.jsonResponse(res, 200, { conversations, success: true });
		} catch (e) {
			console.error('Error retrieving all conversations:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving conversations', success: false});
		}
	}
	
	/*
		@name get requested conversations
		@description Fetches all requested conversations by user hex: in which a user is a participant in a paginated manner
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@returns {Promise<Array<Conversation>>} Paginated requested conversations by sorted by the updatedAt
	*/
	async requested({ res, req }) {
		const { user: { hex } } = req;
		const { page = 1 } = req.query;
		
		try {
			const conversations = await Conversation.find({
				'participants.hex': { $in: [hex] },
				kind: 'request'
			}).sort({ updatedAt: -1 }).skip((page - 1) * perPage).limit(perPage).exec();
			
			return this.jsonResponse(res, 200, { conversations, success: true });
		} catch (e) {
			console.error('Error retrieving requested conversations:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving requested conversations', success: false});
		}
	}
	
	/*
		@name trusted
		@description Fetches all trusted conversations by user hex: in which a user is a participant in a paginated manner
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<Array<Conversation>>} Paginated trusted conversations by sorted by the updatedAt
	*/
	async trusted({ res, req }) {
		const { user: { hex } } = req;
		const { page = 1 } = req.query;
		
		try {
			const conversations = await Conversation.find({
				'participants.hex': { $in: [hex] },
				kind: 'trusted'
			}).sort({ updatedAt: -1 }).skip((page - 1) * perPage).limit(perPage).exec();
			
			return this.jsonResponse(res, 200, { conversations, success: true });
		} catch (e) {
			console.error('Error retrieving trusted conversations:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving trusted conversations', success: false});
		}
	}
	
	/*
		@name unread
		@description Fetches all unread conversations by user hex:
		in which a user is a participant in a paginated manner, that are trusted
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<Array<Conversation>>} Paginated unread conversations by sorted by the updatedAt
	*/
	async unread({ res, req }) {
		const { user: { hex } } = req;
		const { page = 1 } = req.query;
		
		try {
			const conversations = await Conversation.find({
				'participants.hex': { $in: [hex] },
				kind: 'trusted',
				unread: { $gt: 0 }
			}).sort({ updatedAt: -1 }).skip((page - 1) * perPage).limit(perPage).exec();
			
			return this.jsonResponse(res, 200, { conversations, success: true });
		} catch (e) {
			console.error('Error retrieving unread conversations:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving unread conversations', success: false});
		}
	}
	
	/*
		@name get chat
		@description Fetches a single conversation where both hex and user are participants
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@returns {Promise<Conversation>} The conversation
	*/
	async chat({ req, res, body }) {
		const { user: { hex } } = req;
		const { other } = body;
		
		if(!other || typeof other !== 'string') {
			return this.jsonResponse(res, 400, { error: 'Invalid user', success: false });
		}
		
		try {
			// fetch conversation where both current and other are both participants (both hexes are in the participant array)
			const conversation = await Conversation.findOne({
				'participants.hex': { $all: [hex, other] }
			}).exec();
			
			// if no such conversation exists
			if (!conversation) {
				return this.jsonResponse(res, 404, { error: 'Conversation not found', success: false });
			}
			
			return this.jsonResponse(res, 200, { conversation, success: true });
		} catch (e) {
			console.error('Error retrieving the conversation:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving the conversation', success: false});
		}
	}
	
	/*
		@name pins
		@description Fetches all pinned conversations for a given user
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<Array<Conversation>>} The pinned conversations: paginated
	*/
	async pins({ req, res }) {
		const { user: { hex } } = req;
		
		try {
			const conversations = await Conversation.find({
				'pins.user': { $in: [hex] }
			}).sort({ updatedAt: -1 }).exec();
			
			return this.jsonResponse(res, 200, { conversations, success: true });
		} catch (e) {
			console.error('Error retrieving pinned conversations:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving pinned conversations', success: false});
		}
	}
	
	/*
		@name pin
		@description Pins a conversation for a given user: check existence and pin: if pins by user are less than 5
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The pinned conversation
	*/
	async pin({ req, res, body }) {
		const { user: { hex } } = req;
		const { hex: conversationHex } = req.getParameter(0);
		
		try {
			// check if the conversation exists
			const conversation = await Conversation.findOne({ hex: conversationHex, participants: { $in: [hex] } }).exec();
			
			if (!conversation) {
				return this.jsonResponse(res, 404, { error: 'Conversation not found', success: false });
			}
			
			// check if the user has already pinned the conversation
			const pinned = conversation.pins.find(pin => pin.user === hex);
			
			if (pinned) {
				return this.jsonResponse(res, 400, { error: 'Conversation already pinned', success: false });
			}
			
			// check if the user has pinned less than 8 conversations
			if (conversation.pins.length >= maxPins) {
				return this.jsonResponse(res, 400, { error: 'Cannot pin more than 5 conversations', success: false });
			}
			
			// pin the conversation
			conversation.pins.push({ user: hex });
			await conversation.save();
			
			return this.jsonResponse(res, 200, { conversation, success: true });
		} catch (e) {
			console.error('Error pinning conversation:', e);
			return this.jsonResponse(res, 500, {error: 'Error pinning conversation', success: false});
		}
	}
	
	
	/*
		@name unpin
		@description Unpins a conversation for a given user: check existence and unpin
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The unpinned conversation
	*/
	async unpin({ req, res }) {
		const { user: { hex } } = req;
		const { hex: conversationHex } = req.getParameter(0);
		
		try {
			// check if the conversation exists
			const conversation = await Conversation.findOne({ hex: conversationHex, participants: { $in: [hex] } }).exec();
			
			if (!conversation) {
				return this.jsonResponse(res, 404, { error: 'Conversation not found', success: false });
			}
			
			// check if the user has already pinned the conversation
			const pinned = conversation.pins.find(pin => pin.user === hex);
			
			if (!pinned) {
				return this.jsonResponse(res, 400, { error: 'Conversation not pinned', success: false });
			}
			
			// unpin the conversation
			conversation.pins = conversation.pins.filter(pin => pin.user !== hex);
			await conversation.save();
			
			return this.jsonResponse(res, 200, { conversation, success: true });
		} catch (e) {
			console.error('Error unpinning conversation:', e);
			return this.jsonResponse(res, 500, {error: 'Error unpinning conversation', success: false});
		}
	}
	
	/*
		@name stats
		@description Get all statistics for all conversations for a given user
		@type {method}
		@async
		@param {object} res uWebSockets.js response object
		@param {object} req uWebSockets.js request object
		@returns {Promise<object>} The conversation statistics
	*/
	stats = async ({ req, res }) => {
		const { user: { hex } } = req;
		
		try {
			const total = await Conversation.countDocuments({ 'participants.hex': { $in: [hex] } }).exec();
			const unread = await Conversation.countDocuments({ 'participants.hex': { $in: [hex] }, unread: { $gt: 0 } }).exec();
			const requested = await Conversation.countDocuments({ 'participants.hex': { $in: [hex] }, kind: 'request', from: { $ne: hex } }).exec();
			
			return this.jsonResponse(res, 200, { total, unread, requested, success: true });
		} catch (e) {
			console.error('Error retrieving conversation statistics:', e);
			return this.jsonResponse(res, 500, {error: 'Error retrieving conversation statistics', success: false});
		}
	}
}


// export the service
module.exports = ConversationService;