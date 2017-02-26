module.exports = class Chat {
	constructor() {
		this.lastMessages = [];
	}

	attachUser(socket) {
		// Send history to user
		for(let i = 0; i < this.lastMessages.length; i++) {
			socket.emit('chat_msg', this.lastMessages[i]);
		}

		//Bind events to this user:
		socket.on('chat_msg', data => {
			socket.broadcast.emit('chat_msg', data);

			this.lastMessages.push(data);
			if(this.lastMessages.length > 50) {
				this.lastMessages.shift();
			}
		});
	}
};