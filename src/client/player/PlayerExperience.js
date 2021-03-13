import * as soundworks from 'soundworks/client';
import TraceRenderer from '../shared/TraceRenderer';

const audioContext = soundworks.audioContext;
const client = soundworks.client;

const template = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center flex-center">
      <p class="big"><%= title %></p>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

const model = { title: `` };

class PlayerExperience extends soundworks.Experience {
  constructor(assetsDomain) {
    super();

    this.platform = this.require('platform', {});
    this.checkin = this.require('checkin', { showDialog: false });
    this.colorPicker = this.require('color-picker');
    this.sharedParams = this.require('shared-params');

    this.touchId = null;

    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
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

      // setup touch listeners
      const surface = new soundworks.TouchSurface(this.view.$el);
      surface.addListener('touchstart', this.onTouchStart);
      surface.addListener('touchmove', this.onTouchMove);
      surface.addListener('touchend', this.onTouchEnd);

      this.receive('intensity', this.onIntensity);
    });
  }

  updateTrace(x, y) {
    this.renderer.updateTrace(0, x, y, client.color);
    this.send('finger-down', client.index, x, y, client.color);
  }

  resetTrace() {
    this.renderer.resetTrace(0);
    this.send('finger-up', client.index);
  }

  onTouchStart(id, normX, normY) {
    if (this.touchId === null) {
      this.updateTrace(normX, normY);
      this.touchId = id;
    }
  }

  onTouchMove(id, normX, normY) {
    if (id === this.touchId) {
      this.updateTrace(normX, normY);
      this.touchId = id;
    }
  }

  onTouchEnd(id, normX, normY) {
    if (id === this.touchId) {
      this.resetTrace();
      this.touchId = null;
    }
  }

  onIntensity(value) {
    this.renderer.setThickness(10 + 40 * value);
  }
}

export default PlayerExperience;