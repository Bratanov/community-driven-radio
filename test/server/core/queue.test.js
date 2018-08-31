const chai = require('chai');
const sinon = require('sinon');
const _ = require('lodash');
const expect = chai.expect;
const Queue = require('../../../server/core/queue');

describe('Queue', function() {
	let queue;
	let client;
	let clientManager;
	/**
	 * A collection of a few completely random song igs that will be a valid match in a YT query
	 */
	let songIds = [
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
			clientManager = {};
			queue = new Queue(clientManager);
			queue.stop(); // we don't need the queue to run for those tests
		});

		beforeEach(function() {
			client = sinon.fake()
		});

		it('should sort by most recent if votes are the same', function(next) {
			let songIdsCopy = songIds.slice();

			clientManager.emitToAll = function (event, data) {
				// catch the "item added to queue" event
				if (event == 'queue_info') {
					// when all items have been added to queue
					if (songIdsCopy.length == 0) {
						// get the sorted items list (dont queue.items directly!)
						let itemsSorted = queue.getItems();
						itemsSortedIds = _.map(itemsSorted, (song) => song.youtubeId);

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
	})
});
