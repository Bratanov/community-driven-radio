const express = require('express');
const SocketIo = require('socket.io');
const Logger = require('./logger.js');

/**
 * Used to create a socket.io server on the provided `config.port`
 * port and an express server on the same port serving
 * static files from the `/public` folder.
 *
 * @param {Config} config
 */
const socketIoExpressInitializer = config => {
	// App is the express server that serves the static files in public
	const app = express();
	app.set('view engine', 'ejs');
	app.get('/', function(req, res) {
		res.render('../views/index', { config });
	});
	app.use(express.static('./public'));

	// Server is used both by express and by socket.io
	const server = require('http').createServer(app);
	const port = config.get('port', 4000);
	server.listen(config.get('port', 4000));
	Logger.info('Server started successfully on port', port);

	// Start socket.io
	const io = SocketIo(server);

	return io;
};

module.exports = socketIoExpressInitializer;