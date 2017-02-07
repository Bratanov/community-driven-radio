var express = require('express');
var socketio = require('socket.io');
var Queue = require('./server/core/queue.js');
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
var chat = new Chat();
var usersCount = 0;

//Event user connected
io.on('connection', function(socket){
	var isAdmin = false; // TODO: Implement admin functionalities
	usersCount++;
	io.emit('usersCount', usersCount);

	chat.attachUser(socket);

	// Send current song and current queue to user
	if(queue.active && ! queue.active.isOver()) {
		var info = {url_params: queue.active.getVideoUrlParams(), info: queue.active.getInfo()};
		socket.emit('new_song', info);
		socket.emit('queue_info', queue.getInfo());
		socket.emit('related_info', queue.active.relatedVideos);
	}

	socket.on('new_song', function(data){
		// Add to queue
		queue.add(socket, data);
	});

	socket.on('delete_queued', function(data){
		// Remove from queue
		queue.delete(socket, data);
	});

	socket.on('vote', function(songId) {
		// Upvote this song
		queue.addVote(socket, songId);
	});

	socket.on('disconnect', function () {
		usersCount--;

		io.emit('usersCount', usersCount);

		/**
		 * A user has left which would cause the
		 * sorting of the queue to potentially
		 * change, we need to let users know
		 */
		queue.triggerOnQueueChanged();
	});

	if(isAdmin) {
		socket.on('refresh-them', function() {
			io.emit('getRefreshed', true);
		});
	}
});
