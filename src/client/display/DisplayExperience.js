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
    this.sharedParams = this.require('shared-params');

    this.fadeFactor = 0;

    this.onFingerDown = this.onFingerDown.bind(this);
    this.onFingerUp = this.onFingerUp.bind(this);
    this.onIntensity = this.onIntensity.bind(this);
    this.updateThickness = this.updateThickness.bind(this);
    this.updateFade = this.updateFade.bind(this);
    this.onClear = this.onClear.bind(this);
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

      this.receive('finger-down', this.onFingerDown);
      this.receive('finger-up', this.onFingerUp);
      this.receive('intensity', this.onIntensity);

      this.sharedParams.addParamListener('fade', this.updateFade);
      this.sharedParams.addParamListener('thickness', this.updateThickness);
      this.sharedParams.addParamListener('clear', this.onClear);
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

  updateThickness(value) {
    this.renderer.setThickness(value);
  }

  updateFade(value) {
    const isFading = (this.fadeFactor > 0);

    value *= value;    

    if (!isFading && value > 0) {
      this.view.setPreRender((ctx, dt, canvasWidth, canvasHeight) => {
        ctx.fillStyle = '#000';
        ctx.globalAlpha = this.fadeFactor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      });
    } else if (!isFading &&  value > 0) {
      this.view.setPreRender(null);
    }

    this.fadeFactor = value;
  }

  onClear() {
    this.renderer.clear();
  }
}

export default DisplayExperience;