/**
 * TODO: Docs
 */
class Client {
	constructor(socket) {
		this.socket = socket;
		this.id = Date.now() + "-" + Math.random() * Math.pow(10, 20);
		this.votes = [];
	}

	on(eventName, callback) {
		this.socket.on(eventName, callback);
	}

	emit(eventName, data) {
		this.socket.emit(eventName, data);
	}

	broadcast(eventName, data) {
		this.socket.broadcast.emit(eventName, data);
	}

	addVote(songId) {
		this.votes.push(songId);
	}

	getVotes() {
		return this.votes;
	}
}

module.exports = Client;