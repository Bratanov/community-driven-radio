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
	'gucciBang',
	'bobisgolfa',
	'goran-patron',
	'geri-moderen',
	'zucc',
	'nadeto-v-malta'
];

var LOCAL_STORAGE_USERNAME_KEY = 'usrnm';

var userName = localStorage.getItem(LOCAL_STORAGE_USERNAME_KEY);
var usernameDialog = $('#username-dialog').get(0);
var $usernameInput = $('#username-input');

if (!userName) {
	// TODO: scroll lock?
	usernameDialog.showModal();
} else {
	$usernameInput.val(userName);
}

$('.js-name-change').on('click', function(e) {
	usernameDialog.showModal();
});

// username dialog
var $badassUsernames = $('#badass-usernames');
// render options
NAMES.forEach(function(name) {
	var $option = $('<option>');
	$option.attr('value', name);
	$option.text(name);
	$badassUsernames.append($option);
});
// username select handler
$badassUsernames.on('change', function(e) {
	$usernameInput.val(e.target.value);
});
$('#username-form').on('submit', function(e) {
	e.preventDefault();

	if (!$usernameInput.val()) return;
	userName = $usernameInput.val();
	localStorage.setItem(LOCAL_STORAGE_USERNAME_KEY, userName);
	usernameDialog.close();
});

$('#message-submit').on('click', function(e) {
	e.preventDefault();
	onMessageSubmit($('#message-input'));
});

wdtEmojiBundle.defaults.emojiSheets.apple = '//ned.im/wdt-emoji-bundle/sheets/sheet_apple_64_indexed_128.png';
wdtEmojiBundle.defaults.type = 'apple';
wdtEmojiBundle.init('#message-input');

function onMessageSubmit($input) {
	var value = $input.val();
	if (!value) return;

	var message = {
		author: userName,
		value: value,
		created: new Date() // local use only
	};

	// Send msg
	socket.emit('chat_msg', message);

	addMessage(message, true);

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
			'<img class="autocomplete-suggestion__thumb" src="'+item.thumbnail+'"> ' +
			'<div class="autocomplete-suggestion__title">' + item.title + '</div>' +
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

// TODO: this is unused
$('body').on('click', '.btn-delete', function() {
	socket.emit('delete_queued', $(this).data('song-id'));
});

$('body').on('click', '.js-btn-add', function() {
	socket.emit('new_song', $(this).data('youtube-id'));
});

var getTimeShort = function (date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var hoursPadded = hours.toString().padStart(2, '0');
	var minutesPadded = minutes.toString().padStart(2, '0');

	return [hoursPadded, minutesPadded].join(':');
};

var renderer = {

	_cloneTemplate: function(templateId) {
		return $($('#' + templateId).html().trim());
	},

	getQueueItem: function(number, songData) {
		var $clone = this._cloneTemplate('t-queue-list-item');

		$clone.find('.c-song-list-item__number').text(number + '.');
		$clone.find('.c-song-list-item__title')
			.attr('href', 'https://youtube.com/watch?v=' + songData.youtubeId)
			.text(songData.title);
		var duration = (songData.playTime) ? songData.playTime : songData.duration;
		$clone.find('.c-song-list-item__duration').text('- ' + duration + ' sec.');

		$clone.find('.js-btn-vote').attr('data-song-id', songData.id);
		$clone.find('.c-song-list-item__votes').text(songData.votes);

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

		$clone.find('.c-song-list-item__number').text(number + '.');
		$clone.find('.c-song-list-item__title')
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
			$clone.addClass('c-chat-history__item--right c-chat-history__item--inverse');
		} else {
			// another user's message
			$clone.addClass('c-chat-history__item--left');
		}

		var createdShort = getTimeShort(message.created);
		var createdLong = message.created.toISOString();
		// note: escapes original message here, so we can use .html to show emojis in messages
		var messageEscaped = $('<div></div>').text(message.value).html();
		var messageWithEmojis = wdtEmojiBundle.render(messageEscaped);

		$clone.find('.c-chat-history__author').text(message.author + ':');
		$clone.find('.c-chat-history__message').html(messageWithEmojis);
		$clone.find('.c-chat-history__created').text(createdShort);
		$clone.find('.c-chat-history__created').attr('title', createdLong);

		return $clone;
	},

	getChatSystemMessage: function(id, title, duration) {
		var $clone = this._cloneTemplate('t-system-message');

		$clone.attr('data-id', id);
		$clone.find('.c-chat-history__text').text(title);
		$clone.find('.c-chat-history__timer').text(duration + ' sec.');

		return $clone;
	},

	updateStickyMessage: function(id, title, duration) {
		var $stickyMessage = $('.c-chat-history__item--sticky');

		$stickyMessage.attr('data-id', id);
		$stickyMessage.find('.c-chat-history__text').text(title);
		$stickyMessage.find('.c-chat-history__timer').text(duration + ' sec.');
	}
};

