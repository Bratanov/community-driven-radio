const Logger = require('./../logger.js');

/**
 * Wordio is the thing where you guess words and stuff
 *
 * @type {Wordio}
 */
class Wordio {
	/**
	 * @param {ClientManager} clientManager for attaching to the clients events
	 * @param {Chat} chat
	 * @param {Config} config
	 * @param {IDictionary} dictionary
	 */
	constructor(clientManager, chat, config, dictionary) {
		if (config.get('wordio', 'true') !== 'true') {
			Logger.info('Wordio is disabled in config, not initializing');
			return;
		}

		this.chat = chat;
		this.dictionary = dictionary;
		this.clients = {};

		this.maxGuesses = config.get('maxGuesses', 8);
		this.wordSize = config.get('wordSize', 6);
		this.currentWord = dictionary.getDailyWord();

		this.identifier = ''+Date.now()+Math.random();

		clientManager.on('new-client', client => this.attachClient(client));
	}

	/**
	 * Subscribes a new client to kiro's events
	 * will send and receive client positions
	 *
	 * @param {Client} client
	 */
	attachClient(client) {
		this.clients[client.id] = client;
		client.wordio_state = [];

		//Bind events to this user:
		client.on('wordio_guess', data => {
			this.guess(client, data);
		});
		client.on('wordio_sync_state', states => {
			this.syncState(client, states);
		});

		client.on('disconnect', () => {
			delete this.clients[client.id];
		});
		client.emit('wordio', this.identifier);
	}

	getStateForWord(word) {
		const letters = word.split('');
		const wordCheck = this.currentWord.split('');
		// populate initial state to gray for all letters
		const states = letters.map((el) => {
			return {
				letter: el,
				state: 'gray'
			}
		});

		// check for exact/green matches
		for (let index in letters) {
			const letter = letters[index];

			if(letter === this.currentWord[index]) {
				delete wordCheck[index]; // remove found letter
				states[index].state = 'green';
			}
		}

		// check for non-exact/yellow matches
		for (let index in letters) {
			const letter = letters[index];

			const letterLocation = wordCheck.indexOf(letter);
			if (letterLocation !== -1) {
				delete wordCheck[letterLocation]; // remove found letter
				states[index].state = 'yellow';
			}
		}

		return states;
	}

	guess(client, data, silent=false) {
		if (typeof data !== 'string' || data.length !== this.wordSize) {
			if (!silent) client.emit('be_alerted', 'Nemoesh izlaga wordio kopelence!');
			return;
		}

		if (!this.dictionary.isValid(data)) {
			if (!silent) client.emit('be_alerted', 'Wordio does not recognise this word.');
			return;
		}

		if (client.wordio_state.length >= this.maxGuesses) {
			if (!silent) client.emit('be_alerted', 'You\'ve already used up your guesses, try again tomorrow (or clear cache :troll:).');
			return;
		}

		client.wordio_state.push(this.getStateForWord(data.toUpperCase()))
		client.emit('wordio_state', client.wordio_state);

		if (data.toUpperCase() === this.currentWord) {
			if (!silent) client.emit('be_alerted', `Congratulations, you have solved today's mystery! The wordio riddle today was ${data}, yey!`);
			if (!silent) this.chat.newSystemMessage('Wordio', new Date(), `Someone has just solved today's Wordio riddle in ${client.wordio_state.length} guesses! Compliments!`);
		} else {
			if (!silent) client.emit('be_alerted', `${this.maxGuesses - client.wordio_state.length} tries remaning`);
		}
	}

	syncState(client, states) {
		if (states && states.length && Array.isArray(states)) {
			for (const state of states) {
				if (state.length && Array.isArray(state)) {
					const word = state.map(el => el && el.letter).join('');

					this.guess(client, word, true);
				}
			}
		}
		client.emit('wordio_state', client.wordio_state);
	}
}

module.exports = Wordio;