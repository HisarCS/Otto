// renderer.mjs - Fixed scale renderer without zoom functionality

import { CoordinateSystem } from "./renderer/coordinateSystem.mjs";
import { ShapeStyleManager } from "./renderer/styleManager.mjs";
import { InteractionHandler } from "./renderer/interactionHandler.mjs";
import { ShapeRenderer } from "./renderer/shapeRenderer.mjs";
import { PathRenderer } from "./renderer/pathRenderer.mjs";
import { BooleanOperationRenderer } from "./renderer/booleanRenderer.mjs";
import { SelectionSystem } from "./renderer/selectionSystem.mjs";
import { HandleSystem } from "./renderer/handleSystem.mjs";
import { DebugVisualizer } from "./renderer/debugVisualizer.mjs";
import { TransformManager } from "./renderer/transformManager.mjs";
import { shapeManager } from "./shapeManager.mjs";

export class Renderer {
  constructor(canvas) {
    try {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");

      this.initializeComponents();
      this.initializeState();
      this.setupCanvas();
      this.setupInteractivity();
      this.enableInteractiveMode();

      shapeManager.registerRenderer(this);
    } catch (error) {
      console.error("Error initializing renderer:", error);
      this.setupFallbackCanvas();
    }
  }

  initializeComponents() {
    this.coordinateSystem = new CoordinateSystem(this.canvas);
    this.styleManager = new ShapeStyleManager();
    this.shapeRenderer = new ShapeRenderer(this.ctx);
    this.pathRenderer = new PathRenderer(this.ctx);
    this.booleanRenderer = new BooleanOperationRenderer(this.ctx);
    this.selectionSystem = new SelectionSystem(this);
    this.handleSystem = new HandleSystem(this);
    this.debugVisualizer = new DebugVisualizer(this.ctx);
    this.transformManager = new TransformManager();

    this.interactionHandler = new InteractionHandler(this);

    this.renderingEngine = new ModularRenderingEngine(this);
  }

  initializeState() {
    this.shapes = new Map();
    this.selectedShape = null;
    this.hoveredShape = null;
    this.debugMode = false;
    this.updateCodeCallback = null;
    this.shapeManager = shapeManager;
  }

  setupCanvas() {
    this.coordinateSystem.setupCanvas();
    this.createGridToggleButton();
    // REMOVED: createZoomControls() - no zoom functionality
    this.redraw();
  }

  setupFallbackCanvas() {
    this.coordinateSystem = {
      transformX: (x) => x + 400,
      transformY: (y) => 300 - y,
      clear: () => this.ctx.clearRect(0, 0, 800, 600),
      isGridEnabled: true,
      toggleGrid: () => { },
    };
    this.styleManager = {
      createStyleContext: () => ({}),
      applyStyle: () => { },
    };
    this.transformManager = {
      calculateBounds: () => ({ x: -25, y: -25, width: 50, height: 50 }),
    };
  }

  setupInteractivity() {
    this.interactionHandler.setupEventListeners();
  }

  enableInteractiveMode() {
    this.canvas.className = "";
    this.redraw();
  }

  createGridToggleButton() {
    try {
      const existingButton = document.getElementById("grid-toggle-btn");
      if (existingButton) {
        existingButton.remove();
      }

      const gridButton = document.createElement("button");
      gridButton.id = "grid-toggle-btn";
      gridButton.className = "grid-toggle-button";
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

      gridButton.addEventListener("click", () => {
        this.coordinateSystem.toggleGrid();
        this.updateGridButtonState();
        this.redraw();
      });

      this.canvas.parentElement.appendChild(gridButton);
      this.updateGridButtonState();
    } catch (error) {
      console.error("Error creating grid toggle button:", error);
    }
  }

  updateGridButtonState() {
    try {
      const gridButton = document.getElementById("grid-toggle-btn");
      if (gridButton) {
        if (this.coordinateSystem.isGridEnabled) {
          gridButton.classList.add("active");
          gridButton.style.backgroundColor = "#FF5722";
          gridButton.style.color = "white";
        } else {
          gridButton.classList.remove("active");
          gridButton.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
          gridButton.style.color = "#6B7280";
        }
      }
    } catch (error) {
      console.error("Error updating grid button state:", error);
    }
  }

