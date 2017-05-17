/**
 * The client class represents a connected user. It holds the
 * socket connection. All of the communication with the
 * clients should happen through the Client instances
 *
 * @property {int} id A unique identification for this client
 * @type {Client}
 */
class Client {
	/**
	 * @param {Socket} socket The socket.io socket instance for this client
	 */
	constructor(socket) {
		this.socket = socket;
		this.id = Date.now() + "-" + Math.random() * Math.pow(10, 20);
		this.votes = [];
	}

	/**
	 * Subscribe to events received by this client
	 *
	 * @param {String} eventName
	 * @param {Function} callback
	 */
	on(eventName, callback) {
		this.socket.on(eventName, callback);
	}

	/**
	 * Sends an event from the client
	 *
	 * @param {String} eventName
	 * @param {Object} data
	 */
	emit(eventName, data) {
		this.socket.emit(eventName, data);
	}

	/**
	 * Sends an event to all other connected clients
	 * Note: Will use socket.io's broadcast functionality
	 *
	 * @param {String} eventName
	 * @param {Object} data
	 */
	broadcast(eventName, data) {
		this.socket.broadcast.emit(eventName, data);
	}

	/**
	 * Marks the user to have voted for the song with this songId
	 *
	 * @param {String} songId A {@link Song}'s id
	 */
	addVote(songId) {
		this.votes.push(songId);
	}

	/**
	 * Returns the song ids the user has voted for
	 *
	 * @returns {Array} Array of Strings containing {@link Song} ids
	 */
	getVotes() {
		return this.votes;
	}
}

module.exports = Client;