import { solveSystem } from '../math/solveSystem.mjs';
import { Coincident, Distance, Horizontal, Vertical } from './constraints.mjs';

const sym = raw => String(raw).toLowerCase().replace(/[^a-z0-9_]/g, '_');
const rad = d => (d || 0) * Math.PI / 180;

function getNum(shape, keys, def = 0) {
  const p = shape.params || {};
  for (const k of (Array.isArray(keys) ? keys : [keys])) {
    const v = p[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return def;
}
const typeOf = (shape)=> (shape.shapeType || shape.type || '').toString().toLowerCase();

function cstr(x) {
  const v = Number(x);
  if (!Number.isFinite(v)) return '0';
  const vv = Math.abs(v) < 1e-12 ? 0 : +v.toFixed(8);
  return vv < 0 ? `(0-${Math.abs(vv)})` : `${vv}`;
}

let _cid = 1;
const nextId = () => `c${_cid++}`;

export class ConstraintEngine {
  constructor(renderer, shapeManager, onShapeChanged) {
    this.renderer = renderer;
    this.shapeManager = shapeManager;
    this.onShapeChanged = onShapeChanged;

    this._lastChangedShape = null;

    this.anchors = new Map();
    this.anchorCatalog = new Map();

    this.constraints = [];
    this.liveEnforce = true;

    this._applying = false;

    this._takeSnapshot();
  }

  rebuild() {
    this.anchors.clear();
    this.anchorCatalog.clear();
    if (!this.renderer || !this.renderer.shapes) return;

    for (const [name, shape] of this.renderer.shapes.entries()) {
      const anchors = [];
      const type = typeOf(shape);
      const add = (key, label, off) => {
        const id = sym(`${key}_${name}`);
        this.anchors.set(id, { shapeName: name, key, ox: off.x, oy: off.y });
        anchors.push({ key, label });
      };

      add('center', 'Center', {x:0, y:0});

      if (['rectangle','roundedrectangle','chamferrectangle','cross'].includes(type)) {
        const w  = getNum(shape, ['width','w'], 0);
        const h  = getNum(shape, ['height','h'], 0);
        const hx = w/2, hy = h/2;
        add('rect_tl','Top-Left',{x:-hx,y:+hy});
        add('rect_tr','Top-Right',{x:+hx,y:+hy});
        add('rect_br','Bottom-Right',{x:+hx,y:-hy});
        add('rect_bl','Bottom-Left',{x:-hx,y:-hy});
        add('rect_mt','Mid-Top',{x:0,y:+hy});
        add('rect_mr','Mid-Right',{x:+hx,y:0});
        add('rect_mb','Mid-Bottom',{x:0,y:-hy});
        add('rect_ml','Mid-Left',{x:-hx,y:0});
      }

      if (['circle','donut','gear','star'].includes(type)) {
        const r = getNum(shape, ['outerRadius','radius','r'], 0);
        add('circ_e','East (0°)',{x:+r,y:0});
        add('circ_n','North (90°)',{x:0,y:+r});
        add('circ_w','West (180°)',{x:-r,y:0});
        add('circ_s','South (270°)',{x:0,y:-r});
      }
      if (type === 'donut') {
        const ri = getNum(shape, ['innerRadius','rInner','holeRadius'], 0);
        if (ri > 0) {
          add('donut_i_e','Inner East',{x:+ri,y:0});
          add('donut_i_n','Inner North',{x:0,y:+ri});
          add('donut_i_w','Inner West',{x:-ri,y:0});
          add('donut_i_s','Inner South',{x:0,y:-ri});
        }
      }

      if (type === 'ellipse') {
        const rx = getNum(shape, ['radiusX','rx'], 0);
        const ry = getNum(shape, ['radiusY','ry'], 0);
        add('ellipse_e','East',{x:+rx,y:0});
        add('ellipse_n','North',{x:0,y:+ry});
        add('ellipse_w','West',{x:-rx,y:0});
        add('ellipse_s','South',{x:0,y:-ry});
      }

      if (type === 'polygon') {
        const r = getNum(shape, 'radius', 0);
        const n = Math.max(3, Math.round(getNum(shape, 'sides', 3)));
        for (let i=0;i<n;i++){
          const t = (2*Math.PI*i)/n;
          add(`poly_v${i}`, `Vertex ${i}`, {x: r*Math.cos(t), y: r*Math.sin(t)});
        }
      }

      if (type === 'triangle') {
        const base = getNum(shape, ['base','width','w'], 0);
        const height = getNum(shape, ['height','h'], 0);
        const bx = base/2, hy = height/2;
        add('tri_apex','Apex',{x:0,y:+hy});
        add('tri_bl','Base-Left',{x:-bx,y:-hy});
        add('tri_br','Base-Right',{x:+bx,y:-hy});
        add('tri_mb','Mid-Base',{x:0,y:-hy});
      }

      if (type === 'arc') {
        const r  = getNum(shape, ['radius','r','outerRadius'], 0);
        const a0 = rad(getNum(shape, 'startAngle', 0));
        const a1 = rad(getNum(shape, 'endAngle', 0));
        const am = (a0+a1)/2;
        add('arc_start','Start',{x: r*Math.cos(a0), y: r*Math.sin(a0)});
        add('arc_end','End',{x: r*Math.cos(a1), y: r*Math.sin(a1)});
        add('arc_mid','Mid',{x: r*Math.cos(am), y: r*Math.sin(am)});
      }

      if (type === 'arrow') {
        const len = getNum(shape, ['length','shaftLength'], 0);
        const hx = len/2;
        add('arrow_tip','Tip',{x:+hx,y:0});
        add('arrow_tail','Tail',{x:-hx,y:0});
      }

      this.anchorCatalog.set(name, anchors);
    }
  }

  _snapshot = new Map();

  _takeSnapshot() {
    this._snapshot.clear();
    if (!this.renderer || !this.renderer.shapes) return;
    for (const [name, shape] of this.renderer.shapes.entries()) {
      const t = shape.transform || {};
      const [x, y] = Array.isArray(t.position) ? t.position : [0,0];
      const r = Number(t.rotation || 0);
      const sx = (t.scale && Number.isFinite(t.scale[0])) ? t.scale[0] : 1;
      const sy = (t.scale && Number.isFinite(t.scale[1])) ? t.scale[1] : 1;
      this._snapshot.set(name, { x, y, r, sx, sy });
    }
  }

  _detectChangedShape() {
    if (!this.renderer || !this.renderer.shapes || this._snapshot.size === 0) return null;
    let maxScore = 0, which = null;

    for (const [name, shape] of this.renderer.shapes.entries()) {
      const prev = this._snapshot.get(name);
      if (!prev) continue;
      const t = shape.transform || {};
      const [cx, cy] = Array.isArray(t.position) ? t.position : [0,0];
      const r = Number(t.rotation || 0);
      const sx = (t.scale && Number.isFinite(t.scale[0])) ? t.scale[0] : 1;
      const sy = (t.scale && Number.isFinite(t.scale[1])) ? t.scale[1] : 1;

      const dp = Math.hypot(cx - prev.x, cy - prev.y);
      const dr = Math.abs(r - prev.r) * 0.01;   
      const ds = Math.hypot(sx - prev.sx, sy - prev.sy) * 10; 

      const score = dp + dr + ds;
      if (score > maxScore) { maxScore = score; which = name; }
    }

    return maxScore > 1e-6 ? which : null;
  }

  _anchorWorld(anchorId) {
    const a = this.anchors.get(anchorId);
    const s = this.renderer.shapes.get(a.shapeName);
    const t = s.transform || {};
    const [cx, cy] = Array.isArray(t.position) ? t.position : [0,0];
    const rotationDeg = Number(t.rotation || 0);
    const th = rotationDeg * Math.PI / 180;

    const rx = a.ox * Math.cos(th) - a.oy * Math.sin(th);
    const ry = a.ox * Math.sin(th) + a.oy * Math.cos(th);

    return { x: cx + rx, y: cy + ry };
  }

  _varsFor(ids) {
    const vars = {};
    ids.forEach(id => {
      const { x, y } = this._anchorWorld(id);
      vars[`x${id}`] = x;
      vars[`y${id}`] = y;
    });
    return vars;
  }

  _applySolved(idsToMove, solved, fixedShapeName = null) {
    const EPS = 1e-2;

    idsToMove.forEach(id => {
      let nx = solved[`x${id}`];
      let ny = solved[`y${id}`];
      if (!Number.isFinite(nx) || !Number.isFinite(ny)) return;

      nx = +nx.toFixed(6);
      ny = +ny.toFixed(6);

      const a = this.anchors.get(id);
      if (!a) return;

      if (fixedShapeName && a.shapeName === fixedShapeName) return;

      const shape = this.renderer.shapes.get(a.shapeName);
      if (!shape) return;
      if (!shape.transform) shape.transform = { position:[0,0], rotation:0, scale:[1,1] };

      const [cx, cy] = shape.transform.position || [0,0];
      const rotationDeg = Number(shape.transform.rotation || 0);
      const th = rotationDeg * Math.PI / 180;

      const rx = a.ox * Math.cos(th) - a.oy * Math.sin(th);
      const ry = a.ox * Math.sin(th) + a.oy * Math.cos(th);

      const dx = nx - (cx + rx);
      const dy = ny - (cy + ry);

      if (Math.abs(dx) > EPS || Math.abs(dy) > EPS) {
        shape.transform.position = [
          +(cx + dx).toFixed(6),
          +(cy + dy).toFixed(6)
        ];
        if (typeof this.onShapeChanged === 'function') {
          this.onShapeChanged({ action:'update', name:a.shapeName, shape });
        }
      }
    });

    if (this.renderer) this.renderer.redraw();
  }

  _solveConstraint(type, a, b, extra = {}, fixedShapeName = null) {
    this.rebuild();

    const idA = sym(`${a.anchor}_${a.shape}`);
    const idB = sym(`${b.anchor}_${b.shape}`);
    const ax = `x${idA}`, ay = `y${idA}`, bx = `x${idB}`, by = `y${idB}`;

    let c, eqs;
    if (type === 'coincident') {
      c = new Coincident({id:idA},{id:idB});
      eqs = c.getEqs(ax,ay,bx,by);
    } else if (type === 'distance') {
      c = new Distance({id:idA},{id:idB}, extra.dist);
      eqs = c.getEqs(ax,ay,bx,by);
    } else if (type === 'horizontal') {
      c = new Horizontal({id:idA},{id:idB});
      eqs = c.getEqs(ax,ay,bx,by);
    } else if (type === 'vertical') {
      c = new Vertical({id:idA},{id:idB});
      eqs = c.getEqs(ax,ay,bx,by);
    } else {
      throw new Error(`Unknown constraint type: ${type}`);
    }

    const vars = this._varsFor([idA, idB]);

    let forwardSubs = {};
    let idsToMove = [idA, idB];
    if (fixedShapeName === a.shape) {
      forwardSubs = { [ax]: `(${cstr(vars[ax])})`, [ay]: `(${cstr(vars[ay])})` };
      idsToMove = [idB];
    } else if (fixedShapeName === b.shape) {
      forwardSubs = { [bx]: `(${cstr(vars[bx])})`, [by]: `(${cstr(vars[by])})` };
      idsToMove = [idA];
    }

    const [, solved] = solveSystem(eqs, vars, { forwardSubs });
    this._applySolved(idsToMove, solved, fixedShapeName);
  }

  getAnchorWorld(shapeName, anchorKey) {
    if (!this.anchorCatalog.size) this.rebuild();
    const id = (anchorKey + '_' + shapeName).toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const a = this.anchors.get(id);
    if (!a) return { x: 0, y: 0, ok:false };
    const s = this.renderer?.shapes?.get(shapeName);
    if (!s) return { x: 0, y: 0, ok:false };
    const t = s.transform || {};
    const [cx, cy] = Array.isArray(t.position) ? t.position : [0,0];
    const th = (Number(t.rotation || 0) * Math.PI) / 180;
    const rx = a.ox * Math.cos(th) - a.oy * Math.sin(th);
    const ry = a.ox * Math.sin(th) + a.oy * Math.cos(th);
    return { x: cx + rx, y: cy + ry, ok:true };
  }

  getConstraintGeometry(c) {
    const pA = this.getAnchorWorld(c.a.shape, c.a.anchor);
    const pB = this.getAnchorWorld(c.b.shape, c.b.anchor);
    const mid = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
    return { pA, pB, mid };
  }

  getConstraintSnapshot() {
    return this.constraints.slice();
  }

  addCoincidentAnchors(a, b) {
    this._solveConstraint('coincident', a, b);
    const def = this._store({ type:'coincident', a, b });
    return def;
  }
  addDistance(a, b, dist) {
    this._solveConstraint('distance', a, b, {dist});
    const def = this._store({ type:'distance', a, b, dist });
    return def;
  }
  addHorizontal(a, b) {
    this._solveConstraint('horizontal', a, b);
    const def = this._store({ type:'horizontal', a, b });
    return def;
  }
  addVertical(a, b) {
    this._solveConstraint('vertical', a, b);
    const def = this._store({ type:'vertical', a, b });
    return def;
  }

  pruneConstraintsForShapes(shapeNames = []) {
    if (!Array.isArray(shapeNames) || shapeNames.length === 0) return;
    const before = this.constraints.length;
    this.constraints = this.constraints.filter(c => {
      return !shapeNames.includes(c.a.shape) && !shapeNames.includes(c.b.shape);
    });
    if (this.constraints.length !== before) {
      this._notifyListChanged(); 
    }
  }

  _store(entry) {
    const id = nextId();
    this.constraints.push({ id, ...entry });
    this._notifyListChanged();
    return { id, label: this.getConstraintList().find(c => c.id===id).label };
  }

  removeConstraint(id) {
    const idx = this.constraints.findIndex(c => c.id === id);
    if (idx >= 0) {
      this.constraints.splice(idx, 1);
      this._notifyListChanged();
    }
  }

  clearAllConstraints() {
    this.constraints = [];
    this._notifyListChanged();
  }

  getConstraintList() {
    return this.constraints.map(c => {
      const describeAB = () => `${c.a.shape}:${c.a.anchor} ↦ ${c.b.shape}:${c.b.anchor}`;
      if (c.type === 'distance') {
        return { id:c.id, label:`Distance(${c.dist})  ${describeAB()}` };
      }
      const cap = c.type.charAt(0).toUpperCase() + c.type.slice(1);
      return { id:c.id, label:`${cap}  ${describeAB()}` };
    });
  }

  applyAllConstraints(fixedShapeName = null) {
    if (this._applying || !this.liveEnforce || this.constraints.length === 0) return;
    this._applying = true;
    try {
      for (const c of this.constraints) {
        if (c.type === 'distance') {
          this._solveConstraint('distance', c.a, c.b, { dist: c.dist }, fixedShapeName);
        } else {
          this._solveConstraint(c.type, c.a, c.b, {}, fixedShapeName);
        }
      }
    } finally {
      this._applying = false;
    }
  }

  setLiveEnforce(on) {
    this.liveEnforce = !!on;
  }

  installLiveEnforcer(shapeManager) {
    if (!shapeManager || this._wrappedSM) return;
    this._wrappedSM = true;

    const self = this;
    const callEnforce = () => {
      if (self._applying || !self.liveEnforce) return;
      try {
        const fixed = self._detectChangedShape();
        self.rebuild();
        self.applyAllConstraints(fixed);
      } catch (e) {
        console.warn('Constraint enforce error', e);
      } finally {
        self._takeSnapshot();
      }
    };

    const wrap = (fnName) => {
      const orig = shapeManager[fnName]?.bind(shapeManager);
      if (!orig) return;
      shapeManager[fnName] = function(...args){
        const out = orig(...args);
        callEnforce();
        return out;
      };
    };

    wrap('onCanvasPositionChange');
    wrap('onCanvasRotationChange');
    wrap('onCanvasScaleChange');

    wrap('setShapes');
    wrap('updateShape');
    wrap('registerInterpreter');
    wrap('createShapeAtPosition');

    this._takeSnapshot();
  }

  getAnchorsForShape(shapeName) {
    if (!this.anchorCatalog.size) this.rebuild();
    return this.anchorCatalog.get(shapeName) || [{key:'center', label:'Center'}];
  }

  onListChanged(cb) { this._onListChanged = cb; }
  _notifyListChanged(){ if (typeof this._onListChanged === 'function') this._onListChanged(this.getConstraintList()); }
}
