module.exports = class Chat {
	constructor() {
		this.lastMessages = [];
	}

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

	newMessage(client, data) {
        client.broadcast('chat_msg', data);

        this.lastMessages.push(data);
        if(this.lastMessages.length > 50) {
            this.lastMessages.shift();
        }
	}
};