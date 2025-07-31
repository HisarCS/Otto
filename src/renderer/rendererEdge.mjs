// rendererEdge.mjs - Edge Subsystem for Aqui Renderer
// Manages all edge-related functionality including calculation, hit testing, and rendering

import { EdgeCalculator } from "./edge/edgeCalculator.mjs";
import { EdgeHitTester } from "./edge/edgeHitTester.mjs";
import { EdgeCollection } from "./edge/edgeSystem.mjs";

export class RendererEdge {
  constructor(renderer) {
    this.renderer = renderer;
    this.ctx = renderer.ctx;
    this.coordinateSystem = renderer.coordinateSystem;
    
    this.initializeEdgeSystem();
    this.initializeState();
    this.setupEventHandlers();
  }

  initializeEdgeSystem() {
    // Core edge system components
    this.edgeCalculator = new EdgeCalculator({
      tolerance: 0.001,
      maxCurveSegments: 64,
      edgeSimplification: true,
      skipFallbackEdges: false
    });

    this.edgeHitTester = new EdgeHitTester({
      straightEdgeTolerance: 8,
      arcEdgeTolerance: 12,
      bezierEdgeTolerance: 15,
      enableEdgeHover: true,
      preferShortestDistance: true,
      enableMultiSelect: true
    });
  }

  initializeState() {
    // Edge interaction state
    this.interactionMode = false; // false = shape mode, true = edge mode
    this.visible = false; // Edge visibility toggle
    this.selectedEdges = new Set();
    this.hoveredEdge = null;
    
    // Edge collections by shape
    this.shapeEdges = new Map(); // shapeName -> EdgeCollection
    
    // Interaction state
    this.dragging = false;
    this.transformStart = null;
    
    // Event callbacks
    this.onEdgeSelected = null;
    this.onModeChanged = null;
    this.onVisibilityChanged = null;
  }

