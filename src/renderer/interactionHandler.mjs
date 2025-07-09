// interactionHandler.mjs - TRUE 1:1 interaction handler

export class InteractionHandler {
  constructor(renderer) {
    this.renderer = renderer;
    this.canvas = renderer.canvas;
    this.coordinateSystem = renderer.coordinateSystem;
    
    this.selectedShape = null;
    this.hoveredShape = null;
    this.dragging = false;
    this.scaling = false;
    this.rotating = false;
    this.panning = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.activeHandle = null;
    this.hoveredHandle = null;
    
    this.handleRadius = 6;
    this.handleHoverRadius = 7;
    this.rotationHandleDistance = 35;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  handleMouseDown(event) {
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
    this.renderer.redraw();
  }
  
  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const dx = x - this.lastMousePos.x;
    const dy = y - this.lastMousePos.y;
    
    if (this.panning) {
      this.coordinateSystem.pan(dx, dy);
      this.renderer.redraw();
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
  }
  
  handleMouseUp(event) {
    this.dragging = false;
    this.scaling = false;
    this.rotating = false;
    this.panning = false;
    this.activeHandle = null;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.updateCursor(x, y);
  }
  
  handleWheel(event) {
    event.preventDefault();
    
    // Only handle panning with Ctrl+wheel (NO ZOOM)
    if (event.ctrlKey) {
      const panSensitivity = 2;
      
      if (event.deltaY !== 0) {
        this.coordinateSystem.pan(0, -event.deltaY * panSensitivity);
      }
      
      if (event.deltaX !== 0) {
        this.coordinateSystem.pan(-event.deltaX * panSensitivity, 0);
      }
      
      if (event.deltaX === 0 && event.shiftKey) {
        this.coordinateSystem.pan(-event.deltaY * panSensitivity, 0);
      }
      
      this.renderer.redraw();
    }
    // Regular wheel scrolling is ignored (no zoom)
  }
  
  handleKeyDown(event) {
    if (event.key.toLowerCase() === 'g' && !event.ctrlKey && !event.metaKey) {
      if (document.activeElement !== this.renderer.editor?.getWrapperElement()?.querySelector('textarea')) {
        event.preventDefault();
        this.coordinateSystem.toggleGrid();
        this.renderer.updateGridButtonState();
        this.renderer.redraw();
      }
    }
    
    if (event.key.toLowerCase() === 'd' && event.ctrlKey) {
      event.preventDefault();
      this.renderer.setDebugMode(!this.renderer.debugMode);
      return;
    }

    if (!this.selectedShape) return;

    const shapeName = this.renderer.findShapeName(this.selectedShape);
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
        this.renderer.shapeManager.onCanvasRotationChange(shapeName, newRotation);
        this.renderer.notifyShapeChanged(shape);
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        const upAmount = event.shiftKey ? 20 : 5;
        const newPosUp = [shape.transform.position[0], shape.transform.position[1] + upAmount];
        this.renderer.shapeManager.onCanvasPositionChange(shapeName, newPosUp);
        this.renderer.notifyShapeChanged(shape);
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        const downAmount = event.shiftKey ? 20 : 5;
        const newPosDown = [shape.transform.position[0], shape.transform.position[1] - downAmount];
        this.renderer.shapeManager.onCanvasPositionChange(shapeName, newPosDown);
        this.renderer.notifyShapeChanged(shape);
        break;
        
      case 'ArrowLeft':
        event.preventDefault();
        const leftAmount = event.shiftKey ? 20 : 5;
        const newPosLeft = [shape.transform.position[0] - leftAmount, shape.transform.position[1]];
        this.renderer.shapeManager.onCanvasPositionChange(shapeName, newPosLeft);
        this.renderer.notifyShapeChanged(shape);
        break;
        
      case 'ArrowRight':
        event.preventDefault();
        const rightAmount = event.shiftKey ? 20 : 5;
        const newPosRight = [shape.transform.position[0] + rightAmount, shape.transform.position[1]];
        this.renderer.shapeManager.onCanvasPositionChange(shapeName, newPosRight);
        this.renderer.notifyShapeChanged(shape);
        break;
    }
  }
  
  handleMouseLeave() {
    this.hoveredShape = null;
    this.hoveredHandle = null;
    this.renderer.redraw();
  }
  
  selectShapeAtPoint(x, y) {
    let selectedShapeName = null;
    
    if (!this.renderer.shapes) {
      this.renderer.shapes = new Map();
      return;
    }
    
    for (const [name, shape] of [...this.renderer.shapes.entries()].reverse()) {
      if (shape._consumedByBoolean) continue;
      
      if (this.isPointInShape(x, y, shape)) {
        selectedShapeName = name;
        break;
      }
    }
    
    if (selectedShapeName) {
      this.selectedShape = this.renderer.shapes.get(selectedShapeName);
      this.dragging = true;
      this.canvas.className = 'cursor-move';
    } else {
      this.selectedShape = null;
      this.canvas.className = '';
    }
  }
  
