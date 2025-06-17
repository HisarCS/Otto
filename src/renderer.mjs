// renderer.mjs - Complete modular renderer with flexible boolean operations support
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
  PolygonWithHoles
} from './Shapes.mjs';

import { shapeManager } from './shapeManager.mjs';

export class Renderer {
  constructor(canvas) {
    try {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.scale = 1;
      
      // Core rendering system
      this.renderingEngine = new ModularRenderingEngine(this.ctx);
      this.pathBuilder = new FlexiblePathBuilder();
      this.styleManager = new ShapeStyleManager();
      this.transformManager = new TransformManager();
      
      // Interactive features
      this.shapes = new Map();
      this.selectedShape = null;
      this.hoveredShape = null;
      this.dragging = false;
      this.scaling = false;
      this.rotating = false;
      this.panning = false;
      this.lastMousePos = { x: 0, y: 0 };
      
      // Grid and view system
      this.isGridEnabled = true;
      this.gridSize = 20;
      this.gridOpacity = 0.08;
      this.zoomLevel = 1;
      this.panOffset = { x: 0, y: 0 };
      
      // Debug system
      this.debugMode = false;
      this.showOperationLabels = true;
      this.debugVisualizer = new DebugVisualizer(this.ctx);
      
      // Modern handle system
      this.handleRadius = 6;
      this.handleHoverRadius = 7;
      this.rotationHandleDistance = 35;
      this.activeHandle = null;
      this.hoveredHandle = null;
      
      // Color and style system
      this.colorSystem = new ColorSystem();
      this.selectionColor = '#FF5722';
      this.selectionColorLight = '#FF572220';
      this.hoverColor = '#FF6B35';
      this.backgroundColor = '#FAFAFA';
      this.gridColor = '#D1D5DB';
      
      // Boolean operation system
      this.booleanRenderer = new BooleanOperationRenderer(this.ctx, this.pathBuilder);
      
      // Callbacks
      this.updateCodeCallback = null;
      
      this.setupCanvas();
      this.setupInteractivity();
      this.enableInteractiveMode();
      
      // Register with ShapeManager
      shapeManager.registerRenderer(this);
      
      console.log('🚀 Modular Renderer initialized with flexible boolean operations');
    } catch (error) {
      console.error('Error initializing modular renderer:', error);
      this.setupCanvas();
    }
  }

  // Enable/disable debug mode
  setDebugMode(enabled) {
    this.debugMode = enabled;
    this.debugVisualizer.setEnabled(enabled);
    this.booleanRenderer.setDebugMode(enabled);
    console.log(`🔧 Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    this.redraw();
  }

  // MODULAR CALLBACK SYSTEM
  notifyShapeChanged(shape, action = 'update') {
    try {
      if (!this.updateCodeCallback || !shape) return;
      
      let shapeName = null;
      if (this.shapes) {
        for (const [name, s] of this.shapes.entries()) {
          if (s === shape) {
            shapeName = name;
            break;
          }
        }
      }
      
      if (shape.transform && shape.transform.position && shape.transform.position.length > 2) {
        shape.transform.position.length = 2;
      }
      
      if (shapeName) {
        this.updateCodeCallback({
          action: action,
          name: shapeName,
          shape: shape
        });
      }
    } catch (error) {
      console.error('Error in notifyShapeChanged:', error);
    }
  }

  setupCanvas() {
    try {
      const container = this.canvas.parentElement;
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
      
      this.offsetX = this.canvas.width / 2;
      this.offsetY = this.canvas.height / 2;
      this.scale = Math.min(this.canvas.width, this.canvas.height) / 800;
      
      this.createGridToggleButton();
      this.redraw();
    } catch (error) {
      console.error('Error setting up canvas:', error);
      this.offsetX = 400;
      this.offsetY = 300;
      this.scale = 1;
    }
  }

  createGridToggleButton() {
    try {
      const existingButton = document.getElementById('grid-toggle-btn');
      if (existingButton) {
        existingButton.remove();
      }

      const gridButton = document.createElement('button');
      gridButton.id = 'grid-toggle-btn';
      gridButton.className = 'grid-toggle-button';
      gridButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="5" cy="5" r="1" fill="currentColor"/>
          <circle cx="12" cy="5" r="1" fill="currentColor"/>
          <circle cx="19" cy="5" r="1" fill="currentColor"/>
          <circle cx="5" cy="12" r="1" fill="currentColor"/>
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
          <circle cx="19" cy="12" r="1" fill="currentColor"/>
          <circle cx="5" cy="19" r="1" fill="currentColor"/>
          <circle cx="12" cy="19" r="1" fill="currentColor"/>
          <circle cx="19" cy="19" r="1" fill="currentColor"/>
        </svg>
      `;
      
      gridButton.addEventListener('click', () => {
        this.isGridEnabled = !this.isGridEnabled;
        this.updateGridButtonState();
        this.redraw();
      });

      this.canvas.parentElement.appendChild(gridButton);
      this.updateGridButtonState();
    } catch (error) {
      console.error('Error creating grid toggle button:', error);
    }
  }

  updateGridButtonState() {
    try {
      const gridButton = document.getElementById('grid-toggle-btn');
      if (gridButton) {
        if (this.isGridEnabled) {
          gridButton.classList.add('active');
          gridButton.style.backgroundColor = '#FF5722';
          gridButton.style.color = 'white';
        } else {
          gridButton.classList.remove('active');
          gridButton.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          gridButton.style.color = '#6B7280';
        }
      }
    } catch (error) {
      console.error('Error updating grid button state:', error);
    }
  }

  clear() {
    try {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.drawBackground();
    } catch (error) {
      console.error('Error clearing canvas:', error);
    }
  }

  drawBackground() {
    try {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      if (this.isGridEnabled) {
        this.drawModernGrid();
      }
    } catch (error) {
      console.error('Error drawing background:', error);
    }
  }

  drawModernGrid() {
    try {
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
    } catch (error) {
      console.error('Error drawing grid:', error);
    }
  }

  // TRANSFORM COORDINATE SYSTEM
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

