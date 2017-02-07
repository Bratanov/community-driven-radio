var express = require('express');
var socketio = require('socket.io');

module.exports = function(config) {
	if(typeof config === 'undefined') {
		config = {}
	}

	// App is the express server that serves the static files in public
	var app = express();
	app.use(express.static('./public'));

	// Server is used both by express and by socket.io
	var server = require('http').createServer(app);
	server.listen(config.port || 4000);

	// Start socket.io
	var io = socketio.listen(server);

	return io;
}