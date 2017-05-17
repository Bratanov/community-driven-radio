const express = require('express');
const socketIo = require('socket.io');

/**
 * Used to create a socket.io server on the provided `config.port`
 * port and an express server on the same port serving
 * static files from the `/public` folder.
 *
 * @param {Object} config
 * @param {Object} config.port
 */
const socketIoExpressInitializer = config => {
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

module.exports = socketIoExpressInitializer;