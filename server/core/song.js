const Logger = require('./logger.js');
const MAX_DURATION = process.env.MAX_DURATION || 5;

/**
 * Contains information about a song in the queue, or an active song
 *
 * @property {String} id A unique identification for this song
 * @property {String} youtubeId
 * @property {Number} duration In milliseconds, limited to 5min
 * @property {String} title
 * @property {Array} relatedVideos Info about related videos, populated after {@link this.loadRelatedVideos} is called
 * @property {Client} addedBy
 * @property {Number} votes The amount of Clients voted for this song, set by {@link VotesManager.recalculateVotes}
 * @type {Song}
 */
class Song {
	/**
	 * @param {YoutubeApi} youtubeApi - dependency, for fetching related songs
	 * @param {String} youtubeId
	 * @param {String} title
	 * @param {Number} duration in milliseconds, parsed from Youtube response in {@link Queue.add}
	 * @param {Client} addedBy
	 */
	constructor(youtubeApi, youtubeId, title, duration, addedBy) {
		this.youtubeApi = youtubeApi;

		/**
		 * Generate a unique id for the song
		 * It doesn't have to be very random
		 */
		this.id = Date.now().toString() + parseInt(Math.random() * 100000000000).toString();
		this.youtubeId = youtubeId;
		this.duration = duration;
		this.title = title;
		this.relatedVideos = [];
		this.addedBy = addedBy;
		this.votes = 0;

		// Limit duration of a song to 5min
		this.duration = Math.min(this.duration, MAX_DURATION * 60 * 1000);

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

	/**
	 * @returns {Number} The time it would take for the song to end in milliseconds
	 */
	getEndsInMs() {
		return this.shouldStopPlayingAt - Date.now();
	}

	/**
	 * @returns {Number} The total time this song would run, if played, in seconds
	 */
	getDurationInSec() {
		return parseInt(this.duration / 1000);
	}

	/**
	 * Get the current seek time in seconds
	 *
	 * @return {Number} Seconds after this song should have started
	 */
	getCurrentSeekPosition() {
		return Math.max(0, parseInt((Date.now() - this.startedPlayingAt) / 1000));
	}

	/**
	 * Those params can be inserted after youtube.com/embed/
	 * and are sent to the end users to play the video with
	 *
	 * @return {String} Includes video id, autoplay, disabled controls and start time (if needed)
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
	 * @param {Number} votesCount
	 */
	setVotes(votesCount) {
		this.votes = votesCount;
	}

	/**
	 * Loads the {@link this.relatedVideos} info for this song.
	 * Every related video info includes: { youtubeId: String, title: String }
	 *
	 * @param {Function} callback Called after loading is done, no parameters
	 */
	loadRelatedVideos(callback) {
		// Load and add related videos in the this.relatedVideos array
		this.youtubeApi.getRelatedVideos(this.youtubeId).then(data => {
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
		}).catch(err => {
            Logger.error('Song-loadRelatedVideos error', err);
		});
	}
}

module.exports = Song;
