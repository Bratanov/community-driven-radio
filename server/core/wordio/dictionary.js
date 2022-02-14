class IDictionary {
	getDailyWord() {};
	isValid(word) {};
}

class Dictionary extends IDictionary {
	constructor(words, dailyWords) {
		super();

		this.words = words.map(el => el.toUpperCase().trim());
		this.dailyWords = dailyWords.map(el => el.toUpperCase().trim());
	}

	getDailyWord() {
		return this.dailyWords[parseInt(Math.random()*this.dailyWords.length)].toUpperCase().trim();
	}

	isValid(word) {
		return this.words.includes(word.toUpperCase());
	}
}

module.exports = { Dictionary, IDictionary };