function isChatHistoryScrolledToBottom() {
	var chatHistory = $('#chat-history');
	var totalScrollAvailable = chatHistory[0].scrollHeight;
	var currentScrollPosition = chatHistory.scrollTop() + chatHistory.height();

	return (currentScrollPosition >= totalScrollAvailable);
}

function showNewMessageNotice() {
	$('#chat-history-new-message').show();
}

function hideNewMessageNotice() {
	$('#chat-history-new-message').hide();
}

/**
 * Allows (optional) append a message to the chat,
 * and scrolls the chat if the chat is already
 * scrolled to the bottom before new message
 * is appended, or if force was specified
 * @param $message DOM element with new message
 * @param forceScroll Boolean
 */
function appendAndScrollChatToTopIfNeeded($message, forceScroll) {
	if (typeof forceScroll === 'undefined') {
		forceScroll = false;
	}

	var chatHistory = $('#chat-history');

	// important to take this measurement before adding the new message
	// so we know if history was scrolled *before* new message arrived
	var chatHistoryScrolledToBottom = isChatHistoryScrolledToBottom();

	if($message) {
		chatHistory.append($message);
	}

	if (chatHistoryScrolledToBottom || forceScroll) {
		chatHistory.scrollTop(999999999);
	} else {
		if($message && !$message.hasClass('c-chat-history__item--system')) {
			// show new message notice, for all non-system messages
			showNewMessageNotice();
		}
	}
}

socket.on('chat_msg', function(data) {
	addMessage(data, false);
});