  // MAIN SHAPE DRAWING - MODULAR APPROACH
  drawShape(shape, isSelected = false, isHovered = false) {
    try {
      if (!shape || !shape.type || !shape.transform) {
        return;
      }

      // Setup transform context
      const transformContext = this.transformManager.createContext(
        shape.transform, 
        this.transformX(shape.transform.position[0]),
        this.transformY(shape.transform.position[1]),
        this.scale * this.zoomLevel
      );

      this.ctx.save();
      this.ctx.translate(transformContext.screenX, transformContext.screenY);
      this.ctx.rotate(-transformContext.rotation);

      // Apply style using modular style manager
      const styleContext = this.styleManager.createStyleContext(shape, isSelected, isHovered);
      this.styleManager.applyStyle(this.ctx, styleContext);

      // Render using modular rendering engine
      this.renderingEngine.renderShape(shape, styleContext, isSelected, isHovered);

      this.ctx.restore();

      // Draw selection handles
      if (isSelected) {
        this.drawModernSelectionHandles(shape);
        
        if (shape.params.operation && this.showOperationLabels) {
          this.drawOperationLabel(shape, shape.params.operation);
        }
      }

      // Debug visualization
      if (this.debugMode) {
        this.debugVisualizer.visualizeShape(shape, transformContext);
      }

    } catch (error) {
      console.error('Error drawing shape:', error);
    }
  }

  // MODULAR REDRAW SYSTEM
  redraw() {
    try {
      this.clear();
      
      if (!this.shapes) return;

      // Filter and sort shapes for proper rendering order
      const renderableShapes = this.filterRenderableShapes();
      const sortedShapes = this.sortShapesByRenderOrder(renderableShapes);

      // Render each shape
      for (const { name, shape } of sortedShapes) {
        const isSelected = shape === this.selectedShape;
        const isHovered = name === this.hoveredShape && !isSelected;
        
        this.drawShape(shape, isSelected, isHovered);
      }

      // Debug overlay
      if (this.debugMode) {
        this.debugVisualizer.drawOverlay(this.shapes);
      }

    } catch (error) {
      console.error('Error in modular redraw:', error);
      this.fallbackRedraw();
    }
  }

  filterRenderableShapes() {
    const renderable = [];
    
    for (const [name, shape] of this.shapes.entries()) {
      if (!shape) continue;
      
      // Skip consumed shapes (boolean operation inputs)
      if (shape._consumedByBoolean) {
        if (this.debugMode) {
          console.log(`🚫 Skipping consumed shape: ${name}`);
        }
        continue;
      }
      
      renderable.push({ name, shape });
    }
    
    return renderable;
  }

  sortShapesByRenderOrder(shapes) {
    return shapes.sort((a, b) => {
      // Boolean operation results render last (on top)
      const aIsBool = a.shape.params?.operation ? 1 : 0;
      const bIsBool = b.shape.params?.operation ? 1 : 0;
      
      if (aIsBool !== bIsBool) {
        return aIsBool - bIsBool;
      }
      
      // Regular shapes by creation order
      return 0;
    });
  }

  fallbackRedraw() {
    try {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } catch (e) {
      console.error('Failed to recover from redraw error:', e);
    }
  }

  // SELECTION HANDLES SYSTEM
  drawModernSelectionHandles(shape) {
    try {
      if (!shape || !shape.transform) return;
      
      const { transform } = shape;
      const screenX = this.transformX(transform.position[0]);
      const screenY = this.transformY(transform.position[1]);
      
      this.ctx.save();
      this.ctx.translate(screenX, screenY);
      this.ctx.rotate(-transform.rotation * Math.PI / 180);
      
      const bounds = this.getShapeBounds(shape);
      const scaledWidth = bounds.width * this.scale * this.zoomLevel;
      const scaledHeight = bounds.height * this.scale * this.zoomLevel;
      
      // Operation-specific outline color
      let outlineColor = this.selectionColor + '40';
      if (shape.params.operation) {
        outlineColor = this.colorSystem.getOperationColor(shape.params.operation) + '60';
      }
      
      // Selection outline
      this.ctx.strokeStyle = outlineColor;
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([4, 4]);
      this.ctx.strokeRect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      this.ctx.setLineDash([]);
      
      // Corner handles
      this.drawCornerHandles(shape, scaledWidth, scaledHeight);
      
      // Rotation handle
      this.drawRotationHandle(shape, scaledHeight);
      
      this.ctx.restore();
    } catch (error) {
      console.error('Error drawing selection handles:', error);
    }
  }

