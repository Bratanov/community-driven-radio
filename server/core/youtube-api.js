var request = require('request');
var youTubeApi = {
	YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || console.error('Please set a YOUTUBE_API_KEY environment variable'),
	URL_BASE: 'https://www.googleapis.com/youtube/v3/',
	simpleGetRequest: function(youTubeApiRequestUrl, callbackSuccess, callbackError) {
		request(youTubeApiRequestUrl, function (error, response, body) {
		    if ( ! error && response.statusCode == 200) {
		        var data = JSON.parse(body); // Parse response from YouTube

		        if(typeof callbackSuccess === 'function') {
					callbackSuccess(data);
		        }
			} else {
				if(typeof callbackError === 'function') {
					callbackError(error);
				}
			}
		});
	},
	getVideo: function(youtubeId, callbackSuccess, callbackError) {
		var youTubeApiRequestUrl = this.URL_BASE + 'videos?id=' + youtubeId + '&part=contentDetails,status,snippet&key=' + this.YOUTUBE_API_KEY;
		this.simpleGetRequest(youTubeApiRequestUrl, callbackSuccess, callbackError);
	},
	getRelatedVideos: function(youtubeId, callbackSuccess, callbackError) {
		var youTubeApiRequestUrl = this.URL_BASE + 'search?type=video&relatedToVideoId=' + youtubeId + '&part=snippet&key=' + this.YOUTUBE_API_KEY;
		this.simpleGetRequest(youTubeApiRequestUrl, callbackSuccess, callbackError);
	}
};

module.exports = youTubeApi;