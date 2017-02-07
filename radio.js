var express = require('express');
var socketio = require('socket.io');
var Queue = require('./server/core/queue.js');
var QueueManager = require('./server/core/queue-manager.js');
var Chat = require('./server/core/chat.js');

// App is the express server that serves the static files in public
var app = express();
app.use(express.static(__dirname + '/public'));

// Server is used both by express and by socket.io
var server = require('http').createServer(app);
server.listen(4000);

// Start socket.io
var io = socketio.listen(server);

// Start our song queue
var queue = new Queue(io.sockets);
var queueManager = new QueueManager(queue);
var chat = new Chat();
var usersCount = 0;

//Event user connected
io.on('connection', function(socket){
	var isAdmin = false; // TODO: Implement admin functionalities
	usersCount++;
	io.emit('usersCount', usersCount);

	chat.attachUser(socket);
	queueManager.attachUser(socket);

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