  clear() {
    this.coordinateSystem.clear();
  }

  redraw() {
    try {
      this.clear();

      if (!this.shapes) return;

      const renderableShapes = this.filterRenderableShapes();
      const sortedShapes = this.sortShapesByRenderOrder(renderableShapes);

      for (const { name, shape } of sortedShapes) {
        const isSelected =
          shape === this.selectedShape ||
          shape === this.interactionHandler.selectedShape;
        const isHovered = name === this.hoveredShape && !isSelected;

        this.drawShape(shape, isSelected, isHovered, name);
      }

      if (this.debugMode) {
        this.debugVisualizer.drawOverlay(this.shapes, this.coordinateSystem);
      }
    } catch (error) {
      console.error("Error in redraw:", error);
      this.fallbackRedraw();
    }
  }

  filterRenderableShapes() {
    const renderable = [];

    for (const [name, shape] of this.shapes.entries()) {
      if (!shape) continue;

      if (shape._consumedByBoolean) {
        if (this.debugMode) {
          console.log(`Skipping consumed shape: ${name}`);
        }
        continue;
      }

      renderable.push({ name, shape });
    }

    return renderable;
  }

  sortShapesByRenderOrder(shapes) {
    return shapes.sort((a, b) => {
      const aIsBool = a.shape.params?.operation ? 1 : 0;
      const bIsBool = b.shape.params?.operation ? 1 : 0;

      if (aIsBool !== bIsBool) {
        return aIsBool - bIsBool;
      }

      return 0;
    });
  }

  fallbackRedraw() {
    try {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "#FAFAFA";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } catch (e) {
      console.error("Failed to recover from redraw error:", e);
    }
  }

  drawShape(shape, isSelected = false, isHovered = false, shapeName = "") {
    try {
      if (!shape || !shape.type || !shape.transform) {
        return;
      }

      const transformContext = this.transformManager.createContext(
        shape.transform,
        this.coordinateSystem.transformX(shape.transform.position[0]),
        this.coordinateSystem.transformY(shape.transform.position[1]),
        1, // TRUE 1:1 scale - always exactly 1
      );

      this.ctx.save();
      this.ctx.translate(transformContext.screenX, transformContext.screenY);
      this.ctx.rotate(-transformContext.rotation);

      const styleContext = this.styleManager.createStyleContext(
        shape,
        isSelected,
        isHovered,
      );
      this.styleManager.applyStyle(this.ctx, styleContext);

      // Render the shape
      this.renderingEngine.renderShape(
        shape,
        styleContext,
        isSelected,
        isHovered,
      );

      // Draw selection UI in transformed context
      if (isSelected) {
        this.drawSelectionUIInContext(shape, shapeName);
      }

      if (isHovered && !isSelected) {
        this.drawHoverUIInContext(shape);
      }

      // Restore context after drawing selection UI
      this.ctx.restore();

      // Draw elements in screen space
      if (
        isSelected &&
        shape.params.operation &&
        this.selectionSystem.showOperationLabels
      ) {
        this.selectionSystem.drawOperationLabel(shape, shape.params.operation);
      }

      if (this.debugMode) {
        this.debugVisualizer.visualizeShape(shape, transformContext, shapeName);
      }
    } catch (error) {
      console.error("Error drawing shape:", error);
    }
  }

  drawSelectionUIInContext(shape, shapeName) {
    // Get bounds in local space
    const bounds = this.transformManager.calculateBounds(shape);
    // TRUE 1:1 scale - no scaling factors
    const scaledWidth = bounds.width;
    const scaledHeight = bounds.height;

    // Draw bounding box in local transformed space
    const padding = 8;
    const boxWidth = scaledWidth + padding * 2;
    const boxHeight = scaledHeight + padding * 2;

    this.ctx.strokeStyle = shape.params.operation
      ? this.getOperationColor(shape.params.operation) + "60"
      : "#FF572260";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([6, 6]);
    this.ctx.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = shape.params.operation
      ? this.getOperationColor(shape.params.operation) + "10"
      : "#FF572210";
    this.ctx.fillRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);

    // Draw corner handles in local space
    this.drawCornerHandlesInContext(shape, scaledWidth, scaledHeight);

