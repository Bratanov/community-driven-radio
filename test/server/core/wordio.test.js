const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const Wordio = require('../../../server/core/wordio');
const Config = require('../../../server/core/config');

describe('Wordio', function() {
	let clientManager;
	let chat;
	let config;

	beforeEach(function() {
		clientManager = sinon.stub();
		clientManager.on = sinon.stub();
		chat = sinon.stub();
		chat.newSystemMessage = sinon.stub();
		config = new Config({
			wordio: 'true',
			words: ['клитор', 'опържа', 'работа']
		});
	});

	afterEach(function() {
	});

	it('should guess word states correctly', async () => {
		const wordio = new Wordio(clientManager, chat, config);
		wordio.currentWord = 'ОПЪРЖА';
		const client = {
			on: sinon.stub(),
			emit: sinon.stub()
		};

		wordio.attachClient(client);
		wordio.guess(client, 'клитор');

		expect(client.wordio_state.length).to.eq(1);
		expect(client.wordio_state[0]).to.deep.eq([{
			letter: 'К',
			state: 'gray'
		}, {
			letter: 'Л',
			state: 'gray'
		}, {
			letter: 'И',
			state: 'gray'
		}, {
			letter: 'Т',
			state: 'gray'
		}, {
			letter: 'О',
			state: 'yellow'
		}, {
			letter: 'Р',
			state: 'yellow'
		}]);

		sinon.assert.calledWithExactly(client.emit, 'wordio_state', client.wordio_state);
		sinon.assert.calledWithExactly(client.emit, 'be_alerted', '7 tries remaning');

		// reset calls, to check for the new ones after
		client.emit.reset();

		// this word has two A's, one is at the correct spot, the other one is not, and the currentWord
		// has only one A. The second letter A should be green and the first letter A should be gray,
		// because there's only 1 A and the green match should receive priority over the yellow one.
		wordio.guess(client, 'работа');

		expect(client.wordio_state.length).to.eq(2);
		expect(client.wordio_state[1]).to.deep.eq([{
			letter: 'Р',
			state: 'yellow'
		}, {
			letter: 'А',
			state: 'gray'
		}, {
			letter: 'Б',
			state: 'gray'
		}, {
			letter: 'О',
			state: 'yellow'
		}, {
			letter: 'Т',
			state: 'gray'
		}, {
			letter: 'А',
			state: 'green'
		}]);

		sinon.assert.calledWithExactly(client.emit, 'wordio_state', client.wordio_state);
		sinon.assert.calledWithExactly(client.emit, 'be_alerted', '6 tries remaning');

		// reset calls, to check for the new ones after
		client.emit.reset();

		// also check capitalization is ignored
		wordio.guess(client, 'оПъРжА');

		expect(client.wordio_state.length).to.eq(3);
		expect(client.wordio_state[2]).to.deep.eq([{
			letter: 'О',
			state: 'green'
		}, {
			letter: 'П',
			state: 'green'
		}, {
			letter: 'Ъ',
			state: 'green'
		}, {
			letter: 'Р',
			state: 'green'
		}, {
			letter: 'Ж',
			state: 'green'
		}, {
			letter: 'А',
			state: 'green'
		}]);

		sinon.assert.calledWithExactly(client.emit, 'wordio_state', client.wordio_state);
		sinon.assert.calledWithExactly(client.emit, 'be_alerted', 'Congratulations, you have solved today\'s mystery! The wordio riddle today was оПъРжА, yey!');
		sinon.assert.calledWithExactly(chat.newSystemMessage, 'Wordio', sinon.match.any, 'Someone has just solved today\'s Wordio riddle in 3 guesses! Compliments!')
	});
});
