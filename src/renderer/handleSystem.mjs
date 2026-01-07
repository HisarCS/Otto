// handleSystem.mjs - Interactive handles for shape manipulation

export class HandleSystem {
  constructor(renderer) {
    this.renderer = renderer;
    this.ctx = renderer.ctx;
    this.coordinateSystem = renderer.coordinateSystem;
    
    this.handleRadius = 6;
    this.handleHoverRadius = 7;
    this.rotationHandleDistance = 35;
    this.activeHandle = null;
    this.hoveredHandle = null;
    
    this.selectionColor = '#FF5722';
    this.handleFillColor = '#FFFFFF';
    this.handleShadowColor = '#00000020';
  }

  setActiveHandle(handle) {
    this.activeHandle = handle;
  }

  setHoveredHandle(handle) {
    this.hoveredHandle = handle;
  }

  getActiveHandle() {
    return this.activeHandle;
  }

  getHoveredHandle() {
    return this.hoveredHandle;
  }

  drawSelectionHandles(shape, transformContext) {
    if (!shape || !shape.transform) return;

    const { transform } = shape;
    const screenX = this.coordinateSystem.transformX(transform.position[0]);
    const screenY = this.coordinateSystem.transformY(transform.position[1]);

    this.ctx.save();
    this.ctx.translate(screenX, screenY);
    this.ctx.rotate(-transform.rotation * Math.PI / 180);

    let bounds;
    try {
      bounds = this.renderer.transformManager ? 
        this.renderer.transformManager.calculateBounds(shape) :
        this.calculateFallbackBounds(shape);
    } catch (error) {
      bounds = this.calculateFallbackBounds(shape);
    }

    const scale = this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;
    const offsetX = bounds.x * scale;
    const offsetY = bounds.y * scale;
    const scaledWidth = bounds.width * scale;
    const scaledHeight = bounds.height * scale;

    this.drawCornerHandles(shape, scaledWidth, scaledHeight, offsetX, offsetY);
    this.drawRotationHandle(shape, scaledWidth, scaledHeight, offsetX, offsetY);

    this.ctx.restore();
  }

  drawCornerHandles(shape, scaledWidth, scaledHeight, offsetX, offsetY) {
    const handlePositions = [
      { x: offsetX, y: offsetY, handle: 'tl' },
      { x: offsetX + scaledWidth, y: offsetY, handle: 'tr' },
      { x: offsetX + scaledWidth, y: offsetY + scaledHeight, handle: 'br' },
      { x: offsetX, y: offsetY + scaledHeight, handle: 'bl' }
    ];

    handlePositions.forEach(pos => {
      const isHovered = this.hoveredHandle === pos.handle;
      const isActive = this.activeHandle === pos.handle;
      const radius = isHovered ? this.handleHoverRadius : this.handleRadius;

      this.ctx.save();
      this.ctx.translate(pos.x, pos.y);

      this.ctx.beginPath();
      this.ctx.arc(0.5, 0.5, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.handleShadowColor;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.handleFillColor;
      this.ctx.fill();

      const strokeColor = shape.params.operation ? 
        this.getOperationColor(shape.params.operation) : this.selectionColor;
      this.ctx.strokeStyle = isActive ? strokeColor + 'FF' : strokeColor;
      this.ctx.lineWidth = isActive ? 3 : 2;
      this.ctx.stroke();

      if (isHovered) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
        this.ctx.strokeStyle = strokeColor + '40';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }

      this.ctx.restore();
    });
  }

