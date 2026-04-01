const clients = new Set();

function addClient(res) {
  clients.add(res);
  res.on('close', () => clients.delete(res));
}

function broadcast(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    res.write(data);
  }
}

module.exports = { addClient, broadcast };
