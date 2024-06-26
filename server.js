import express from 'express';
import WebSocket from 'ws';
// import https from 'https';
import http from 'http';

// const key = fs.readFileSync('sslcert/selfsigned.key', 'utf8');
// const cert = fs.readFileSync('sslcert/selfsigned.crt', 'utf8');
// const credentials = { key, cert };
// openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout sslcert/selfsigned.key -out sslcert/selfsigned.crt

/****************************************************************
 * http server
 */
const httpPort = Number(process.env.PORT) || 3000;
const app = express();

// const httpsServer = https
//   .createServer(credentials, app)
//   .listen(httpPort, () => console.log(`HTTP server listening on port ${httpPort}`));

const httpServer = http
  .createServer(app)
  .listen(httpPort, () => console.log(`HTTP server listening on port ${httpPort}`));

app.use(express.static('.'));

/****************************************************************
 * websoket server
 */
// const webSocketServer = new WebSocket.Server({ server: httpsServer });
const webSocketServer = new WebSocket.Server({ server: httpServer });
console.log(`websocket server listening`);

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
