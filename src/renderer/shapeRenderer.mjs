// shapeRenderer.mjs - Basic shape rendering (circles, rectangles, etc.)

import {
  Rectangle,
  Circle,
  Triangle,
  Ellipse,
  RegularPolygon,
  Star,
  Arc,
  RoundedRectangle,
  Arrow,
  Text,
  BezierCurve,
  Donut,
  Spiral,
  Cross,
  Wave,
  Slot,
  ChamferRectangle,
  PolygonWithHoles
} from '../Shapes.mjs';

export class ShapeRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  renderText(params, styleContext, isSelected, isHovered) {
    if (!params.text) return false;

    const { text, fontSize = 12, fontFamily = 'Inter, Arial, sans-serif' } = params;
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (styleContext.shouldFill) {
      this.ctx.fillText(text, 0, 0);
    }

    if (params.strokeText || isSelected) {
      this.ctx.strokeText(text, 0, 0);
    }

    return true;
  }

  renderGear(params, styleContext, isSelected, isHovered) {
    const teeth = params.teeth || 12;
    const diameter = params.diameter || 50;
    const shaftType = params.shaft || 'round';
    const shaftSize = params.shaftSize || 10;
    
    const r = diameter / 2;
    const toothHeight = r * 0.2;
    
    this.ctx.beginPath();
    
    for (let i = 0; i < teeth; i++) {
      const angle1 = (i / teeth) * Math.PI * 2;
      const angle2 = ((i + 0.3) / teeth) * Math.PI * 2;
      const angle3 = ((i + 0.7) / teeth) * Math.PI * 2;
      const angle4 = ((i + 1) / teeth) * Math.PI * 2;
      
      const x1 = Math.cos(angle1) * r;
      const y1 = Math.sin(angle1) * r;
      const x2 = Math.cos(angle2) * r;
      const y2 = Math.sin(angle2) * r;
      const x3 = Math.cos(angle2) * (r + toothHeight);
      const y3 = Math.sin(angle2) * (r + toothHeight);
      const x4 = Math.cos(angle3) * (r + toothHeight);
      const y4 = Math.sin(angle3) * (r + toothHeight);
      const x5 = Math.cos(angle3) * r;
      const y5 = Math.sin(angle3) * r;
      const x6 = Math.cos(angle4) * r;
      const y6 = Math.sin(angle4) * r;
      
      if (i === 0) {
        this.ctx.moveTo(x1, y1);
      }
      
      this.ctx.lineTo(x2, y2);
      this.ctx.lineTo(x3, y3);
      this.ctx.lineTo(x4, y4);
      this.ctx.lineTo(x5, y5);
      this.ctx.lineTo(x6, y6);
    }
    
    this.ctx.closePath();
    
    if (styleContext.shouldFill) {
      this.ctx.fill();
    }
    this.ctx.stroke();
    
    this.ctx.beginPath();
    if (shaftType === 'square') {
      const halfSize = shaftSize / 2;
      this.ctx.rect(-halfSize, -halfSize, shaftSize, shaftSize);
    } else {
      this.ctx.arc(0, 0, shaftSize / 2, 0, Math.PI * 2);
    }
    this.ctx.fillStyle = styleContext.fillColor;
    this.ctx.fill();
    this.ctx.stroke();
    
    return true;
  }

  renderBezier(params, styleContext, isSelected, isHovered) {
    if (!params.controlPoints || params.controlPoints.length < 4) return false;
    
    const points = params.controlPoints;
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0][0], points[0][1]);
    this.ctx.bezierCurveTo(
      points[1][0], points[1][1],
      points[2][0], points[2][1],
      points[3][0], points[3][1]
    );
    
    this.ctx.stroke();
    
    if (isSelected || params.showControlPoints) {
      this.ctx.save();
      this.ctx.setLineDash([3, 3]);
      this.ctx.strokeStyle = '#999999';
      this.ctx.lineWidth = 1;
      
      this.ctx.beginPath();
      this.ctx.moveTo(points[0][0], points[0][1]);
      this.ctx.lineTo(points[1][0], points[1][1]);
      this.ctx.moveTo(points[2][0], points[2][1]);
      this.ctx.lineTo(points[3][0], points[3][1]);
      this.ctx.stroke();
      
      for (let i = 0; i < 4; i++) {
        this.ctx.beginPath();
        this.ctx.arc(points[i][0], points[i][1], 3, 0, Math.PI * 2);
        this.ctx.fillStyle = i === 0 || i === 3 ? '#FF5722' : '#2196F3';
        this.ctx.fill();
      }
      
      this.ctx.restore();
    }
    
    return true;
  }

  renderGenericShape(type, params, styleContext, isSelected, isHovered) {
    const shapeInstance = this.createShapeInstance(type, params);
    if (!shapeInstance) return false;

    const points = shapeInstance.getPoints();
    if (!points || points.length === 0) return false;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    if (!['arc', 'path', 'wave'].includes(type)) {
      this.ctx.closePath();
      if (styleContext.shouldFill) {
        this.ctx.fill();
      }
    }

    this.ctx.stroke();
    return true;
  }

  createShapeInstance(type, params) {
    try {
      switch (type) {
        case 'rectangle':
          return new Rectangle(params.width || 100, params.height || 100);
        case 'circle':
          return new Circle(params.radius || 50);
        case 'triangle':
          return new Triangle(params.base || 60, params.height || 80);
        case 'ellipse':
          return new Ellipse(params.radiusX || 60, params.radiusY || 40);
        case 'polygon':
          return new RegularPolygon(params.radius || 50, params.sides || 6);
        case 'star':
          return new Star(params.outerRadius || 50, params.innerRadius || 20, params.points || 5);
        case 'arc':
          return new Arc(params.radius || 50, params.startAngle || 0, params.endAngle || 90);
        case 'roundedRectangle':
          return new RoundedRectangle(params.width || 100, params.height || 100, params.radius || 10);
        case 'arrow':
          return new Arrow(params.length || 100, params.headWidth || 30, params.headLength || 25);
        case 'donut':
          return new Donut(params.outerRadius || 50, params.innerRadius || 20);
        case 'spiral':
          return new Spiral(params.startRadius || 10, params.endRadius || 50, params.turns || 3);
        case 'cross':
          return new Cross(params.width || 100, params.thickness || 20);
        case 'wave':
          return new Wave(params.width || 100, params.amplitude || 20, params.frequency || 2);
        case 'slot':
          return new Slot(params.length || 100, params.width || 20);
        case 'chamferRectangle':
          return new ChamferRectangle(params.width || 100, params.height || 100, params.chamfer || 10);
        case 'polygonWithHoles':
          return new PolygonWithHoles(params.outerPoints || [], params.holes || []);
        default:
          return new Rectangle(100, 100);
      }
    } catch (error) {
      return new Rectangle(100, 100);
    }
  }

  calculateShapeBounds(type, params) {
    switch (type) {
      case 'rectangle':
      case 'roundedRectangle':
      case 'chamferRectangle':
        return {
          x: -(params.width || 100) / 2,
          y: -(params.height || 100) / 2,
          width: params.width || 100,
          height: params.height || 100
        };
        
      case 'circle':
        const radius = params.radius || 50;
        return {
          x: -radius, y: -radius,
          width: radius * 2, height: radius * 2
        };
        
      case 'triangle':
        return {
          x: -(params.base || 60) / 2,
          y: -(params.height || 80) / 2,
          width: params.base || 60,
          height: params.height || 80
        };
        
      case 'ellipse':
        return {
          x: -(params.radiusX || 60),
          y: -(params.radiusY || 40),
          width: (params.radiusX || 60) * 2,
          height: (params.radiusY || 40) * 2
        };
        
      case 'polygon':
      case 'arc':
        const polyRadius = params.radius || 50;
        return {
          x: -polyRadius, y: -polyRadius,
          width: polyRadius * 2, height: polyRadius * 2
        };
        
      case 'star':
        const starRadius = params.outerRadius || 50;
        return {
          x: -starRadius, y: -starRadius,
          width: starRadius * 2, height: starRadius * 2
        };
        
      case 'donut':
        const donutRadius = params.outerRadius || 50;
        return {
          x: -donutRadius, y: -donutRadius,
          width: donutRadius * 2, height: donutRadius * 2
        };
        
      case 'spiral':
        const spiralRadius = Math.max(params.startRadius || 10, params.endRadius || 50);
        return {
          x: -spiralRadius, y: -spiralRadius,
          width: spiralRadius * 2, height: spiralRadius * 2
        };
        
      case 'cross':
        const crossWidth = params.width || 100;
        return {
          x: -crossWidth / 2, y: -crossWidth / 2,
          width: crossWidth, height: crossWidth
        };
        
      case 'gear':
        const gearRadius = (params.diameter || 50) / 2;
        return {
          x: -gearRadius, y: -gearRadius,
          width: gearRadius * 2, height: gearRadius * 2
        };
        
      case 'arrow':
        const arrowLength = params.length || 100;
        const arrowHeight = Math.max(params.headWidth || 30, params.bodyWidth || 10);
        return {
          x: -(params.bodyWidth || 10) / 2,
          y: -arrowHeight / 2,
          width: arrowLength,
          height: arrowHeight
        };
        
      case 'text':
        const fontSize = params.fontSize || 12;
        const textLength = (params.text || '').length;
        const estimatedWidth = fontSize * 0.6 * textLength;
        return {
          x: -estimatedWidth / 2, y: -fontSize / 2,
          width: estimatedWidth, height: fontSize
        };
        
      case 'wave':
        const waveWidth = params.width || 100;
        const waveHeight = (params.amplitude || 20) * 2;
        return {
          x: -waveWidth / 2, y: -waveHeight / 2,
          width: waveWidth, height: waveHeight
        };
        
      case 'slot':
        const slotLength = params.length || 100;
        const slotWidth = params.width || 20;
        return {
          x: -slotLength / 2, y: -slotWidth / 2,
          width: slotLength, height: slotWidth
        };
        
      default:
        return { x: -50, y: -50, width: 100, height: 100 };
    }
  }

  getShapeComplexity(type) {
    const curvedShapes = ['circle', 'ellipse', 'arc', 'roundedRectangle', 'spiral', 'donut', 'wave'];
    const complexShapes = ['star', 'gear', 'bezier'];
    
    if (complexShapes.includes(type)) return 'complex';
    if (curvedShapes.includes(type)) return 'curved';
    return 'simple';
  }

  getOptimalResolution(type, params) {
    const complexity = this.getShapeComplexity(type);
    
    switch (complexity) {
      case 'complex':
        return 128;
      case 'curved':
        return 64;
      default:
        return 32;
    }
  }

  renderShapeWithOptimization(type, params, styleContext, isSelected, isHovered) {
    const complexity = this.getShapeComplexity(type);
    
    if (complexity === 'simple') {
      return this.renderGenericShape(type, params, styleContext, isSelected, isHovered);
    }
    
    const resolution = this.getOptimalResolution(type, params);
    const shapeInstance = this.createShapeInstance(type, params);
    
    if (!shapeInstance) return false;
    
    const points = shapeInstance.getPoints(resolution);
    if (!points || points.length === 0) return false;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    if (complexity !== 'curved' || type === 'donut') {
      this.ctx.closePath();
      if (styleContext.shouldFill) {
        this.ctx.fill();
      }
    }

    this.ctx.stroke();
    return true;
  }
}
