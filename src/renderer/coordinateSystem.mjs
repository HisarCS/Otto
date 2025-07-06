// coordinateSystem.mjs - Coordinate transformations and canvas management

export class CoordinateSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.scale = 1;
    this.zoomLevel = 1;
    this.panOffset = { x: 0, y: 0 };
    this.offsetX = 0;
    this.offsetY = 0;
    
    this.isGridEnabled = true;
    this.gridSize = 20;
    this.gridOpacity = 0.08;
    this.backgroundColor = '#FAFAFA';
    this.gridColor = '#D1D5DB';
    
    this.setupCanvas();
  }
  
  setupCanvas() {
    try {
      const container = this.canvas.parentElement;
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
      
      this.offsetX = this.canvas.width / 2;
      this.offsetY = this.canvas.height / 2;
      this.scale = Math.min(this.canvas.width, this.canvas.height) / 800;
    } catch (error) {
      this.offsetX = 400;
      this.offsetY = 300;
      this.scale = 1;
    }
  }
  
  transformX(x) {
    return x * this.scale * this.zoomLevel + this.offsetX + this.panOffset.x;
  }

  transformY(y) {
    return -y * this.scale * this.zoomLevel + this.offsetY + this.panOffset.y;
  }
  
  screenToWorld(x, y) {
    return {
      x: (x - this.offsetX - this.panOffset.x) / (this.scale * this.zoomLevel),
      y: -(y - this.offsetY - this.panOffset.y) / (this.scale * this.zoomLevel)
    };
  }
  
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
  }
  
  drawBackground() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.isGridEnabled) {
      this.drawModernGrid();
    }
  }
  
  drawModernGrid() {
    const gridSize = this.gridSize * this.scale * this.zoomLevel;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    let opacity = this.gridOpacity * 3;
    if (this.zoomLevel < 0.5) opacity *= this.zoomLevel * 2;
    if (this.zoomLevel > 3) opacity *= (1 / this.zoomLevel) * 3;
    
    this.ctx.fillStyle = '#999999';
    
    for (let x = this.offsetX % gridSize; x < width; x += gridSize) {
      for (let y = this.offsetY % gridSize; y < height; y += gridSize) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }
  
  zoom(factor, mouseX, mouseY) {
    const worldBefore = this.screenToWorld(mouseX, mouseY);
    this.zoomLevel *= factor;
    this.zoomLevel = Math.max(0.1, Math.min(10, this.zoomLevel));
    const worldAfter = this.screenToWorld(mouseX, mouseY);
    
    this.panOffset.x += (worldAfter.x - worldBefore.x) * this.scale * this.zoomLevel;
    this.panOffset.y -= (worldAfter.y - worldBefore.y) * this.scale * this.zoomLevel;
  }
  
  pan(dx, dy) {
    this.panOffset.x += dx;
    this.panOffset.y += dy;
  }
  
  toggleGrid() {
    this.isGridEnabled = !this.isGridEnabled;
  }
  
  setZoomLevel(level) {
    this.zoomLevel = Math.max(0.1, Math.min(10, level));
  }
  
  setPanOffset(x, y) {
    this.panOffset.x = x;
    this.panOffset.y = y;
  }
  
  getCanvasBounds() {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
      centerX: this.offsetX,
      centerY: this.offsetY
    };
  }
  
  getViewportBounds() {
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.canvas.width, this.canvas.height);
    
    return {
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y,
      width: bottomRight.x - topLeft.x,
      height: topLeft.y - bottomRight.y
    };
  }
  
  isPointInViewport(x, y) {
    const bounds = this.getViewportBounds();
    return x >= bounds.left && x <= bounds.right && 
           y >= bounds.bottom && y <= bounds.top;
  }
  
  snapToGrid(x, y) {
    if (!this.isGridEnabled) return { x, y };
    
    const gridWorldSize = this.gridSize;
    return {
      x: Math.round(x / gridWorldSize) * gridWorldSize,
      y: Math.round(y / gridWorldSize) * gridWorldSize
    };
  }
}
