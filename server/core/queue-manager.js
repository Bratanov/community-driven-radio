var QueueManager = function(_queue) {
	var self = this;
	var queue = _queue;

	this.attachUser = function(socket) {
		// Send current song and current queue to user
		if(queue.active && ! queue.active.isOver()) {
			var info = {url_params: queue.active.getVideoUrlParams(), info: queue.active.getInfo()};
			socket.emit('new_song', info);
			socket.emit('queue_info', queue.getInfo());
			socket.emit('related_info', queue.active.relatedVideos);
		}

		socket.on('disconnect', function() {			
			/**
			 * A user has left which would cause the
			 * sorting of the queue to potentially
			 * change, we need to let users know
			 */
			queue.triggerOnQueueChanged();
		})

		/**
		 * Attach user initiated events
		 */
		socket.on('new_song', function(data){
			// Add to queue
			queue.add(socket, data);
		});
		socket.on('delete_queued', function(data){
			// Remove from queue
			queue.delete(socket, data);
		});
	}
}

module.exports = QueueManager;