/**
 * Handles events from users that are intended to the
 * {@link Queue} and sends initial {@link Queue} info to each {@link Client}.
 *
 * @type {QueueManager}
 */
class QueueManager {
	/**
	 * @param {Queue} queue The Queue that is handled by this manager
	 */
	constructor(queue) {
		this.queue = queue;
	}

	/**
	 * Adds a client to the Queue. Note that
	 * clients are not added to the Queue
	 * directly, but to the QueueManager
	 *
	 * @param {Client} client
	 */
	attachClient(client) {
		// Send current song and current queue to user
		if(this.queue.active && ! this.queue.active.isOver()) {
			let info = {
				url_params: this.queue.active.getVideoUrlParams(),
				info: this.queue.active.getInfo()
			};
			client.emit('new_song', info);
			client.emit('queue_info', this.queue.getInfo());
			client.emit('related_info', this.queue.active.relatedVideos);
		}

		client.on('disconnect', () => {
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
		client.on('new_song', data => {
			// Add to queue
			this.queue.add(client, data);
		});
		client.on('delete_queued', data => {
			// Remove from queue
			this.queue.deleteItem(client, data);
		});
	}
}

module.exports = QueueManager;