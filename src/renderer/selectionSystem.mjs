// selectionSystem.mjs - Fixed shape selection and visual feedback

export class SelectionSystem {
  constructor(renderer, config = {}) {
    this.renderer = renderer;
    this.ctx = renderer.ctx;
    this.coordinateSystem = renderer.coordinateSystem;
    
    // Shared configuration with consistent colors
    this.selectionColor = config.selectionColor || '#FF5722';
    this.selectionColorLight = config.selectionColorLight || '#FF572220';
    this.hoverColor = config.hoverColor || '#FF6B35';
    this.showOperationLabels = true;
    
    this.selectedShape = null;
    this.hoveredShape = null;
  }

  setSelectedShape(shape) {
    this.selectedShape = shape;
  }

  setHoveredShape(shapeName) {
    this.hoveredShape = shapeName;
  }

  getSelectedShape() {
    return this.selectedShape;
  }

  getHoveredShape() {
    return this.hoveredShape;
  }

  drawSelectionOutline(shape, transformContext) {
    if (!shape || !shape.transform) return;

    const { transform } = shape;
    const screenX = this.coordinateSystem.transformX(transform.position[0]);
    const screenY = this.coordinateSystem.transformY(transform.position[1]);

    this.ctx.save();
    this.ctx.translate(screenX, screenY);
    this.ctx.rotate(-transform.rotation * Math.PI / 180);

    const bounds = this.renderer.transformManager.calculateBounds(shape);
    const scaledWidth = bounds.width * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;
    const scaledHeight = bounds.height * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;

    // Draw inner bounds outline (solid)
    this.ctx.strokeStyle = this.selectionColor + '40';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
    this.ctx.setLineDash([]);

    this.ctx.restore();
  }

  drawHoverOutline(shape, transformContext) {
    if (!shape || !shape.transform) return;

    const { transform } = shape;
    const screenX = this.coordinateSystem.transformX(transform.position[0]);
    const screenY = this.coordinateSystem.transformY(transform.position[1]);

    this.ctx.save();
    this.ctx.translate(screenX, screenY);
    this.ctx.rotate(-transform.rotation * Math.PI / 180);

    const bounds = this.renderer.transformManager.calculateBounds(shape);
    const scaledWidth = bounds.width * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;
    const scaledHeight = bounds.height * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;

    this.ctx.strokeStyle = this.hoverColor + '80';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([2, 2]);
    this.ctx.strokeRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
    this.ctx.setLineDash([]);

    this.ctx.restore();
  }

  drawOperationLabel(shape, operation) {
    if (!this.showOperationLabels || !operation) return;

    const screenX = this.coordinateSystem.transformX(shape.transform.position[0]);
    const screenY = this.coordinateSystem.transformY(shape.transform.position[1]);

    this.ctx.save();

    const bounds = this.renderer.transformManager.calculateBounds(shape);
    const labelY = screenY - (bounds.height * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel) / 2 - 25;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(screenX - 40, labelY - 10, 80, 20);

    this.ctx.strokeStyle = this.getOperationColor(operation);
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(screenX - 40, labelY - 10, 80, 20);

    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(operation.toUpperCase(), screenX, labelY);

    this.ctx.restore();
  }

  drawSelectionBadge(shape, badgeText, color = '#FF5722') {
    const screenX = this.coordinateSystem.transformX(shape.transform.position[0]);
    const screenY = this.coordinateSystem.transformY(shape.transform.position[1]);

    const bounds = this.renderer.transformManager.calculateBounds(shape);
    const badgeX = screenX + (bounds.width * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel) / 2 + 10;
    const badgeY = screenY - (bounds.height * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel) / 2;

    this.ctx.save();

    const badgeWidth = this.ctx.measureText(badgeText).width + 12;
    const badgeHeight = 18;

    this.ctx.fillStyle = color;
    this.ctx.fillRect(badgeX, badgeY - badgeHeight/2, badgeWidth, badgeHeight);

    this.ctx.fillStyle = 'white';
    this.ctx.font = '11px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(badgeText, badgeX + badgeWidth/2, badgeY);

    this.ctx.restore();
  }

  drawMultiSelectionOutline(shapes) {
    if (!shapes || shapes.length === 0) return;

    const bounds = this.calculateMultiSelectionBounds(shapes);
    
    this.ctx.save();
    this.ctx.strokeStyle = this.selectionColor + '60';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([8, 4]);
    this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = this.selectionColor + '10';
    this.ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

    this.drawSelectionCount(shapes.length, bounds);

    this.ctx.restore();
  }

