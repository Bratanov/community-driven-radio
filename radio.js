// load environment variables from .env file
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { ContainerBuilder, Reference } = require('node-dependency-injection');

const Queue = require('./server/core/queue.js');
const QueueManager = require('./server/core/queue-manager.js');
const VotesManager = require('./server/core/votes-manager.js');
const Chat = require('./server/core/chat.js');
const Kiro = require('./server/core/kiro.js');
const Wordio = require('./server/core/wordio');
const Logger = require('./server/core/logger.js');
const ClientManager = require('./server/core/client-manager.js');
const YoutubeApi = require('./server/core/youtube-api.js');
const Config = require('./server/core/config.js');
const { Dictionary } = require('./server/core/wordio/dictionary');
const CsvDictionary = require('./server/core/wordio/csv-dictionary');

const container = new ContainerBuilder();
container.register('Config', Config);
const config = container.get('Config');
config.set('port', process.env.PORT);

// Kiro configuration variables
config.set('kiro', process.env.KIRO, 'true');
config.set('updateTime', process.env.KIRO_UPDATE_TIME, 50);
config.set('trailRetentionTime', process.env.KIRO_TRAIL_RETENTION_TIME, 1000*30);
config.set('maxTrails', process.env.KIRO_MAX_TRAILS, 20);
config.set('icons', process.env.KIRO_ICONS, '😀 😃 😄 😁 😆 😅 😂 🤣 ☺ 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👹 👺 🤡 💩 👻 💀 ☠️ 👽 👾 🤖 🎃 😺 😸 😹 😻 😼 😽 🙀 😿 😾');

// Wordio configuration variables
config.set('wordio', process.env.WORDIO, 'true');

if (process.env.WORDS_LIST) {
	Logger.info('Loading dictionary from provided csv word list');
	container.register('Dictionary', Dictionary)
		.addArgument(process.env.WORDS_LIST.split(','))
		.addArgument((process.env.DAILY_WORDS_LIST || process.env.WORDS_LIST).split(','));
} else if (process.env.WORDS_FILENAME) {
	Logger.info('Loading dictionary from provided CSV file');
	container.register('Dictionary', CsvDictionary)
		.addArgument(process.env.WORDS_FILENAME)
		.addArgument(process.env.DAILY_WORDS_FILENAME || process.env.WORDS_FILENAME);
} else {
	Logger.info('Loading default dictionary');
	// default dictionary if none provided
	container.register('Dictionary', CsvDictionary)
		.addArgument('wordio_6.csv')
		.addArgument('wordio_6.csv');
}

const io = require('./server/core/socketio-express-initializer')(config);

container.register('YoutubeApi', YoutubeApi)
	.addArgument(process.env.YOUTUBE_API_KEY);
// start the server components
container.register('ClientManager', ClientManager)
	.addArgument(new Reference('YoutubeApi'))
	.addArgument(io);
container.register('Queue', Queue)
	.addArgument(new Reference('ClientManager'))
	.addArgument(new Reference('YoutubeApi'));
container.register('VotesManager', VotesManager)
	.addArgument(new Reference('Queue'))
	.addArgument(new Reference('ClientManager'));
container.register('QueueManager', QueueManager)
	.addArgument(new Reference('Queue'))
	.addArgument(new Reference('ClientManager'));
container.register('Kiro', Kiro)
	.addArgument(new Reference('ClientManager'))
	.addArgument(new Reference('Config'));
container.register('Chat', Chat)
	.addArgument(new Reference('ClientManager'));
container.register('Wordio', Wordio)
	.addArgument(new Reference('ClientManager'))
	.addArgument(new Reference('Chat'))
	.addArgument(new Reference('Config'))
	.addArgument(new Reference('Dictionary'));

container.compile();

Logger.info('Radio components initialized and waiting');