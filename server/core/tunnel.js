const localtunnel = require('localtunnel');

const Logger = require('./logger.js');

class Tunnel {
    constructor(subdomain, port) {
        this.subdomain = subdomain;
        this.port = port;
    }

    async start() {
        this.starting = true;
        Logger.info(`Starting tunnel for port ${this.port}, subdomain: ${this.subdomain}`);
        this.currentTunnel = await localtunnel({ port: this.port, subdomain: this.subdomain });
        Logger.info(`Tunnel started on: ${this.currentTunnel.url}`);

        this.currentTunnel.on('close', (e) => {
            Logger.error(`Tunnel closed, restarting..`, e);
            // restart the tunnel
            this.restart();
        });
        this.currentTunnel.on('error', (e) => {
            Logger.error(`Tunnel error, restarting..`, e);
            // restart the tunnel
            this.restart();
        });

        this.starting = false;
    }

    async restart() {
        if (this.starting) {
            Logger.info(`Tunnel is already starting, ignoring a restart request`);
            return;
        }

        if (this.currentTunnel) {
            try {
                await this.currentTunnel.close();
            } catch (e) {
                Logger.error('Error closing tunnel, ignoring and continuing', e);
            }
        }

        return this.start();
    }
}

module.exports = Tunnel;