const Queue = require('./server/core/queue.js');
const QueueManager = require('./server/core/queue-manager.js');
const VotesManager = require('./server/core/votes-manager.js');
const Chat = require('./server/core/chat.js');
const Logger = require('./server/core/logger.js');

const SERVER_PORT = 4000;
const io = require('./server/core/socketio-express-initializer')({
	port: SERVER_PORT
});
Logger.info("Server started successfully on port", SERVER_PORT);

// Start our song queue
const queue = new Queue(io.sockets);
const votesManager = new VotesManager(queue);
const queueManager = new QueueManager(queue);
const chat = new Chat();

let usersCount = 0;

//Event user connected
io.on('connection', socket => {
	chat.attachUser(socket);
	queueManager.attachUser(socket);
	votesManager.attachUser(socket);

    usersCount++;
    io.emit('usersCount', usersCount);
	socket.on('disconnect', () => {
		usersCount--;

		io.emit('usersCount', usersCount);

        Logger.info("User", socket.id, "disconnected");
	});

    let isAdmin = false; // TODO: Implement admin functionality
	if(isAdmin) {
		socket.on('refresh-them', () => {
			io.emit('getRefreshed', true);
		});
	}

    Logger.info("User", socket.id, "connected");
});

Logger.info("Radio components initialized and waiting");