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

$('body').on('click', '.add-song', function() {
	socket.emit('new_song', $(this).data('youtube-id'));
});

socket.on('chat_msg', function(data){
	addMessage(data);
});

socket.on('new_song', function(song) {
	$('#text').append('<p>Now plaing: ' + song + '</p>');
	$('#text').scrollTop(999999999);
	play(song);
});

socket.on('usersCount', function(data){
	$('#usersCount').text(data);
});

socket.on('getRefreshed', function(data){
	window.location.reload();
});

socket.on('song_info', function(data) {
	$('#song-info').html(renderSong(data));
});

socket.on('queue_info', function(data) {
	$queue_info = $('#queue-info');
	$queue_info.html('<ol></ol>');
	$queue_info = $queue_info.find('ol');

	for(var song in data) {
		$queue_info.append('<li>' + renderSong(data[song]) + '</li>');
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

function play(thingie) {
	$('iframe').attr('src', 'https://www.youtube.com/embed/' + thingie);
}

function addMessage(message) {
	$('#text').append('<p>Message: '+ $('<div/>').text(message).html() +'</p>');

	$('#text').scrollTop(999999999);
}
