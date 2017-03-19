module.exports = class VotesManager {

	/**
	 * @param {Queue} queue
	 */
	constructor(queue) {
		this.queue = queue;
		this.voters = [];
	}

	attachClient(client) {
		this.voters.push(client);

		client.on('disconnect', () => {
			// remove user from voters array
			this.voters = this.voters.filter(user => {
				return user !== client;
			});
			this.recalculateVotes();
		});
		client.on('vote', songId => {
			this.addVote(client, songId);
			this.recalculateVotes();
		});
	}

	hasVotedFor(client, songId) {
		return client.getVotes().indexOf(songId) !== -1;
	}

	getVotesCount(song) {
		let votesCount = 0;

		// Loop through the currently connected users
		for(let voterClient of this.voters) {
			// Check if the song id is contained inside
			if(this.hasVotedFor(voterClient, song.id)) {
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

	addVote(client, songId) {
		if(this.hasVotedFor(client, songId)) {
			client.emit('be_alerted', 'You\'ve already voted for this song');
		} else {
			client.addVote(songId);
		}
	}
};