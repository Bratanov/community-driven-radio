const EventEmitter = require('events');
const Client = require('./client');

/**
 * Handles connections of socket.io clients.
 * Will hold refferences to all clients
 * and do the communication with them
 *
 * @extends EventEmitter
 * @type {ClientManager}
 */
class ClientManager extends EventEmitter {

	/**
	 * @param {io} socketIo The socketIo instance
	 */
	constructor(socketIo) {
		super();
		this.socketIo = socketIo;
		this.clients = [];

		// bind events
		this.socketIo.on('connection', socket => {
			let client = new Client(socket);

			this.clients.push(client);

			client.on('disconnect', () => {
				this.clients.splice(this.clients.indexOf(client), 1);
			});

			this.emit('new-client', client);
		});
	}

	/**
	 * Sends a message to all connected clients
	 *
	 * @param {String} event
	 * @param {Object} data
	 */
	emitToAll(event, data) {
		this.socketIo.sockets.emit(event, data);
	}

	/**
	 * Gets the number of currently connected clients
	 *
	 * @returns {Number}
	 */
	getClientsCount() {
		return this.clients.length;
	}
}

module.exports = ClientManager;