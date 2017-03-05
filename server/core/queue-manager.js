module.exports = class QueueManager {
	constructor(queue) {
		this.queue = queue;
	}

	attachUser(socket) {
		// Send current song and current queue to user
		if(this.queue.active && ! this.queue.active.isOver()) {
			let info = {
				url_params: this.queue.active.getVideoUrlParams(),
				info: this.queue.active.getInfo()
			};
			socket.emit('new_song', info);
			socket.emit('queue_info', this.queue.getInfo());
			socket.emit('related_info', this.queue.active.relatedVideos);
		}

		socket.on('disconnect', () => {
			/**
			 * A user has left which would cause the
			 * sorting of the queue to potentially
			 * change, we need to let users know
			 */
			this.queue.triggerOnQueueChanged();
		});

		/**
		 * Attach user initiated events
		 */
		socket.on('new_song', data => {
			// Add to queue
			this.queue.add(socket, data);
		});
		socket.on('delete_queued', data => {
			// Remove from queue
			this.queue.deleteItem(socket, data);
		});
	}
};