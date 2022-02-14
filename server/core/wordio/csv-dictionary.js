const fs = require('fs');
const path = require('path');

const { Dictionary } = require('./dictionary');

class CsvDictionary extends Dictionary {
	constructor(wordsCsvFile, dailyWordsCsvFile) {
		let words = fs.readFileSync(path.resolve(__dirname, wordsCsvFile)).toString().split("\n");
		let dailyWords = fs.readFileSync(path.resolve(__dirname, dailyWordsCsvFile)).toString().split("\n");

		super(words, dailyWords);
	}
}

module.exports = CsvDictionary;