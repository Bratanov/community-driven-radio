/**
 * Manages adding votes from {@link Client}s and calculates vote counts
 *
 * @type {VotesManager}
 */
class VotesManager {

	/**
	 * @param {Queue} queue Songs from this {@link Queue} will be available for voting and will have votes counted
	 */
	constructor(queue) {
		this.queue = queue;
		this.voters = [];
	}

	/**
	 * @param {Client} client
	 */
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

	/**
	 * Determines if the {@link Client} has voted for this song
	 *
	 * @param {Client} client
	 * @param {String} songId
	 * @returns {boolean}
	 */
	hasVotedFor(client, songId) {
		return client.getVotes().indexOf(songId) !== -1;
	}

	/**
	 * @param {Song} song
	 * @returns {number} The number of votes this song currently has
	 */
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
	 * Sets the {@link Song.votes} attribute of the songs inside
	 * the queue (including the active song) to the
	 * proper value according to {@link this.getVotesCount}
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

	/**
	 * @param {Client} client
	 * @param {String} songId
	 */
	addVote(client, songId) {
		if(this.hasVotedFor(client, songId)) {
			client.emit('be_alerted', 'You\'ve already voted for this song');
		} else {
			client.addVote(songId);
		}
	}
}

module.exports = VotesManager;