    // Draw rotation handle in local space
    this.drawRotationHandleInContext(shape, scaledHeight);
  }

  drawHoverUIInContext(shape) {
    const bounds = this.transformManager.calculateBounds(shape);
    // TRUE 1:1 scale - no scaling factors
    const scaledWidth = bounds.width;
    const scaledHeight = bounds.height;

    this.ctx.strokeStyle = this.selectionSystem.hoverColor + "80";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([2, 2]);
    this.ctx.strokeRect(
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight,
    );
    this.ctx.setLineDash([]);
  }

  drawCornerHandlesInContext(shape, scaledWidth, scaledHeight) {
    const handlePositions = [
      { x: -scaledWidth / 2, y: -scaledHeight / 2, handle: "tl" },
      { x: scaledWidth / 2, y: -scaledHeight / 2, handle: "tr" },
      { x: scaledWidth / 2, y: scaledHeight / 2, handle: "br" },
      { x: -scaledWidth / 2, y: scaledHeight / 2, handle: "bl" },
    ];

    handlePositions.forEach((pos) => {
      const isHovered = this.interactionHandler.hoveredHandle === pos.handle;
      const isActive = this.interactionHandler.activeHandle === pos.handle;
      const radius = isHovered
        ? this.handleSystem.handleHoverRadius
        : this.handleSystem.handleRadius;

      this.ctx.save();
      this.ctx.translate(pos.x, pos.y);

      // Shadow
      this.ctx.beginPath();
      this.ctx.arc(0.5, 0.5, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.handleSystem.handleShadowColor;
      this.ctx.fill();

      // Handle
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.handleSystem.handleFillColor;
      this.ctx.fill();

      const strokeColor = shape.params.operation
        ? this.getOperationColor(shape.params.operation)
        : this.handleSystem.selectionColor;
      this.ctx.strokeStyle = isActive ? strokeColor + "FF" : strokeColor;
      this.ctx.lineWidth = isActive ? 3 : 2;
      this.ctx.stroke();

      if (isHovered) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
        this.ctx.strokeStyle = strokeColor + "40";
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }

      this.ctx.restore();
    });
  }

  drawRotationHandleInContext(shape, scaledHeight) {
    const rotHandleY =
      -scaledHeight / 2 - this.handleSystem.rotationHandleDistance;
    const isRotHovered = this.interactionHandler.hoveredHandle === "rotate";
    const isRotActive = this.interactionHandler.activeHandle === "rotate";
    const rotRadius = isRotHovered
      ? this.handleSystem.handleHoverRadius
      : this.handleSystem.handleRadius;

    // Connection line
    this.ctx.beginPath();
    this.ctx.moveTo(0, -scaledHeight / 2);
    this.ctx.lineTo(0, rotHandleY);
    const connectionColor = shape.params.operation
      ? this.getOperationColor(shape.params.operation)
      : this.handleSystem.selectionColor;
    this.ctx.strokeStyle = connectionColor + "60";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Shadow
    this.ctx.beginPath();
    this.ctx.arc(0.5, rotHandleY + 0.5, rotRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.handleSystem.handleShadowColor;
    this.ctx.fill();

    // Handle
    this.ctx.beginPath();
    this.ctx.arc(0, rotHandleY, rotRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.handleSystem.handleFillColor;
    this.ctx.fill();

    const strokeColor = shape.params.operation
      ? this.getOperationColor(shape.params.operation)
      : this.handleSystem.selectionColor;
    this.ctx.strokeStyle = isRotActive ? strokeColor + "FF" : strokeColor;
    this.ctx.lineWidth = isRotActive ? 3 : 2;
    this.ctx.stroke();

    if (isRotHovered) {
      this.ctx.beginPath();
      this.ctx.arc(0, rotHandleY, rotRadius + 2, 0, Math.PI * 2);
      this.ctx.strokeStyle = strokeColor + "40";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }

    // Rotation icon
    this.ctx.beginPath();
    this.ctx.arc(0, rotHandleY, rotRadius * 0.4, 0, Math.PI * 1.5);
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // Arrow
    const arrowSize = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(-rotRadius * 0.4, rotHandleY);
    this.ctx.lineTo(-rotRadius * 0.4 - arrowSize, rotHandleY - arrowSize);
    this.ctx.lineTo(-rotRadius * 0.4 - arrowSize, rotHandleY + arrowSize);
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }

  getOperationColor(operation) {
    const colors = {
      difference: "#FF5722",
      union: "#4CAF50",
      intersection: "#2196F3",
      xor: "#9C27B0",
    };
    return colors[operation] || "#808080";
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
      this.selectionSystem.clearSelection();
      this.handleSystem.clearHandleState();
      this.redraw();
    } catch (error) {
      console.error("Error setting shapes:", error);
      this.shapes = new Map();
    }
  }

  setUpdateCodeCallback(callback) {
    this.updateCodeCallback = callback;
  }

  notifyShapeChanged(shape, action = "update") {
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

      if (
        shape.transform &&
        shape.transform.position &&
        shape.transform.position.length > 2
      ) {
        shape.transform.position.length = 2;
      }

      if (shapeName) {
        this.updateCodeCallback({
          action: action,
          name: shapeName,
          shape: shape,
        });
      }
    } catch (error) {
      console.error("Error in notifyShapeChanged:", error);
    }
  }

  findShapeName(shapeObject) {
    for (const [name, shape] of this.shapes.entries()) {
      if (shape === shapeObject) {
        return name;
      }
    }
    return null;
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
    this.debugVisualizer.setEnabled(enabled);
    this.booleanRenderer.setDebugMode(enabled);
    this.redraw();
  }

  getSelectedShape() {
    return this.interactionHandler.selectedShape || this.selectedShape;
  }

  setSelectedShape(shape) {
    this.interactionHandler.selectedShape = shape;
    this.selectedShape = shape;
    this.selectionSystem.setSelectedShape(shape);
    this.redraw();
  }

  getHoveredShape() {
    return this.interactionHandler.hoveredShape;
  }

  setHoveredShape(shapeName) {
    this.interactionHandler.hoveredShape = shapeName;
    this.hoveredShape = shapeName;
    this.selectionSystem.setHoveredShape(shapeName);
    this.redraw();
  }

  selectShapeAtPoint(x, y) {
    return this.interactionHandler.selectShapeAtPoint(x, y);
  }

  isPointInShape(x, y, shape) {
    return this.interactionHandler.isPointInShape(x, y, shape);
  }

  getHandleAtPoint(x, y) {
    return this.handleSystem.getHandleAtPoint(
      x,
      y,
      this.selectedShape || this.interactionHandler.selectedShape,
    );
  }

  toggleFillForSelectedShape() {
    try {
      const selected =
        this.selectedShape || this.interactionHandler.selectedShape;
      if (!selected) return;

      const shapeName = this.findShapeName(selected);
      if (!shapeName) return;

      const shape = selected;
      const currentFill = shape.params.fill || false;

      this.shapeManager.onCanvasShapeChange(shapeName, "fill", !currentFill);

      if (!currentFill && !shape.params.fillColor) {
        this.shapeManager.onCanvasShapeChange(
          shapeName,
          "fillColor",
          "#808080",
        );
      }

      this.notifyShapeChanged(selected);
    } catch (error) {
      console.error("Error toggling fill:", error);
    }
  }

  setFillColorForSelectedShape(color) {
    try {
      const selected =
        this.selectedShape || this.interactionHandler.selectedShape;
      if (!selected) return;

      const shapeName = this.findShapeName(selected);
      if (!shapeName) return;

      this.shapeManager.onCanvasShapeChange(shapeName, "fill", true);
      this.shapeManager.onCanvasShapeChange(shapeName, "fillColor", color);

      this.notifyShapeChanged(selected);
    } catch (error) {
      console.error("Error setting fill color:", error);
    }
  }

  // REMOVED: zoomIn(), zoomOut() - no zoom functionality

  resetView() {
    // Only reset pan, no zoom
    this.coordinateSystem.setPanOffset(0, 0);
    this.redraw();
  }

  fitToView() {
    if (!this.shapes || this.shapes.size === 0) return;

    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (const [name, shape] of this.shapes.entries()) {
      if (shape._consumedByBoolean) continue;

      const bounds = this.transformManager.calculateBounds(shape);
      const x = shape.transform.position[0];
      const y = shape.transform.position[1];

      minX = Math.min(minX, x + bounds.x);
      maxX = Math.max(maxX, x + bounds.x + bounds.width);
      minY = Math.min(minY, y + bounds.y);
      maxY = Math.max(maxY, y + bounds.y + bounds.height);
    }

    if (minX === Infinity) return;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Center the view on the shapes (no scaling, TRUE 1:1)
    this.coordinateSystem.setPanOffset(-centerX, centerY);

    this.redraw();
  }

  exportCanvasAsImage(format = "png") {
    try {
      const dataURL = this.canvas.toDataURL(`image/${format}`);

      const link = document.createElement("a");
      link.download = `aqui_canvas.${format}`;
      link.href = dataURL;
      link.click();

      return dataURL;
    } catch (error) {
      console.error("Error exporting canvas:", error);
      return null;
    }
  }

  getCanvasInfo() {
    const bounds = this.coordinateSystem.getCanvasBounds();
    const viewport = this.coordinateSystem.getViewportBounds();

    return {
      canvas: bounds,
      viewport: viewport,
      scale: this.coordinateSystem.scale, // Always 1
      pan: this.coordinateSystem.panOffset,
      shapeCount: this.shapes.size,
      selectedShape: this.selectedShape
        ? this.findShapeName(this.selectedShape)
        : null,
      debugMode: this.debugMode,
      pixelsToMm: this.coordinateSystem.pixelsToMm, // Always 1
    };
  }

  destroy() {
    try {
      const gridButton = document.getElementById("grid-toggle-btn");
      if (gridButton) {
        gridButton.remove();
      }

      this.shapes.clear();
      this.selectedShape = null;
      this.hoveredShape = null;
      this.updateCodeCallback = null;

      if (this.debugVisualizer) {
        this.debugVisualizer.reset();
      }

      if (this.selectionSystem) {
        this.selectionSystem.clearSelection();
      }

      if (this.handleSystem) {
        this.handleSystem.clearHandleState();
      }
    } catch (error) {
      console.error("Error destroying renderer:", error);
    }
  }
}