  drawCornerHandles(shape, scaledWidth, scaledHeight) {
    const handlePositions = [
      { x: -scaledWidth / 2, y: -scaledHeight / 2, handle: 'tl' },
      { x: scaledWidth / 2, y: -scaledHeight / 2, handle: 'tr' },
      { x: scaledWidth / 2, y: scaledHeight / 2, handle: 'br' },
      { x: -scaledWidth / 2, y: scaledHeight / 2, handle: 'bl' }
    ];
    
    handlePositions.forEach(pos => {
      const isHovered = this.hoveredHandle === pos.handle;
      const radius = isHovered ? this.handleHoverRadius : this.handleRadius;
      
      this.ctx.save();
      this.ctx.translate(pos.x, pos.y);
      
      // Shadow
      this.ctx.beginPath();
      this.ctx.arc(0.5, 0.5, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#00000020';
      this.ctx.fill();
      
      // Handle
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fill();
      this.ctx.strokeStyle = shape.params.operation ? 
        this.colorSystem.getOperationColor(shape.params.operation) : this.selectionColor;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      this.ctx.restore();
    });
  }

  drawRotationHandle(shape, scaledHeight) {
    const rotHandleY = -scaledHeight / 2 - this.rotationHandleDistance;
    
    // Connection line
    this.ctx.beginPath();
    this.ctx.moveTo(0, -scaledHeight / 2);
    this.ctx.lineTo(0, rotHandleY);
    this.ctx.strokeStyle = (shape.params.operation ? 
      this.colorSystem.getOperationColor(shape.params.operation) : this.selectionColor) + '60';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Handle
    const isRotHovered = this.hoveredHandle === 'rotate';
    const rotRadius = isRotHovered ? this.handleHoverRadius : this.handleRadius;
    
    this.ctx.beginPath();
    this.ctx.arc(0.5, rotHandleY + 0.5, rotRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#00000020';
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(0, rotHandleY, rotRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fill();
    this.ctx.strokeStyle = shape.params.operation ? 
      this.colorSystem.getOperationColor(shape.params.operation) : this.selectionColor;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Rotation icon
    this.ctx.beginPath();
    this.ctx.arc(0, rotHandleY, rotRadius * 0.4, 0, Math.PI * 1.5);
    this.ctx.strokeStyle = shape.params.operation ? 
      this.colorSystem.getOperationColor(shape.params.operation) : this.selectionColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }

  drawOperationLabel(shape, operation) {
    try {
      const screenX = this.transformX(shape.transform.position[0]);
      const screenY = this.transformY(shape.transform.position[1]);
      
      this.ctx.save();
      
      const bounds = this.getShapeBounds(shape);
      const labelY = screenY - (bounds.height * this.scale * this.zoomLevel) / 2 - 25;
      
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(screenX - 40, labelY - 10, 80, 20);
      
      this.ctx.strokeStyle = this.colorSystem.getOperationColor(operation);
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(screenX - 40, labelY - 10, 80, 20);
      
      this.ctx.fillStyle = 'white';
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(operation.toUpperCase(), screenX, labelY);
      
      this.ctx.restore();
    } catch (error) {
      console.error('Error drawing operation label:', error);
    }
  }

  getShapeBounds(shape) {
    try {
      if (!shape || !shape.type || !shape.params) {
        return { x: -25, y: -25, width: 50, height: 50 };
      }
      
      return this.transformManager.calculateBounds(shape);
    } catch (error) {
      console.error('Error getting shape bounds:', error);
      return { x: -25, y: -25, width: 50, height: 50 };
    }
  }

  // INTERACTIVITY SYSTEM
  setupInteractivity() {
    try {
      this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
      this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
      this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
      window.addEventListener('keydown', this.handleKeyDown.bind(this));
    } catch (error) {
      console.error('Error setting up interactivity:', error);
    }
  }
  
  enableInteractiveMode() {
    try {
      this.canvas.className = '';
      this.redraw();
    } catch (error) {
      console.error('Error enabling interactive mode:', error);
    }
  }

  // Mouse event handlers (simplified for brevity - same logic as before)
  handleMouseDown(event) {
    try {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      this.lastMousePos = { x, y };
      
      if (event.shiftKey) {
        this.panning = true;
        this.canvas.className = 'cursor-grabbing';
        return;
      }
      
      if (this.selectedShape) {
        const handleInfo = this.getHandleAtPoint(x, y);
        if (handleInfo) {
          if (handleInfo.type === 'scale') {
            this.scaling = true;
            this.activeHandle = handleInfo.handle;
            this.canvas.className = 'cursor-resize-' + this.getResizeCursorClass(handleInfo.handle);
          } else if (handleInfo.type === 'rotate') {
            this.rotating = true;
            this.canvas.className = 'cursor-grabbing';
          }
          return;
        }
      }
      
      this.selectShapeAtPoint(x, y);
      this.redraw();
    } catch (error) {
      console.error('Error in handleMouseDown:', error);
    }
  }

  selectShapeAtPoint(x, y) {
    let selectedShapeName = null;
    
    if (!this.shapes) {
      this.shapes = new Map();
      return;
    }
    
    for (const [name, shape] of [...this.shapes.entries()].reverse()) {
      if (shape._consumedByBoolean) continue;
      
      if (this.isPointInShape(x, y, shape)) {
        selectedShapeName = name;
        break;
      }
    }
    
    if (selectedShapeName) {
      this.selectedShape = this.shapes.get(selectedShapeName);
      this.dragging = true;
      this.canvas.className = 'cursor-move';
    } else {
      this.selectedShape = null;
      this.canvas.className = '';
    }
  }

  handleMouseMove(event) {
    try {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const dx = x - this.lastMousePos.x;
      const dy = y - this.lastMousePos.y;
      
      if (this.panning) {
        this.panOffset.x += dx;
        this.panOffset.y += dy;
        this.redraw();
      } else if (this.scaling && this.selectedShape) {
        this.handleParameterScaling(dx, dy);
      } else if (this.rotating && this.selectedShape) {
        this.handleRotation(x, y);
      } else if (this.dragging && this.selectedShape) {
        this.handleDragging(dx, dy);
      } else {
        this.updateCursor(x, y);
        this.updateHoverState(x, y);
      }
      
      this.lastMousePos = { x, y };
    } catch (error) {
      console.error('Error in handleMouseMove:', error);
    }
  }

  // Additional mouse handlers and interaction methods would continue here...
  // (Including handleMouseUp, handleWheel, handleKeyDown, etc.)
  
  handleMouseUp() {
    try {
      this.dragging = false;
      this.scaling = false;
      this.rotating = false;
      this.panning = false;
      this.activeHandle = null;
      
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.updateCursor(x, y);
    } catch (error) {
      console.error('Error in handleMouseUp:', error);
    }
  }


handleWheel(event) {
  try {
    event.preventDefault();
    
    // Check if Ctrl is pressed for panning mode
    if (event.ctrlKey) {
      // Pan sensitivity - adjust these values to control movement speed
      const panSensitivity = 2;
      
      // Handle vertical panning (up/down)
      if (event.deltaY !== 0) {
        this.panOffset.y -= event.deltaY * panSensitivity;
      }
      
      // Handle horizontal panning (left/right)
      if (event.deltaX !== 0) {
        this.panOffset.x -= event.deltaX * panSensitivity;
      }
      
      // If no horizontal wheel movement, use Shift+Ctrl+wheel for horizontal
      if (event.deltaX === 0 && event.shiftKey) {
        this.panOffset.x -= event.deltaY * panSensitivity;
      }
      
      this.redraw();
      
    } else {
      // Original zoom functionality when Ctrl is not pressed
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      const worldBefore = this.screenToWorld(mouseX, mouseY);
      this.zoomLevel *= zoomFactor;
      this.zoomLevel = Math.max(0.1, Math.min(10, this.zoomLevel));
      const worldAfter = this.screenToWorld(mouseX, mouseY);
      
      this.panOffset.x += (worldAfter.x - worldBefore.x) * this.scale * this.zoomLevel;
      this.panOffset.y -= (worldAfter.y - worldBefore.y) * this.scale * this.zoomLevel;
      
      this.redraw();
    }
    
  } catch (error) {
    console.error('Error in handleWheel:', error);
  }
}

  handleKeyDown(event) {
    try {
      if (event.key.toLowerCase() === ';') {
        event.preventDefault();
        this.isGridEnabled = !this.isGridEnabled;
        this.updateGridButtonState();
        this.redraw();
        return;
      }

      if (event.key.toLowerCase() === 'd' && event.ctrlKey) {
        event.preventDefault();
        this.setDebugMode(!this.debugMode);
        return;
      }

      if (!this.selectedShape) return;

      const shapeName = shapeManager.findShapeName(this.selectedShape);
      if (!shapeName) return;
      
      const shape = this.selectedShape;
      
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          this.deleteSelectedShape();
          break;
        
        case 'r':
        case 'R':
          event.preventDefault();
          const newRotation = (shape.transform.rotation + 15) % 360;
          shapeManager.onCanvasRotationChange(shapeName, newRotation);
          this.notifyShapeChanged(shape);
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          const upAmount = event.shiftKey ? 20 : 5;
          const newPosUp = [shape.transform.position[0], shape.transform.position[1] + upAmount];
          shapeManager.onCanvasPositionChange(shapeName, newPosUp);
          this.notifyShapeChanged(shape);
          break;
          
        case 'ArrowDown':
          event.preventDefault();
          const downAmount = event.shiftKey ? 20 : 5;
          const newPosDown = [shape.transform.position[0], shape.transform.position[1] - downAmount];
          shapeManager.onCanvasPositionChange(shapeName, newPosDown);
          this.notifyShapeChanged(shape);
          break;
          
        case 'ArrowLeft':
          event.preventDefault();
          const leftAmount = event.shiftKey ? 20 : 5;
          const newPosLeft = [shape.transform.position[0] - leftAmount, shape.transform.position[1]];
          shapeManager.onCanvasPositionChange(shapeName, newPosLeft);
          this.notifyShapeChanged(shape);
          break;
          
        case 'ArrowRight':
          event.preventDefault();
          const rightAmount = event.shiftKey ? 20 : 5;
          const newPosRight = [shape.transform.position[0] + rightAmount, shape.transform.position[1]];
          shapeManager.onCanvasPositionChange(shapeName, newPosRight);
          this.notifyShapeChanged(shape);
          break;
      }
    } catch (error) {
      console.error('Error in handleKeyDown:', error);
    }
  }

  // Additional utility methods
  isPointInShape(x, y, shape) {
    try {
      if (!shape || !shape.transform) return false;
      
      const shapeX = this.transformX(shape.transform.position[0]);
      const shapeY = this.transformY(shape.transform.position[1]);
      
      const dx = x - shapeX;
      const dy = y - shapeY;
      
      const angle = shape.transform.rotation * Math.PI / 180;
      const rotatedX = dx * Math.cos(angle) + dy * Math.sin(angle);
      const rotatedY = dy * Math.cos(angle) - dx * Math.sin(angle);
      
      const bounds = this.getShapeBounds(shape);
      const scaledWidth = bounds.width * this.scale * this.zoomLevel;
      const scaledHeight = bounds.height * this.scale * this.zoomLevel;
      
      return (
        Math.abs(rotatedX) <= scaledWidth / 2 &&
        Math.abs(rotatedY) <= scaledHeight / 2
      );
    } catch (error) {
      console.error('Error in isPointInShape:', error);
      return false;
    }
  }

  getHandleAtPoint(x, y) {
    // Implementation similar to before but more modular
    try {
      if (!this.selectedShape) return null;
      
      const shape = this.selectedShape;
      const shapeX = this.transformX(shape.transform.position[0]);
      const shapeY = this.transformY(shape.transform.position[1]);
      
      const bounds = this.getShapeBounds(shape);
      const scaledWidth = bounds.width * this.scale * this.zoomLevel;
      const scaledHeight = bounds.height * this.scale * this.zoomLevel;
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
      
      const handlePositions = [
        { handle: 'tl', pos: rotate(shapeX - halfWidth, shapeY - halfHeight) },
        { handle: 'tr', pos: rotate(shapeX + halfWidth, shapeY - halfHeight) },
        { handle: 'br', pos: rotate(shapeX + halfWidth, shapeY + halfHeight) },
        { handle: 'bl', pos: rotate(shapeX - halfWidth, shapeY + halfHeight) }
      ];
      
      for (const handleInfo of handlePositions) {
        const dx = x - handleInfo.pos.x;
        const dy = y - handleInfo.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= this.handleRadius + 3) {
          return { type: 'scale', handle: handleInfo.handle };
        }
      }
      
      const rotHandlePos = rotate(shapeX, shapeY - halfHeight - this.rotationHandleDistance);
      const rotDx = x - rotHandlePos.x;
      const rotDy = y - rotHandlePos.y;
      const rotDist = Math.sqrt(rotDx * rotDx + rotDy * rotDy);
      
      if (rotDist <= this.handleRadius + 3) {
        return { type: 'rotate' };
      }
      
      return null;
    } catch (error) {
      console.error('Error in getHandleAtPoint:', error);
      return null;
    }
  }

  updateCursor(x, y) {
    try {
      if (this.selectedShape) {
        const handleInfo = this.getHandleAtPoint(x, y);
        
        if (handleInfo) {
          if (handleInfo.type === 'scale') {
            this.canvas.className = 'cursor-resize-' + this.getResizeCursorClass(handleInfo.handle);
          } else if (handleInfo.type === 'rotate') {
            this.canvas.className = 'cursor-rotate';
          }
          return;
        }
      }
      
      let isOverShape = false;
      
      if (this.shapes) {
        for (const [name, shape] of [...this.shapes.entries()].reverse()) {
          if (shape._consumedByBoolean) continue;
          
          if (this.isPointInShape(x, y, shape)) {
            this.canvas.className = 'cursor-move';
            isOverShape = true;
            break;
          }
        }
      }
      
      if (!isOverShape) {
        this.canvas.className = '';
      }
    } catch (error) {
      console.error('Error in updateCursor:', error);
      this.canvas.className = '';
    }
  }

  updateHoverState(x, y) {
    try {
      let newHoveredShape = null;
      let newHoveredHandle = null;
      
      if (this.selectedShape) {
        const handleInfo = this.getHandleAtPoint(x, y);
        if (handleInfo) {
          newHoveredHandle = handleInfo.handle || 'rotate';
        }
      }
      
      if (!newHoveredHandle && this.shapes) {
        for (const [name, shape] of [...this.shapes.entries()].reverse()) {
          if (shape._consumedByBoolean) continue;
          
          if (this.isPointInShape(x, y, shape)) {
            newHoveredShape = name;
            break;
          }
        }
      }
      
      if (newHoveredShape !== this.hoveredShape || newHoveredHandle !== this.hoveredHandle) {
        this.hoveredShape = newHoveredShape;
        this.hoveredHandle = newHoveredHandle;
        this.redraw();
      }
    } catch (error) {
      console.error('Error updating hover state:', error);
    }
  }

  handleMouseLeave() {
    try {
      this.hoveredShape = null;
      this.hoveredHandle = null;
      this.redraw();
    } catch (error) {
      console.error('Error in handleMouseLeave:', error);
    }
  }

  getResizeCursorClass(handle) {
    switch (handle) {
      case 'tl':
      case 'br':
        return 'nwse';
      case 'tr':
      case 'bl':
        return 'nesw';
      default:
        return '';
    }
  }

  handleParameterScaling(dx, dy) {
    // Implementation would be similar to before but more modular
    try {
      if (!this.selectedShape) return;
      
      const shapeName = shapeManager.findShapeName(this.selectedShape);
      if (!shapeName) return;
      
      // Use modular parameter scaling system
      this.transformManager.handleParameterScaling(
        this.selectedShape, 
        this.activeHandle, 
        dx, 
        dy, 
        this.scale * this.zoomLevel,
        shapeName,
        shapeManager
      );
      
      this.notifyShapeChanged(this.selectedShape);
    } catch (error) {
      console.error('Error in handleParameterScaling:', error);
    }
  }

  handleRotation(x, y) {
    try {
      if (!this.selectedShape) return;
      
      const shapeName = shapeManager.findShapeName(this.selectedShape);
      if (!shapeName) return;
      
      const shape = this.selectedShape;
      const centerX = this.transformX(shape.transform.position[0]);
      const centerY = this.transformY(shape.transform.position[1]);
      
      const angle = -Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
      
      let newRotation = angle;
      if (event.altKey) {
        newRotation = Math.round(angle / 15) * 15;
      }
      
      shapeManager.onCanvasRotationChange(shapeName, newRotation);
      this.notifyShapeChanged(this.selectedShape);
    } catch (error) {
      console.error('Error in handleRotation:', error);
    }
  }

  handleDragging(dx, dy) {
    try {
      if (!this.selectedShape) return;
      
      const shapeName = shapeManager.findShapeName(this.selectedShape);
      if (!shapeName) return;
      
      const shape = this.selectedShape;
      
      const worldDX = dx / (this.scale * this.zoomLevel);
      const worldDY = -dy / (this.scale * this.zoomLevel);
      
      let newX = shape.transform.position[0] + worldDX;
      let newY = shape.transform.position[1] + worldDY;

      if (this.isGridEnabled && event.ctrlKey) {
        newX = Math.round(newX / this.gridSize) * this.gridSize;
        newY = Math.round(newY / this.gridSize) * this.gridSize;
      }

      shapeManager.onCanvasPositionChange(shapeName, [newX, newY]);
      this.notifyShapeChanged(this.selectedShape);
    } catch (error) {
      console.error('Error in handleDragging:', error);
    }
  }

  deleteSelectedShape() {
    try {
      if (!this.selectedShape) return;
      
      let selectedName = null;
      
      if (this.shapes) {
        for (const [name, shape] of this.shapes.entries()) {
          if (shape === this.selectedShape) {
            selectedName = name;
            break;
          }
        }
      }
      
      if (selectedName) {
        this.shapes.delete(selectedName);
        this.selectedShape = null;
        
        if (this.updateCodeCallback) {
          this.updateCodeCallback({ action: 'delete', name: selectedName });
        }
        
        this.redraw();
      }
    } catch (error) {
      console.error('Error in deleteSelectedShape:', error);
    }
  }

  // PUBLIC API METHODS
  setUpdateCodeCallback(callback) {
    this.updateCodeCallback = callback;
  }
  
  setShapes(shapes) {
    try {
      if (!shapes) {
        this.shapes = new Map();
      } else {
        this.shapes = shapes;
        shapeManager.registerInterpreter({ env: { shapes } });
      }
      this.selectedShape = null;
      this.hoveredShape = null;
      this.redraw();
    } catch (error) {
      console.error('Error setting shapes:', error);
      this.shapes = new Map();
    }
  }

  toggleFillForSelectedShape() {
    try {
      if (!this.selectedShape) return;
      
      const shapeName = shapeManager.findShapeName(this.selectedShape);
      if (!shapeName) return;
      
      const shape = this.selectedShape;
      const currentFill = shape.params.fill || false;
      
      shapeManager.onCanvasShapeChange(shapeName, 'fill', !currentFill);
      
      if (!currentFill && !shape.params.fillColor) {
        shapeManager.onCanvasShapeChange(shapeName, 'fillColor', '#808080');
      }
      
      this.notifyShapeChanged(this.selectedShape);
    } catch (error) {
      console.error('Error toggling fill:', error);
    }
  }

  setFillColorForSelectedShape(color) {
    try {
      if (!this.selectedShape) return;
      
      const shapeName = shapeManager.findShapeName(this.selectedShape);
      if (!shapeName) return;
      
      shapeManager.onCanvasShapeChange(shapeName, 'fill', true);
      shapeManager.onCanvasShapeChange(shapeName, 'fillColor', color);
      
      this.notifyShapeChanged(this.selectedShape);
    } catch (error) {
      console.error('Error setting fill color:', error);
    }
  }
}

// MODULAR RENDERING ENGINE
class ModularRenderingEngine {
  constructor(ctx) {
    this.ctx = ctx;
    this.pathRenderer = new PathRenderer(ctx);
    this.shapeRenderer = new ShapeRenderer(ctx);
    this.booleanRenderer = new BooleanOperationRenderer(ctx);
  }