  setupEventHandlers() {
    // Internal event handling setup
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.boundHandleKeyDown);
  }

  // === CORE EDGE CALCULATION ===

  calculateAllEdges() {
    this.shapeEdges.clear();
    
    if (!this.renderer.shapes) return;
    
    for (const [shapeName, shape] of this.renderer.shapes.entries()) {
      try {
        if (shape._consumedByBoolean) continue;
        
        const shapeInstance = this.createShapeInstanceForEdges(shape);
        if (shapeInstance) {
          const edgeCollection = this.edgeCalculator.calculateEdges(
            shapeInstance, 
            shape.type, 
            shape.params
          );
          
          // Add metadata
          edgeCollection.metadata.shapeName = shapeName;
          edgeCollection.metadata.shape = shape;
          this.shapeEdges.set(shapeName, edgeCollection);
        }
      } catch (error) {
        console.warn(`Failed to calculate edges for shape ${shapeName}:`, error);
      }
    }
  }

  createShapeInstanceForEdges(shape) {
    try {
      // Use renderer's shape creation system
      const shapeInstance = this.renderer.renderingEngine.createShapeInstance(
        shape.type, 
        shape.params
      );
      
      if (shapeInstance) {
        // Set world position and transform
        shapeInstance.position = {
          x: shape.transform.position[0],
          y: shape.transform.position[1]
        };
        shapeInstance.rotation = shape.transform.rotation || 0;
        shapeInstance.scale = shape.transform.scale || [1, 1];
      }
      
      return shapeInstance;
    } catch (error) {
      console.warn('Error creating shape instance for edges:', error);
      return null;
    }
  }

  recalculateShapeEdges(shapeName) {
    const shape = this.renderer.shapes.get(shapeName);
    if (!shape) return;

    try {
      const shapeInstance = this.createShapeInstanceForEdges(shape);
      if (shapeInstance) {
        const edgeCollection = this.edgeCalculator.calculateEdges(
          shapeInstance, 
          shape.type, 
          shape.params
        );
        
        edgeCollection.metadata.shapeName = shapeName;
        edgeCollection.metadata.shape = shape;
        this.shapeEdges.set(shapeName, edgeCollection);
      }
    } catch (error) {
      console.warn(`Failed to recalculate edges for shape ${shapeName}:`, error);
    }
  }

  // === EDGE ACCESS AND QUERIES ===

  getAllEdges() {
    const allEdges = [];
    
    for (const [shapeName, edgeCollection] of this.shapeEdges.entries()) {
      edgeCollection.edges.forEach((edge, index) => {
        // Add identification metadata
        edge.parentShapeName = shapeName;
        edge.parentShape = this.renderer.shapes.get(shapeName);
        edge.globalEdgeId = `${shapeName}_edge_${index}`;
        edge.shapeEdgeIndex = index;
        allEdges.push(edge);
      });
    }
    
    return allEdges;
  }

  getEdgesForShape(shapeName) {
    const edgeCollection = this.shapeEdges.get(shapeName);
    return edgeCollection ? edgeCollection.edges : [];
  }

  getEdgeById(globalEdgeId) {
    const allEdges = this.getAllEdges();
    return allEdges.find(edge => edge.globalEdgeId === globalEdgeId);
  }

  // === INTERACTION MODE MANAGEMENT ===

  toggleInteractionMode() {
    this.interactionMode = !this.interactionMode;
    
    // Clear selections when switching modes
    if (this.interactionMode) {
      this.renderer.interactionHandler.selectedShape = null;
      this.renderer.selectedShape = null;
    } else {
      this.clearSelection();
    }
    
    this.updateCursorMode();
    
    if (this.onModeChanged) {
      this.onModeChanged(this.interactionMode);
    }
    
    return this.interactionMode;
  }

  setInteractionMode(enabled) {
    if (this.interactionMode !== enabled) {
      this.toggleInteractionMode();
    }
  }

  isInteractionMode() {
    return this.interactionMode;
  }

  toggleVisibility() {
    this.visible = !this.visible;
    
    if (this.onVisibilityChanged) {
      this.onVisibilityChanged(this.visible);
    }
    
    return this.visible;
  }

  setVisibility(visible) {
    if (this.visible !== visible) {
      this.visible = visible;
      
      if (this.onVisibilityChanged) {
        this.onVisibilityChanged(this.visible);
      }
    }
  }

  updateCursorMode() {
    const body = document.body;
    if (this.interactionMode) {
      body.classList.add('edge-interaction-mode');
    } else {
      body.classList.remove('edge-interaction-mode');
    }
  }

  // === EDGE HIT TESTING AND SELECTION ===

  handleClick(x, y, multiSelect = false) {
    if (!this.interactionMode) return false;

    const allEdges = this.getAllEdges();
    const hitResults = this.edgeHitTester.hitTest(x, y, allEdges);
    
    if (hitResults.length > 0) {
      const hitEdge = hitResults[0].edge;
      
      if (!multiSelect) {
        this.selectedEdges.clear();
      }
      
      // Toggle edge selection
      if (this.selectedEdges.has(hitEdge)) {
        this.selectedEdges.delete(hitEdge);
      } else {
        this.selectedEdges.add(hitEdge);
      }
      
      // Notify selection change
      this.notifyEdgeSelection(hitEdge, hitResults[0]);
      
      return true;
    } else {
      // Clear selection if not multi-selecting
      if (!multiSelect) {
        this.clearSelection();
      }
      return false;
    }
  }

  handleHover(x, y) {
    if (!this.interactionMode) {
      this.hoveredEdge = null;
      return false;
    }

    const allEdges = this.getAllEdges();
    const closestEdge = this.edgeHitTester.findClosestEdge(x, y, allEdges, 15);
    
    const newHoveredEdge = closestEdge ? closestEdge.edge : null;
    
    if (newHoveredEdge !== this.hoveredEdge) {
      this.hoveredEdge = newHoveredEdge;
      return true; // Indicates hover state changed
    }
    
    return false;
  }

  clearSelection() {
    this.selectedEdges.clear();
    this.hoveredEdge = null;
  }

  selectEdge(edge) {
    if (!edge) return false;
    
    this.selectedEdges.add(edge);
    this.notifyEdgeSelection(edge, null);
    return true;
  }

  deselectEdge(edge) {
    return this.selectedEdges.delete(edge);
  }

  isEdgeSelected(edge) {
    return this.selectedEdges.has(edge);
  }

  getSelectedEdges() {
    return Array.from(this.selectedEdges);
  }

  getSelectedEdgeCount() {
    return this.selectedEdges.size;
  }

  notifyEdgeSelection(edge, hitInfo) {
    if (this.onEdgeSelected) {
      this.onEdgeSelected({
        edge,
        hitInfo,
        selectedCount: this.selectedEdges.size,
        allSelected: Array.from(this.selectedEdges)
      });
    }
  }

  // === EDGE RENDERING ===

  renderAllEdges() {
    if (!this.visible) return;

    for (const [shapeName, edgeCollection] of this.shapeEdges.entries()) {
      const shape = this.renderer.shapes.get(shapeName);
      if (!shape || shape._consumedByBoolean) continue;
      
      this.renderEdgeCollection(edgeCollection, shapeName);
    }
  }

  renderEdgeCollection(edgeCollection, shapeName) {
    const shape = this.renderer.shapes.get(shapeName);
    const isShapeSelected = shape === this.renderer.selectedShape;
    
    edgeCollection.edges.forEach((edge, index) => {
      const isEdgeSelected = this.selectedEdges.has(edge);
      const isEdgeHovered = this.hoveredEdge === edge;
      
      this.renderEdge(edge, {
        shapeSelected: isShapeSelected,
        edgeSelected: isEdgeSelected,
        edgeHovered: isEdgeHovered,
        shapeName,
        edgeIndex: index
      });
    });
  }

  renderEdge(edge, state = {}) {
    this.ctx.save();
    
    // Determine visual style based on state
    const style = this.getEdgeRenderStyle(state);
    
    // Apply styles
    this.ctx.strokeStyle = style.strokeColor;
    this.ctx.lineWidth = style.lineWidth;
    this.ctx.globalAlpha = style.globalAlpha;
    this.ctx.setLineDash(style.lineDash);
    
    // Render edge based on type
    this.renderEdgeGeometry(edge);
    
    // Draw selection handles
    if (state.edgeSelected) {
      this.renderEdgeHandles(edge);
    }
    
    this.ctx.restore();
  }

  getEdgeRenderStyle(state) {
    if (state.edgeSelected) {
      return {
        strokeColor: '#FF0066', // Bright pink for selected
        lineWidth: 3,
        globalAlpha: 1.0,
        lineDash: []
      };
    } else if (state.edgeHovered) {
      return {
        strokeColor: '#FF6600', // Orange for hovered
        lineWidth: 2,
        globalAlpha: 0.8,
        lineDash: [4, 2]
      };
    } else if (state.shapeSelected) {
      return {
        strokeColor: '#FF5722', // Orange for parent shape selected
        lineWidth: 2,
        globalAlpha: 0.7,
        lineDash: []
      };
    } else {
      return {
        strokeColor: '#999999', // Gray for normal edges
        lineWidth: 1,
        globalAlpha: 0.5,
        lineDash: []
      };
    }
  }

  renderEdgeGeometry(edge) {
    switch (edge.type) {
      case 'straight':
        this.renderStraightEdge(edge);
        break;
      case 'arc':
        this.renderArcEdge(edge);
        break;
      case 'bezier':
        this.renderBezierEdge(edge);
        break;
      default:
        this.renderStraightEdge(edge); // Fallback
    }
  }

  renderStraightEdge(edge) {
    this.ctx.beginPath();
    this.ctx.moveTo(edge.startPoint.x, edge.startPoint.y);
    this.ctx.lineTo(edge.endPoint.x, edge.endPoint.y);
    this.ctx.stroke();
  }

  renderArcEdge(edge) {
    const { center, radius, startAngle, endAngle, clockwise } = edge.properties || {};
    
    if (center && radius) {
      this.ctx.beginPath();
      this.ctx.arc(center.x, center.y, radius, startAngle, endAngle, !clockwise);
      this.ctx.stroke();
    } else {
      this.renderStraightEdge(edge);
    }
  }

  renderBezierEdge(edge) {
    const { controlPoint1, controlPoint2 } = edge.properties || {};
    
    if (controlPoint1 && controlPoint2) {
      this.ctx.beginPath();
      this.ctx.moveTo(edge.startPoint.x, edge.startPoint.y);
      this.ctx.bezierCurveTo(
        controlPoint1.x, controlPoint1.y,
        controlPoint2.x, controlPoint2.y,
        edge.endPoint.x, edge.endPoint.y
      );
      this.ctx.stroke();
    } else {
      this.renderStraightEdge(edge);
    }
  }

  renderEdgeHandles(edge) {
    const handleRadius = 4;
    const handleStyle = {
      fillColor: '#FF0066',
      strokeColor: '#FFFFFF',
      strokeWidth: 2
    };
    
    // Start point handle
    this.renderHandle(edge.startPoint, handleRadius, handleStyle);
    
    // End point handle  
    this.renderHandle(edge.endPoint, handleRadius, handleStyle);
    
    // Midpoint handle for longer edges
    const edgeLength = edge.getLength ? edge.getLength() : this.calculateEdgeLength(edge);
    if (edgeLength > 40) {
      const midpoint = edge.getMidpoint ? edge.getMidpoint() : this.calculateMidpoint(edge);
      this.renderHandle(midpoint, handleRadius - 1, {
        fillColor: '#FF6600',
        strokeColor: '#FFFFFF',
        strokeWidth: 1
      });
    }
  }

  renderHandle(point, radius, style) {
    this.ctx.beginPath();
    this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = style.fillColor;
    this.ctx.fill();
    
    if (style.strokeColor) {
      this.ctx.strokeStyle = style.strokeColor;
      this.ctx.lineWidth = style.strokeWidth;
      this.ctx.stroke();
    }
  }

  calculateEdgeLength(edge) {
    const dx = edge.endPoint.x - edge.startPoint.x;
    const dy = edge.endPoint.y - edge.startPoint.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  calculateMidpoint(edge) {
    return {
      x: (edge.startPoint.x + edge.endPoint.x) / 2,
      y: (edge.startPoint.y + edge.endPoint.y) / 2
    };
  }

  // === EDGE DRAGGING (EXPERIMENTAL) ===

  startDragging(x, y) {
    if (!this.interactionMode || this.selectedEdges.size === 0) return false;

    this.dragging = true;
    this.transformStart = {
      mouseX: x,
      mouseY: y,
      edges: Array.from(this.selectedEdges).map(edge => ({
        edge: edge,
        startPoint: { ...edge.startPoint },
        endPoint: { ...edge.endPoint }
      }))
    };
    
    return true;
  }

  updateDragging(x, y) {
    if (!this.dragging || !this.transformStart) return false;

    // Calculate displacement
    const dx = x - this.transformStart.mouseX;
    const dy = y - this.transformStart.mouseY;
    
    // Apply to all dragged edges
    this.transformStart.edges.forEach(({ edge, startPoint, endPoint }) => {
      edge.startPoint.x = startPoint.x + dx;
      edge.startPoint.y = startPoint.y - dy; // Flip Y for world coordinates
      edge.endPoint.x = endPoint.x + dx;
      edge.endPoint.y = endPoint.y - dy;
    });
    
    return true;
  }

  stopDragging() {
    if (!this.dragging) return false;
    
    this.dragging = false;
    this.transformStart = null;
    
    // Recalculate affected shapes
    this.recalculateAffectedShapes();
    
    return true;
  }

  recalculateAffectedShapes() {
    const affectedShapes = new Set();
    
    this.selectedEdges.forEach(edge => {
      if (edge.parentShapeName) {
        affectedShapes.add(edge.parentShapeName);
      }
    });
    
    affectedShapes.forEach(shapeName => {
      this.recalculateShapeEdges(shapeName);
    });
  }

  // === KEYBOARD HANDLING ===

  handleKeyDown(event) {
    // Only handle if not in text input
    if (document.activeElement && 
        (document.activeElement.tagName === 'INPUT' || 
         document.activeElement.tagName === 'TEXTAREA' ||
         document.activeElement.contentEditable === 'true')) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'e':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          if (event.shiftKey) {
            this.toggleVisibility();
          } else {
            this.toggleInteractionMode();
          }
        }
        break;
        
      case 'escape':
        event.preventDefault();
        this.clearSelection();
        break;
    }
  }

  // === INFORMATION AND DEBUGGING ===

  getInfo() {
    const totalEdges = Array.from(this.shapeEdges.values())
      .reduce((sum, collection) => sum + collection.getEdgeCount(), 0);
    
    return {
      totalShapes: this.renderer.shapes ? this.renderer.shapes.size : 0,
      totalEdges: totalEdges,
      selectedEdges: this.selectedEdges.size,
      hoveredEdge: this.hoveredEdge ? this.hoveredEdge.globalEdgeId : null,
      interactionMode: this.interactionMode,
      visible: this.visible,
      dragging: this.dragging
    };
  }

  getSelectedEdgeInfo() {
    if (this.selectedEdges.size === 0) return null;
    
    const edges = Array.from(this.selectedEdges);
    const firstEdge = edges[0];
    
    return {
      count: edges.length,
      firstEdge: {
        id: firstEdge.globalEdgeId,
        type: firstEdge.type,
        parentShape: firstEdge.parentShapeName,
        length: firstEdge.getLength ? firstEdge.getLength().toFixed(2) : 'N/A',
        startPoint: firstEdge.startPoint,
        endPoint: firstEdge.endPoint
      },
      allEdges: edges.map(edge => ({
        id: edge.globalEdgeId,
        type: edge.type,
        parentShape: edge.parentShapeName
      }))
    };
  }

  // === CLEANUP ===

  destroy() {
    // Remove event listeners
    if (this.boundHandleKeyDown) {
      document.removeEventListener('keydown', this.boundHandleKeyDown);
    }
    
    // Clear state
    this.shapeEdges.clear();
    this.selectedEdges.clear();
    this.hoveredEdge = null;
    this.transformStart = null;
    
    // Clear callbacks
    this.onEdgeSelected = null;
    this.onModeChanged = null;
    this.onVisibilityChanged = null;
    
    // Remove cursor mode
    document.body.classList.remove('edge-interaction-mode');
  }
}
