const GLYPH_BG = 'rgba(255,255,255,0.95)';
const GLYPH_BORDER = '#444';
const GLYPH_TEXT = '#111';
const GLYPH_SELECTED = '#2a7fff';
const R_SCR = 12;   
const PAD = 8;      

function toScreen(cs, x, y) {
  return { x: cs.transformX(x), y: cs.transformY(y) };
}

export class ConstraintOverlay {
  constructor(renderer, engine) {
    this.renderer = renderer;
    this.engine = engine;
    this._markers = new Map();
    this._hoverId = null;
    this._selectedId = null;

    this._draw = this._draw.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onKeyDown   = this._onKeyDown.bind(this);

    this.renderer.addOverlayDrawer(this._draw);

    const canvas = this.renderer.canvas || document.getElementById('canvas');
    this.canvas = canvas;
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('keydown', this._onKeyDown);

    this.refresh();
  }

  dispose() {
    this.renderer.removeOverlayDrawer(this._draw);
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this._onMouseMove);
      this.canvas.removeEventListener('mousedown', this._onMouseDown);
    }
    window.removeEventListener('keydown', this._onKeyDown);
  }

  _recompute() {
    this._markers.clear();
    const list = this.engine.getConstraintSnapshot();
    for (const c of list) {
      const { mid } = this.engine.getConstraintGeometry(c);
      if (!Number.isFinite(mid?.x) || !Number.isFinite(mid?.y)) continue;
      this._markers.set(c.id, {
        id: c.id,
        type: c.type,
        info: c,
        mid
      });
    }
  }

  refresh() {
    this._recompute();
    this.renderer.redraw();
  }

  _draw(ctx, cs) {
    this._recompute();

    if (!this._markers.size) return;

    ctx.save();
    ctx.font = '12px ui-monospace, Menlo, Consolas, monospace';
    ctx.textBaseline = 'middle';

    for (const m of this._markers.values()) {
      const P = toScreen(this.renderer.coordinateSystem, m.mid.x, m.mid.y);
      if (!Number.isFinite(P.x) || !Number.isFinite(P.y)) continue;
      m.scr = P;

      const label = glyphLabel(m.type, m.info);
      const metrics = ctx.measureText(label);
      const w = Math.max(18, metrics.width + PAD*2);
      const h = 18;
      const x = P.x - w/2;
      const y = P.y - h/2;
      m.bbox = { x, y, w, h };

      ctx.fillStyle = GLYPH_BG;
      roundRect(ctx, x, y, w, h, 6);
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.lineWidth = (this._selectedId === m.id) ? 2.5 : 1;
      ctx.strokeStyle = (this._selectedId === m.id) ? GLYPH_SELECTED : (this._hoverId === m.id ? '#888' : GLYPH_BORDER);

      if (this._selectedId === m.id) {
        ctx.fillStyle = 'rgba(42,127,255,0.15)'; // seçili için hafif mavi arkaplan
        roundRect(ctx, x, y, w, h, 6);
        ctx.fill();
      }
      ctx.stroke();

      ctx.fillStyle = GLYPH_TEXT;
      ctx.fillText(label, x + (w - metrics.width)/2, P.y);
    }

    ctx.restore();
  }

  _hitTest(px, py) {
    for (const m of Array.from(this._markers.values()).reverse()) {
      const b = m.bbox;
      if (!b) continue;
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
        return m.id;
      }
    }
    for (const m of Array.from(this._markers.values()).reverse()) {
      const P = m.scr;
      if (!P) continue;
      const d = Math.hypot(px - P.x, py - P.y);
      if (d <= R_SCR) return m.id;
    }
    return null;
  }

  clearSelection() {
    if (this._selectedId) {
      this._selectedId = null;
      this.renderer.redraw();
    }
  }

  selectById(id) {
    this._selectedId = id || null;
    if (this._selectedId) {
      this.renderer.setSelectedShape(null);
      this.renderer.selectedEdges?.clear?.();
      this.renderer.hoveredEdge = null;
    }
    this.refresh();
  }

  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const id = this._hitTest(mx, my);
    const old = this._hoverId;
    this._hoverId = id;
    if (old !== id) this.renderer.redraw();
  }

  _onMouseDown(e) {
    if (e.button !== 0) return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const id = this._hitTest(mx, my);

    if (id) {
      if (this._selectedId === id) {
        this._selectedId = null;
        this.renderer.redraw();
      } else {
        this._selectedId = id;

        this.renderer.setSelectedShape(null);
        this.renderer.selectedEdges?.clear?.();
        this.renderer.hoveredEdge = null;

        this.renderer.redraw();
      }
      e.stopPropagation();
      e.preventDefault();
    } else {
      if (this._selectedId) {
        this._selectedId = null;
        this.renderer.redraw();
      }
    }
  }

  _onKeyDown(e) {
    if (e.key === 'Escape') {
      if (this._selectedId) {
        this._selectedId = null;
        this.renderer.redraw();
      }
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this._selectedId) {
        this.engine.removeConstraint(this._selectedId);
        this._selectedId = null;
        this.refresh();   
        e.preventDefault();
        e.stopPropagation(); 
      }
    }
  }
}

function glyphLabel(type, c) {
  switch(type) {
    case 'coincident':  return 'C';
    case 'distance':    return `D${formatNum(c.dist)}`;
    case 'horizontal':  return 'H';
    case 'vertical':    return 'V';
    default:            return type?.[0]?.toUpperCase() || '?';
  }
}

function formatNum(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '?';
  const abs = Math.abs(v);
  return abs >= 100 ? v.toFixed(0)
       : abs >= 10  ? v.toFixed(1)
       : abs >= 1   ? v.toFixed(2)
       : v.toFixed(3);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y,   x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x,   y+h, rr);
  ctx.arcTo(x,   y+h, x,   y,   rr);
  ctx.arcTo(x,   y,   x+w, y,   rr);
  ctx.closePath();
}
