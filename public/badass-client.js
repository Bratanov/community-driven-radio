var socket = io.connect('/');

$('#message').on('keyup', function(e){
	if(e.keyCode == 13){
		var message = $('#my-name').val() + ' - ' + $(this).val();

		//Send msg
		socket.emit('chat_msg', message);

		addMessage(message);

		//Clear text in input
		$(this).val('');
	}
});

$('#newSong').on('keyup', function(e){
	if(e.keyCode == 13){
		//Send msg
		socket.emit('new_song', $(this).val());

		//Clear text in input
		$(this).val('');
	}
});

$('body').on('click', '.btn-vote', function() {
	socket.emit('vote', $(this).data('song-id'));
});

$('body').on('click', '.btn-delete', function() {
	socket.emit('delete_queued', $(this).data('song-id'));
});

$('body').on('click', '.add-song', function() {
	socket.emit('new_song', $(this).data('youtube-id'));
});

socket.on('chat_msg', function(data){
	addMessage(data);
});

socket.on('new_song', function(song) {
	$('#text').append('<p>Now plaing: ' + song + '</p>');
	$('#text').scrollTop(999999999);
	player.play(song);
});

socket.on('usersCount', function(data){
	$('#usersCount').text(data);
});

socket.on('getRefreshed', function(data){
	window.location.reload();
});

socket.on('song_info', function(data) {
	if (data.playTime) {	
		$('#song-info').html(renderSong(data));
		player.streamPlayingAt(data.playingAt);
	}
});

socket.on('queue_info', function(data) {
	$queue_info = $('#queue-info');
	$queue_info.html('<ol></ol>');
	$queue_info = $queue_info.find('ol');

	for(var song in data) {
		var o = data[song];
		var addedBy = o.addedBy.substring(2);
		var deleteButton = '';
		if (addedBy == socket.id) {
			deleteButton = '<button class="btn-delete" data-song-id="' + o.id + '">Remove</button>';
		}
		$queue_info.append('<li>' + renderSong(o) + deleteButton + '</li>');
	}
});

socket.on('be_alerted', function(message) {
	// alert lolzorz
	alert(message);
});

socket.on('related_info', function(data) {
	var relatedView = renderRelatedSongs(data);

	$('#related-songs').html(relatedView);
});

function renderRelatedSongs(songs) {
	var view = '<ul>Related <i>(First one will play if nothing in queue)</i>:';

	for(var relatedId in songs) {
		var relatedSong = songs[relatedId];
		view += '<li>' + relatedSong.title + ' <button class="add-song" data-youtube-id="' + relatedSong.youtubeId + '">Add to queue</button></li>'
	}

	view += '</ul>';

	return view;
}

function renderSong(song) {
	// Default votes to 0
	song.votes = song.votes || 0;

	return '<a href="https://youtube.com/watch?v=' + song.youtubeId + '" target="_blank">'
		+ song.title
		+ '</a> - '
		+ ((song.playTime) ? song.playTime : song.duration) + 'sec. '
		+ '<button class="btn-vote" data-song-id="' + song.id + '">Vote up (' + song.votes + ')</button>'
	;
}

/*function play(thingie) {
	$('iframe').attr('src', 'https://www.youtube.com/embed/' + thingie);
}*/

function addMessage(message) {
	$('#text').append('<p>Message: '+ $('<div/>').text(message).html() +'</p>');

	$('#text').scrollTop(999999999);
}

/**
 * A player object
 */
var player = {

	instance: null,
	ready: false,
	_streamPlayingAt: 0,
	init: function($player) {
		var self = this;

		// called right after api library is loaded asyncronosly
		window.onYouTubeIframeAPIReady = function() {
			self.instance = new YT.Player($player.get(0), {
				height: '180',
				width: '320',
				playerVars: {
					controls: 0, // disable video controls
					disablekb: 1, // disable keyboard player controls
					rel: 0 // so not show related videos after song finishes
				},
				events: {
					'onReady': self.onPlayerReady,
					'onStateChange': self.onPlayerStateChange
				}
			});
		}
	},
	// functions to call right after player is ready
	_queuedActionsAfterInit: [],

	onPlayerReady: function(event) {
		// Note: event.target === self.instance
		var self = player;
		self.ready = true;
		if (self._queuedActionsAfterInit.length) {
			self._queuedActionsAfterInit.forEach(function(action) {
				if (typeof action === 'function') {
					action();
				}
			});
		}
		
		console.log('player ready');
	},

	onPlayerStateChange: function(event) {
		// TODO: trying to seek player time here,
		// triggers a nasty recursion...doh
		// current solution is to use flags in code
		// 
		// alternative: binding click handler on iframe doesn't work
		// since event doesn't bubble up to current page
		console.log('player state changed');

		var self = player;
		switch (self.instance.getPlayerState()) {
			case YT.PlayerState.PAUSED:
				// player paused. do nothing. for now.
				break;
			case YT.PlayerState.PLAYING:
				// player resumed, seek video to server time.
				if (!self.seekedFromCode) {
					var seekToTime = self.streamPlayingAt();
					self.instance.seekTo(seekToTime, true);

					self.seekedFromCode = true;
				} else {
					self.seekedFromCode = false;
				}
				break;
		}
	},

	/**
	 * Getter/setter for server playing time of the current song.
	 * @param  {Number} songSeekTime   Seconds passed from the song start.
	 * @return {Number}                Last saved stream time.
	 */
	streamPlayingAt: function(songSeekTime) {
		if (arguments.length) {
			this._streamPlayingAt = songSeekTime;
		}

		return this._streamPlayingAt;
	},

	play: function(videoId) {
		var self = this;
		if (self.ready) {
			self.instance.loadVideoById(videoId);
			var seekToTime = self.streamPlayingAt();
			self.instance.seekTo(seekToTime, true);
			self.instance.playVideo();
		} else {
			// call is defered for when player is ready
			self._queuedActionsAfterInit.push(self.play.bind(self, videoId));
		}
	}
}

player.init($('#player'));