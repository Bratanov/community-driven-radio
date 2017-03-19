const express = require('express');
const socketIo = require('socket.io');

module.exports = config => {
	if(typeof config === 'undefined') {
		config = {};
	}

	// App is the express server that serves the static files in public
	let app = express();
	app.use(express.static('./public'));

	// Server is used both by express and by socket.io
	let server = require('http').createServer(app);
	server.listen(config.port || 4000);

	// Start socket.io
	let io = socketIo.listen(server);

	return io;
};