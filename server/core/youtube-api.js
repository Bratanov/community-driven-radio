const request = require('request');
const URL_BASE = 'https://www.googleapis.com/youtube/v3/';

/**
 * TODO: docs
 */
class YoutubeApi {
	constructor(apiKey) {
		if(!apiKey) {
			throw new Error('Please specify your Youtube API key');
		}

		this.apiKey = apiKey;
	}

	/**
	 * @param youTubeApiRequestUrl
	 * @returns {Promise}
	 */
	simpleGetRequest(youTubeApiRequestUrl) {
		return new Promise((resolve, reject) => {
			request(youTubeApiRequestUrl, (error, response, body) => {
				if (!error && response.statusCode === 200) {
					let data = JSON.parse(body); // Parse response from YouTube

					resolve(data);
				} else {
					reject(error || response.statusCode);
				}
			});
		});
	}

	/**
	 *
	 * @param youtubeId
	 * @returns {Promise}
	 */
	getVideo(youtubeId) {
		let youTubeApiRequestUrl = `${URL_BASE}videos?id=${youtubeId}&part=contentDetails,status,snippet&key=${this.apiKey}`;
		return this.simpleGetRequest(youTubeApiRequestUrl);
	}

	/**
	 * @param youtubeId
	 * @returns {Promise}
	 */
	getRelatedVideos(youtubeId) {
		let youTubeApiRequestUrl = `${URL_BASE}search?type=video&relatedToVideoId=${youtubeId}&part=snippet&key=${this.apiKey}`;
		return this.simpleGetRequest(youTubeApiRequestUrl);
	}
}

module.exports = YoutubeApi;