const request = require('request');
const cacheManager = require('cache-manager');
const memoryCache = cacheManager.caching({store: 'memory', max: 300, ttl: 36000/*seconds*/});
const URL_BASE = 'https://www.googleapis.com/youtube/v3/';

/**
 * Handles communication with the YoutubeAPI
 * Read their docs here: {@link https://developers.google.com/youtube/}
 *
 * @type {YoutubeApi}
 */
class YoutubeApi {
	/**
	 * @param {String} apiKey from Youtube - get one here {@link https://console.developers.google.com/apis/credentials}
	 */
	constructor(apiKey) {
		if(!apiKey) {
			throw new Error('Please specify your Youtube API key');
		}

		this.apiKey = apiKey;
	}

	/**
	 * Executes a GET request
	 *
	 * @param {String} youTubeApiRequestUrl
	 * @returns {Promise} With the JSON data from the body on resolve, error message or statusCode on reject
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

	simpleGetRequestCached(youTubeApiRequestUrl) {
		return memoryCache.wrap(youTubeApiRequestUrl, () => {
			return this.simpleGetRequest(youTubeApiRequestUrl);
		});
	}

	/**
	 * Gets YouTube API information about a video
	 * {@link https://developers.google.com/youtube/v3/docs/videos/list}
	 *
	 * @param {String} youtubeId
	 * @returns {Promise}
	 */
	getVideo(youtubeId) {
		let youTubeApiRequestUrl = `${URL_BASE}videos?id=${youtubeId}&part=contentDetails,status,snippet&key=${this.apiKey}`;
		return this.simpleGetRequestCached(youTubeApiRequestUrl);
	}

	/**
	 * Gets YouTube API information related videos to our video with youtubeId
	 * {@link https://developers.google.com/youtube/v3/docs/search/list}
	 *
	 * @param {String} youtubeId
	 * @returns {Promise}
	 */
	getRelatedVideos(youtubeId) {
		let youTubeApiRequestUrl = `${URL_BASE}search?type=video&relatedToVideoId=${youtubeId}&part=snippet&videoEmbeddable=true&key=${this.apiKey}`;
		return this.simpleGetRequestCached(youTubeApiRequestUrl);
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
		const youTubeApiRequestUrl = `${URL_BASE}search?part=snippet&q=${encodeURI(queryString)}&type=video&videoEmbeddable=true&maxResults=${maxResults}&key=${this.apiKey}`;
		return this.simpleGetRequestCached(youTubeApiRequestUrl);
	}
}

module.exports = YoutubeApi;