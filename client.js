import { Canvas } from "./canvas.js";

// websocket parameters
const webSocketPort = 3000;
const webSocketAddr = '192.168.0.210';

// create full screen canvas to draw to
const canvasElem = document.getElementById("canvas");
const canvas = new Canvas(canvasElem);
let color = '#fff';

/****************************************************************
 * websocket communication
 */
// const socket = new WebSocket(`wss://${webSocketAddr}:${webSocketPort}`);
const socket = new WebSocket(`ws://${webSocketAddr}:${webSocketPort}`);

// listen to opening websocket connections
socket.addEventListener('open', (event) => {
  // send regular ping messages
  setInterval(() => {
    if (socket.readyState == socket.OPEN) {
      socket.send('');
    }
  }, 20000);
});

// listen to messages from server
socket.addEventListener('message', (event) => {
  const message = event.data;

  if (message.length > 0) {
    const incoming = JSON.parse(message);

    // dispatch incomming messages
    switch (incoming.selector) {
      case 'color':
        // change color
        color = incoming.value;
        break;

      default:
        break;
    }
  }
});

/********************************************************************
 *  start screen (overlay)
 */
// start screen HTML elements
const startScreenDiv = document.getElementById("start-screen");
const startScreenTextDiv = startScreenDiv.querySelector("p");

// open start screen
startScreenDiv.style.display = "block";
setOverlayText("touch screen to start");

// start after touch
startScreenDiv.addEventListener("touchend", onStartScreenClick);
startScreenDiv.addEventListener("mouseup", onStartScreenClick);

function onStartScreenClick() {
  startScreenDiv.removeEventListener("touchend", onStartScreenClick);
  startScreenDiv.removeEventListener("mouseup", onStartScreenClick);

  if (matchMedia('(hover:hover)').matches) {
    listenForMousePointer();
  } else {
    listenForTouch();

    // setOverlayText("checking for motion sensors...");
    // requestDeviceOrientation()
    //   .then(() => startScreenDiv.style.display = "none") // close start screen (everything is ok)
    //   .catch((error) => setOverlayError(error)); // display error
  }

  startScreenDiv.style.display = "none";
}

// display text on start screen
function setOverlayText(text) {
  startScreenTextDiv.classList.remove("error");
  startScreenTextDiv.innerHTML = text;
}

/****************************************************************
 * draw stroke to canvas
 */
let lastTime = null;
let lastX = null;
let lastY = null;
let lastFilteredThickness = 0;


function makeStroke(x, y) {
  const time = 0.001 * performance.now();

  const diffX = x - lastX;
  const diffY = y - lastY;
  const dist = Math.sqrt(diffX * diffX + diffY * diffY);
  const speed = dist / (time - lastTime);
  const thickness = Math.pow(1 - Math.min(1, speed), 2);
  const filteredThickness = 0.5 * lastFilteredThickness + 0.5 * thickness;

  if (lastX !== null && lastY !== null) {
    // paint stroke into canvas (normalized coordinates)
    canvas.stroke(lastX, lastY, x, y, filteredThickness, color);

    // paint stroke with normalized start and end coordinates and color
    const outgoing = {
      selector: 'stroke',
      start: [lastX, lastY],
      end: [x, y],
      color: color,
      thickness: filteredThickness
    };

    // send paint stroke to server
    const str = JSON.stringify(outgoing);
    socket.send(str);
  }

  lastTime = time;
  lastX = x;
  lastY = y;
  lastFilteredThickness = filteredThickness;
}

/****************************************************************
 * touch listeners
 */
window.addEventListener('touchstart', onTouchStart, false);
window.addEventListener('touchend', onTouchEnd, false);
window.addEventListener('touchmove', (e) => e.preventDefault(), false);

let touchDown = false;
function onTouchStart(e) {
  touchDown = (e.touches.length > 0);
}

function onTouchEnd(e) {
  touchDown = (e.touches.length > 0);
  lastX = lastY = null;
}

/********************************************************************
 *  device orientation
 */
