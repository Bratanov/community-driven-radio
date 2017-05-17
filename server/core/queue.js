const moment = require('moment');
const Song = require('./song.js');
const Logger = require('./logger.js');
const YoutubeApi = require('./youtube-api.js');
const youTubeApi = new YoutubeApi(process.env.YOUTUBE_API_KEY);

module.exports = class Queue {

	constructor(clientManager) {
		this.items = [];
		this.active = null;
		this.relatedVideoIsLoading = false;

		let queueInterval = null;

		/**
		 * When the queue changes we want to
		 * broadcast the new queue to all
		 * users so they're up-to-date
		 */
		let onQueueChanged = () => {
			// Send queue info:
			clientManager.emitToAll('queue_info', this.getInfo());
		};

		let onRelatedChanged = song => {
			// Send queue info:
			clientManager.emitToAll('related_info', song.relatedVideos);
		};

		this.emitToAll = (event, data) => {
			clientManager.emitToAll(event, data);
		};

		/**
		 * Use this to manually trigger an update to the queue/positions
		 * and display it to all users. Can be used for example when a
		 * user disconnects and we want to update visually the queue
		 */
		this.triggerOnQueueChanged = () => {
			onQueueChanged();
		};

		this.triggerOnRelatedChanged = song => {
			onRelatedChanged(song);
		};

		this.run();
	}

	/**
	 * Returns the items in the queue
	 * sorted by the priority based
	 * on the votes of the users
	 *
	 * @return {Array} Array of song items, sorted by votes/pos
	 */
	getItems() {
		// Make a fresh copy of the original items
		let copyItems = this.items.slice();

		// sort by votes
		copyItems.sort((item1, item2) => {
			if(item1.votes > item2.votes) {
				return -1;
			}

			if(item1.votes < item2.votes) {
				return 1;
			}

			return 0;
		});

		return copyItems;
	}

	getInfo() {
		let queueInfo = [];
		let queueSortedItems = this.getItems();

		for(let item of queueSortedItems) {
			// Get info for the song
			let songInfo = item.getInfo();

			queueInfo.push(songInfo);
		}

		return queueInfo;
	}

	add(userSocket, videoId) {
		// check if song is already playing, prevent adding
		if(this.active && this.active.youtubeId === videoId) {
			userSocket.emit('be_alerted', 'This song is currently playing.');

			return;
		}

		// check if song already exists in queue, prevent adding
		for(let queueItem of this.getItems()) {
			if(queueItem.youtubeId === videoId) {
				userSocket.emit('be_alerted', 'This song is already in the queue. Try voting for it instead.');

				return;
			}
		}

		youTubeApi.getVideo(videoId).then(data => {
			if (data.pageInfo.totalResults > 0) {
				if( ! data.items[0].status.embeddable) {
					userSocket.emit('be_alerted', `Sorry, the video with ID: ${videoId} is not embeddable. Try adding a different one.`);
					return;
				}

				var regionRestriction = data.items[0].contentDetails.regionRestriction;
				if (
					regionRestriction && 
					regionRestriction.blocked &&
					regionRestriction.blocked.includes('BG')) {
					userSocket.emit('be_alerted', `Sorry, the video is blocked for watching in Bulgaria. Try a different one.`);
					return;
				}

				let title = data.items[0].snippet.title;
				let resultDuration = data.items[0].contentDetails.duration;
				let durationInMs = moment.duration(resultDuration).asMilliseconds();

				this.items.push(new Song(videoId, title, durationInMs, userSocket));

				this.triggerOnQueueChanged();
			}
		}).catch(error => {
            Logger.error('Queue-add error', error);
		});
	}

	deleteItem(userSocket, videoId) {
		let song = this.items.filter((item) => {
			return item.id === videoId;
		});
		if (! song.length) {
			return;
		}

		song = song[0];
		if (song.addedBy.id === userSocket.id) {
			let index = this.items.indexOf(song);
			this.items.splice(index, 1);

			this.triggerOnQueueChanged();
		}
	}

	work() {
		if(this.active === null || this.active.isOver()) {
			// When nothing is in the queue
			if(this.items.length === 0) {
				if(this.relatedVideoIsLoading) {
					// Wait for the related video to load
					return;
				}

				// Add the first related video to queue (asynchronous!)
				if(this.active !== null && this.active.relatedVideos.length) {
					this.add({}, this.active.relatedVideos[0].youtubeId);
					this.relatedVideoIsLoading = true;
				}

				// Nothing active or no related videos found
				return;
			}
			// Reset the value of the flag, used when loading related videos on empty queue
			this.relatedVideoIsLoading = false;

			// The next song would be the first one from the sorted queue
			let newSong = this.getItems().shift();

			// Remove the song we just took - from the original items array
			let newSongIndexInQueue = this.items.indexOf(newSong);
			this.items.splice(newSongIndexInQueue, 1);

			this.triggerOnQueueChanged();

			newSong.play();

			this.active = newSong;

			// Load related videos for newly played active song
			this.active.loadRelatedVideos(() => {
				this.triggerOnRelatedChanged(this.active);
			});

			// Emit to all users:
			let info = {
				url_params: this.active.getVideoUrlParams(),
				info: this.active.getInfo()
			};

			this.emitToAll('new_song', info);
		}

		// Send current song info:
		let newSongInfo = this.active.getInfo();
		this.emitToAll('song_info', newSongInfo);
	}

	run() {
		/**
		 * Schedule work every second
		 * the queue will check its
		 * items and do its magic
		 */
		this.queueInterval = setInterval(() => {
			this.work();
		}, 1000);
	}

	stop() {
		clearInterval(this.queueInterval);
	}
};