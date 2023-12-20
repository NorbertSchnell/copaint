import express from 'express';
import WebSocket from 'ws';

/****************************************************************
 * static web server
 */
const httpPort = Number(process.env.PORT) || 3000;
express()
  .use(express.static('.'))
  .listen(3000, () => console.log(`HTTP server istening on port ${httpPort}`))

/****************************************************************
 * websoket server
 */
const webSocketPort = 3001;
const webSocketServer = new WebSocket.Server({ port: webSocketPort });
console.log(`websocket server listening on port ${webSocketPort}`);

let boardSockets = new Set();
let hue = 0; // painting color of next client connecting

// listen to new web socket connections
webSocketServer.on('connection', (socket, req) => {
  if (req.url === '/board') {
    // add new board
    boardSockets.add(socket);

    // remove board (when connection closes)
    socket.on('close', () => {
      boardSockets.delete(socket);
    });
  } else {
    // send color to freshly connected client
    const outgoing = { selector: 'color', value: `hsl(${hue}, 100%, 50%)` };
    const str = JSON.stringify(outgoing);
    socket.send(str);

    // pick next color
    hue = (hue + 0.6180339887498949 * 360) % 360;
  }

  // listen to client messages
  socket.on('message', (message) => {
    if (message.length === 0) {
      // receive ping from client and respond with pong message
      socket.send('');
    } else {
      const incoming = JSON.parse(message);

      // relay message from client to all boards
      if (incoming.selector === 'stroke') {
        for (let board of boardSockets) {
          board.send(message);
        }
      }
    }
  });
});
