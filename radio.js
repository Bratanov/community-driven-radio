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
config.set('words', process.env.WORDS_LIST || fs.readFileSync(path.resolve(__dirname, process.env.WORDS_FILENAME || 'server/core/wordio/wordio_6.csv')).toString().split("\n"));
config.set('dailyWordPool', process.env.DAILY_WORDS_LIST || fs.readFileSync(path.resolve(__dirname, process.env.DAILY_WORDS_FILENAME || 'server/core/wordio/wordio_6.csv')).toString().split("\n"));

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
	.addArgument(new Reference('Config'));

container.compile();

Logger.info('Radio components initialized and waiting');