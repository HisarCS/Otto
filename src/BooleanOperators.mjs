import {
    Rectangle,
    Circle,
    Triangle,
    Ellipse,
    RegularPolygon,
    Star,
    Arc,
    RoundedRectangle,
    Path,
    Arrow,
    Text,
    BezierCurve,
    Donut,
    Spiral,
    Cross,
    Wave,
    Slot,
    ChamferRectangle,
    PolygonWithHoles,
    Gear,
    DovetailPin,
    DovetailTail,
    FingerJointPin,
    FingerJointSocket,
    HalfLapMale,
    HalfLapFemale,
    CrossLapVertical,
    CrossLapHorizontal,
    SlotBoard,
    TabBoard,
    FingerCombMale,
    FingerCombFemale
} from './Shapes.mjs';

class BooleanNaming {
    constructor() {
      this.operationSymbols = { union: 'U', difference: 'D', intersection: 'I', xor: 'X' };
      this.counter = new Map();
    }
    reset() {
      this.counter.clear();
    }
    getNextCount(op) {
      const c = this.counter.get(op) || 0;
      this.counter.set(op, c + 1);
      return c + 1;
    }
    generateName(op, shapes) {
      const sym = this.operationSymbols[op];
      const cnt = this.getNextCount(op);
      const base = shapes[0] && typeof shapes[0] === 'string' ? shapes[0] : 'shape';
      return `${base}_${sym}${cnt}`;
    }
  }
  
  export class BooleanOperator {
    constructor() {
      this.naming = new BooleanNaming();
      this.debugMode = false;
      this.ClipperLib = null;
      this.isLibraryAvailable = this._initializeClipper();
      this.operationColors = {
        union: '#4CAF50',
        difference: '#FF5722',
        intersection: '#2196F3',
        xor: '#9C27B0'
      };
      if (this.isLibraryAvailable) {
        console.log(`BooleanOperator (Vatti Clipping) initialized`);
      } else {
        console.log(`BooleanOperator (Vatti Clipping) couldn't be initialized`);
      }
    }
  
    _initializeClipper() {
      if (typeof window !== 'undefined' && window.ClipperLib) {
        this.ClipperLib = window.ClipperLib;
        return true;
      }
      try {
        this.ClipperLib = require('clipper-lib');
        return true;
      } catch {
        console.error(
          'ClipperLib not found! Add to HTML:\n' +
          '<script src="https://cdn.jsdelivr.net/gh/junmer/clipper-lib@master/clipper.js"></script>'
        );
        return false;
      }
    }
  
    setDebugMode(on) {
      this.debugMode = !!on;
    }
    log(...args) {
      if (this.debugMode) console.log('[BooleanOp]', ...args);
    }
  
    performUnion(shapes) {
      return this._clipAndMake(shapes, 'union', this.ClipperLib.ClipType.ctUnion);
    }
    performDifference(shapes) {
      return this._clipAndMake(shapes, 'difference', this.ClipperLib.ClipType.ctDifference);
    }
    performIntersection(shapes) {
      return this._clipAndMake(shapes, 'intersection', this.ClipperLib.ClipType.ctIntersection);
    }
    performXor(shapes) {
      return this._clipAndMake(shapes, 'xor', this.ClipperLib.ClipType.ctXor);
    }
  
    _clipAndMake(shapes, op, clipType) {
      this._ensureLib();
      if (op === 'union') this._ensureCount(shapes, 1);
      else if (op === 'difference' || op === 'xor') this._ensureCount(shapes, 2, 2);
      else this._ensureCount(shapes, 2);

      const scale = 1000;
      const subj = [], clip = [];
      shapes.forEach((s, i) => {
        const pts = this.extractShapePoints(s);
        const path = pts.filter(p => p !== null).map(p => ({ X: Math.round(p[0] * scale), Y: Math.round(-p[1] * scale) }));
        if (i === 0) subj.push(path);
        else clip.push(path);
      });
  
      const c = new this.ClipperLib.Clipper();
      c.AddPaths(subj, this.ClipperLib.PolyType.ptSubject, true);
      c.AddPaths(clip, this.ClipperLib.PolyType.ptClip, true);
  
      const sol = new this.ClipperLib.Paths();
      c.Execute(
        clipType,
        sol,
        this.ClipperLib.PolyFillType.pftNonZero,
        this.ClipperLib.PolyFillType.pftNonZero
      );
  
      const ptsOut = [];
      sol.forEach((path, idx) => {
        if (idx > 0) ptsOut.push(null);
        path.forEach(pt => ptsOut.push([pt.X / scale, pt.Y / scale]));
      });
  
      const name = this.naming.generateName(op, shapes.map(s => s.name || 'shape'));
      const style = this.extractStyling(shapes[0], op);
      return {
        type: 'path',
        name,
        params: {
          points: ptsOut,
          closed: true,
          operation: op,
          hasHoles: ptsOut.includes(null),
          ...style
        },
        transform: { position: [0, 0], rotation: 0, scale: [1, 1] }
      };
    }
  
    _ensureLib() {
      if (!this.isLibraryAvailable) throw new Error('ClipperLib not available');
    }
    _ensureCount(arr, min, max = Infinity) {
      if (!Array.isArray(arr) || arr.length < min || arr.length > max) {
        throw new Error(`Need between ${min} and ${max} shapes, got ${arr.length}`);
      }
    }
    
    extractShapePoints(shape) {
      if (!shape || !shape.type) throw new Error('Invalid shape object');
      this.log(`Extracting points from ${shape.type}`);
      if (shape.type === 'path' && shape.params && shape.params.points) {
        return this._handlePathShape(shape);
      }
      return this._handleRegularShape(shape);
    }
  
    _handlePathShape(shape) {
      let pts = shape.params.points;
      if (shape.params.isTurtlePath && Array.isArray(shape.params.subPaths)) {
        const all = [];
        for (const sp of shape.params.subPaths) {
          all.push(...sp.map(p => (Array.isArray(p) ? p : [p.x || 0, p.y || 0])));
        }
        pts = all;
      } else {
        pts = pts.map(p => (p === null ? null : Array.isArray(p) ? p : [p.x || 0, p.y || 0]));
      }
      return this.applyTransform(pts, shape.transform);
    }
  
    _handleRegularShape(shape) {
      const inst = this._createShapeInstance(shape);
      const res = this._getShapeResolution(shape.type);
      const pts = inst.getPoints(res);
      const arr = pts.map(p => [p.x || 0, p.y || 0]);
      return this.applyTransform(arr, shape.transform);
    }
  
    _createShapeInstance(shape) {
      const p = shape.params || {};
      switch (shape.type) {
        case 'rectangle': return new Rectangle(p.width || 100, p.height || 100);
        case 'circle': return new Circle(p.radius || 50);
        case 'triangle': return new Triangle(p.base || 60, p.height || 80);
        case 'ellipse': return new Ellipse(p.radiusX || 60, p.radiusY || 40);
        case 'polygon': return new RegularPolygon(p.radius || 50, p.sides || 6);
        case 'star': return new Star(p.outerRadius || 50, p.innerRadius || 20, p.points || 5);
        case 'arc': return new Arc(p.radius || 50, p.startAngle || 0, p.endAngle || 90);
        case 'roundedRectangle': return new RoundedRectangle(p.width || 100, p.height || 100, p.radius || 10);
        case 'arrow': return new Arrow(p.length || 100, p.headWidth || 30, p.headLength || 25);
        case 'beziercurve': return new BezierCurve(p.startX, p.startY, p.cp1x, p.cp1y, p.cp2x, p.cp2y, p.endX, p.endY);
        case 'donut': return new Donut(p.outerRadius || 50, p.innerRadius || 20);
        case 'spiral': return new Spiral(p.startRadius || 10, p.endRadius || 50, p.turns || 3);
        case 'cross': return new Cross(p.width || 100, p.thickness || 20);
        case 'gear': return new Gear(p.pitch_diameter || 50, p.teeth || 10, p.pressure_angle || 20);
        case 'wave': return new Wave(p.width || 100, p.amplitude || 20, p.frequency || 2);
        case 'slot': return new Slot(p.length || 100, p.width || 20);
        case 'chamferRectangle': return new ChamferRectangle(p.width || 100, p.height || 100, p.chamfer || 10);
        case 'polygonWithHoles': return new PolygonWithHoles(p.outerPath || [], p.holes || []);
        case 'dovetailpin': return new DovetailPin(p.width, p.jointCount, p.depth, p.angle, p.thickness);
        case 'dovetailtail': return new DovetailTail(p.width, p.jointCount, p.depth, p.angle, p.thickness);
        case 'fingerjointpin': return new FingerJointPin(p.width, p.fingerCount, p.fingerWidth, p.depth, p.thickness);
        case 'fingerjointsocket': return new FingerJointSocket(p.width, p.fingerCount, p.fingerWidth, p.depth, p.thickness);
        case 'halflapmale': return new HalfLapMale(p.width, p.height, p.lapLength, p.lapDepth);
        case 'halflapfemale': return new HalfLapFemale(p.width, p.height, p.lapLength, p.lapDepth);
        case 'crosslapvertical': return new CrossLapVertical(p.width, p.height, p.slotWidth, p.slotDepth, p.slotPosition);
        case 'crosslaphorizontal': return new CrossLapHorizontal(p.width, p.height, p.slotWidth, p.slotDepth, p.slotPosition);
        case 'slotboard': return new SlotBoard(p.width, p.height, p.slotCount, p.slotWidth, p.slotDepth, p.slotPosition);
        case 'tabboard': return new TabBoard(p.width, p.height, p.tabCount, p.tabWidth, p.tabDepth);
        case 'fingercombmale': return new FingerCombMale(p.width, p.height, p.toothCount, p.toothDepth);
        case 'fingercombfemale': return new FingerCombFemale(p.width, p.height, p.toothCount, p.toothDepth);
        default:
          console.warn(`Unknown shape type: ${shape.type}, using default Rectangle`);
          return new Rectangle(100, 100);
      }
    }
  
    _getShapeResolution(type) {
      const curved = ['circle','ellipse','arc','roundedrectangle','spiral','donut','wave'];
      return curved.includes(type.toLowerCase()) ? 64 : 32;
    }
  
    applyTransform(points, transform) {
      if (!Array.isArray(points)) return [];
      const { position=[0,0], rotation=0, scale=[1,1] } = transform || {};
      const rad = rotation * Math.PI/180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      return points.map(p => {
        if (p === null) return null;
        let [x,y] = p;
        x *= scale[0]; y *= scale[1];
        const rx = x*cos - y*sin, ry = x*sin + y*cos;
        return [rx + position[0], ry + position[1]];
      });
    }
  
    extractStyling(base, op) {
      const defaults = {
        fill: true,
        fillColor: this.operationColors[op],
        strokeColor: '#000',
        strokeWidth: 2,
        opacity: 0.8
      };
      if (!base || !base.params) return defaults;
      const p = base.params, out = { ...defaults };
      if (p.fill !== undefined) out.fill = p.fill;
      if (p.fillColor) out.fillColor = p.fillColor;
      if (p.color && !p.fillColor) out.fillColor = p.color;
      if (p.strokeColor) out.strokeColor = p.strokeColor;
      if (p.strokeWidth !== undefined) out.strokeWidth = p.strokeWidth;
      if (p.opacity !== undefined) out.opacity = p.opacity;
      return out;
    }
  
    calculatePolygonArea(pts) {
      if (!Array.isArray(pts) || pts.length < 3) return 0;
      let a = 0;
      for (let i=0,j=pts.length-1;i<pts.length;j=i++){
        a += pts[j][0]*pts[i][1] - pts[i][0]*pts[j][1];
      }
      return Math.abs(a/2);
    }
  
    resetNaming() {
      this.naming.reset();
    }
  
    getStatus() {
      return {
        library: this.ClipperLib ? 'ClipperLib' : 'none',
        libraryAvailable: this.isLibraryAvailable,
        debugMode: this.debugMode
      };
    }
  }
  
  export const booleanOperator = new BooleanOperator();
