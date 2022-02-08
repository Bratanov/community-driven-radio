/**
 * Kiro is here to share your cursor pointer's location with the rest of the community,
 * you can also perform a very basic drawing of specific shapes using Kiro's trails.
 *
 * @type {Chat}
 */
class Kiro {
	/**
	 *
	 * @param {ClientManager} clientManager for attaching to the clients events
	 * @param options
	 */
	constructor(clientManager, options) {
		this.pointers = {};
		this.clients = {};
		this.icons = options.icons ? options.icons.split(' ') : [];
		this.pointersDirty = false;
		this.trailRetentionTime = options.trailRetentionTime || 1000 * 30;
		this.maxTrails = options.maxTrails || 20;
		this.updateInterval = setInterval(this.update.bind(this), options.updateTime);

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

		// Send current pointers to user
		client.emit('kiro_pointers', this.pointers);
		client.kiroIcon = this.icons[parseInt(Math.random()*this.icons.length)];

		this.pointers[client.id] = {
			x: -1000,
			y: -1000,
			icon: client.kiroIcon,
			trails: []
		};

		//Bind events to this user:
		client.on('kiro_move', data => {
			data.created = Date.now();
			this.move(client, data);
		});

		client.on('kiro_trail', data => {
			data.created = Date.now();
			this.trail(client, data);
		});

		client.on('disconnect', () => {
			delete this.pointers[client.id];
			delete this.clients[client.id];
		});
	}

	/**
	 * Handles move events from the clients
	 *
	 * @param {Client} client
	 * @param {string} data Message contents
	 */
	move(client, data) {
		this.pointers[client.id] = Object.assign(this.pointers[client.id], {
			x: parseInt(data.x, 10),
			y: parseInt(data.y, 10)
		});
		this.pointersDirty = true;
	}

	/**
	 * Adds a new trail item for the client
	 *
	 * @param client
	 * @param data
	 */
	trail(client, data) {
		this.pointers[client.id].trails.unshift({
			x: parseInt(data.x, 10),
			y: parseInt(data.y, 10),
			d: data.created
		});

		this.expireTrails(client);
	}

	/**
	 * Checks if any existing trails for this client should be expired and updates them
	 *
	 * @param client
	 */
	expireTrails(client) {
		const retentionTime = 1000 * 30;
		const maxTrails = 20;
		const timeNow = Date.now();

		let startTrimTrails = maxTrails;
		for (let trailIndex in this.pointers[client.id].trails) {
			// either we reached maxTrails, or we reached the retention time
			if (trailIndex === maxTrails || this.pointers[client.id].trails[trailIndex].d < (timeNow-retentionTime)) {
				startTrimTrails = trailIndex;
				break;
			}
		}

		// prevents unnecessary cleanup and rerenders
		if (startTrimTrails >= this.pointers[client.id].trails.length) {
			return;
		}

		this.pointers[client.id].trails = this.pointers[client.id].trails.slice(0, startTrimTrails);
		this.pointersDirty = true;
	}

	/**
	 * The update loop for Kiro, responsible for sending up to date information to all clients
	 */
	update() {
		if (!Object.values(this.pointers).length || !Object.values(this.clients).length || !this.pointersDirty) {
			return;
		}

		this.pointersDirty = false;
		for (let client of Object.values(this.clients)) {
			this.expireTrails(client);

			client.emit('kiro_pointers', this.pointers);
		}
	}
}

module.exports = Kiro;