  drawRotationHandle(shape, scaledWidth, scaledHeight, offsetX, offsetY) {
    const centerX = offsetX + scaledWidth / 2;
    const rotHandleY = offsetY - this.rotationHandleDistance;
    const isRotHovered = this.hoveredHandle === 'rotate';
    const isRotActive = this.activeHandle === 'rotate';
    const rotRadius = isRotHovered ? this.handleHoverRadius : this.handleRadius;

    this.ctx.beginPath();
    this.ctx.moveTo(centerX, offsetY);
    this.ctx.lineTo(centerX, rotHandleY);
    const connectionColor = shape.params.operation ? 
      this.getOperationColor(shape.params.operation) : this.selectionColor;
    this.ctx.strokeStyle = connectionColor + '60';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(centerX + 0.5, rotHandleY + 0.5, rotRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.handleShadowColor;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(centerX, rotHandleY, rotRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.handleFillColor;
    this.ctx.fill();

    const strokeColor = shape.params.operation ? 
      this.getOperationColor(shape.params.operation) : this.selectionColor;
    this.ctx.strokeStyle = isRotActive ? strokeColor + 'FF' : strokeColor;
    this.ctx.lineWidth = isRotActive ? 3 : 2;
    this.ctx.stroke();

    if (isRotHovered) {
      this.ctx.beginPath();
      this.ctx.arc(centerX, rotHandleY, rotRadius + 2, 0, Math.PI * 2);
      this.ctx.strokeStyle = strokeColor + '40';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }

    this.ctx.beginPath();
    this.ctx.arc(centerX, rotHandleY, rotRadius * 0.4, 0, Math.PI * 1.5);
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    const arrowSize = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - rotRadius * 0.4, rotHandleY);
    this.ctx.lineTo(centerX - rotRadius * 0.4 - arrowSize, rotHandleY - arrowSize);
    this.ctx.lineTo(centerX - rotRadius * 0.4 - arrowSize, rotHandleY + arrowSize);
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }

  drawHandleAtPosition(x, y, handleType = 'corner', isHovered = false, isActive = false, color = null) {
    const radius = isHovered ? this.handleHoverRadius : this.handleRadius;
    const strokeColor = color || this.selectionColor;

    this.ctx.save();
    this.ctx.translate(x, y);

    this.ctx.beginPath();
    this.ctx.arc(0.5, 0.5, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.handleShadowColor;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.handleFillColor;
    this.ctx.fill();

    this.ctx.strokeStyle = isActive ? strokeColor + 'FF' : strokeColor;
    this.ctx.lineWidth = isActive ? 3 : 2;
    this.ctx.stroke();

    if (isHovered) {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
      this.ctx.strokeStyle = strokeColor + '40';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }

    if (handleType === 'rotation') {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 1.5);
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawEdgeHandles(shape, scaledWidth, scaledHeight) {
    const edgePositions = [
      { x: 0, y: -scaledHeight / 2, handle: 'top' },
      { x: scaledWidth / 2, y: 0, handle: 'right' },
      { x: 0, y: scaledHeight / 2, handle: 'bottom' },
      { x: -scaledWidth / 2, y: 0, handle: 'left' }
    ];

    edgePositions.forEach(pos => {
      const isHovered = this.hoveredHandle === pos.handle;
      const isActive = this.activeHandle === pos.handle;
      
      this.drawHandleAtPosition(pos.x, pos.y, 'edge', isHovered, isActive);
    });
  }

  drawCustomHandles(shape, handleConfig) {
    if (!handleConfig || !handleConfig.positions) return;

    handleConfig.positions.forEach(pos => {
      const isHovered = this.hoveredHandle === pos.id;
      const isActive = this.activeHandle === pos.id;
      
      this.drawHandleAtPosition(pos.x, pos.y, pos.type || 'corner', isHovered, isActive, pos.color);
    });
  }

  getHandlePositions(shape) {
    if (!shape || !shape.transform) return [];

    let bounds;
    try {
      bounds = this.renderer.transformManager ? 
        this.renderer.transformManager.calculateBounds(shape) :
        this.calculateFallbackBounds(shape);
    } catch (error) {
      bounds = this.calculateFallbackBounds(shape);
    }

    const scaledWidth = bounds.width * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;
    const scaledHeight = bounds.height * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;

    const shapeX = this.coordinateSystem.transformX(shape.transform.position[0]);
    const shapeY = this.coordinateSystem.transformY(shape.transform.position[1]);
    const halfWidth = scaledWidth / 2;
    const halfHeight = scaledHeight / 2;

    const angle = -shape.transform.rotation * Math.PI / 180;
    const rotate = (px, py) => {
      const s = Math.sin(angle);
      const c = Math.cos(angle);
      const dx = px - shapeX;
      const dy = py - shapeY;
      return {
        x: shapeX + (dx * c - dy * s),
        y: shapeY + (dx * s + dy * c)
      };
    };

    const positions = [
      { id: 'tl', ...rotate(shapeX - halfWidth, shapeY - halfHeight), type: 'corner' },
      { id: 'tr', ...rotate(shapeX + halfWidth, shapeY - halfHeight), type: 'corner' },
      { id: 'br', ...rotate(shapeX + halfWidth, shapeY + halfHeight), type: 'corner' },
      { id: 'bl', ...rotate(shapeX - halfWidth, shapeY + halfHeight), type: 'corner' },
      { id: 'rotate', ...rotate(shapeX, shapeY - halfHeight - this.rotationHandleDistance), type: 'rotation' }
    ];

    return positions;
  }

  getHandleAtPoint(x, y, shape) {
    if (!shape) return null;

    const positions = this.getHandlePositions(shape);

    for (const pos of positions) {
      const dx = x - pos.x;
      const dy = y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= this.handleRadius + 3) {
        return {
          type: pos.type === 'rotation' ? 'rotate' : 'scale',
          handle: pos.id,
          position: pos
        };
      }
    }

    return null;
  }

  drawHandleGuides(shape, activeHandle) {
    if (!shape || !activeHandle) return;

    let bounds;
    try {
      bounds = this.renderer.transformManager ? 
        this.renderer.transformManager.calculateBounds(shape) :
        this.calculateFallbackBounds(shape);
    } catch (error) {
      bounds = this.calculateFallbackBounds(shape);
    }

    const screenX = this.coordinateSystem.transformX(shape.transform.position[0]);
    const screenY = this.coordinateSystem.transformY(shape.transform.position[1]);

    this.ctx.save();
    this.ctx.setLineDash([2, 2]);
    this.ctx.strokeStyle = this.selectionColor + '60';
    this.ctx.lineWidth = 1;

    switch (activeHandle) {
      case 'tl':
      case 'br':
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(this.coordinateSystem.canvas.width, this.coordinateSystem.canvas.height);
        this.ctx.stroke();
        break;
      case 'tr':
      case 'bl':
        this.ctx.beginPath();
        this.ctx.moveTo(this.coordinateSystem.canvas.width, 0);
        this.ctx.lineTo(0, this.coordinateSystem.canvas.height);
        this.ctx.stroke();
        break;
      case 'rotate':
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, 50, 0, Math.PI * 2);
        this.ctx.stroke();
        break;
    }

    this.ctx.restore();
  }

  drawHandleLabels(shape) {
    if (!shape) return;

    const positions = this.getHandlePositions(shape);
    
    this.ctx.save();
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';

    positions.forEach(pos => {
      if (pos.type === 'corner') {
        this.ctx.fillText(pos.id.toUpperCase(), pos.x, pos.y - 15);
      } else if (pos.type === 'rotation') {
        this.ctx.fillText('ROT', pos.x, pos.y - 15);
      }
    });

    this.ctx.restore();
  }

  getOperationColor(operation) {
    const colors = {
      'difference': '#FF5722',
      'union': '#4CAF50',
      'intersection': '#2196F3',
      'xor': '#9C27B0'
    };
    return colors[operation] || '#808080';
  }

  setHandleStyle(style) {
    if (style.radius) this.handleRadius = style.radius;
    if (style.hoverRadius) this.handleHoverRadius = style.hoverRadius;
    if (style.rotationDistance) this.rotationHandleDistance = style.rotationDistance;
    if (style.fillColor) this.handleFillColor = style.fillColor;
    if (style.selectionColor) this.selectionColor = style.selectionColor;
    if (style.shadowColor) this.handleShadowColor = style.shadowColor;
  }

  getHandleStyle() {
    return {
      radius: this.handleRadius,
      hoverRadius: this.handleHoverRadius,
      rotationDistance: this.rotationHandleDistance,
      fillColor: this.handleFillColor,
      selectionColor: this.selectionColor,
      shadowColor: this.handleShadowColor
    };
  }

  clearHandleState() {
    this.activeHandle = null;
    this.hoveredHandle = null;
  }

  animateHandleSelection(shape, animationProgress = 0) {
    if (!shape || animationProgress <= 0) return;

    const pulse = Math.sin(animationProgress * Math.PI * 4) * 0.3 + 0.7;
    const originalRadius = this.handleRadius;
    
    this.handleRadius = originalRadius * (1 + pulse * 0.5);
    this.drawSelectionHandles(shape);
    this.handleRadius = originalRadius;
  }

  calculateFallbackBounds(shape) {
    if (!shape || !shape.params) {
      return { x: -25, y: -25, width: 50, height: 50 };
    }

    const { type, params } = shape;

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
        return { x: -radius, y: -radius, width: radius * 2, height: radius * 2 };
        
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
        const outerRadius = params.outerRadius || 50;
        return {
          x: -outerRadius, y: -outerRadius,
          width: outerRadius * 2, height: outerRadius * 2
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
        const gearRadius = (params.diameter || 100) / 2;
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
        
      case 'path':
        if (params.points && params.points.length > 0) {
          let minX = Infinity, maxX = -Infinity;
          let minY = Infinity, maxY = -Infinity;

          params.points.forEach(point => {
            if (point === null) return;
            const x = Array.isArray(point) ? point[0] : point.x;
            const y = Array.isArray(point) ? point[1] : point.y;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          });

          return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }
        return { x: -25, y: -25, width: 50, height: 50 };
        
      default:
        return { x: -25, y: -25, width: 50, height: 50 };
    }
  }
}
