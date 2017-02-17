var VotesManager = function(_queue) {
	var self = this;
	var queue = _queue;
	var voters = [];

	this.attachUser = function(socket) {
		voters.push(socket);

		socket.on('disconnect', function() {
			// remove user from voters array
			voters = voters.filter(function(user) {
				return user !== socket;
			});
			self.recalculateVotes();
		});
		socket.on('vote', function(songId) {
			self.addVote(socket, songId);
			self.recalculateVotes();
		});
	}

	var getVotesCount = function(song) {
		var votesCount = 0;

		// Loop through the currently connected users
		for(var voterIndex in voters) {
			var userSocket = voters[voterIndex];

			// Get the votes array from this users Socket object
			var votes = userSocket.votes || [];

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
	this.recalculateVotes = function() {
		// calculate votes for queue items
		queue.getItems().forEach(function(song) {
			var newVotesCount = getVotesCount(song);
			song.setVotes(newVotesCount);
		});

		// calculate votes for the active 
		// queue song (if there is any)
		if(queue.active) {
			var activeSongVotesCount = getVotesCount(queue.active);
			queue.active.setVotes(activeSongVotesCount);
		}

		queue.triggerOnQueueChanged();
	}

	this.addVote = function(userSocket, songId) {
		var currentVotes = userSocket.votes || [];

		if(currentVotes.indexOf(songId) === -1) {
			currentVotes.push(songId);
			// Put the votes back in the socket object
			userSocket.votes = currentVotes;
		} else {
			userSocket.emit('be_alerted', 'You\'ve already voted for this song');
		}
	}
}

module.exports = VotesManager;