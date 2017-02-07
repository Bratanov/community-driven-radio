var Chat = function() {
	var self = this;

	var lastMessages = [];

	this.attachUser = function(socket) {
		// Send history to user
		for(var i = 0; i < lastMessages.length; i++) {
			socket.emit('chat_msg', lastMessages[i]);
		}

		//Bind events to this user:
		socket.on('chat_msg', function(data){
			socket.broadcast.emit('chat_msg', data);

			lastMessages.push(data);
			if(lastMessages.length > 50) {
				lastMessages.shift();
			}
		});
	}
}

module.exports = Chat;