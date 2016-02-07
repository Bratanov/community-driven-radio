var request = require('request');
var moment = require('moment');
var express = require('express');
var socketio = require('socket.io');

var youTubeApi = {
	YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || console.error('Please set a YOUTUBE_API_KEY environment variable'),
	URL_BASE: 'https://www.googleapis.com/youtube/v3/',
	simpleGetRequest: function(youTubeApiRequestUrl, callbackSuccess, callbackError) {
		request(youTubeApiRequestUrl, function (error, response, body) {
		    if ( ! error && response.statusCode == 200) {
		        var data = JSON.parse(body); // Parse response from YouTube
		        
		        if(typeof callbackSuccess === 'function') {
		        	callbackSuccess(data);
		        }
			} else {
				if(typeof callbackError === 'function') {
					callbackError(error);
				}
			}
		});
	},
	getVideo: function(youtubeId, callbackSuccess, callbackError) {
		var youTubeApiRequestUrl = this.URL_BASE + 'videos?id=' + youtubeId + '&part=contentDetails,status,snippet&key=' + this.YOUTUBE_API_KEY;
		this.simpleGetRequest(youTubeApiRequestUrl, callbackSuccess, callbackError);
	},
	getRelatedVideos: function(youtubeId, callbackSuccess, callbackError) {
		var youTubeApiRequestUrl = this.URL_BASE + 'search?type=video&relatedToVideoId=' + youtubeId + '&part=snippet&key=' + this.YOUTUBE_API_KEY;
		this.simpleGetRequest(youTubeApiRequestUrl, callbackSuccess, callbackError);
	}
}

var Song = function(youtubeId, title, duration) {
	var self = this;
	/**
	 * Generate a unique id for the song
	 * Doesn't have to be very random
	 * @type {string}
	 */
	this.id = Date.now().toString() + parseInt(Math.random() * 100000000000).toString();
	this.youtubeId = youtubeId;
	this.duration = duration;
	this.title = title;
	this.relatedVideos = [];

	// Limit duration of a song to 5min
	this.duration = Math.min(this.duration, 5 * 60 * 1000);

	var startedPlayingAt = null;
	var shouldStopPlayingAt = null;

	/**
	 * Marks this song as currently playing
	 */
	this.play = function() {
		startedPlayingAt = Date.now();
		shouldStopPlayingAt = startedPlayingAt + this.duration;
	}

	/**
	 * @return {Boolean} If the song should have stopped playing by now
	 */
	this.isOver = function() {
		// Not started yet
		if( ! startedPlayingAt) {
			return true;
		}

		return this.getEndsInMs() <= 0;
	}

	this.getEndsInMs = function() {
		return shouldStopPlayingAt - Date.now();
	}

	this.getDurationInSec = function() {
		return parseInt(this.duration / 1000);
	}

	/**
	 * Get the current seek time in seconds
	 *
	 * @return {int} Seconds after this song should have started
	 */
	this.getCurrentSeekPosition = function() {
		return Math.max(0, parseInt((Date.now() - startedPlayingAt) / 1000));
	}

	/**
	 * Those params can be inserted after youtube.com/embed/ 
	 * and are sent to the end users to play the video with
	 * 
	 * @return {string} Include video id, autoplay and time (if needed)
	 */
	this.getVideoUrlParams = function() {
		return this.youtubeId + '?' + 
			'autoplay=1&controls=0&' + 
			'start=' + this.getCurrentSeekPosition();
	}

	/**
	 * Returns a summary of a song for display to
	 * users. When playing it includes the time
	 * played and when over the total duration
	 * 
	 * @return {string}
	 */
	this.getInfo = function() {
		return {
			id: this.id,
			title: this.title,
			youtubeId: this.youtubeId,
			duration: this.getDurationInSec(),
			playTime: ( ! this.isOver()) ? (this.getCurrentSeekPosition() + '/' + this.getDurationInSec()) : false
		}
	}
}

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
		// Make a fresh copy of the original items
		var copyItems = this.items.slice();

		copyItems.sort(function(item1, item2) {
			var votesForItem1 = getVotesCount(item1);
			var votesForItem2 = getVotesCount(item2);

			return votesForItem1 < votesForItem2;
		});

		return copyItems;
	}

	this.getInfo = function() {
		var queueInfo = [];
		var queueSortedItems = this.getItems();

		for(var itemIndex in queueSortedItems) {
			// Get info for the song
			var songInfo = queueSortedItems[itemIndex].getInfo();

			// Attach votes (stored in the queue, not on the song)
			songInfo.votes = getVotesCount(queueSortedItems[itemIndex]);

			queueInfo.push(songInfo);
		}

		return queueInfo;
	}

	this.add = function(videoId) {
		youTubeApi.getVideo(videoId, function(data) {
			if(data.pageInfo.totalResults > 0) {
				if( ! data.items[0].status.embeddable) {
					return; // Show error?
				}

				var title = data.items[0].snippet.title;
				var resultDuration = data.items[0].contentDetails.duration;

				var durationInMs = moment.duration(resultDuration).asMilliseconds();

				self.items.push(new Song(videoId, title, durationInMs));

				onQueueChanged();
			}
		});
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
					self.add(self.active.relatedVideos[0].youtubeId);
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
			ioUsers.emit('new_song', self.active.getVideoUrlParams());
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
}

// App is the express server that serves the static files in public
var app = express();
app.use(express.static(__dirname + '/public'));

// Server is used both by express and by socket.io
var server = require('http').createServer(app);
server.listen(4000);

// Start socket.io
var io = socketio.listen(server);

// Start our song queue
var queue = new Queue(io.sockets);
queue.run();

var usersCount = 0;
var lastMessages = [];

//Event user connected
io.on('connection', function(socket){
	var isAdmin = false; // TODO: Implement admin functionalities
	usersCount++;
	io.emit('usersCount', usersCount);

	// Send current song and current queue to user
	if(queue.active && ! queue.active.isOver()) {
		socket.emit('new_song', queue.active.getVideoUrlParams());
		socket.emit('queue_info', queue.getInfo());
	}

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

	socket.on('new_song', function(data){
		// Add to queue
		queue.add(data);
	});

	socket.on('vote', function(songId) {
		// Upvote this song
		queue.addVote(socket, songId);
	});

	socket.on('disconnect', function () {
		usersCount--;

		io.emit('usersCount', usersCount);

		/**
		 * A user has left which would cause the
		 * sorting of the queue to potentially
		 * change, we need to let users know 
		 */
		queue.triggerOnQueueChanged();
	});

	if(isAdmin) {
		socket.on('refresh-them', function() {
			io.emit('getRefreshed', true);
		});
	}
});
