import { Canvas2dRenderer } from 'soundworks/client';

/**
 * A simple canvas renderer.
 * The class renders a dot moving over the screen and rebouncing on the edges.
 */
class TraceRenderer extends Canvas2dRenderer {
  constructor() {
    super();

    this.x = null;
    this.y = null;
    this.lastX = null;
    this.lastY = null;

    this.opacity = 1;
    this.thickness = 20;
    this.pendingClear = false;

    this.traces = new Map();
  }

  init() {
    // this.canvasWidth
    // this.canvasHeight
  }

  setOpacity(opacity) {
    this.opacity = opacity;
  }

  setThickness(thickness) {
    this.thickness = thickness;
  }

  updateTrace(id, x, y, color) {
    let trace = this.traces.get(id);

    if (!trace) {
      trace = {
        x: null,
        y: null,
        lastX: null,
        lastY: null,
        color: color,
      };

      this.traces.set(id, trace);
    }

    trace.x = x;
    trace.y = y;
  }

  resetTrace(id) {
    this.traces.delete(id);
  }

  update(dt) {

  }

  render(ctx) {
    if (this.pendingClear) {
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.pendingClear = false;
    }

    for (let [id, trace] of this.traces) {
      const x = trace.x * this.canvasWidth;
      const y = trace.y * this.canvasHeight;

      ctx.fillStyle = trace.color;
      ctx.strokeStyle = trace.color;
      ctx.lineWidth = this.thickness;
      ctx.globalAlpha = this.opacity;

      ctx.beginPath();
      ctx.arc(x, y, this.thickness / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();

      if (trace.lastX !== null && trace.lastY !== null) {
        ctx.beginPath();
        ctx.moveTo(trace.lastX * this.canvasWidth, trace.lastY * this.canvasHeight);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      trace.lastX = trace.x;
      trace.lastY = trace.y;
    }
  }

  clear() {
    this.pendingClear = true;
  }
}

export default TraceRenderer;