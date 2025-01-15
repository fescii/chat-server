const { redis } = require('../../configs');
const { Queue } = require('bullmq');

// Initialize queues
module.exports = new Queue('socketQueue', { connection: redis });
