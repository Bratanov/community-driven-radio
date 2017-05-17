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

// search input, handle direct entering of URL or Youtube id
$('#badassSearch').on('keyup', function(e) {
	if (e.keyCode == 13) {
		var id = getIdFromYoutubeUrl($(this).val());

		// Send msg
		socket.emit('new_song', id);

		// Clear text in input
		$(this).val('');

		// Hide autocomplete suggestions, if any
		// ref: https://github.com/Pixabay/JavaScript-autoComplete/blob/master/auto-complete.js#L57
		$('.autocomplete-suggestions').css('display', 'none');
	}
});

/**
 * Callback for when badassSearch autocomplete options needs to be refreshed.
 * Passes result array into the latest badassSearch suggestion callback 
 * so they can be processed by the plugin.
 * @param  {Object} results
 */
function fillAutocompleteOptions(results) {
	// extract array of titles only
	var titles = results.items.map(function(item) {
		return {
			videoId: item.id.videoId,
			title: item.snippet.title,
			thumbnail: item.snippet.thumbnails.default.url
		};
	});

	return suggestCb(titles);
}

/**
 * badassSearch suggestion callback that will trigger rerendering when called with new data.
 * Refreshed on every new search term.
 * @type {Function}
 */
var suggestCb = new Function();

/**
 * Initialize search autocompelte input.
 */
var badassSearch = new autoComplete({
	selector: '#badassSearch',
	minChars: 2,
	delay: 500,
	source: function(term, suggest) {
		// normalize term
		term = term.toLowerCase();
		// search and refresh results callback
		socket.emit('youtube_search', term);
		suggestCb = suggest;
	},
	renderItem: function(item, search) {
		// Autocomplete item html. 
		// "data-val" is what we see in input when item is selected.
		return '<div class="autocomplete-suggestion" data-id="'+item.videoId+'" data-title="'+item.title+'" data-val="'+item.title+'">' +
			'<img src="'+item.thumbnail+'" height="16px"> ' +
			item.title +
		'</div>';
	},
	onSelect: function(e, term, item) {
		// add to queue by id
		var videoId = item.getAttribute('data-id');
		socket.emit('new_song', videoId);
		// clear input
		$(this.selector).val('');
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
	var recv = song;
	var song = queryStringToObj(song.url_params);

	$('#text').append('<p>Now playing: ' + recv.info.title + '</p>');
	$('#text').scrollTop(999999999);

	player.play(song.url, song);
	var sendNotification = function(song) {
		var options = {
			body: song.info.title,
			icon: 'https://i.ytimg.com/vi/' + song.info.youtubeId + '/maxresdefault.jpg'
		}
		var n = new Notification('Now playing:', options);
		setTimeout(function() { n.close(); }, 5000);
	}
	if (Notification.permission !== 'denied') {
		if (Notification.permisson === 'granted') {
			sendNotification(recv);
		} else {
			Notification.requestPermission(function (permission) {
				if (permission === 'granted') {
					sendNotification(recv);
				}
			});
		}
	}
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

socket.on('youtube_search', fillAutocompleteOptions);

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
		var self = player;
		console.log('Player state changed to', Object.keys(YT.PlayerState).filter(function(key) {
			return self.instance.getPlayerState() === YT.PlayerState[key];
		})[0].toLowerCase() + ".");
		switch (self.instance.getPlayerState()) {
			case YT.PlayerState.PAUSED:
				// player paused. do nothing. for now.
				break;
			case YT.PlayerState.PLAYING:
				// player resumed, seek video to server time.
				if (!self.seekedFromCode) {
					var seekToTime = self.streamPlayingAt();
					self.instance.seekTo(parseFloat(seekToTime), true);

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

	play: function(videoId, params) {
		var params = params || {};
		var self = this;
		if (self.ready) {
			var seekToTime = params.start || self.streamPlayingAt();
			self.instance.loadVideoById(videoId);
			self.instance.seekTo(parseFloat(seekToTime), true);
			self.instance.playVideo();
		} else {
			// call is defered for when player is ready
			self._queuedActionsAfterInit.push(self.play.bind(self, videoId, params));
		}
	}
}

player.init($('#player'));

function isURL(str) {
	return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(str);
}

function getIdFromYoutubeUrl(url) {
	if (! isURL(url)) {
		// Youtube ids have length of 11. We assume that is the case here and return it as it is.
		if (url.length === 11) return url;
		return '';
	}

	var r = new RegExp('^.*(?:youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*');
	var m = url.match(r);

	return (m.length > 1) ? m[1] : '';
}

function queryStringToObj(q) {
	var query = {};
	query.url = q.split('?')[0];
	var a = q.substr(query.url.length + 1).split('&');
	for (var i = 0; i < a.length; i++) {
		var b = a[i].split('=');
		query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
	}
	return query;
}
