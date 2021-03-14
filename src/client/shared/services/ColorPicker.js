import { Service, serviceManager, SegmentedView, client } from 'soundworks/client';

const SERVICE_ID = 'service:color-picker';

const numColors = 11;

const template = `
  <div class="section-top flex-middle">
    <p class="small">Choose your color</p>
  </div>
  <div class="section-center flex-center">
    <div class="color-wrapper">
      <% for (var i = 0; i < 11; i++) { %>
      <div class="circle color"></div>
      <% } %>
      <div class="circle color-change"></div>
    </div>
  </div>
  <div class="section-bottom"></div>
`;

class ColorPickerView extends SegmentedView {
  constructor(template, model, events, options) {
    super(template, model, events, options);

    this._updatePalette = this._updatePalette.bind(this);

    this.installEvents({
      'click .color-change': (e) => {
        e.target.classList.add('active');
        this._updatePalette();
      }
    });
  }

  onRender() {
    super.onRender();

    this.$colorWrapper = this.$el.querySelector('.color-wrapper');
    this.$circles = Array.from(this.$el.querySelectorAll('.circle'));
    this._updatePalette();
  }

  onResize(width, height, orientation) {
    super.onResize(width, height, orientation);

    const nbrX = 3;
    const nbrY = 4;
    const size = Math.min(width / nbrX, height / nbrY);

    this.$circles.forEach(($circle) => {
      $circle.style.width = `${size}px`;
      $circle.style.height = `${size}px`;
    });
  }

  _updatePalette() {
    const $circles = this.$circles;
    let hue = Math.floor(360 * Math.random());
    const hueIncr = 360 / numColors;

    for (let i = 0; i < numColors; i++) {
      const $circle = $circles[i];
      const sat = Math.floor(50 + 50 * Math.random());
      const lum = Math.floor(25 + 50 * Math.random());
      const color = `hsl(${hue}, ${sat}%, ${lum}%)`;

      $circle.style.backgroundColor = color;
      $circle.setAttribute('data-color', color);

      hue += hueIncr;
    }
  }
}

class ColorPicker extends Service {
  constructor() {
    super(SERVICE_ID);

    this._onSelectColor = this._onSelectColor.bind(this);
  }

  start() {
    super.start();

    this.options.viewPriority = 7;

    this.view = new ColorPickerView(template, {}, {
      'touchstart .color': this._onSelectColor,
      'mousedown .color': this._onSelectColor,
    }, {
      id: 'service-color-picker',
      ratios: {
        '.section-top': 0.12,
        '.section-center': 0.85,
        '.section-bottom': 0.03,
      },
    });

    this.show();
  }

  stop() {
    super.stop();

    this.hide();
  }

  _onSelectColor(e) {
    e.preventDefault();
    e.stopPropagation();

    client.color = e.target.getAttribute('data-color');
    this.ready();
  }
}

serviceManager.register(SERVICE_ID, ColorPicker);

export default ColorPicker;