socket.on('new_song', function(song) {
	var songUrlParams = queryStringToObj(song.url_params);

	renderer.updateStickyMessage(song.info.youtubeId, song.info.title, song.info.duration);
	$message = renderer.getChatSystemMessage(song.info.youtubeId, song.info.title, song.info.duration);

	appendAndScrollChatToTopIfNeeded($message);

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

socket.on('song_info', function(data) {
	if (!data.playTime) return;

	// sync song time diplayed in chat
	// find song in chat by song id attr and update template
	$timer = findSongSystemMessage(data.youtubeId).find('.c-chat-history__timer');
	$timerSticky = findSongSystemMessageSticky(data.youtubeId).find('.c-chat-history__timer');
	if (data.duration - data.playingAt > 1) {
		// more than 1 second is remaining until song ends
		$timer.text(data.playTime + ' sec.');
		$timerSticky.text(data.playTime + ' sec.');
	} else {
		// update with duration
		$timer.text(data.duration + ' sec.');
		$timerSticky.text(data.duration + ' sec.');
	}

	// sync player play time with server
	player.streamPlayingAt(data.playingAt);
});

// set currently playing song position on top of message container
// when it's not visible
// TODO: Soooo many corner cases. What if song persist more than once in the same list?
(function() {

	var stickyMessageOriginalTopCoords = false;
	var previouslyPlayingSongId = false;

	function resetStickyMessages() {
		$('.c-chat-history__item--sticky').hide();
		$('.c-chat-history__messages').removeClass('c-chat-history__messages--with-sticky');
	}

	function setStickyMessage() {
		$('.c-chat-history__item--sticky').show();
		$('.c-chat-history__messages').addClass('c-chat-history__messages--with-sticky');
	}

	function setHistoryStartMessage() {
		var $chatHistoryStart = $('#chat-history-start');
		var startMessages = [
			'It starts with one',
			'One thing, I don\'t know why',
			'It doesn\'t even matter how hard you try',
			'Keep that in mind',
			'I designed this rhyme to explain in due time',
			'All I know',
			'Time is a valuable thing',
			'Watch it fly by as the pendulum swings',
			'Watch it count down to the end of the day',
			'The clock ticks life away',
			'It\'s so unreal',
			'You didn\'t look out below',
			'Watch the time go right out the window',
			'Tryin\' to hold on, they didn\'t even know',
			'I wasted it all just to watch you go',
			'I kept everything inside',
			'And even though I tried, it all fell apart',
			'What it meant to me will eventually be a memory',
			'Of a time when I tried so hard',
			'One thing, I don\'t know why',
			'It doesn\'t even matter how hard you try',
			'Keep that in mind, I designed this rhyme',
			'To remind myself how I tried so hard',
			'It\'s part of the way you were mockin\' me',
			'Actin\' like I was part of your property',
			'Remembering all the times you fought with me',
			'I\'m surprised it got so far',
			'Things aren\'t the way they were before',
			'You wouldn\'t even recognize me anymore',
			'Not that you knew me back then',
			'But it all comes back to me in the end',
			'You kept everything inside',
			'And even though I tried, it all fell apart',
			'What it meant to me will eventually',
			'Be a memory of a time when I tried so hard'
		];
		var chosenMessages = []
		for (var i = 0; i < 3; i++) {
			chosenMessages.push(startMessages.splice(parseInt(startMessages.length*Math.random()), 1)[0]);
		}
		$chatHistoryStart.html(`<i>${chosenMessages.join('<br />')}</i>`);
	}

	function hideNewMessageNoticeIfNeeded() {
		if(isChatHistoryScrolledToBottom()) {
			hideNewMessageNotice();
		}
	}

	function setStickyMessagePosition(e) {
		// song not loaded yet, do nothing
		if (!player.instance) return;
		if (typeof player.instance.getVideoData !== 'function') return;
		if (!player.instance.getVideoData()) return;

		var currentlyPlayingSongId = player.instance.getVideoData().video_id;
		if (currentlyPlayingSongId !== previouslyPlayingSongId) {
			// song changed, reset and invalidate cached coords
			resetStickyMessages();
			stickyMessageOriginalTopCoords = false;
			previouslyPlayingSongId = currentlyPlayingSongId;
		}
		// find song in chat messages
		var $songMessage = findSongSystemMessage(currentlyPlayingSongId);

		// radio just started, no songs playing
		if(!$songMessage.length) return;

		var $chatHistory = $('#chat-history');
		var visibleVerticalCoords = {
			top: $chatHistory.scrollTop(),
			bottom: $chatHistory.scrollTop() + $chatHistory.height()
		};

		// get original position relative to parent ($chatHistory)
		var messagePosition = 0;
		if (stickyMessageOriginalTopCoords !== false) {
			messagePosition = stickyMessageOriginalTopCoords;
		} else {
			messagePosition = stickyMessageOriginalTopCoords = $songMessage.get(0).offsetTop;
		}

		// determine if message is placed (originally) in visible portion of the chat
		var belowTop = messagePosition > visibleVerticalCoords.top;
		var aboveBottom = messagePosition < visibleVerticalCoords.bottom;
		if (belowTop && aboveBottom) {
			// mesage should be placed at its original place
			resetStickyMessages();
		} else {
			// message should be on top of container
			setStickyMessage($songMessage);
		}
	}

	setHistoryStartMessage();

	// add sticky message
	var $stickyMessage = renderer._cloneTemplate('t-system-message');
	$stickyMessage.addClass('c-chat-history__item--sticky');
	$stickyMessage.hide();
	$('#chat-history').append($stickyMessage);

	$('#chat-history').on('scroll', setStickyMessagePosition);
	$('#chat-history').on('scroll', hideNewMessageNoticeIfNeeded);
	$('#chat-history-new-message').on('click', function() {
		appendAndScrollChatToTopIfNeeded(null, true);
		hideNewMessageNotice();
	});
})();

function findSongSystemMessage (youtubeId) {
	return $('.c-chat-history__item[data-id=' + youtubeId + ']:not(.c-chat-history__item--sticky)').last();
}

function findSongSystemMessageSticky (youtubeId) {
	return $('.c-chat-history__item[data-id=' + youtubeId + '].c-chat-history__item--sticky');
}

function addMessage(message, ownMessage) {
	// allows date to be passed as a string
	if (typeof message.created === 'string') {
		message.created = new Date(message.created);
	}

	var $chatHistory = $('#chat-history');
	var $message = renderer.getChatMessage(userName, message);
	appendAndScrollChatToTopIfNeeded($message, ownMessage);
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
	toastr.info(message, null, {
		positionClass: 'toast-bottom-right'
	});
});

socket.on('youtube_search', fillAutocompleteOptions);

/**
 * A soundwave animation
 */
var soundWave = {
	$element: $('.js-sound-wave'),
	play: function() {
		this.$element.removeClass('c-sound-wave--stopped');
	},
	stop: function() {
		this.$element.addClass('c-sound-wave--stopped');
	}
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
				// player paused.
				soundWave.stop();
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
				soundWave.play();
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
	},

	mute: function() {
		this.instance.mute();
	},

	unMute: function() {
		this.instance.unMute();
	},

	isMuted: function() {
		return this.instance.isMuted();
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

/* Mute controls */
$('.js-mute').on('click', function(e) {
	if (player.isMuted()) {
		player.unMute();
		$(this).find('.c-icon').removeClass('active');
		return;
	}

	player.mute();
	$(this).find('.c-icon').addClass('active');
});


/* Theme controls */
var THEME_CLASS_SUFFIX = '-theme';
var LOCAL_STORAGE_THEME_KEY = 'theme';

/**
 * Set theme button checked, according to default theme.
 * If theme previosly set in local storage, use that,
 * if not use the one set in html.
 */
var setDefaultTheme = function() {
	var theme = $('html').attr('class');
	var lastSetTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
	if (lastSetTheme) {
		theme = lastSetTheme;
		$('html').removeClass().addClass(theme);
	}
	$('#' + theme.substring(0, theme.indexOf(THEME_CLASS_SUFFIX))).prop('checked', true);
}

/**
 * Change page theme, by modifying root class.
 * Store chosen theme into localStorage.
 * @param {Object} e HTML DOM Event
 */
var changeTheme = function(e) {
	// reset all inputs
	$('.js-theme-toggle').prop('checked', false);
	var chosenInput = $(e.target);
	// set theme
	var theme = chosenInput.attr('id') + THEME_CLASS_SUFFIX;
	$('html').removeClass().addClass(theme);
	localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
	// set target
	chosenInput.prop('checked', true);
}

setDefaultTheme();

$('.js-theme-controls-toggle').on('click', function(e) {
	$(this).find('.c-icon').toggleClass('active');
	$('.js-theme-controls').toggleClass('c-theme-controls--active');
});

$('.js-theme-toggle').on('click', changeTheme);

/* Users online label toggle */
var toggleUsersOnline = function(e) {
	$(this).find('.c-icon').toggleClass('active');
	$('.js-users-count').toggleClass('u-hidden');
}
$('.js-users-online').on('click', toggleUsersOnline)

/* Tooltips mudhaflickah, powered by https://popper.js.org */
var tooltipDelay = { show: 1000, hide: 0 };
var nameChangeTooltip = new Tooltip($('.js-name-change'), {
	placement: 'right',
	title: 'Say My Name',
	delay: tooltipDelay
});
var muteTooltip = new Tooltip($('.js-mute'), {
	placement: 'left',
	title: 'Silence',
	delay: tooltipDelay
});
var themeControlsTooltip = new Tooltip($('.js-theme-controls-toggle'), {
	placement: 'right',
	title: 'Green Gucci Suit',
	delay: tooltipDelay
});
var usersOnlineTooltip = new Tooltip($('.js-users-online'), {
	placement: 'top-end',
	title: 'All The People In The World',
	delay: tooltipDelay
});
