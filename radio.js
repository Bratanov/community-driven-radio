var request = require('request');
var moment = require('moment');
var express = require('express');
var socketio = require('socket.io');

var youTubeApi = {
	YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || console.error('Please set a YOUTUBE_API_KEY environment variable'),
	getVideo: function(youtubeId, callbackSuccess, callbackError) {
		var youTubeApiRequestUrl = 'https://www.googleapis.com/youtube/v3/videos?id=' + youtubeId + '&part=contentDetails,status,snippet&key=' + youTubeApi.YOUTUBE_API_KEY;
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
	}
}

var Song = function(youtubeId, duration) {
	this.youtubeId = youtubeId;
	this.duration = duration;

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
		return this.youtubeId + ' ' + 
		(   
			( ! this.isOver()) ? // if the song is not over it's either playing or still in queue
				this.getCurrentSeekPosition() + '/' + this.getDurationInSec() :
				this.getDurationInSec() + ' sec.'
		)
		;
	}
}

var Queue = function(ioUsers) {
	var self = this;
	
	this.items = [];
	this.active = null;

	var queueInterval = null;

	/**
	 * When the queue changes we want to
	 * broadcast the new queue to all
	 * users so they're up-to-date
	 */
	var onQueueChanged = function() {
		// Send queue info:
		ioUsers.emit('queue_info', self.getInfo());
	}

	this.getInfo = function() {
		var queueInfo = [];
		for(var itemIndex in self.items) {
			queueInfo.push(self.items[itemIndex].getInfo());
		}

		return queueInfo;
	}

	this.add = function(videoId) {
		youTubeApi.getVideo(videoId, function(data) {
			if(data.pageInfo.totalResults > 0) {
				var resultDuration = data.items[0].contentDetails.duration;

				var durationInMs = moment.duration(resultDuration).asMilliseconds();

				self.items.push(new Song(videoId, durationInMs));

				onQueueChanged();
			}
		});
	}

	this.work = function() {
		if(self.active === null || self.active.isOver()) {
			if(self.items.length === 0) {
				// No items in queue, play something random?
				return;
			}

			var newSong = self.items.shift();
			onQueueChanged();

			newSong.play();

			self.active = newSong;

			// Emit to all users:
			ioUsers.emit('new_song', self.active.getVideoUrlParams());
		}

		// Send current song info:
		ioUsers.emit('song_info', self.active.getInfo());
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
var queue = new Queue(io);
queue.run();

var usersCount = 0;
var lastMessages = [];

//Event user connected
io.on('connection', function(socket){
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
		if(lastMessages.length > 15) {
			lastMessages.shift();
		}
	});

	socket.on('new_song', function(data){
		// Add to queue
		queue.add(data);
	});

	socket.on('disconnect', function () {
		usersCount--;

		io.emit('usersCount', usersCount);
	});

	socket.on('refresh-them', function() {
		io.emit('getRefreshed', true);
	});
});
