# ChatBloom Real-Time Chat Server

## Overview
ChatBloom is a real-time chat server designed to enable secure, scalable, and feature-rich communication. Built with **uWebSockets.js** and **MongoDB**, this server facilitates end-to-end encrypted messaging, real-time updates, and seamless integration with WebSocket technology.

## Features
- **Real-time messaging** with WebSockets
- **End-to-end encryption** using libsodium
- **User authentication** via JWT tokens
- **Scalable job processing** with BullMQ
- **Offline message storage** in MongoDB
- **Read receipts** and **online status tracking**
- Modular and extensible architecture

## Project Structure
```
chat-server/
├── configs/                # Configuration files
│   ├── data.js        # MongoDB connection configuration
│   ├── websocket.js       # WebSocket server configuration
│   ├── app.js      # Encryption-related configuration
│   └── environment.js     # Environment variables loader
├── data/                   # Database-related files
│   ├── seed/              # Data seeding scripts
│   ├── migrations/        # Database migrations
│   └── schemas/           # MongoDB schemas
├── auth/                   # Authentication modules
│   ├── authMiddleware.js  # Middleware for JWT validation
│   ├── jwtService.js      # Service to handle JWT operations
│   ├── encryptionService.js # Encryption and decryption logic
│   └── keyExchange.js     # Key exchange protocols
├── models/                 # MongoDB models
│   ├── user.js            # User model
│   ├── chat.js            # Chat metadata model
│   └── conversation.js         # Individual message model
├── chats/                  # Chat-related logic
│   ├── chatController.js  # Controller for chat APIs
│   ├── chatService.js     # Core chat business logic
│   ├── chatUtils.js       # Utility functions for chat operations
│   └── chatRoutes.js      # API routes for chat
├── queues/                 # Asynchronous job processing
│   ├── bullmq/            # BullMQ-specific files
│   │   ├── jobs/          # Job definitions
│   │   │   ├── messageJob.js  # Message handling job
│   │   │   └── notificationJob.js # Notification handling job
│   │   ├── processors/    # Job processors
│   │   │   ├── messageProcessor.js
│   │   │   └── notificationProcessor.js
│   └── broker/            # Message broker
│       └── brokerService.js
├── middlewares/            # Middleware functions
│   ├── errorHandler.js    # Global error handling middleware
│   ├── requestLogger.js   # Logs incoming requests
│   └── rateLimiter.js     # Rate-limiting middleware
├── services/               # Core services
│   ├── notificationService.js # Handles notifications
│   ├── onlineStatusService.js # Tracks online/offline status
│   ├── messageService.js  # Handles message-specific logic
│   └── websocketService.js # Manages WebSocket connections
├── utils/                  # Utility functions
│   ├── logger.js          # Logging utility
│   ├── validator.js       # Input validation
│   ├── responseHelper.js  # Standardized API responses
│   └── cryptoUtils.js     # Cryptographic helpers
├── public/                 # Public-facing assets
│   └── index.html         # Placeholder HTML file
├── tests/                  # Test files
│   ├── authTests/         # Tests for authentication
│   ├── chatTests/         # Tests for chat functionality
│   └── utilsTests/        # Tests for utilities
├── app.js                # Entry point for the server
├── package.json            # Dependencies and project metadata
├── README.md               # Project documentation
└── .env                    # Environment variables
```

## Prerequisites
- Node.js (v16+)
- MongoDB (v4.4+)
- Redis (for BullMQ)
- Nginx (for reverse proxy, optional)

## Setup Instructions

### Clone the Repository
```bash
git clone https://github.com/your-username/chatbloom-server.git
cd chatbloom-server
```

### Install Dependencies
```bash
npm install
```

### Configure Environment Variables
Create a `.env` file in the root directory and add the following:
```env
PORT=9000
MONGO_URI=mongodb://localhost:27017/chatbloom
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

### Run the Server
Start the server in development mode:
```bash
npm run dev
```

### Run Tests
Execute the test suite:
```bash
npm test
```

## Deployment
- Use Docker for containerization.
- Set up a reverse proxy using Nginx for WebSocket handling.
- Integrate with CI/CD pipelines for continuous deployment.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request for review.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


