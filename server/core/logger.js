function getDateFormatted() {
    return new Date().toISOString();
}

module.exports = class Logger {
    static info(...args) {
        console.info(getDateFormatted(), "info:", ...args);
    }
    static error(...args) {
        console.error(getDateFormatted(), "error:", ...args);
    }
};