class Config {
	constructor() {
		this.values = {};
	}

	get(key, defaultValue) {
		if (!key in this.values || typeof this.values[key] === 'undefined') {
			return defaultValue;
		}

		return this.values[key];
	}

	set(key, value, defaultValue) {
		if (typeof value === 'undefined') {
			value = defaultValue;
		}

		this.values[key] = value;
	}
}

module.exports = Config;