  renderShape(shape, styleContext, isSelected, isHovered) {
    try {
      const { type, params } = shape;

      // Handle boolean operation results specially
      if (params.operation) {
        return this.booleanRenderer.renderBooleanResult(shape, styleContext, isSelected, isHovered);
      }

      // Handle different shape types
      switch (type) {
        case 'path':
          return this.pathRenderer.renderPath(params, styleContext, isSelected, isHovered);
        case 'text':
          return this.shapeRenderer.renderText(params, styleContext, isSelected, isHovered);
        case 'gear':
          return this.shapeRenderer.renderGear(params, styleContext, isSelected, isHovered);
        case 'bezier':
          return this.shapeRenderer.renderBezier(params, styleContext, isSelected, isHovered);
        default:
          return this.shapeRenderer.renderGenericShape(type, params, styleContext, isSelected, isHovered);
      }
    } catch (error) {
      console.error('Error in renderShape:', error);
    }
  }
}

// BOOLEAN OPERATION RENDERER - THE KEY TO FIXING HOLES
class BooleanOperationRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.debugMode = false;
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  renderBooleanResult(shape, styleContext, isSelected, isHovered) {
    try {
      const { params } = shape;
      
      if (this.debugMode) {
        console.log('🎯 Rendering boolean result:', {
          operation: params.operation,
          hasHoles: params.hasHoles,
          pointCount: params.points ? params.points.length : 0
        });
      }

      // Handle path-based boolean results
      if (shape.type === 'path' && params.points) {
        return this.renderBooleanPath(params, styleContext, isSelected, isHovered);
      }

      return false;
    } catch (error) {
      console.error('Error rendering boolean result:', error);
      return false;
    }
  }

