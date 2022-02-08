/**
 * The chat handles sending and receiving messages to/from users
 *
 * @type {Chat}
 */
class Chat {
	/**
	 * @param {ClientManager} clientManager for attaching to the clients events
	 * @param {int} historySize Default: 50, The amount of messages to be stored and send to new users initially
	 */
	constructor(clientManager, historySize = 50) {
		this.lastMessages = [];
		this.historySize = historySize;
		this.clientManager = clientManager;

		clientManager.on('new-client', client => this.attachClient(client));
	}

	/**
	 * Subscribes a new client to the chat events
	 * Will send the current history to the user
	 *
	 * @param {Client} client
	 */
	attachClient(client) {
		// Send history to user
		for(let lastMessage of this.lastMessages) {
			client.emit('chat_msg', lastMessage);
		}

		//Bind events to this user:
		client.on('chat_msg', data => {
			const message = {
				author: data.author,
				created: new Date(),
				value: data.value
			};

			this.newMessage(client, message);
		});
	}

	/**
	 * Sends a new chat message from the specified Client
	 *
	 * @param {Client} client
	 * @param {string} data Message contents
	 */
	newMessage(client, data) {
		client.broadcast('chat_msg', data);

		this.lastMessages.push(data);
		if(this.lastMessages.length > this.historySize) {
			this.lastMessages.shift();
		}
	}

	newSystemMessage(author, created, value) {
		const data = {author, created, value, system: true};
		this.clientManager.emitToAll('chat_msg', data);

		this.lastMessages.push(data);
		if(this.lastMessages.length > this.historySize) {
			this.lastMessages.shift();
		}
	}
}

module.exports = Chat;