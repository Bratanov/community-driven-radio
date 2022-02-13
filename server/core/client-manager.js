const EventEmitter = require('events');
const Client = require('./client');
const Logger = require('./logger.js');

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
	 * @param {YoutubeApi} youtubeApi
	 * @param {io} socketIo The socketIo instance
	 */
	constructor(youtubeApi, socketIo) {
		super();
		this.youtubeApi = youtubeApi;
		this.socketIo = socketIo;
		this.clients = [];

		// bind events
		this.socketIo.on('connection', socket => {
			let client = new Client(socket);

			this.clients.push(client);

			client.on('disconnect', () => {
				this.clients.splice(this.clients.indexOf(client), 1);
			});

			client.on('youtube_search', qs => {
				youTubeApi.search(qs)
					.then(res => {
						client.emit('youtube_search', res);
					})
					.catch(err => {
						Logger.error('ClientManager error', err);
					});
			});

			this.emit('new-client', client);
		});

		this.on('new-client', client => {
			this.emitToAll('usersCount', this.getClientsCount());
			client.on('disconnect', () => {
				this.emitToAll('usersCount', this.getClientsCount());

				Logger.info('Client', client.id, 'disconnected');
			});

			let isAdmin = false; // TODO: Implement admin functionality
			if(isAdmin) {
				client.on('refresh-them', () => {
					this.emitToAll('getRefreshed', true);
				});
			}

			Logger.info('Client', client.id, 'connected');
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