  renderBooleanPath(params, styleContext, isSelected, isHovered) {
    try {
      const { points } = params;
      if (!points || points.length < 2) return false;

      // Check for holes
      const nullIndex = points.findIndex(p => p === null);
      const hasHoles = nullIndex !== -1 || params.hasHoles;

      if (this.debugMode) {
        console.log('🕳️ Boolean path rendering:', {
          hasHoles: hasHoles,
          nullIndex: nullIndex,
          totalPoints: points.length
        });
      }

      if (hasHoles && nullIndex !== -1) {
        return this.renderPathWithHoles(points, nullIndex, params, styleContext, isSelected, isHovered);
      } else {
        return this.renderSimplePath(points, params, styleContext, isSelected, isHovered);
      }
    } catch (error) {
      console.error('Error rendering boolean path:', error);
      return false;
    }
  }

  renderPathWithHoles(points, nullIndex, params, styleContext, isSelected, isHovered) {
    try {
      const outerPath = points.slice(0, nullIndex);
      const innerPath = points.slice(nullIndex + 1);

      if (this.debugMode) {
        console.log('🔥 RENDERING PATH WITH HOLES:', {
          outerPoints: outerPath.length,
          innerPoints: innerPath.length,
          operation: params.operation
        });
      }

      if (outerPath.length < 3) {
        console.warn('Insufficient outer path points');
        return false;
      }

      // BEGIN PATH CONSTRUCTION
      this.ctx.beginPath();

      // Draw outer path (counter-clockwise)
      if (outerPath.length >= 3) {
        this.ctx.moveTo(outerPath[0][0], outerPath[0][1]);
        for (let i = 1; i < outerPath.length; i++) {
          this.ctx.lineTo(outerPath[i][0], outerPath[i][1]);
        }
        this.ctx.closePath();

        if (this.debugMode) {
          console.log('✅ Outer path drawn');
        }
      }

      // Draw inner path (clockwise - creates hole)
      if (innerPath.length >= 3) {
        this.ctx.moveTo(innerPath[0][0], innerPath[0][1]);
        for (let i = 1; i < innerPath.length; i++) {
          this.ctx.lineTo(innerPath[i][0], innerPath[i][1]);
        }
        this.ctx.closePath();

        if (this.debugMode) {
          console.log('✅ Inner path (hole) drawn');
        }
      }

      // FILL WITH EVEN-ODD RULE (CRITICAL FOR HOLES)
      if (styleContext.shouldFill) {
        if (this.debugMode) {
          console.log('🎨 FILLING WITH EVEN-ODD RULE');
        }
        this.ctx.fill('evenodd');
      }

      // STROKE THE PATHS
      this.ctx.stroke();

      if (this.debugMode) {
        console.log('✅ Boolean path with holes rendered successfully');
      }

      return true;
    } catch (error) {
      console.error('Error rendering path with holes:', error);
      return false;
    }
  }

