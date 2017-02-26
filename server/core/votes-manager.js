module.exports = class VotesManager {

	/**
	 * @param {Queue} queue
	 */
	constructor(queue) {
		this.queue = queue;
		this.voters = [];
	}

	attachUser(socket) {
		this.voters.push(socket);

		socket.on('disconnect', () => {
			// remove user from voters array
			this.voters = this.voters.filter(user => {
				return user !== socket;
			});
			this.recalculateVotes();
		});
		socket.on('vote', songId => {
			this.addVote(socket, songId);
			this.recalculateVotes();
		});
	}

	getVotesCount(song) {
		let votesCount = 0;

		// Loop through the currently connected users
		for(let voterSocket of this.voters) {
			// Get the votes array from this users Socket object
			let votes = voterSocket.votes || [];

			// Check if the song id is contained inside
			if(votes.indexOf(song.id) !== -1) {
				votesCount++;
			}
		}

		return votesCount;
	}

	/**
	 * Sets the `votes` attribute of the songs inside
	 * the queue (including the active song) to the
	 * proper value according to @getVotesCount
	 */
	recalculateVotes() {
		// calculate votes for queue items
		this.queue.getItems().forEach(song => {
			let newVotesCount = this.getVotesCount(song);
			song.setVotes(newVotesCount);
		});

		// calculate votes for the active 
		// queue song (if there is any)
		if(this.queue.active) {
			let activeSongVotesCount = this.getVotesCount(this.queue.active);
			this.queue.active.setVotes(activeSongVotesCount);
		}

		this.queue.triggerOnQueueChanged();
	}

	addVote(userSocket, songId) {
		let currentVotes = userSocket.votes || [];

		if(currentVotes.indexOf(songId) === -1) {
			currentVotes.push(songId);
			// Put the votes back in the socket object
			userSocket.votes = currentVotes;
		} else {
			userSocket.emit('be_alerted', 'You\'ve already voted for this song');
		}
	}
};