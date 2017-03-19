const EventEmitter = require('events');
const Client = require('./client');

module.exports = class ClientManager extends EventEmitter {

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

	emitToAll(event, data) {
		this.socketIo.sockets.emit(event, data);
	}

	getClientsCount() {
		return this.clients.length;
	}
};