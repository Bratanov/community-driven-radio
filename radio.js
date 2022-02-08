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

const SERVER_PORT = process.env.PORT || 4000;
const io = require('./server/core/socketio-express-initializer')({
	port: SERVER_PORT
});
Logger.info('Server started successfully on port', SERVER_PORT);

const container = new ContainerBuilder();
// start the server components
container.register('ClientManager', ClientManager)
	.addArgument(io);
container.register('Queue', Queue)
	.addArgument(new Reference('ClientManager'));
container.register('VotesManager', VotesManager)
	.addArgument(new Reference('Queue'))
	.addArgument(new Reference('ClientManager'));
container.register('QueueManager', QueueManager)
	.addArgument(new Reference('Queue'))
	.addArgument(new Reference('ClientManager'));
container.register('Kiro', Kiro)
	.addArgument(new Reference('ClientManager'))
	.addArgument({
		updateTime: process.env.KIRO_UPDATE_TIME || 50,
		trailRetentionTime: process.env.KIRO_TRAIL_RETENTION_TIME || 1000*30,
		maxTrails: process.env.KIRO_MAX_TRAILS || 20,
		icons: process.env.KIRO_ICONS || '😀 😃 😄 😁 😆 😅 😂 🤣 ☺ 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👹 👺 🤡 💩 👻 💀 ☠️ 👽 👾 🤖 🎃 😺 😸 😹 😻 😼 😽 🙀 😿 😾'
	});
container.register('Chat', Chat)
	.addArgument(new Reference('ClientManager'));
container.register('Wordio', Wordio)
	.addArgument(new Reference('ClientManager'))
	.addArgument(new Reference('Chat'))
	.addArgument({
		words: process.env.WORDS_LIST || fs.readFileSync(path.resolve(__dirname, process.env.WORDS_FILENAME || 'server/core/wordio/wordio_6.csv')).toString().split("\n"),
		dailyWordPool: process.env.DAILY_WORDS_LIST || fs.readFileSync(path.resolve(__dirname, process.env.DAILY_WORDS_FILENAME || 'server/core/wordio/wordio_6.csv')).toString().split("\n"),
	});

container.compile();

Logger.info('Radio components initialized and waiting');