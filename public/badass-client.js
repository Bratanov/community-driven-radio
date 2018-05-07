var socket = io.connect('/');

var NAMES = [
	'igra4a91',
	'malkaSiNoSLatkasi',
	'Radioactive',
	'dqvola',
	'MaNeKeNa',
	'kArAmeL4e70',
	'ivan_tigara',
	'mn_loff_fiki',
	'bonbonchetoy',
	'armani-vn',
	'|͇̿V͇̿I͇̿P͇̿| FuTbOlIst4eTo(•̪●)',
	'666<<<®鬼ExecutoR鬼®>>>666',
	'•̪̀●́ iskam_yaka_kaka •̪̀●́,',
	'OtRoVnA_CeLuvKa',
	'LOVEMACHINE',
	'kachestvenia',
	'bi4e70',
	'SliderMan',
	'sasho_kvadrata',
	'gucciBang'
];

var userName = NAMES[Math.floor(Math.random()*NAMES.length)];

$('#message-submit').on('click', function(e) {
	e.preventDefault();
	onMessageSubmit($('#message-input'));
});

function onMessageSubmit($input) {
	var value = $input.val();
	if (!value) return;

	var message = {
		author: userName,
		value: value
	};

	// Send msg
	socket.emit('chat_msg', message);

	addMessage(message);

	// Clear text in input
	$input.val('');
}

/**
 * Emit a new_song event with youtube id, parsed from youtube url
 */
function addSongToQueue() {
	var $input = $('#badass-search');
	var url = $input.val();
	var id = getIdFromYoutubeUrl(url);

	// Send msg
	socket.emit('new_song', id);

	// Clear text in input
	$input.val('');

	// Hide autocomplete suggestions, if any
	// ref: https://github.com/Pixabay/JavaScript-autoComplete/blob/master/auto-complete.js#L57
	$('.autocomplete-suggestions').css('display', 'none');
}

// search input, handle direct entering of URL or Youtube id
$('#badass-search').on('keyup', function(e) {
	if (e.keyCode == 13) {
		addSongToQueue();
	}
});

$('#badaass-song-add').on('click', function(e) {
	e.preventDefault();
	addSongToQueue();
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
	selector: '#badass-search',
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

$('body').on('click', '.js-btn-vote', function() {
	socket.emit('vote', $(this).data('song-id'));
});

$('body').on('click', '.btn-delete', function() {
	socket.emit('delete_queued', $(this).data('song-id'));
});

$('body').on('click', '.js-btn-add', function() {
	socket.emit('new_song', $(this).data('youtube-id'));
});

socket.on('chat_msg', function(data) {
	addMessage(data);
});

socket.on('new_song', function(song) {
	var songUrlParams = queryStringToObj(song.url_params);

	$message = renderer.getChatSystemMessage(song.info.title, song.info.duration);
	$('#chat-history').append($message);
	$('#chat-history').scrollTop(999999999);

	player.play(songUrlParams.url, songUrlParams);

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
			sendNotification(song);
		} else {
			Notification.requestPermission(function (permission) {
				if (permission === 'granted') {
					sendNotification(song);
				}
			});
		}
	}
});

socket.on('usersCount', function(data){
	$('#users-count').text(data);
});

socket.on('getRefreshed', function(data){
	window.location.reload();
});

// TODO;
socket.on('song_info', function(data) {
	if (data.playTime) {
		$('#song-info').html(renderSong(data));
		player.streamPlayingAt(data.playingAt);
	}
});


function addMessage(message) {
	var $chatHistory = $('#chat-history');
	var $message = renderer.getChatMessage(userName, message);
	$chatHistory.append($message);
	$chatHistory.scrollTop(999999999);
}

socket.on('queue_info', function(data) {
	var $queue = $('#queue-list');
	$queue.empty();

	data.forEach(function(song, i) {
		var $songTemplate = renderer.getQueueItem(i + 1, song);
		$queue.append($songTemplate);
	});
});

socket.on('related_info', function(data) {
	var $list = $('#related-list');
	$list.empty();

	data.forEach(function(song, i) {
		var $songTemplate = renderer.getRelatedItem(i + 1, song);
		$list.append($songTemplate);
	});
});

socket.on('be_alerted', function(message) {
	// alert lolzorz
	alert(message);
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
		+ '<button class="js-btn-vote" data-song-id="' + song.id + '">Vote up (' + song.votes + ')</button>'
	;
}

/*function play(thingie) {
	$('iframe').attr('src', 'https://www.youtube.com/embed/' + thingie);
}*/

var renderer = {

	_cloneTemplate: function(templateId) {
		return $($('#' + templateId).html().trim());
	},

	getQueueItem: function(number, songData) {
		var $clone = this._cloneTemplate('t-queue-list-item'); 
	
		$clone.find('.queue-list__item-number').text(number + '.');
		$clone.find('.queue-list__item-title')
			.attr('href', 'https://youtube.com/watch?v=' + songData.youtubeId)
			.text(songData.title);
		var duration = (songData.playTime) ? songData.playTime : songData.duration;
		$clone.find('.queue-list__item-duration').text('- ' + duration + ' sec.');
	
		$clone.find('.js-btn-vote').attr('data-song-id', songData.id);
		$clone.find('.queue-list__item-votes').text(songData.votes);
	
		// TOOD: delete button in template? There's a (backend?) bug here.
		// var addedBy = songData.addedBy.substring(2);
		// var deleteButton = '';
		// if (addedBy == socket.id) {
		// 	deleteButton = '<button class="btn-delete" data-song-id="' + o.id + '">Remove</button>';
		// }
	
		return $clone;
	},

	getRelatedItem: function(number, songData) {
		var $clone = this._cloneTemplate('t-related-list-item');
	
		$clone.find('.related-list__item-number').text(number + '.');
		$clone.find('.related-list__item-title')
			.attr('href', 'https://youtube.com/watch?v=' + songData.youtubeId)
			.text(songData.title);
		$clone.find('.js-btn-add').attr('data-youtube-id', songData.youtubeId);
	
		return $clone;
	},

	/**
	 * Render chat message.
	 * @param {Object} message 
	 * {
	 * 	author: String,
	 * 	value: String
	 * }
	 */
	getChatMessage: function(currentUserName, message) {
		var $clone = this._cloneTemplate('t-message');

		if (currentUserName === message.author) {
			// logged user's message
			$clone.addClass('chat-history__item--right chat-history__item--inverse');
		} else {
			// another user's message
			$clone.addClass('chat-history__item--left');
		}

		$clone.find('.chat-history__author').text(message.author);
		$clone.find('.chat-history__message').text(message.value);

		return $clone;
	},

	getChatSystemMessage: function(title, duration) {
		var $clone = this._cloneTemplate('t-system-message');

		$clone.find('.chat-history__message').text(title + ' - ');
		$clone.find('.chat-history__timer').text(duration + 'sec.');

		return $clone;
	}
};

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
};

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
