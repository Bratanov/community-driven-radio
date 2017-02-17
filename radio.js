var Queue = require('./server/core/queue.js');
var QueueManager = require('./server/core/queue-manager.js');
var VotesManager = require('./server/core/votes-manager.js');
var Chat = require('./server/core/chat.js');

var io = require('./server/core/socketio-express-initializer')({
	port: 4000
});

// Start our song queue
var queue = new Queue(io.sockets);
var votesManager = new VotesManager(queue);
var queueManager = new QueueManager(queue);
var chat = new Chat();
var usersCount = 0;

//Event user connected
io.on('connection', function(socket) {
	var isAdmin = false; // TODO: Implement admin functionalities
	usersCount++;
	io.emit('usersCount', usersCount);

	chat.attachUser(socket);
	queueManager.attachUser(socket);
	votesManager.attachUser(socket);

	socket.on('disconnect', function () {
		usersCount--;

		io.emit('usersCount', usersCount);
	});

	if(isAdmin) {
		socket.on('refresh-them', function() {
			io.emit('getRefreshed', true);
		});
	}
});