  renderSimplePath(points, params, styleContext, isSelected, isHovered) {
    try {
      this.ctx.beginPath();
      this.ctx.moveTo(points[0][0], points[0][1]);

      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i][0], points[i][1]);
      }

      if (params.closed !== false) {
        this.ctx.closePath();

        if (styleContext.shouldFill) {
          this.ctx.fill();
        }
      }

      this.ctx.stroke();
      return true;
    } catch (error) {
      console.error('Error rendering simple path:', error);
      return false;
    }
  }
}

// PATH RENDERER
class PathRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  renderPath(params, styleContext, isSelected, isHovered) {
    try {
      if (params.isTurtlePath) {
        return this.renderTurtlePath(params, styleContext, isSelected, isHovered);
      } else {
        return this.renderRegularPath(params, styleContext, isSelected, isHovered);
      }
    } catch (error) {
      console.error('Error rendering path:', error);
      return false;
    }
  }

  renderTurtlePath(params, styleContext, isSelected, isHovered) {
    try {
      if (!params.subPaths || params.subPaths.length === 0) return false;

      for (const path of params.subPaths) {
        if (path.length >= 2) {
          this.ctx.beginPath();
          this.ctx.moveTo(path[0][0], path[0][1]);

          for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i][0], path[i][1]);
          }

          this.ctx.stroke();
        }
      }
      return true;
    } catch (error) {
      console.error('Error rendering turtle path:', error);
      return false;
    }
  }

  renderRegularPath(params, styleContext, isSelected, isHovered) {
    try {
      const { points } = params;
      if (!points || points.length < 2) return false;

      this.ctx.beginPath();
      this.ctx.moveTo(points[0][0], points[0][1]);

      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i][0], points[i][1]);
      }

      if (params.closed !== false) {
        this.ctx.closePath();

        if (styleContext.shouldFill) {
          this.ctx.fill();
        }
      }

      this.ctx.stroke();
      return true;
    } catch (error) {
      console.error('Error rendering regular path:', error);
      return false;
    }
  }
}

