// load environment variables from .env file
require('dotenv').config()

const Queue = require('./server/core/queue.js');
const QueueManager = require('./server/core/queue-manager.js');
const VotesManager = require('./server/core/votes-manager.js');
const Chat = require('./server/core/chat.js');
const Logger = require('./server/core/logger.js');
const ClientManager = require('./server/core/client-manager.js');

const SERVER_PORT = 4000;
const io = require('./server/core/socketio-express-initializer')({
	port: SERVER_PORT
});
Logger.info('Server started successfully on port', SERVER_PORT);

// start the server components
const clientManager = new ClientManager(io);
const queue = new Queue(clientManager);
const votesManager = new VotesManager(queue);
const queueManager = new QueueManager(queue);
const chat = new Chat();

clientManager.on('new-client', client => {
	// attach client to our components
	chat.attachClient(client);
	queueManager.attachClient(client);
	votesManager.attachClient(client);

	clientManager.emitToAll('usersCount', clientManager.getClientsCount());
	client.on('disconnect', () => {
		clientManager.emitToAll('usersCount', clientManager.getClientsCount());

        Logger.info('Client', client.id, 'disconnected');
	});

    let isAdmin = false; // TODO: Implement admin functionality
	if(isAdmin) {
		client.on('refresh-them', () => {
			clientManager.emitToAll('getRefreshed', true);
		});
	}

    Logger.info('Client', client.id, 'connected');
});

Logger.info('Radio components initialized and waiting');