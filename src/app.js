const { redisConfig } = require('../configs').storageConfig;
const { Worker } = require('bullmq');
const { actionQueue, activityQueue } = require('../bull');
const uWs = require('uWebSockets.js');
const path = require('path');
const dotenv = require('dotenv');
const { sendNotificationByCustomKey } = require('../controllers/push');
dotenv.config();

// Server configuration
const host = '0.0.0.0'
const port = process.env['PORT'] || 3001;

const credentials = {
	key_file_name: path.join(__dirname, '../ssl', 'zoanai_com.key'),
	cert_file_name: path.join(__dirname, '../ssl', 'zoanai_com_chain.crt'),
};

// Create the WebSocket server
const app = uWs.SSLApp(credentials).ws('/events', {
		compression: uWs.SHARED_COMPRESSOR,
		maxPayloadLength: 16 * 1024 * 1024,
		idleTimeout: 960,
		
		open: (ws, req) => {
			console.log('A WebSocket connected');
			ws.subscribe('/events');
		},
		
		message: async (ws, message, isBinary) => {
			console.log('A WebSocket message received');
		},
		
		drain: (ws) => {
			console.log('A WebSocket backpressure drained');
		},
		
		close: (ws, code, message) => {
			console.log('A WebSocket closed with code:', code, 'and message:', message);
		},
		
		error: (ws, error) => {
			console.error('A WebSocket error occurred:', error);
		}
	})
	
	// Listen to the port
	.listen(host, port, (listenSocket) => {
		if (listenSocket) {
			console.log(`Listening on port: ${port}`);
		} else {
			console.error(`Failed to listen to port ${port}`);
		}
	});

console.log('Socket worker process initialized');