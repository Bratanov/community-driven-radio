/**
 * The chat handles sending and receiving messages to/from users
 *
 * @type {Chat}
 */
class Chat {
	/**
	 * @param {int} historySize Default: 50, The amount of messages to be stored and send to new users initially
	 */
	constructor(historySize = 50) {
		this.lastMessages = [];
		this.historySize = historySize;
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
			this.newMessage(client, data);
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
}

module.exports = Chat;