var moment = require('moment');
var Song = require('./song.js');
var youTubeApi = require('./youtube-api.js');

var Queue = function(ioUsers) {
	var self = this;

	this.items = [];
	this.active = null;

	var queueInterval = null;
	var relatedVideoIsLoading = false;

	/**
	 * When the queue changes we want to
	 * broadcast the new queue to all
	 * users so they're up-to-date
	 */
	var onQueueChanged = function() {
		// Send queue info:
		ioUsers.emit('queue_info', self.getInfo());
	}

	var onRelatedChanged = function(song) {
		// Send queue info:
		ioUsers.emit('related_info', song.relatedVideos);
	}

	var getVotesCount = function(song) {
		var votesCount = 0;

		// Loop through the currently connected users
		for(var userId in ioUsers.connected) {
			var userSocket = ioUsers.connected[userId];

			// Get the votes array from this users Socket object
			var votes = userSocket.votes || [];

			// Check if the song id is contained inside
			if(votes.indexOf(song.id) !== -1) {
				votesCount++;
			}
		}

		return votesCount;
	}

	var loadRelatedVideos = function(song) {
		// Load and add related videos in the self.relatedVideos array
		youTubeApi.getRelatedVideos(song.youtubeId, function(data) {
			if(data.pageInfo.totalResults > 0 && data.items.length) {
				for(var itemId in data.items) {
					// The data we need from the YouTube response
					var relatedVideoInfo = {
						youtubeId: data.items[itemId].id.videoId,
						title: data.items[itemId].snippet.title
					}

					song.relatedVideos.push(relatedVideoInfo);
				}

				onRelatedChanged(song);
			}
		});
	}

	this.addVote = function(userSocket, songId) {
		var currentVotes = userSocket.votes || [];

		if(currentVotes.indexOf(songId) === -1) {
			currentVotes.push(songId);
			// Put the votes back in the socket object
			userSocket.votes = currentVotes;

			onQueueChanged();
		} else {
			userSocket.emit('be_alerted', 'You\'ve already voted for this song');
		}
	}

	/**
	 * Returns the items in the queue
	 * sorted by the priority based
	 * on the votes of the users
	 *
	 * @return {array} Array of song items, sorted by votes/pos
	 */
	this.getItems = function() {
		// Make a fresh copy of the original items with votes included
		var copyItems = [];
		for(var itemIndex in this.items) {
			var item = this.items[itemIndex];
			item.votes = getVotesCount(item);

			copyItems.push(item);
		}

		copyItems.sort(function(item1, item2) {
			if(item1.votes > item2.votes) {
				return -1;
			}

			if(item1.votes < item2.votes) {
				return 1;
			}

			return 0;
		});

		return copyItems;
	}

	this.getInfo = function() {
		var queueInfo = [];
		var queueSortedItems = this.getItems();

		for(var itemIndex in queueSortedItems) {
			var item = queueSortedItems[itemIndex];
			// Get info for the song
			var songInfo = item.getInfo();

			// Attach votes (stored in the queue, not on the song)
			songInfo.votes = getVotesCount(item);

			queueInfo.push(songInfo);
		}

		return queueInfo;
	}

	this.add = function(userSocket, videoId) {
		var self = this;

		// check if song is already playing, prevent adding
		if(self.active && self.active.youtubeId === videoId) {
			userSocket.emit('be_alerted', 'This song is currently playing.');
			return;
		}

		// check if song already exists in queue, prevent adding
		var queueItems = self.getItems();
		for(var index in queueItems) {
			if(queueItems[index].youtubeId === videoId) {
				userSocket.emit('be_alerted', 'This song is already in the queue. Try voting for it instead.');
				return;
			}
		}

		youTubeApi.getVideo(videoId, function(data) {
			if(data.pageInfo.totalResults > 0) {
				if( ! data.items[0].status.embeddable) {
					return; // Show error?
				}

				var title = data.items[0].snippet.title;
				var resultDuration = data.items[0].contentDetails.duration;

				var durationInMs = moment.duration(resultDuration).asMilliseconds();

				self.items.push(new Song(videoId, title, durationInMs, userSocket));

				onQueueChanged();
			}
		}, function(error) {
			console.log('Error adding a song: ', error);
		});
	}

	this.delete = function(userSocket, videoId) {
		var song = self.items.filter(function (o) {
			return o.id == videoId;
		});
		if (! song.length) {
			return;
		}
		song = song[0];
		if (song.addedBy.id == userSocket.id) {
			var idx = self.items.indexOf(song);
			self.items.splice(idx, 1);
			onQueueChanged();
		}
	}

	this.delete = function(userSocket, videoId) {
		var song = self.items.filter(function (o) {
			return o.id == videoId;
		});
		if (! song.length) {
			return;
		}
		song = song[0];
		if (song.addedBy.id == userSocket.id) {
			var idx = self.items.indexOf(song);
			self.items.splice(idx, 1);
			onQueueChanged();
		}
	}

	this.work = function() {
		if(self.active === null || self.active.isOver()) {
			// When nothing is in the queue
			if(self.items.length === 0) {
				if(relatedVideoIsLoading) {
					// Wait for the related video to load
					return;
				}

				// Add the first related video to queue (asynchronous!)
				if(self.active !== null && self.active.relatedVideos.length) {
					self.add({}, self.active.relatedVideos[0].youtubeId);
					relatedVideoIsLoading = true;
				}

				// Nothing active or no related videos found
				return;
			}
			// Reset the value of the flag, used when loading related videos on empty queue
			relatedVideoIsLoading = false;

			// The next song would be the first one from the sorted queue
			var newSong = self.getItems().shift();

			// Remove the song we just took - from the original items array
			var newSongIndexInQueue = self.items.indexOf(newSong);
			self.items.splice(newSongIndexInQueue, 1);

			onQueueChanged();

			newSong.play();

			self.active = newSong;

			// Load related videos for newly played active song
			loadRelatedVideos(self.active);

			// Emit to all users:
			var info = {url_params: self.active.getVideoUrlParams(), info: self.active.getInfo()};
			ioUsers.emit('new_song', info);
		}

		// Send current song info:
		var newSongInfo = self.active.getInfo();
		newSongInfo.votes = getVotesCount(self.active);
		ioUsers.emit('song_info', newSongInfo);
	}

	this.run = function() {
		/**
		 * Schedule work every second
		 * the queue will check its
		 * items and do its magic
		 */
		this.queueInterval = setInterval(function() {
			self.work();
		}, 1000)
	}

	this.stop = function() {
		clearInterval(this.queueInterval);
	}

	/**
	 * Use this to manually trigger an update to the queue/positions
	 * and display it to all users. Can be used for example when a
	 * user disconnects and we want to update visually the queue
	 */
	this.triggerOnQueueChanged = function() {
		onQueueChanged();
	}

	this.run();
}

module.exports = Queue;