let dataStreamTimeout = null;
let dataStreamResolve = null;

// get promise for device orientation check and start
function requestDeviceOrientation() {
  return new Promise((resolve, reject) => {
    dataStreamResolve = resolve;

    // set timeout in case that the API is ok, but no data is sent
    dataStreamTimeout = setTimeout(() => {
      dataStreamTimeout = null;
      reject("no motion sensor data streams");
    }, 1000);

    if (DeviceOrientationEvent) {
      if (DeviceOrientationEvent.requestPermission) {
        clearTimeout(dataStreamTimeout);

        // ask device orientation permission on iOS
        DeviceOrientationEvent.requestPermission()
          .then((response) => {
            if (response == "granted") {
              // got permission
              window.addEventListener("deviceorientation", onDeviceOrientation);
              resolve();
            } else {
              reject("no permission for device orientation");
            }
          })
          .catch(console.error);
      } else {
        // no permission needed on non-iOS devices
        window.addEventListener("deviceorientation", onDeviceOrientation);
      }
    } else {
      reject("device orientation not available");
    }
  });
}

const alphaRange = 45;
const minBeta = 0;
const maxBeta = 45;
let refAlpha = null;
let lastAlpha = null;
let lastBeta = null;

function onDeviceOrientation(e) {
  if (dataStreamTimeout !== null && dataStreamResolve !== null) {
    dataStreamResolve();
    clearTimeout(dataStreamTimeout);
  }

  let alpha = e.alpha;
  let beta = e.beta;

  if (refAlpha === null) {
    refAlpha = alpha;
  }

  alpha -= refAlpha;

  if (alpha < -180) {
    alpha += 360;
  } else if (alpha >= 180) {
    alpha -= 360;
  }

  if (Math.abs(alpha - lastAlpha) < 90 && Math.abs(beta - lastBeta) < 90) {
    alpha = Math.min(Math.max(alpha, -alphaRange), alphaRange);
    beta = Math.min(Math.max(beta, minBeta), maxBeta);

    const x = 1 - (alpha + alphaRange) / (2 * alphaRange);
    const y = 1 - (beta + minBeta) / (maxBeta - minBeta);

    if ((x === 0 || x === 1) && (y === 0 || y === 1)) {
      console.log(alpha, beta);
    }

    if (touchDown) {
      makeStroke(x, y);
    }

    lastAlpha = alpha;
    lastBeta = beta;
  }
}

/********************************************************************
 * overlay
 */
// display error message on start screen
function setOverlayError(text) {
  startScreenTextDiv.classList.add("error");
  startScreenTextDiv.innerHTML = text;
}

/****************************************************************
 * touch and mouse pointer event listeners
 */
// touch listener
function listenForTouch() {
  window.addEventListener('touchstart', onPointerStart, false);
  window.addEventListener('touchmove', onPointerMove, false);
  window.addEventListener('touchend', onPointerEnd, false);
  window.addEventListener('touchcancel', onPointerEnd, false);
}

// mouse pointer listener
function listenForMousePointer() {
  window.addEventListener('mousedown', onPointerStart, false);
  window.addEventListener('mousemove', onPointerMove, false);
  window.addEventListener('mouseup', onPointerEnd, false);
}

let mouseIsDown = false;

function onPointerStart(e) {
  const x = e.changedTouches ? e.changedTouches[0].pageX : e.pageX;
  const y = e.changedTouches ? e.changedTouches[0].pageY : e.pageY;
  mouseIsDown = true;
  makeStroke(x / canvas.width, y / canvas.height); // normalize coordinates with canvas size
}

function onPointerMove(e) {
  if (mouseIsDown) {
    const x = e.changedTouches ? e.changedTouches[0].pageX : e.pageX;
    const y = e.changedTouches ? e.changedTouches[0].pageY : e.pageY;
    makeStroke(x / canvas.width, y / canvas.height); // normalize coordinates with canvas size
  }
}

function onPointerEnd(e) {
  mouseIsDown = false;
  lastX = null;
  lastY = null;
}
