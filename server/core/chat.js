module.exports = class Chat {
	constructor() {
		this.lastMessages = [];
	}

	attachUser(socket) {
		// Send history to user
		for(let lastMessage of this.lastMessages) {
			socket.emit('chat_msg', lastMessage);
		}

		//Bind events to this user:
		socket.on('chat_msg', data => {
			this.newMessage(socket, data);
		});
	}

	newMessage(socket, data) {
        socket.broadcast.emit('chat_msg', data);

        this.lastMessages.push(data);
        if(this.lastMessages.length > 50) {
            this.lastMessages.shift();
        }
	}
};