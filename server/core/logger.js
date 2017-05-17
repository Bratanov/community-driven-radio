/**
 * @private
 * @returns {String} Returns the ISO formatted date
 */
function getDateFormatted() {
	return new Date().toISOString();
}

/**
 * Used to log to console. Will prepend the
 * date and the type of log to the output
 *
 * @type {Logger}
 */
class Logger {
	/**
	 * @param args Redirected to console.info
	 */
	static info(...args) {
		console.info(getDateFormatted(), 'info:', ...args);
	}
	/**
	 * @param args Redirected to console.error
	 */
	static error(...args) {
		console.error(getDateFormatted(), 'error:', ...args);
	}
}

module.exports = Logger;