  calculateMultiSelectionBounds(shapes) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const shape of shapes) {
      const screenX = this.coordinateSystem.transformX(shape.transform.position[0]);
      const screenY = this.coordinateSystem.transformY(shape.transform.position[1]);
      const bounds = this.renderer.transformManager.calculateBounds(shape);
      const scaledWidth = bounds.width * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;
      const scaledHeight = bounds.height * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;

      minX = Math.min(minX, screenX - scaledWidth / 2);
      maxX = Math.max(maxX, screenX + scaledWidth / 2);
      minY = Math.min(minY, screenY - scaledHeight / 2);
      maxY = Math.max(maxY, screenY + scaledHeight / 2);
    }

    return {
      x: minX - 10,
      y: minY - 10,
      width: maxX - minX + 20,
      height: maxY - minY + 20
    };
  }

  drawSelectionCount(count, bounds) {
    const countText = `${count} selected`;
    const textWidth = this.ctx.measureText(countText).width;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(bounds.x, bounds.y - 25, textWidth + 10, 20);

    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(countText, bounds.x + 5, bounds.y - 15);
  }

  drawSelectionInfo(shape, shapeName) {
    if (!shape) return;

    const screenX = this.coordinateSystem.transformX(shape.transform.position[0]);
    const screenY = this.coordinateSystem.transformY(shape.transform.position[1]);
    const bounds = this.renderer.transformManager.calculateBounds(shape);
    
    const infoX = screenX + (bounds.width * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel) / 2 + 15;
    const infoY = screenY;

    this.ctx.save();

    const info = this.getShapeInfoText(shape, shapeName);
    const maxWidth = Math.max(...info.map(line => this.ctx.measureText(line).width));
    const panelWidth = maxWidth + 16;
    const panelHeight = info.length * 16 + 8;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.fillRect(infoX, infoY - panelHeight/2, panelWidth, panelHeight);

    this.ctx.strokeStyle = this.selectionColor;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(infoX, infoY - panelHeight/2, panelWidth, panelHeight);

    this.ctx.fillStyle = '#333';
    this.ctx.font = '11px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    for (let i = 0; i < info.length; i++) {
      this.ctx.fillText(info[i], infoX + 8, infoY - panelHeight/2 + 8 + i * 16);
    }

    this.ctx.restore();
  }

  getShapeInfoText(shape, shapeName) {
    const info = [`${shapeName} (${shape.type})`];
    
    if (shape.transform.position) {
      info.push(`pos: ${shape.transform.position[0].toFixed(1)}, ${shape.transform.position[1].toFixed(1)}`);
    }
    
    if (shape.transform.rotation) {
      info.push(`rot: ${shape.transform.rotation.toFixed(1)}°`);
    }

    const params = shape.params;
    if (params.width && params.height) {
      info.push(`size: ${params.width.toFixed(1)} × ${params.height.toFixed(1)}`);
    } else if (params.radius) {
      info.push(`radius: ${params.radius.toFixed(1)}`);
    }

    if (params.operation) {
      info.push(`op: ${params.operation}`);
    }

    return info;
  }

  drawFocusRing(shape) {
    if (!shape || !shape.transform) return;

    const screenX = this.coordinateSystem.transformX(shape.transform.position[0]);
    const screenY = this.coordinateSystem.transformY(shape.transform.position[1]);

    this.ctx.save();
    this.ctx.translate(screenX, screenY);
    this.ctx.rotate(-shape.transform.rotation * Math.PI / 180);

    const bounds = this.renderer.transformManager.calculateBounds(shape);
    const scaledWidth = bounds.width * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;
    const scaledHeight = bounds.height * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;

    const padding = 8;
    const focusWidth = scaledWidth + padding * 2;
    const focusHeight = scaledHeight + padding * 2;

    this.ctx.strokeStyle = this.selectionColor;
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([]);
    this.ctx.globalAlpha = 0.6;
    this.ctx.strokeRect(-focusWidth / 2, -focusHeight / 2, focusWidth, focusHeight);

    this.ctx.restore();
  }

  drawSelectionGlow(shape, glowColor = null) {
    if (!shape || !shape.transform) return;

    const color = glowColor || this.getOperationColor(shape.params.operation) || this.selectionColor;
    
    this.ctx.save();
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 15;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.globalAlpha = 0.5;

    const screenX = this.coordinateSystem.transformX(shape.transform.position[0]);
    const screenY = this.coordinateSystem.transformY(shape.transform.position[1]);
    const bounds = this.renderer.transformManager.calculateBounds(shape);
    const scaledWidth = bounds.width * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;
    const scaledHeight = bounds.height * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;

    this.ctx.fillStyle = color + '40';
    this.ctx.fillRect(screenX - scaledWidth/2, screenY - scaledHeight/2, scaledWidth, scaledHeight);

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

  setShowOperationLabels(show) {
    this.showOperationLabels = show;
  }

  clearSelection() {
    this.selectedShape = null;
    this.hoveredShape = null;
  }

  isShapeSelected(shape) {
    return this.selectedShape === shape;
  }

  isShapeHovered(shapeName) {
    return this.hoveredShape === shapeName;
  }

  getSelectionBounds(shape) {
    if (!shape || !shape.transform) return null;

    const bounds = this.renderer.transformManager.calculateBounds(shape);
    const screenX = this.coordinateSystem.transformX(shape.transform.position[0]);
    const screenY = this.coordinateSystem.transformY(shape.transform.position[1]);
    const scaledWidth = bounds.width * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;
    const scaledHeight = bounds.height * this.coordinateSystem.scale * this.coordinateSystem.zoomLevel;

    return {
      x: screenX - scaledWidth / 2,
      y: screenY - scaledHeight / 2,
      width: scaledWidth,
      height: scaledHeight,
      centerX: screenX,
      centerY: screenY
    };
  }

  highlightShape(shape, highlightType = 'selection') {
    if (!shape) return;

    const transformContext = {
      screenX: this.coordinateSystem.transformX(shape.transform.position[0]),
      screenY: this.coordinateSystem.transformY(shape.transform.position[1]),
      rotation: (shape.transform.rotation || 0) * Math.PI / 180,
      scale: this.coordinateSystem.scale * this.coordinateSystem.zoomLevel
    };

    switch (highlightType) {
      case 'selection':
        this.drawFocusRing(shape);
        break;
      case 'hover':
        this.drawHoverOutline(shape, transformContext);
        break;
      case 'glow':
        this.drawSelectionGlow(shape);
        break;
      case 'outline':
        this.drawSelectionOutline(shape, transformContext);
        break;
    }
  }
}
