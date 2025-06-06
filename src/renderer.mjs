// renderer.mjs - Fixed version with comprehensive interactive support for all shapes
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
      
      // Interactive features
      this.shapes = new Map();
      this.selectedShape = null;
      this.hoveredShape = null;
      this.dragging = false;
      this.scaling = false;
      this.rotating = false;
      this.panning = false;
      this.lastMousePos = { x: 0, y: 0 };
      
      // Modern grid system
      this.isGridEnabled = true;
      this.gridSize = 20;
      this.gridOpacity = 0.08;
      this.zoomLevel = 1;
      this.panOffset = { x: 0, y: 0 };
      
      // Modern handle system - Cuttle-style
      this.handleRadius = 6;
      this.handleHoverRadius = 7;
      this.rotationHandleDistance = 35;
      this.activeHandle = null;
      this.hoveredHandle = null;
      
      // Orange accent color scheme
      this.selectionColor = '#FF5722';
      this.selectionColorLight = '#FF572220';
      this.hoverColor = '#FF6B35';
      this.backgroundColor = '#FAFAFA';
      this.gridColor = '#D1D5DB';
      this.shapeColor = '#374151';
      this.shapeHoverColor = '#FF5722';
      
      // Callbacks
      this.updateCodeCallback = null;
      
      this.setupCanvas();
      this.setupInteractivity();
      this.enableInteractiveMode();
      
      // Register with ShapeManager
      shapeManager.registerRenderer(this);
    } catch (error) {
      console.error('Error initializing renderer:', error);
      this.setupCanvas();
    }
  }

  // IMMEDIATE CODE SYNC FIX - Restore the missing callback mechanism
  notifyShapeChanged(shape, action = 'update') {
    try {
      if (!this.updateCodeCallback || !shape) return;
      
      // Find the shape name
      let shapeName = null;
      if (this.shapes) {
        for (const [name, s] of this.shapes.entries()) {
          if (s === shape) {
            shapeName = name;
            break;
          }
        }
      }
      
      // Clean up position array to prevent trailing commas
      if (shape.transform && shape.transform.position && shape.transform.position.length > 2) {
        shape.transform.position.length = 2;
      }
      
      // Immediate callback - no delays
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
      
      // Center point
      this.offsetX = this.canvas.width / 2;
      this.offsetY = this.canvas.height / 2;
      
      // Scale to fit design space
      this.scale = Math.min(this.canvas.width, this.canvas.height) / 800;
      
      // Create grid toggle button
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
      // Remove existing button if it exists
      const existingButton = document.getElementById('grid-toggle-btn');
      if (existingButton) {
        existingButton.remove();
      }

      // Create grid toggle button
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
      
      // Add click handler
      gridButton.addEventListener('click', () => {
        this.isGridEnabled = !this.isGridEnabled;
        console.log('Grid toggled via button:', this.isGridEnabled);
        this.updateGridButtonState();
        this.redraw();
      });

      // Add to canvas container
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
      // Clean white background like Cuttle
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
      
      // Adaptive grid opacity
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

  // Transform coordinates
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
  
  drawShape(shape, isSelected = false, isHovered = false) {
    try {
      if (!shape || !shape.type || !shape.transform) {
        return;
      }
      
      const { type, params, transform } = shape;
      
      this.ctx.save();
      this.ctx.translate(
        this.transformX(transform.position[0]),
        this.transformY(transform.position[1])
      );
      this.ctx.rotate(-transform.rotation * Math.PI / 180);
      
      // Modern styling - clean and minimal
      if (isSelected) {
        this.ctx.strokeStyle = this.selectionColor;
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = this.selectionColorLight;
      } else if (isHovered) {
        this.ctx.strokeStyle = this.hoverColor;
        this.ctx.lineWidth = 1.5;
        this.ctx.fillStyle = 'transparent';
      } else {
        this.ctx.strokeStyle = this.shapeColor;
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = 'transparent';
      }
      
      // Set line style for clean appearance
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      switch (type) {
        case 'text':
          this.drawText(params, isSelected, isHovered);
          break;
        case 'gear':
          this.drawGear(params, isSelected, isHovered);
          break;
        case 'path':
          if (params.isTurtlePath) {
            this.drawTurtlePath(params, isSelected, isHovered);
          } else {
            this.drawPath(params, isSelected, isHovered);
          }
          break;
        case 'bezier':
          this.drawBezier(params, isSelected, isHovered);
          break;
        default:
          this.drawGenericShape(type, params, isSelected, isHovered);
      }

      this.ctx.restore();
      
      // Draw modern selection handles
      if (isSelected) {
        this.drawModernSelectionHandles(shape);
      }
    } catch (error) {
      console.error('Error drawing shape:', error);
    }
  }
  
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
      
      // Cuttle-style selection outline - subtle dashed line
      this.ctx.strokeStyle = this.selectionColor + '40';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([4, 4]);
      this.ctx.strokeRect(
        -scaledWidth / 2, 
        -scaledHeight / 2, 
        scaledWidth, 
        scaledHeight
      );
      this.ctx.setLineDash([]);
      
      // Modern circular handles with shadows
      const handlePositions = [
        { x: -scaledWidth / 2, y: -scaledHeight / 2, handle: 'tl' },
        { x: scaledWidth / 2, y: -scaledHeight / 2, handle: 'tr' },
        { x: scaledWidth / 2, y: scaledHeight / 2, handle: 'br' },
        { x: -scaledWidth / 2, y: scaledHeight / 2, handle: 'bl' }
      ];
      
      handlePositions.forEach(pos => {
        const isHovered = this.hoveredHandle === pos.handle;
        const radius = isHovered ? this.handleHoverRadius : this.handleRadius;
        
        // Handle shadow for depth
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        
        // Shadow
        this.ctx.beginPath();
        this.ctx.arc(0.5, 0.5, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00000020';
        this.ctx.fill();
        
        // Handle background
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();
        
        // Handle border
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.selectionColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
      });
      
      // Rotation handle with connecting line
      const rotHandleY = -scaledHeight / 2 - this.rotationHandleDistance;
      
      // Connection line
      this.ctx.beginPath();
      this.ctx.moveTo(0, -scaledHeight / 2);
      this.ctx.lineTo(0, rotHandleY);
      this.ctx.strokeStyle = this.selectionColor + '60';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      
      // Rotation handle
      const isRotHovered = this.hoveredHandle === 'rotate';
      const rotRadius = isRotHovered ? this.handleHoverRadius : this.handleRadius;
      
      // Shadow
      this.ctx.beginPath();
      this.ctx.arc(0.5, rotHandleY + 0.5, rotRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#00000020';
      this.ctx.fill();
      
      // Handle
      this.ctx.beginPath();
      this.ctx.arc(0, rotHandleY, rotRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fill();
      this.ctx.strokeStyle = this.selectionColor;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Rotation icon
      this.ctx.beginPath();
      this.ctx.arc(0, rotHandleY, rotRadius * 0.4, 0, Math.PI * 1.5);
      this.ctx.strokeStyle = this.selectionColor;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
      
      this.ctx.restore();
    } catch (error) {
      console.error('Error drawing selection handles:', error);
    }
  }
  
  // FIXED: Enhanced getShapeBounds to handle all shape types properly
  getShapeBounds(shape) {
    try {
      if (!shape || !shape.type || !shape.params) {
        return { x: -25, y: -25, width: 50, height: 50 };
      }
      
      const { type, params } = shape;
      
      switch (type) {
        case 'rectangle':
          return {
            x: -params.width / 2,
            y: -params.height / 2,
            width: params.width,
            height: params.height
          };
          
        case 'circle':
          return {
            x: -params.radius,
            y: -params.radius,
            width: params.radius * 2,
            height: params.radius * 2
          };
          
        case 'triangle':
          return {
            x: -params.base / 2,
            y: -params.height / 2,
            width: params.base,
            height: params.height
          };
          
        case 'ellipse':
          return {
            x: -params.radiusX,
            y: -params.radiusY,
            width: params.radiusX * 2,
            height: params.radiusY * 2
          };
          
        case 'polygon':
          return {
            x: -params.radius,
            y: -params.radius,
            width: params.radius * 2,
            height: params.radius * 2
          };
          
        case 'star':
          return {
            x: -params.outerRadius,
            y: -params.outerRadius,
            width: params.outerRadius * 2,
            height: params.outerRadius * 2
          };
          
        case 'arc':
          return {
            x: -params.radius,
            y: -params.radius,
            width: params.radius * 2,
            height: params.radius * 2
          };
          
        case 'roundedRectangle':
          return {
            x: -params.width / 2,
            y: -params.height / 2,
            width: params.width,
            height: params.height
          };
          
        case 'arrow':
          return {
            x: -params.length / 2,
            y: -params.headWidth / 2,
            width: params.length,
            height: params.headWidth
          };
          
        case 'donut':
          return {
            x: -params.outerRadius,
            y: -params.outerRadius,
            width: params.outerRadius * 2,
            height: params.outerRadius * 2
          };
          
        case 'spiral':
          const maxRadius = Math.max(params.startRadius || 0, params.endRadius || 0);
          return {
            x: -maxRadius,
            y: -maxRadius,
            width: maxRadius * 2,
            height: maxRadius * 2
          };
          
        case 'cross':
          return {
            x: -params.width / 2,
            y: -params.width / 2,
            width: params.width,
            height: params.width
          };
          
        case 'wave':
          return {
            x: -params.width / 2,
            y: -params.amplitude,
            width: params.width,
            height: params.amplitude * 2
          };
          
        case 'slot':
          return {
            x: -params.length / 2,
            y: -params.width / 2,
            width: params.length,
            height: params.width
          };
          
        case 'chamferRectangle':
          return {
            x: -params.width / 2,
            y: -params.height / 2,
            width: params.width,
            height: params.height
          };
          
        case 'gear':
          const diameter = params.diameter || 100;
          return {
            x: -diameter / 2,
            y: -diameter / 2,
            width: diameter,
            height: diameter
          };
          
        case 'text':
          const width = params.text.length * (params.fontSize || 12) * 0.6;
          const height = (params.fontSize || 12) * 1.2;
          return {
            x: -width / 2,
            y: -height / 2,
            width: width,
            height: height
          };
          
        case 'path':
          if (params.points && params.points.length > 0) {
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            
            params.points.forEach(point => {
              const x = Array.isArray(point) ? point[0] : point.x;
              const y = Array.isArray(point) ? point[1] : point.y;
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            });
            
            return {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY
            };
          }
          return { x: -25, y: -25, width: 50, height: 50 };
          
        default:
          return { x: -25, y: -25, width: 50, height: 50 };
      }
    } catch (error) {
      console.error('Error getting shape bounds:', error);
      return { x: -25, y: -25, width: 50, height: 50 };
    }
  }
  
  drawTurtlePath(params, isSelected, isHovered) {
    try {
      if (!params.subPaths || params.subPaths.length === 0) return;
      
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
    } catch (error) {
      console.error('Error drawing turtle path:', error);
    }
  }

  drawPath(params, isSelected, isHovered) {
    try {
      const { points } = params;
      if (!points || points.length < 2) return;
      
      this.ctx.beginPath();
      this.ctx.moveTo(points[0][0], points[0][1]);
      
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i][0], points[i][1]);
      }
      
      if (params.closed !== false) {
        this.ctx.closePath();
        if (isSelected && this.ctx.fillStyle !== 'transparent') {
          this.ctx.fill();
        }
      }
      this.ctx.stroke();
    } catch (error) {
      console.error('Error drawing path:', error);
    }
  }
  
  drawBezier(params, isSelected, isHovered) {
    try {
      if (!params.startPoint || !params.controlPoint1 || 
          !params.controlPoint2 || !params.endPoint) {
        return;
      }
      
      const { startPoint, controlPoint1, controlPoint2, endPoint } = params;
      
      this.ctx.beginPath();
      this.ctx.moveTo(startPoint[0], startPoint[1]);
      this.ctx.bezierCurveTo(
        controlPoint1[0], controlPoint1[1],
        controlPoint2[0], controlPoint2[1],
        endPoint[0], endPoint[1]
      );
      this.ctx.stroke();
      
      // Show control points when selected
      if (isSelected) {
        this.ctx.setLineDash([2, 2]);
        this.ctx.strokeStyle = this.selectionColor + '60';
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        this.ctx.moveTo(startPoint[0], startPoint[1]);
        this.ctx.lineTo(controlPoint1[0], controlPoint1[1]);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(endPoint[0], endPoint[1]);
        this.ctx.lineTo(controlPoint2[0], controlPoint2[1]);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        
        // Control point handles
        [controlPoint1, controlPoint2].forEach(pt => {
          this.ctx.beginPath();
          this.ctx.arc(pt[0], pt[1], 3, 0, Math.PI * 2);
          this.ctx.fillStyle = this.selectionColor;
          this.ctx.fill();
        });
      }
    } catch (error) {
      console.error('Error drawing bezier curve:', error);
    }
  }
  
  drawText(params, isSelected, isHovered) {
    try {
      if (!params.text) return;
      
      const { text, fontSize = 12, fontFamily = 'Inter, Arial, sans-serif' } = params;
      this.ctx.font = `${fontSize}px ${fontFamily}`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = this.ctx.strokeStyle;
      this.ctx.fillText(text, 0, 0);
      
      if (isSelected) {
        const metrics = this.ctx.measureText(text);
        const width = metrics.width;
        const height = fontSize;
        
        this.ctx.strokeStyle = this.selectionColor;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(-width/2, -height/2, width, height);
      }
    } catch (error) {
      console.error('Error drawing text:', error);
    }
  }
  
  drawGear(params, isSelected, isHovered) {
    try {
      if (!params.teeth || !params.diameter) return;
      
      const N = params.teeth;
      const pitchDiameter = params.diameter;
      const r = pitchDiameter / 2;
      const m = pitchDiameter / N;
      const addendum = m;
      const dedendum = 1.25 * m;
      const r_a = r + addendum;
      const r_f = r - dedendum;
      
      this.ctx.beginPath();
      
      for (let i = 0; i < N; i++) {
        const angle1 = (i / N) * Math.PI * 2;
        const angle2 = ((i + 0.4) / N) * Math.PI * 2;
        const angle3 = ((i + 0.5) / N) * Math.PI * 2;
        const angle4 = ((i + 0.6) / N) * Math.PI * 2;
        const angle5 = ((i + 1) / N) * Math.PI * 2;
        
        const x1 = Math.cos(angle1) * r;
        const y1 = Math.sin(angle1) * r;
        const x2 = Math.cos(angle2) * r;
        const y2 = Math.sin(angle2) * r;
        const x3 = Math.cos(angle3) * r_a;
        const y3 = Math.sin(angle3) * r_a;
        const x4 = Math.cos(angle4) * r_a;
        const y4 = Math.sin(angle4) * r_a;
        const x5 = Math.cos(angle5) * r;
        const y5 = Math.sin(angle5) * r;
        
        if (i === 0) {
          this.ctx.moveTo(x1, y1);
        }
        
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x3, y3);
        this.ctx.lineTo(x4, y4);
        this.ctx.lineTo(x5, y5);
      }
      
      this.ctx.closePath();
      if (isSelected && this.ctx.fillStyle !== 'transparent') {
        this.ctx.fill();
      }
      this.ctx.stroke();
      
      // Root circle
      this.ctx.beginPath();
      this.ctx.arc(0, 0, r_f, 0, Math.PI * 2);
      this.ctx.stroke();
      
      // Shaft
      if (params.shaft) {
        const shaftType = params.shaft.toLowerCase();
        const shaftSize = params.shaftSize || 0.5 * m;
        
        if (shaftType === 'circle') {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, shaftSize / 2, 0, Math.PI * 2);
          this.ctx.stroke();
        } else if (shaftType === 'square') {
          const halfSize = shaftSize / 2;
          this.ctx.strokeRect(-halfSize, -halfSize, shaftSize, shaftSize);
        }
      }
    } catch (error) {
      console.error('Error drawing gear:', error);
    }
  }

  drawGenericShape(type, params, isSelected, isHovered) {
    try {
      const shapeInstance = this.createShapeInstance(type, params);
      if (!shapeInstance) return;

      const points = shapeInstance.getPoints();
      if (!points || points.length === 0) return;

      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
      }

      if (!['arc', 'path', 'wave'].includes(type)) {
        this.ctx.closePath();
        if (isSelected && this.ctx.fillStyle !== 'transparent') {
          this.ctx.fill();
        }
      }

      this.ctx.stroke();
    } catch (error) {
      console.error('Error drawing generic shape:', error);
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
      
      // Check corner handles
      for (const handleInfo of handlePositions) {
        const dx = x - handleInfo.pos.x;
        const dy = y - handleInfo.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= this.handleRadius + 3) {
          return { type: 'scale', handle: handleInfo.handle };
        }
      }
      
      // Check rotation handle
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
      
      let selectedShapeName = null;
      
      if (!this.shapes) {
        this.shapes = new Map();
        return;
      }
      
      for (const [name, shape] of [...this.shapes.entries()].reverse()) {
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
      
      this.redraw();
    } catch (error) {
      console.error('Error in handleMouseDown:', error);
      this.dragging = false;
      this.scaling = false;
      this.rotating = false;
      this.panning = false;
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
  
  updateHoverState(x, y) {
    try {
      let newHoveredShape = null;
      let newHoveredHandle = null;
      
      // Check for handle hover
      if (this.selectedShape) {
        const handleInfo = this.getHandleAtPoint(x, y);
        if (handleInfo) {
          newHoveredHandle = handleInfo.handle || 'rotate';
        }
      }
      
      // Check for shape hover
      if (!newHoveredHandle && this.shapes) {
        for (const [name, shape] of [...this.shapes.entries()].reverse()) {
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
  
  // FIXED: Comprehensive parameter scaling for all shape types
  handleParameterScaling(dx, dy) {
    try {
      if (!this.selectedShape) return;
      
      const shapeName = shapeManager.findShapeName(this.selectedShape);
      if (!shapeName) return;
      
      const shape = this.selectedShape;
      const handle = this.activeHandle;
      
      const scaleFactor = 1 / (this.scale * this.zoomLevel);
      const worldDX = dx * scaleFactor;
      const worldDY = dy * scaleFactor;
      
      // For circular shapes, calculate radius change based on distance from center
      const isCircularShape = ['circle', 'donut', 'spiral', 'polygon', 'arc', 'star', 'cross', 'gear'].includes(shape.type);
      
      if (isCircularShape) {
        // For circular shapes, calculate change based on movement towards/away from center
        const bounds = this.getShapeBounds(shape);
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        
        // Calculate handle position relative to shape center
        let handleX, handleY;
        switch (handle) {
          case 'tl': handleX = -bounds.width / 2; handleY = -bounds.height / 2; break;
          case 'tr': handleX = bounds.width / 2; handleY = -bounds.height / 2; break;
          case 'br': handleX = bounds.width / 2; handleY = bounds.height / 2; break;
          case 'bl': handleX = -bounds.width / 2; handleY = bounds.height / 2; break;
        }
        
        // Current distance from center to handle
        const currentDistance = Math.sqrt(handleX * handleX + handleY * handleY);
        
        // New handle position after drag
        const newHandleX = handleX + worldDX;
        const newHandleY = handleY + worldDY;
        const newDistance = Math.sqrt(newHandleX * newHandleX + newHandleY * newHandleY);
        
        // Radius change is the difference in distances
        const radiusChange = (newDistance - currentDistance);
        
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
            
          case 'star':
            const newOuterRadius = Math.max(5, shape.params.outerRadius + radiusChange);
            // Maintain proportion between inner and outer radius
            const ratio = shape.params.innerRadius / shape.params.outerRadius;
            const newInnerRadius = Math.max(2, newOuterRadius * ratio);
            shapeManager.onCanvasShapeChange(shapeName, 'outerRadius', newOuterRadius);
            shapeManager.onCanvasShapeChange(shapeName, 'innerRadius', newInnerRadius);
            break;
            
          case 'donut':
            const newDonutOuterRadius = Math.max(10, shape.params.outerRadius + radiusChange);
            // Maintain minimum thickness
            const newDonutInnerRadius = Math.min(shape.params.innerRadius, newDonutOuterRadius - 5);
            shapeManager.onCanvasShapeChange(shapeName, 'outerRadius', newDonutOuterRadius);
            shapeManager.onCanvasShapeChange(shapeName, 'innerRadius', newDonutInnerRadius);
            break;
            
          case 'spiral':
            const newStartRadius = Math.max(1, shape.params.startRadius + radiusChange * 0.5);
            const newEndRadius = Math.max(newStartRadius + 5, shape.params.endRadius + radiusChange);
            shapeManager.onCanvasShapeChange(shapeName, 'startRadius', newStartRadius);
            shapeManager.onCanvasShapeChange(shapeName, 'endRadius', newEndRadius);
            break;
            
          case 'cross':
            const newCrossWidth = Math.max(10, shape.params.width + radiusChange * 2);
            shapeManager.onCanvasShapeChange(shapeName, 'width', newCrossWidth);
            break;
            
          case 'gear':
            const newDiameter = Math.max(20, shape.params.diameter + radiusChange * 2);
            shapeManager.onCanvasShapeChange(shapeName, 'diameter', newDiameter);
            break;
        }
      } else {
        // For rectangular shapes, use directional scaling
        // Determine scaling direction based on handle
        const scaleX = (handle === 'tr' || handle === 'br') ? 1 : -1;
        const scaleY = (handle === 'bl' || handle === 'br') ? 1 : -1;
        
        const deltaX = worldDX * scaleX * 2; // *2 because we're scaling from center
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
            
          case 'triangle':
            const newBase = Math.max(5, shape.params.base + deltaX);
            const newTriHeight = Math.max(5, shape.params.height + deltaY);
            shapeManager.onCanvasShapeChange(shapeName, 'base', newBase);
            shapeManager.onCanvasShapeChange(shapeName, 'height', newTriHeight);
            break;
            
          case 'ellipse':
            const newRadiusX = Math.max(5, shape.params.radiusX + deltaX / 2);
            const newRadiusY = Math.max(5, shape.params.radiusY + deltaY / 2);
            shapeManager.onCanvasShapeChange(shapeName, 'radiusX', newRadiusX);
            shapeManager.onCanvasShapeChange(shapeName, 'radiusY', newRadiusY);
            break;
            
          case 'arrow':
            const newLength = Math.max(10, shape.params.length + deltaX);
            const newHeadWidth = Math.max(5, shape.params.headWidth + deltaY);
            shapeManager.onCanvasShapeChange(shapeName, 'length', newLength);
            shapeManager.onCanvasShapeChange(shapeName, 'headWidth', newHeadWidth);
            break;
            
          case 'wave':
            const newWaveWidth = Math.max(10, shape.params.width + deltaX);
            const newAmplitude = Math.max(2, shape.params.amplitude + Math.abs(deltaY) / 2);
            shapeManager.onCanvasShapeChange(shapeName, 'width', newWaveWidth);
            shapeManager.onCanvasShapeChange(shapeName, 'amplitude', newAmplitude);
            break;
            
          case 'slot':
            const newSlotLength = Math.max(10, shape.params.length + deltaX);
            const newSlotWidth = Math.max(5, shape.params.width + Math.abs(deltaY));
            shapeManager.onCanvasShapeChange(shapeName, 'length', newSlotLength);
            shapeManager.onCanvasShapeChange(shapeName, 'width', newSlotWidth);
            break;
            
          case 'text':
            if (shape.params.fontSize) {
              const fontChange = deltaY / 2;
              const newFontSize = Math.max(8, shape.params.fontSize + fontChange);
              shapeManager.onCanvasShapeChange(shapeName, 'fontSize', newFontSize);
            }
            break;
            
          default:
            // Generic scaling for unknown shapes - try common parameters
            if (shape.params.radius) {
              // Treat unknown shapes with radius as circular
              const bounds = this.getShapeBounds(shape);
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
              const radiusChange = (newDistance - currentDistance);
              
              const newGenericRadius = Math.max(5, shape.params.radius + radiusChange);
              shapeManager.onCanvasShapeChange(shapeName, 'radius', newGenericRadius);
            } else if (shape.params.width && shape.params.height) {
              const newGenericWidth = Math.max(5, shape.params.width + deltaX);
              const newGenericHeight = Math.max(5, shape.params.height + deltaY);
              shapeManager.onCanvasShapeChange(shapeName, 'width', newGenericWidth);
              shapeManager.onCanvasShapeChange(shapeName, 'height', newGenericHeight);
            }
            break;
        }
      }
      
      // IMMEDIATE CODE SYNC
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
      
      // IMMEDIATE CODE SYNC
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
      
      // IMMEDIATE CODE SYNC
      this.notifyShapeChanged(this.selectedShape);
    } catch (error) {
      console.error('Error in handleDragging:', error);
    }
  }
  
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
    } catch (error) {
      console.error('Error in handleWheel:', error);
    }
  }
  
  handleKeyDown(event) {
    try {
      // Handle grid toggle for any state (not just when shape is selected)
      if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        this.isGridEnabled = !this.isGridEnabled;
        this.updateGridButtonState();
        this.redraw();
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
          // IMMEDIATE CODE SYNC
          this.notifyShapeChanged(shape);
          break;
          
        case 'ArrowUp':
          event.preventDefault();
          const upAmount = event.shiftKey ? 20 : 5;
          const newPosUp = [shape.transform.position[0], shape.transform.position[1] + upAmount];
          shapeManager.onCanvasPositionChange(shapeName, newPosUp);
          // IMMEDIATE CODE SYNC
          this.notifyShapeChanged(shape);
          break;
          
        case 'ArrowDown':
          event.preventDefault();
          const downAmount = event.shiftKey ? 20 : 5;
          const newPosDown = [shape.transform.position[0], shape.transform.position[1] - downAmount];
          shapeManager.onCanvasPositionChange(shapeName, newPosDown);
          // IMMEDIATE CODE SYNC
          this.notifyShapeChanged(shape);
          break;
          
        case 'ArrowLeft':
          event.preventDefault();
          const leftAmount = event.shiftKey ? 20 : 5;
          const newPosLeft = [shape.transform.position[0] - leftAmount, shape.transform.position[1]];
          shapeManager.onCanvasPositionChange(shapeName, newPosLeft);
          // IMMEDIATE CODE SYNC
          this.notifyShapeChanged(shape);
          break;
          
        case 'ArrowRight':
          event.preventDefault();
          const rightAmount = event.shiftKey ? 20 : 5;
          const newPosRight = [shape.transform.position[0] + rightAmount, shape.transform.position[1]];
          shapeManager.onCanvasPositionChange(shapeName, newPosRight);
          // IMMEDIATE CODE SYNC
          this.notifyShapeChanged(shape);
          break;
      }
    } catch (error) {
      console.error('Error in handleKeyDown:', error);
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
        
        // IMMEDIATE CODE SYNC
        if (this.updateCodeCallback) {
          this.updateCodeCallback({ action: 'delete', name: selectedName });
        }
        
        this.redraw();
      }
    } catch (error) {
      console.error('Error in deleteSelectedShape:', error);
    }
  }
  
  redraw() {
    try {
      this.clear();
      
      if (this.shapes) {
        for (const [name, shape] of this.shapes.entries()) {
          if (shape) {
            const isSelected = shape === this.selectedShape;
            const isHovered = name === this.hoveredShape && !isSelected;
            this.drawShape(shape, isSelected, isHovered);
          }
        }
      }
    } catch (error) {
      console.error('Error in redraw:', error);
      try {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      } catch (e) {
        console.error('Failed to recover from redraw error:', e);
      }
    }
  }
  
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
}