  isPointInShape(x, y, shape) {
    if (!shape || !shape.transform) return false;
    
    const shapeX = this.coordinateSystem.transformX(shape.transform.position[0]);
    const shapeY = this.coordinateSystem.transformY(shape.transform.position[1]);
    
    const dx = x - shapeX;
    const dy = y - shapeY;
    
    const angle = shape.transform.rotation * Math.PI / 180;
    const rotatedX = dx * Math.cos(angle) + dy * Math.sin(angle);
    const rotatedY = dy * Math.cos(angle) - dx * Math.sin(angle);
    
    const bounds = this.renderer.transformManager.calculateBounds(shape);
    // TRUE 1:1 scale - no scaling factors
    const scaledWidth = bounds.width;
    const scaledHeight = bounds.height;
    
    return (
      Math.abs(rotatedX) <= scaledWidth / 2 &&
      Math.abs(rotatedY) <= scaledHeight / 2
    );
  }
  
  getHandleAtPoint(x, y) {
    if (!this.selectedShape) return null;
    
    const shape = this.selectedShape;
    const shapeX = this.coordinateSystem.transformX(shape.transform.position[0]);
    const shapeY = this.coordinateSystem.transformY(shape.transform.position[1]);
    
    const bounds = this.renderer.transformManager.calculateBounds(shape);
    // TRUE 1:1 scale - no scaling factors
    const scaledWidth = bounds.width;
    const scaledHeight = bounds.height;
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
  }
  
  updateCursor(x, y) {
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
    
    if (this.renderer.shapes) {
      for (const [name, shape] of [...this.renderer.shapes.entries()].reverse()) {
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
  }
  
  updateHoverState(x, y) {
    let newHoveredShape = null;
    let newHoveredHandle = null;
    
    if (this.selectedShape) {
      const handleInfo = this.getHandleAtPoint(x, y);
      if (handleInfo) {
        newHoveredHandle = handleInfo.handle || 'rotate';
      }
    }
    
    if (!newHoveredHandle && this.renderer.shapes) {
      for (const [name, shape] of [...this.renderer.shapes.entries()].reverse()) {
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
      this.renderer.redraw();
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
    if (!this.selectedShape) return;
    
    const shapeName = this.renderer.findShapeName(this.selectedShape);
    if (!shapeName) return;
    
    // TRUE 1:1 scale - no scaling factors
    this.renderer.transformManager.handleParameterScaling(
      this.selectedShape, 
      this.activeHandle, 
      dx, 
      dy, 
      1, // TRUE 1:1 scale
      shapeName,
      this.renderer.shapeManager
    );
    
    this.renderer.notifyShapeChanged(this.selectedShape);
  }
  
  handleRotation(x, y) {
    if (!this.selectedShape) return;
    
    const shapeName = this.renderer.findShapeName(this.selectedShape);
    if (!shapeName) return;
    
    const shape = this.selectedShape;
    const centerX = this.coordinateSystem.transformX(shape.transform.position[0]);
    const centerY = this.coordinateSystem.transformY(shape.transform.position[1]);
    
    const angle = -Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
    
    let newRotation = angle;
    if (event.altKey) {
      newRotation = Math.round(angle / 15) * 15;
    }
    
    this.renderer.shapeManager.onCanvasRotationChange(shapeName, newRotation);
    this.renderer.notifyShapeChanged(this.selectedShape);
  }
  
  handleDragging(dx, dy) {
    if (!this.selectedShape) return;
    
    const shapeName = this.renderer.findShapeName(this.selectedShape);
    if (!shapeName) return;
    
    const shape = this.selectedShape;
    
    // TRUE 1:1 scale - direct pixel to mm conversion
    const worldDX = dx;  // No scaling needed - 1 pixel = 1 mm
    const worldDY = -dy; // Just flip Y axis
    
    let newX = shape.transform.position[0] + worldDX;
    let newY = shape.transform.position[1] + worldDY;

    if (this.coordinateSystem.isGridEnabled && event.ctrlKey) {
      const snapped = this.coordinateSystem.snapToGrid(newX, newY);
      newX = snapped.x;
      newY = snapped.y;
    }

    this.renderer.shapeManager.onCanvasPositionChange(shapeName, [newX, newY]);
    this.renderer.notifyShapeChanged(this.selectedShape);
  }
  
  deleteSelectedShape() {
    if (!this.selectedShape) return;
    
    let selectedName = null;
    
    if (this.renderer.shapes) {
      for (const [name, shape] of this.renderer.shapes.entries()) {
        if (shape === this.selectedShape) {
          selectedName = name;
          break;
        }
      }
    }
    
    if (selectedName) {
      this.renderer.shapes.delete(selectedName);
      this.selectedShape = null;
      
      if (this.renderer.updateCodeCallback) {
        this.renderer.updateCodeCallback({ action: 'delete', name: selectedName });
      }
      
      this.renderer.redraw();
    }
  }
}
