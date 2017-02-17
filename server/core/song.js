var Song = function(youtubeId, title, duration, addedBy) {
	var self = this;
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

	var startedPlayingAt = null;
	var shouldStopPlayingAt = null;

	/**
	 * Marks this song as currently playing
	 */
	this.play = function() {
		startedPlayingAt = Date.now();
		shouldStopPlayingAt = startedPlayingAt + this.duration;
	}

	/**
	 * @return {Boolean} If the song should have stopped playing by now
	 */
	this.isOver = function() {
		// Not started yet
		if( ! startedPlayingAt) {
			return true;
		}

		return this.getEndsInMs() <= 0;
	}

	this.getEndsInMs = function() {
		return shouldStopPlayingAt - Date.now();
	}

	this.getDurationInSec = function() {
		return parseInt(this.duration / 1000);
	}

	/**
	 * Get the current seek time in seconds
	 *
	 * @return {int} Seconds after this song should have started
	 */
	this.getCurrentSeekPosition = function() {
		return Math.max(0, parseInt((Date.now() - startedPlayingAt) / 1000));
	}

	/**
	 * Those params can be inserted after youtube.com/embed/
	 * and are sent to the end users to play the video with
	 *
	 * @return {string} Include video id, autoplay and time (if needed)
	 */
	this.getVideoUrlParams = function() {
		return this.youtubeId + '?' +
			'autoplay=1&controls=0&' +
			'start=' + this.getCurrentSeekPosition();
	}

	/**
	 * Returns a summary of a song for display to
	 * users. When playing it includes the time
	 * played and when over the total duration
	 *
	 * @return {string}
	 */
	this.getInfo = function() {
		return {
			id: this.id,
			title: this.title,
			youtubeId: this.youtubeId,
			playingAt: this.getCurrentSeekPosition(),
			duration: this.getDurationInSec(),
			playTime: ( ! this.isOver()) ? (this.getCurrentSeekPosition() + '/' + this.getDurationInSec()) : false,
			addedBy: this.addedBy.id,
			votes: this.votes
		}
	}

	/**
	 * Sets the total number of votes this song
	 * currently has, meant to be used by the
	 * votes manager, not directly anywhere
	 *
	 * @param {integer} votesCount
	 */
	this.setVotes = function(votesCount) {
		self.votes = votesCount;
	}
}
module.exports = Song;