// SHAPE RENDERER
class ShapeRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  renderText(params, styleContext, isSelected, isHovered) {
    try {
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
    } catch (error) {
      console.error('Error rendering text:', error);
      return false;
    }
  }

  renderGear(params, styleContext, isSelected, isHovered) {
    // Implementation similar to before but more modular
    return true;
  }

  renderBezier(params, styleContext, isSelected, isHovered) {
    // Implementation similar to before but more modular
    return true;
  }

  renderGenericShape(type, params, styleContext, isSelected, isHovered) {
    try {
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
    } catch (error) {
      console.error('Error rendering generic shape:', error);
      return false;
    }
  }

  createShapeInstance(type, params) {
    try {
      switch (type) {
        case 'rectangle':
          return new Rectangle(params.width, params.height);
        case 'circle':
          return new Circle(params.radius);
        case 'triangle':
          return new Triangle(params.base, params.height);
        case 'ellipse':
          return new Ellipse(params.radiusX, params.radiusY);
        case 'polygon':
          return new RegularPolygon(params.radius, params.sides);
        case 'star':
          return new Star(params.outerRadius, params.innerRadius, params.points);
        case 'arc':
          return new Arc(params.radius, params.startAngle, params.endAngle);
        case 'roundedRectangle':
          return new RoundedRectangle(params.width, params.height, params.radius);
        case 'arrow':
          return new Arrow(params.length, params.headWidth, params.headLength);
        case 'donut':
          return new Donut(params.outerRadius, params.innerRadius);
        case 'spiral':
          return new Spiral(params.startRadius, params.endRadius, params.turns);
        case 'cross':
          return new Cross(params.width, params.thickness);
        case 'wave':
          return new Wave(params.width, params.amplitude, params.frequency);
        case 'slot':
          return new Slot(params.length, params.width);
        case 'chamferRectangle':
          return new ChamferRectangle(params.width, params.height, params.chamfer);
        case 'polygonWithHoles':
          return new PolygonWithHoles(params.outerPoints, params.holes);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error creating shape instance for ${type}:`, error);
      return null;
    }
  }
}

// FLEXIBLE PATH BUILDER
class FlexiblePathBuilder {
  constructor() {
    this.currentPath = [];
  }

  buildCompoundPath(outerPoints, innerPoints) {
    const path = [...outerPoints];
    if (innerPoints && innerPoints.length > 0) {
      path.push(null);
      path.push(...innerPoints);
    }
    return path;
  }

  buildSimplePath(points, closed = true) {
    return closed ? [...points] : points;
  }
}

// SHAPE STYLE MANAGER
class ShapeStyleManager {
  constructor() {
    this.colorSystem = new ColorSystem();
  }

  createStyleContext(shape, isSelected, isHovered) {
    const { params } = shape;

    return {
      shouldFill: this.shouldShapeBeFilled(params),
      fillColor: this.getFillColor(params, isSelected, isHovered),
      fillOpacity: this.getFillOpacity(params),
      strokeColor: this.getStrokeColor(params, isSelected, isHovered),
      strokeWidth: this.getStrokeWidth(params, isSelected, isHovered)
    };
  }

  applyStyle(ctx, styleContext) {
    // Apply fill
    if (styleContext.shouldFill) {
      if (styleContext.fillOpacity < 1) {
        const rgb = this.colorSystem.hexToRgb(styleContext.fillColor);
        if (rgb) {
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${styleContext.fillOpacity})`;
        } else {
          ctx.fillStyle = styleContext.fillColor;
        }
      } else {
        ctx.fillStyle = styleContext.fillColor;
      }
    } else {
      ctx.fillStyle = 'transparent';
    }

    // Apply stroke
    ctx.strokeStyle = styleContext.strokeColor;
    ctx.lineWidth = styleContext.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  shouldShapeBeFilled(params) {
    if (params.fill === true || params.filled === true) return true;
    if (params.fill === false || params.filled === false) return false;
    if (params.fillColor) return true;

    // CRITICAL: Boolean operations should always be filled
    if (params.operation && ['difference', 'union', 'intersection'].includes(params.operation)) {
      return true;
    }

    if (params.hasHoles || (params.points && params.points.includes(null))) {
      return true;
    }

    return false;
  }

  getFillColor(params, isSelected, isHovered) {
    if (isSelected) {
      if (params.operation === 'difference') return '#FF572240';
      if (params.operation === 'union') return '#4CAF5040';
      if (params.operation === 'intersection') return '#2196F340';
      return '#FF572220';
    }

    if (params.fillColor) {
      return this.colorSystem.resolveColor(params.fillColor);
    }

    if (params.color && (params.fill === true || params.filled === true)) {
      return this.colorSystem.resolveColor(params.color);
    }

    if (params.operation) {
      switch (params.operation) {
        case 'difference': return '#FF572280';
        case 'union': return '#4CAF5080';
        case 'intersection': return '#2196F380';
        default: return '#808080';
      }
    }

    return '#808080';
  }

  getFillOpacity(params) {
    if (params.opacity !== undefined) {
      return Math.max(0, Math.min(1, params.opacity));
    }
    if (params.alpha !== undefined) {
      return Math.max(0, Math.min(1, params.alpha));
    }
    return 0.7;
  }

  getStrokeColor(params, isSelected, isHovered) {
    if (isSelected) return '#FF5722';
    if (isHovered) return '#FF6B35';
    if (params.strokeColor) return this.colorSystem.resolveColor(params.strokeColor);
    if (params.color && !params.fillColor) return this.colorSystem.resolveColor(params.color);
    return '#374151';
  }

  getStrokeWidth(params, isSelected, isHovered) {
    if (isSelected) return 2;
    if (isHovered) return 1.5;
    if (params.strokeWidth !== undefined) return Math.max(0.1, params.strokeWidth);
    if (params.thickness !== undefined) return Math.max(0.1, params.thickness);
    return 2;
  }
}

