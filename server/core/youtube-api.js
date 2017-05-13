const request = require('request');
const URL_BASE = 'https://www.googleapis.com/youtube/v3/';

module.exports = class YoutubeApi {
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
		let youTubeApiRequestUrl = `${URL_BASE}search?type=video&relatedToVideoId=${youtubeId}&part=snippet&videoEmbeddable=true&key=${this.apiKey}`;
		return this.simpleGetRequest(youTubeApiRequestUrl);
	}

	/**
	 * Returns video results that match the query string
	 * {@link https://developers.google.com/youtube/v3/docs/search/list}
	 *
	 * @param {String} queryString
	 * @param {Number} [Optional] maxResults
	 * @returns {Promise}
	 */
	search(queryString, maxResults = 10) {
		const youTubeApiRequestUrl = `${URL_BASE}search?part=snippet&q=${queryString}&type=video&videoEmbeddable=true&maxResults=${maxResults}&key=${this.apiKey}`;
		return this.simpleGetRequest(youTubeApiRequestUrl);
	}
};