import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

import { createServer } from 'vite';
import net from 'net';

async function start() {
  try {
    const server = await createServer({
      root: __dirname,
      configFile: path.resolve(__dirname, 'vite.config.js'),
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
    });
    await server.listen();
    server.printUrls();

    // Dual-stack IPv6 forwarder on [::1]:3000 -> 127.0.0.1:3000
    try {
      const ipv6Server = net.createServer((socket) => {
        const client = net.createConnection({ host: '127.0.0.1', port: 3000 }, () => {
          socket.pipe(client);
          client.pipe(socket);
        });
        client.on('error', () => socket.destroy());
        socket.on('error', () => client.destroy());
      });
      ipv6Server.listen(3000, '::1', () => {
        console.log('Dual-stack IPv6 forwarder active on [::1]:3000');
      });
      ipv6Server.on('error', () => {});
    } catch (_) {}

    console.log('SecureScan Frontend running on http://localhost:3000 and http://127.0.0.1:3000');
  } catch (e) {
    console.error('Failed to start Vite:', e);
    process.exit(1);
  }
}

start();
setInterval(() => {}, 1 << 30);