class ModularRenderingEngine {
  constructor(renderer) {
    this.renderer = renderer;
    this.ctx = renderer.ctx;
    this.shapeRenderer = renderer.shapeRenderer;
    this.pathRenderer = renderer.pathRenderer;
    this.booleanRenderer = renderer.booleanRenderer;
  }

  renderShape(shape, styleContext, isSelected, isHovered) {
    try {
      const { type, params } = shape;

      if (params.operation) {
        return this.booleanRenderer.renderBooleanResult(
          shape,
          styleContext,
          isSelected,
          isHovered,
        );
      }

      switch (type) {
        case "path":
          return this.pathRenderer.renderPath(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
        case "slotBoard":
          return this.shapeRenderer.renderSlotBoard(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
        case "tabBoard":
          return this.shapeRenderer.renderTabBoard(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
        case "text":
          return this.shapeRenderer.renderText(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
        case "gear":
          return this.shapeRenderer.renderGear(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
        case "bezier":
          return this.shapeRenderer.renderBezier(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
        case "dovetailPin": // ADD THIS
          return this.shapeRenderer.renderDovetailPin(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
        case "dovetailTail": // ADD THIS
          return this.shapeRenderer.renderDovetailTail(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
        case "fingerJointPin": // ADD THIS
          return this.shapeRenderer.renderFingerJointPin(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
        case "fingerJointSocket": // ADD THIS
          return this.shapeRenderer.renderFingerJointSocket(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
        case "halfLapMale":
          return this.shapeRenderer.renderHalfLapMale(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
        case "halfLapFemale":
          return this.shapeRenderer.renderHalfLapFemale(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
        case "crossLapVertical":
          return this.shapeRenderer.renderCrossLapVertical(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
        case "crossLapHorizontal":
          return this.shapeRenderer.renderCrossLapHorizontal(
            params,
            styleContext,
            isSelected,
            isHovered,
          );
      case 'fingerCombMale':
        return this.shapeRenderer.renderFingerCombMale(params, styleContext, isSelected, isHovered);
      case 'fingerCombFemale':
        return this.shapeRenderer.renderFingerCombFemale(params, styleContext, isSelected, isHovered);
        default:
          return this.shapeRenderer.renderGenericShape(
            type,
            params,
            styleContext,
            isSelected,
            isHovered,
          );
      }
    } catch (error) {
      console.error("Error in renderShape:", error);
      return false;
    }
  }
}
