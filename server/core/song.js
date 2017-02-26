const youTubeApi = require('./youtube-api.js');

module.exports = class Song {
	constructor(youtubeId, title, duration, addedBy) {
		/**
		 * Generate a unique id for the song
		 * Doesn't have to be very random
		 * @type {string}
		 */
		this.id = Date.now().toString() + parseInt(Math.random() * 100000000000).toString();
		this.youtubeId = youtubeId;
		this.duration = duration;
		this.title = title;
		this.relatedVideos = [];
		this.addedBy = addedBy;
		this.votes = 0;

        // Limit duration of a song to 5min
        this.duration = Math.min(this.duration, 5 * 60 * 1000);

        // Internally used (private-ish)
        this.startedPlayingAt = null;
        this.shouldStopPlayingAt = null;
	}

	/**
	 * Marks this song as currently playing
	 */
	play() {
		this.startedPlayingAt = Date.now();
		this.shouldStopPlayingAt = this.startedPlayingAt + this.duration;
	}

	/**
	 * @return {Boolean} If the song should have stopped playing by now
	 */
	isOver() {
		// Not started yet
		if( ! this.startedPlayingAt) {
			return true;
		}

		return this.getEndsInMs() <= 0;
	}

	getEndsInMs() {
		return this.shouldStopPlayingAt - Date.now();
	}

	getDurationInSec() {
		return parseInt(this.duration / 1000);
	}

	/**
	 * Get the current seek time in seconds
	 *
	 * @return {int} Seconds after this song should have started
	 */
	getCurrentSeekPosition() {
		return Math.max(0, parseInt((Date.now() - this.startedPlayingAt) / 1000));
	}

	/**
	 * Those params can be inserted after youtube.com/embed/
	 * and are sent to the end users to play the video with
	 *
	 * @return {string} Include video id, autoplay and time (if needed)
	 */
	getVideoUrlParams() {
		return `${this.youtubeId}?autoplay=1&controls=0&start=$(this.getCurrentSeekPosition()}`;
	}

	/**
	 * Returns a summary of a song for display to
	 * users. When playing it includes the time
	 * played and when over the total duration
	 *
	 * @return {Object}
	 */
	getInfo() {
		return {
			id: this.id,
			title: this.title,
			youtubeId: this.youtubeId,
			playingAt: this.getCurrentSeekPosition(),
			duration: this.getDurationInSec(),
			playTime: ( ! this.isOver()) ? (`${this.getCurrentSeekPosition()}/${this.getDurationInSec()}`) : false,
			addedBy: this.addedBy.id,
			votes: this.votes
		};
	}

	/**
	 * Sets the total number of votes this song
	 * currently has, meant to be used by the
	 * votes manager, not directly anywhere
	 *
	 * @param {int} votesCount
	 */
	setVotes(votesCount) {
		this.votes = votesCount;
	}

	loadRelatedVideos(callback) {
		// Load and add related videos in the self.relatedVideos array
		youTubeApi.getRelatedVideos(this.youtubeId, data => {
			if(data.pageInfo.totalResults > 0 && data.items.length) {
				for(let item of data.items) {
					// The data we need from the YouTube response
					let relatedVideoInfo = {
						youtubeId: item.id.videoId,
						title: item.snippet.title
					};

					this.relatedVideos.push(relatedVideoInfo);
				}

				return callback();
			}
		});
	}
};