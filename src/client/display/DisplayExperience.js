import * as soundworks from 'soundworks/client';
import TraceRenderer from '../shared/TraceRenderer';

const audioContext = soundworks.audioContext;
const client = soundworks.client;

const template = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center flex-center">
      <p><%= text %></p>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

const model = { text: '' };

class DisplayExperience extends soundworks.Experience {
  constructor(assetsDomain) {
    super();

    this.platform = this.require('platform', { showDialog: false });

    this.onFingerDown = this.onFingerDown.bind(this);
    this.onFingerUp = this.onFingerUp.bind(this);
    this.onIntensity = this.onIntensity.bind(this);
  }

  start() {
    super.start();

    this.view = new soundworks.CanvasView(template, model, {}, {
      id: this.id,
      preservePixelRatio: true,
    });

    this.show().then(() => {
      this.renderer = new TraceRenderer();
      this.view.addRenderer(this.renderer);
      this.view.setPreRender(function(ctx, dt, canvasWidth, canvasHeight) {
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.05;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      });

      this.receive('finger-down', this.onFingerDown);
      this.receive('finger-up', this.onFingerUp);
      this.receive('intensity', this.onIntensity);
    });
  }

  onFingerDown(playerId, x, y, color) {
    this.renderer.updateTrace(playerId, x, y, color);
  }

  onFingerUp(playerId) {
    this.renderer.resetTrace(playerId);
  }

  onIntensity(value) {
    this.renderer.setThickness(10 + 40 * value);
  }
}

export default DisplayExperience;