const chai = require('chai');
const sinon = require('sinon');
const _ = require('lodash');
const expect = chai.expect;
const Queue = require('../../../server/core/queue');
const VotesManager = require('../../../server/core/votes-manager');
const Client = require('../../../server/core/client');

const getVideoMock = require('./youtube-get-video-mock.json');

describe('Queue', function() {
	let queue;
	let client;
	let clientManager;
	let youtubeApi;
	/**
	 * A collection of a few completely random song ids that will be a valid match in a YT query
	 */
	const songIds = [
		'-gd0psCIdmM',
		'abg5DVHMAnM',
		'ROAVuLc28IY',
		'Zf25EAgFTCQ',
		'OtyVp8UuN8g',
		'ng1TapT_S9A',
		'QFdDkIkWbx0',
		'drLQH49ZjdY',
		'1Qa8UolifUw',
		'bOvy6oRBZug',
		'ZSAMUxRS9Bw',
		'C2LodZEUXi4',
		'Iz1k5A8J7qU'
	];

	describe('sorting', function() {
		beforeEach(function() {
			youtubeApi = {
				getVideo: async (videoId) => {
					const getVideoMockClone = JSON.parse(JSON.stringify(getVideoMock));
					getVideoMockClone.items[0].id = videoId;

					return getVideoMock
				}
			};
			clientManager = {
				on: sinon.stub()
			};
			queue = new Queue(clientManager, youtubeApi);
			queue.stop(); // we don't need the queue to run for those tests
		});

		beforeEach(function() {
			client = sinon.fake()
		});

		it('should sort by most recent if votes are the same', function(next) {
			const songIdsCopy = songIds.slice();

			clientManager.emitToAll = function (event, data) {
				// catch the "item added to queue" event
				if (event == 'queue_info') {
					// when all items have been added to queue
					if (songIdsCopy.length == 0) {
						// get the sorted items list (dont queue.items directly!)
						let itemsSorted = queue.getItems();
						let itemsSortedIds = _.map(itemsSorted, (song) => song.youtubeId);

						expect(itemsSortedIds).to.deep.eq(songIds);

						return next()
					} else {
						// add next item to queue
						queue.add(client, songIdsCopy.shift());
					}
				}
			};

			// add first item to queue
			queue.add(client, songIdsCopy.shift());
		});

		it('should sort highest rated first', function(next) {
			// votes manager calculates votes of clients for the queue items
			let votesManager = new VotesManager(queue, clientManager);
			// client has own votes attached
			let client1 = new Client(sinon.mock());
			votesManager.attachClient(client1);

			let songIdsCopy = songIds.slice(0, 2);
			let voteAdded = false;

			clientManager.emitToAll = function (event, data) {
				// catch the "item added to queue" event
				if (event == 'queue_info') {
					if (queue.getItems().length == 1) {
						// add second item to queue
						return queue.add(client1, songIdsCopy[1]);
					}

					// when all items have been added to queue
					if (queue.getItems().length == 2) {
						// add vote for second item
						if (!voteAdded) {
							votesManager.addVote(client1, queue.items[1].id);

							voteAdded = true;
							// update votes count manually, usually happens on a socket event
							return votesManager.recalculateVotes();
						}

						// get the sorted items list (dont queue.items directly!)
						let itemsSorted = queue.getItems();
						let itemsSortedIds = _.map(itemsSorted, (song) => song.youtubeId);

						expect(itemsSortedIds).to.deep.eq([
							songIdsCopy[1],
							songIdsCopy[0]
						]);

						return next()
					}
				}
			};

			// add first item to queue
			queue.add(client1, songIdsCopy[0]);
		});
	})
});
