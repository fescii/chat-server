const mongoose = require('mongoose');
const { Worker } = require('bullmq');
// const { actionQueue, activityQueue } = require('../bull');
const uWs = require('uWebSockets.js');
const path = require('path');
require('dotenv').config();

const { mongo, app: { host, port} } = require('./configs');
const { authorize, checkConversation } = require("./middlewares").authMiddleware;
const services = require('./services');

// Connect to the MongoDB database
mongoose.connect(mongo.uri, mongo.options).then(r => {
	console.log('Connected to MongoDB');
}).catch(e => {
	console.error('Failed to connect to MongoDB:', e);
});

const credentials = {
	key_file_name: path.join(__dirname, './ssl', 'key.pem'),
	cert_file_name: path.join(__dirname, './ssl', 'cert.pem')
};

// Create the WebSocket server
const app = uWs.SSLApp(credentials).ws('/events', {
	compression: uWs.SHARED_COMPRESSOR,
	maxPayloadLength: 16 * 1024 * 1024,
	idleTimeout: 960,
	
	upgrade: async (res, req, context) => {
		const cookies = req.getHeader('cookie');
		try {
			// Use the authorization middleware
			const user = await authorize(cookies);
			
			if (!user || res.done) {
				res.cork(() => {
					res.writeStatus('401 Unauthorized');
					res.end();
				});
			}
			
			// Pass user data to the WebSocket
			res.upgrade(
				{ ...user }, // Pass the user data
				req.getHeader('sec-websocket-key'),
				req.getHeader('sec-websocket-protocol'),
				req.getHeader('sec-websocket-extensions'),
				context
			);
		} catch (error) {
			console.error('Upgrade error:', error);
			res.cork(() => {
				res.writeStatus('500 Internal Server Error');
				res.end();
			});
		}
	},
	
	open: (ws, req) => {
		console.log('A WebSocket connected');
		ws.subscribe('/events');
	},
		
	message: async (ws, message, isBinary) => {
		console.log('A WebSocket message received', message.toString());
	},
		
	drain: (ws) => {
		console.log('A WebSocket backpressure drained');
	},
		
	close: (ws, code, message) => {
		console.log('A WebSocket closed with code:', code, 'and message:', message);
	},
	
	// error: (ws, error) => {
	// 	console.error('A WebSocket error occurred:', error);
	// 	}
	})
	
	// Listen to the port
	.listen(host, port, (listenSocket) => {
		if (listenSocket) {
			console.log(`Listening on port: ${port}`);
		} else {
			console.error(`Failed to listen to port ${port}`);
		}
	});

	// Register all the servers
	services(app, '/api/v1');

	// WebSocket for specific conversations
	app.ws('/chat/:hex', {
		compression: uWs.SHARED_COMPRESSOR,
		maxPayloadLength: 16 * 1024 * 1024,
		idleTimeout: 960,
		
		upgrade: async (res, req, context) => {
			// Capture all required data synchronously
			const headers = {
				cookies: req.getHeader('cookie'),
				secWebSocketKey: req.getHeader('sec-websocket-key'),
				secWebSocketProtocol: req.getHeader('sec-websocket-protocol'),
				secWebSocketExtensions: req.getHeader('sec-websocket-extensions')
			};
			
			// Handle aborted requests
			res.onAborted(() => {
				res.done = true;
			});
			
			try {
				// console.log('Conversation handler reached!')
				// Use the authorization middleware
				const user = await authorize(headers.cookies);
				
				if (!user || res.done) {
					res.cork(() => {
						res.writeStatus('401 Unauthorized');
						res.end();
					});
					return;
				}
				
				const hex = req.getParameter(0); // Get the conversationId from the URL
				console.log('Hex is:', hex)
				const conversation = await checkConversation({ user: user.hex, hex: hex });
				
				// console.log('Conversation is fetched:', conversation);
				if (!conversation || res.done) {
					res.cork(() => {
						res.writeStatus('404 Not Found');
						res.end();
					});
					return;
				}
				
				res.upgrade(
					{ user: user, conversation: { hex: hex, participants: conversation.participants } },
					headers.secWebSocketKey,
					headers.secWebSocketProtocol,
					headers.secWebSocketExtensions,
					context
				);
			} catch (error) {
				console.error('Upgrade error:', error);
				res.cork(() => {
					res.writeStatus('500 Internal Server Error');
					res.end();
				});
			}
		},
		
		open: (ws) => {
			try {
				const { hex, participants } = ws.conversation;
				console.log(`WebSocket connected for conversation: ${hex}`);
				// console.log('Participants:', participants);
				ws.subscribe(`/chat/${hex}`);
			} catch (error) {
				console.error('Open handler error:', error);
			}
		},
		
		message: (ws, message, isBinary) => {
			try {
				const { hex } = ws.conversation;
				// convert a message from ArrayBuffer to string
				message = Buffer.from(message).toString();
				console.log(`Message for conversation ${hex}:`, message);
				ws.publish(`/chat/${hex}`, message, isBinary);
			} catch (error) {
				console.error('Message handling error:', error);
			}
		},
		
		close: (ws, code, message) => {
			try {
				const { hex } = ws.conversation;
				console.log(`WebSocket closed for conversation ${hex}:`, code, message.toString());
			} catch (error) {
				console.error('Close handler error:', error);
			}
		},
	});