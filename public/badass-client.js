
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
	
	socket.on('chat_msg', function(data){
		addMessage(data);
	});

	socket.on('new_song', function(song) {
		$('#text').prepend('<p>Now plaing: '+song+'</p>');
		play(song);
		console.log(song);
	});

	socket.on('usersCount', function(data){
		$('#usersCount').text(data);
	});

	socket.on('getRefreshed', function(data){
		window.location.reload();
	});

	socket.on('song_info', function(data) {
		$('#song-info').text(data);
	});

	socket.on('queue_info', function(data) {
		$queue_info = $('#queue-info');
		$queue_info.html('<ol></ol>');
		$queue_info = $queue_info.find('ol');

		for(var song in data) {
			$queue_info.append('<li>' + data[song] + '</li>');
		}
	});

	function play(thingie) {
		$('iframe').attr('src', 'https://www.youtube.com/embed/' + thingie);
	}

	function addMessage(message) {
		$('#text').append('<p>Message: '+ $('<div/>').text(message).html() +'</p>');

		$('#text').scrollTop(999999999);
	}