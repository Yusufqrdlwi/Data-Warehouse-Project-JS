const os = require('os');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Cari IPv4 yang bukan loopback (bukan 127.0.0.1)
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const ipLokal = getLocalIp();
const port = process.env.PORT || 3000;

console.log('='.repeat(50));
console.log(`🌐 IP Address Lokal Anda : ${ipLokal}`);
console.log('='.repeat(50));
console.log(
  `Berikan URL ini ke teman Anda untuk dites di Postman:\nhttp://${ipLokal}:${port}/api/fetch-live-posts`
);
console.log('='.repeat(50));