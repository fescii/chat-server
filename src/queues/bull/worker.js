const { redis } = require('../../configs');
const { Worker } = require('bullmq');

class SocketWorker {
	/**
	 * Initializes the SocketWorker class.
	 * @param connections
	 * @param {Object} app - The uWebSocket app instance to publish events.
	 */
	constructor(connections, app) {
		this.app = app;
		this.connections = connections;
		this.worker = new Worker(
			'socketQueue',
			async (job) => {
				try {
					const data = job.data;
					
					// send the message to the desired user
					this.send(data);
				} catch (error) {
					console.error(`Failed to process job ${job.id}:`, error);
					throw error; // Ensure failure is tracked
				}
			},
			{ connection: redis }
		);
		
		// Set up event listeners
		this.worker.on('completed', (job) => {
			console.log(`Socket job ${job.id} completed`);
		});
		
		this.worker.on('failed', (job, err) => {
			console.error(`Socket job ${job.id} failed with error:`, err);
		});
		
		console.log('Socket worker process initialized');
	}
	
	/*
		@name send
		@description Send a message to all connected desired user
		@type {method}
		@param {object} message The message object
	*/
	send = (data) => {
		// Check if data has been received from a socket
		if (!data || !data.to) {
			console.warn('No data or recipient specified');
			return;
		}
		
		const [user1, user2] = data.to.map(user => this.connections.get(user));
		
		if (user1 && user2) {
			try {
				const message = JSON.stringify(data);
				user1.send(message);
				user2.send(message);
				console.log(`Message sent to users ${data.to}:`, data);
			} catch (error) {
				console.error(`Failed to send message to users ${data.to}:`, error);
			}
		} else {
			console.warn(`No active connection found for users ${data.to}`);
		}
	}
}

module.exports = SocketWorker;