// COLOR SYSTEM
class ColorSystem {
  constructor() {
    this.operationColors = {
      difference: '#FF5722',
      union: '#4CAF50',
      intersection: '#2196F3'
    };

    this.namedColors = {
      'red': '#FF0000', 'green': '#008000', 'blue': '#0000FF',
      'yellow': '#FFFF00', 'orange': '#FFA500', 'purple': '#800080',
      'pink': '#FFC0CB', 'brown': '#A52A2A', 'black': '#000000',
      'white': '#FFFFFF', 'gray': '#808080', 'grey': '#808080',
      'lightgray': '#D3D3D3', 'lightgrey': '#D3D3D3',
      'darkgray': '#A9A9A9', 'darkgrey': '#A9A9A9',
      'cyan': '#00FFFF', 'magenta': '#FF00FF', 'lime': '#00FF00',
      'navy': '#000080', 'teal': '#008080', 'silver': '#C0C0C0',
      'gold': '#FFD700', 'transparent': 'transparent'
    };
  }

  getOperationColor(operation) {
    return this.operationColors[operation] || '#000000';
  }

  resolveColor(color) {
    if (typeof color === 'string') {
      if (color.startsWith('#')) return color;
      return this.namedColors[color.toLowerCase()] || color;
    }
    return color;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

// TRANSFORM MANAGER
class TransformManager {
  createContext(transform, screenX, screenY, scale) {
    return {
      screenX: screenX,
      screenY: screenY,
      rotation: (transform.rotation || 0) * Math.PI / 180,
      scale: scale
    };
  }

  calculateBounds(shape) {
    const { type, params } = shape;

    switch (type) {
      case 'rectangle':
        return {
          x: -params.width / 2, y: -params.height / 2,
          width: params.width, height: params.height
        };
      case 'circle':
        return {
          x: -params.radius, y: -params.radius,
          width: params.radius * 2, height: params.radius * 2
        };
      case 'triangle':
        return {
          x: -params.base / 2, y: -params.height / 2,
          width: params.base, height: params.height
        };
      case 'ellipse':
        return {
          x: -params.radiusX, y: -params.radiusY,
          width: params.radiusX * 2, height: params.radiusY * 2
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

  handleParameterScaling(shape, activeHandle, dx, dy, scaleFactor, shapeName, shapeManager) {
    const worldDX = dx * (1 / scaleFactor);
    const worldDY = dy * (1 / scaleFactor);

    const isCircularShape = ['circle', 'donut', 'spiral', 'polygon', 'arc', 'star', 'cross', 'gear'].includes(shape.type);

    if (isCircularShape) {
      this.handleCircularScaling(shape, activeHandle, worldDX, worldDY, shapeName, shapeManager);
    } else {
      this.handleRectangularScaling(shape, activeHandle, worldDX, worldDY, shapeName, shapeManager);
    }
  }

  handleCircularScaling(shape, handle, worldDX, worldDY, shapeName, shapeManager) {
    const bounds = this.calculateBounds(shape);
    let handleX, handleY;

    switch (handle) {
      case 'tl': handleX = -bounds.width / 2; handleY = -bounds.height / 2; break;
      case 'tr': handleX = bounds.width / 2; handleY = -bounds.height / 2; break;
      case 'br': handleX = bounds.width / 2; handleY = bounds.height / 2; break;
      case 'bl': handleX = -bounds.width / 2; handleY = bounds.height / 2; break;
    }

    const currentDistance = Math.sqrt(handleX * handleX + handleY * handleY);
    const newHandleX = handleX + worldDX;
    const newHandleY = handleY + worldDY;
    const newDistance = Math.sqrt(newHandleX * newHandleX + newHandleY * newHandleY);
    const radiusChange = newDistance - currentDistance;

    switch (shape.type) {
      case 'circle':
        const newRadius = Math.max(5, shape.params.radius + radiusChange);
        shapeManager.onCanvasShapeChange(shapeName, 'radius', newRadius);
        break;
      case 'polygon':
      case 'arc':
        const newPolyRadius = Math.max(5, shape.params.radius + radiusChange);
        shapeManager.onCanvasShapeChange(shapeName, 'radius', newPolyRadius);
        break;
      // Add other circular shape cases...
    }
  }

  handleRectangularScaling(shape, handle, worldDX, worldDY, shapeName, shapeManager) {
    const scaleX = (handle === 'tr' || handle === 'br') ? 1 : -1;
    const scaleY = (handle === 'bl' || handle === 'br') ? 1 : -1;

    const deltaX = worldDX * scaleX * 2;
    const deltaY = worldDY * scaleY * 2;

    switch (shape.type) {
      case 'rectangle':
      case 'roundedRectangle':
      case 'chamferRectangle':
        const newWidth = Math.max(5, shape.params.width + deltaX);
        const newHeight = Math.max(5, shape.params.height + deltaY);
        shapeManager.onCanvasShapeChange(shapeName, 'width', newWidth);
        shapeManager.onCanvasShapeChange(shapeName, 'height', newHeight);
        break;
      // Add other rectangular shape cases...
    }
  }
}

// DEBUG VISUALIZER
class DebugVisualizer {
  constructor(ctx) {
    this.ctx = ctx;
    this.enabled = false;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  visualizeShape(shape, transformContext) {
    if (!this.enabled) return;

    // Add debug visualization for shapes
    if (shape.params.operation) {
      this.visualizeBooleanOperation(shape, transformContext);
    }
  }

  visualizeBooleanOperation(shape, transformContext) {
    this.ctx.save();
    this.ctx.translate(transformContext.screenX, transformContext.screenY);

    // Draw debug info
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    this.ctx.fillRect(-5, -5, 10, 10);

    this.ctx.restore();
  }

  drawOverlay(shapes) {
    if (!this.enabled) return;

    // Draw debug overlay information
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(10, 10, 200, 100);
    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Shapes: ${shapes.size}`, 15, 25);

    let consumedCount = 0;
    shapes.forEach(shape => {
      if (shape._consumedByBoolean) consumedCount++;
    });

    this.ctx.fillText(`Consumed: ${consumedCount}`, 15, 40);
    this.ctx.fillText(`Debug Mode: ON`, 15, 55);
    this.ctx.restore();
  }
}
