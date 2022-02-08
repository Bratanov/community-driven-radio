/**
 * Wordio is the thing where you guess words and stuff
 *
 * @type {Chat}
 */
class Wordio {
	/**
	 * @param {ClientManager} clientManager for attaching to the clients events
	 * @param {Chat} chat
	 * @param options
	 */
	constructor(clientManager, chat, options) {
		this.chat = chat;
		this.words = options && options.words || [];

		// sanitize words
		this.words = this.words.map(el => el.toUpperCase().trim());

		const dailyWordPool = options && options.dailyWordPool || this.words;
		this.clients = {};

		this.maxGuesses = options && options.maxGuesses || 8;
		this.wordSize = options && options.wordSize || 6;
		this.currentWord = dailyWordPool[parseInt(Math.random()*dailyWordPool.length)].toUpperCase().trim();

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

		client.on('disconnect', () => {
			delete this.clients[client.id];
		});
	}

	getStateForWord(word) {
		const states = [];
		const letters = word.split('');
		const wordCheck = this.currentWord.split('');

		for (let index in letters) {
			const letter = letters[index];
			let state = 'gray';

			const letterLocation = wordCheck.indexOf(letter);
			if (letterLocation != -1) {
				wordCheck.splice(letterLocation, 1);

				if(letter == this.currentWord[index]) {
					state = 'green';
				} else {
					state = 'yellow';
				}
			}

			states.push({
				letter,
				state
			});
		}

		return states;
	}

	guess(client, data) {
		if (typeof data !== 'string' || data.length != this.wordSize) {
			client.emit('be_alerted', 'Nemoesh izlaga wordio kopelence!');
			return;
		}

		if (!this.words.includes(data.toUpperCase())) {
			client.emit('be_alerted', 'Wordio does not recognise this word.');
			return;
		}

		if (client.wordio_state.length >= this.maxGuesses) {
			client.emit('be_alerted', 'You\'ve already used up your guesses, try again tomorrow (or refresh the page :troll:).');
			return;
		}

		client.wordio_state.push(this.getStateForWord(data.toUpperCase()));
		client.emit('wordio_state', client.wordio_state);

		if (data.toUpperCase() === this.currentWord) {
			client.emit('be_alerted', `Congratulations, you have solved today's mystery! The wordio riddle today was ${data}, yey!`);
		} else {
			client.emit('be_alerted', `${this.maxGuesses - client.wordio_state.length} tries remaning`);
		}
	}
}

module.exports = Wordio;