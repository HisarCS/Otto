# AQUI Renderer System Documentation

## Architecture Overview

AQUI's renderer system transforms mathematical shape definitions into interactive visual representations on HTML5 Canvas. The system provides real-time feedback, precise coordinate systems, and professional-quality output suitable for both education and fabrication.

**Why a custom renderer?** Standard web graphics APIs (DOM, SVG) aren't optimized for real-time parametric design. AQUI needs:
- **1:1 scale accuracy** - True-to-life measurements for fabrication
- **Interactive manipulation** - Direct shape editing with immediate feedback
- **Performance** - Smooth updates during parameter changes
- **Professional features** - Grid systems, rulers, selection handles, export capabilities

The renderer architecture consists of modular components working together:
1. **Core Renderer** (`renderer.mjs`) - Main orchestrator and shape management
2. **Coordinate System** (`coordinateSystem.mjs`) - World-to-screen transforms and measurement accuracy
3. **Visual Components** - Selection, handles, grid, rulers, debug overlays
4. **Interaction Systems** - Mouse handling, drag-and-drop, shape manipulation
5. **Export Pipeline** - SVG and DXF generation for fabrication workflows

---

## Core Renderer (`renderer.mjs`)

### Main Renderer Architecture

#### **Renderer Class Structure**
```javascript
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;                              // HTML5 Canvas element
        this.ctx = canvas.getContext("2d");               // 2D rendering context

        this._overlayDrawers = [];                        // Additional drawing layers

        this.initializeComponents();                      // Create subsystems
        this.initializeState();                           // Set up data structures
        this.setupCanvas();                               // Configure canvas properties
        this.setupInteractivity();                        // Bind event handlers
        this.enableInteractiveMode();                     // Enable shape manipulation

        shapeManager.registerRenderer(this);              // Integration with shape system
    }
}
```
**How it works:** The renderer acts as the central coordinator for all visual operations. It initializes subsystems, manages the rendering pipeline, and provides the interface between AQUI's mathematical shape system and the visual display.

**Component initialization:** Each subsystem (coordinate system, selection, handles, etc.) is created and configured during construction. This modular approach allows components to be developed, tested, and maintained independently.

#### **Component Initialization**
```javascript
initializeComponents() {
    this.coordinateSystem = new CoordinateSystem(this.canvas);     // World-to-screen mapping
    this.styleManager = new ShapeStyleManager();                  // Colors, fills, strokes
    this.shapeRenderer = new ShapeRenderer(this.ctx);             // Basic shape drawing
    this.pathRenderer = new PathRenderer(this.ctx);               // Complex path handling
    this.booleanRenderer = new BooleanOperationRenderer(this.ctx); // Boolean operations
    this.selectionSystem = new SelectionSystem(this);             // Shape selection
    this.handleSystem = new HandleSystem(this);                   // Interactive handles
    this.debugVisualizer = new DebugVisualizer(this.ctx);         // Performance monitoring
    this.transformManager = new TransformManager();               // Shape transformations

    // Edge detection system
    this.edgeCalculator = new EdgeCalculator();
    this.edgeHitTester = new EdgeHitTester({
        straightEdgeTolerance: 10,
        arcEdgeTolerance: 12,
        bezierEdgeTolerance: 15,
        enableEdgeHover: true
    });

    // High-level systems
    this.interactionHandler = new SimpleInteractionHandler(this);
    this.renderingEngine = new ModularRenderingEngine(this);
}
```
**How it works:** Component initialization creates specialized subsystems for different aspects of rendering:
- **Coordinate System** - Handles the complex math of converting between world coordinates (where shapes exist) and screen pixels (where they're drawn)
- **Style Management** - Centralizes color, fill, and stroke handling across different shape types
- **Rendering Engines** - Specialized renderers for different shape categories and operations
- **Interaction Systems** - Handle mouse events, selection, and direct manipulation
- **Debug Tools** - Performance monitoring and troubleshooting aids

**Why modular architecture?** Each component has a single responsibility, making the system easier to understand, debug, and extend. New features can be added by creating new components or extending existing ones without touching unrelated code.

### Shape Management and Storage

#### **Shape Storage System**
```javascript
initializeState() {
    this.shapes = new Map();                              // Shape name → Shape instance
    this.selectedShape = null;                            // Currently selected shape
    this.hoveredShape = null;                             // Shape under mouse cursor
    this.hoveredEdge = null;                              // Edge under mouse cursor
    
    // Performance tracking
    this.frameCount = 0;
    this.lastFrameTime = 0;
    
    // Interaction state
    this.isDragging = false;
    this.draggedShape = null;
    this.dragStart = { x: 0, y: 0 };
    this.isResizing = false;
    this.isRotating = false;
    
    // Visual state
    this.debugMode = false;
    this.showGrid = true;
    this.showRulers = true;
}
```
**How it works:** The renderer maintains comprehensive state for all aspects of the visual system:
- **Shape Storage** - Map provides O(1) access to shapes by name while preserving creation order
- **Selection State** - Tracks which shapes are selected, hovered, or being manipulated  
- **Performance Metrics** - Frame counting and timing for optimization
- **Interaction State** - Current user activity (dragging, resizing, etc.)
- **Visual Configuration** - User preferences for grid, rulers, debug information

**Why Maps over Arrays?** Maps provide both fast key-based access (for finding shapes by name) and ordered iteration (for consistent rendering order). This dual capability is essential for shape management.

#### **Shape Registration and Updates**
```javascript
setShapes(shapes) {
    this.shapes = shapes;                                  // Replace entire shape collection
    this.selectedShape = null;                             // Clear selection on content change
    this.hoveredShape = null;                              // Clear hover state
    this.hoveredEdge = null;
    
    this.updateShapeEdges();                               // Recalculate edge information
    this.redraw();                                         // Trigger visual update
}

updateShapeEdges() {
    this.shapeEdges.clear();                               // Clear existing edge data
    
    for (const [name, shape] of this.shapes.entries()) {
        if (shape._consumedByBoolean) continue;            // Skip shapes used in boolean operations
        
        try {
            const collection = this.edgeCalculator.calculateEdges(shape);
            if (collection && collection.getEdgeCount() > 0) {
                this.shapeEdges.set(name, collection);
            }
        } catch (error) {
            console.warn(`Edge calculation failed for ${name}:`, error);
        }
    }
}
```
**How it works:** Shape updates involve multiple coordinated operations:
1. **Replace storage** - Swap out the entire shape collection atomically
2. **Clear state** - Reset selection and hover to prevent stale references
3. **Recalculate edges** - Update edge data for mouse interaction and selection
4. **Trigger redraw** - Schedule visual update on next animation frame

**Boolean shape handling:** Shapes that are consumed by boolean operations (union, difference, intersection) are hidden from normal rendering and interaction. They exist mathematically but not visually.

### Main Rendering Pipeline

#### **Core Drawing Method**
```javascript
draw() {
    try {
        this.coordinateSystem.clear();                     // Clear canvas and draw grid/rulers
        
        if (!this.shapes || this.shapes.size === 0) {     // Early exit for empty scenes
            this.drawOverlays();
            return;
        }

        this.frameCount++;                                 // Performance tracking
        const startTime = performance.now();

        // Main shape rendering loop
        for (const [shapeName, shape] of this.shapes.entries()) {
            if (shape._consumedByBoolean) continue;        // Skip hidden shapes
            
            try {
                this.drawShape(shape, shapeName);          // Render individual shape
            } catch (error) {
                console.error(`Error drawing shape ${shapeName}:`, error);
                // Continue rendering other shapes despite individual failures
            }
        }

        // Post-processing layers
        this.drawSelectionUI();                            // Selection highlights and handles
        this.drawOverlays();                               // Debug info, constraint markers, etc.
        
        // Performance monitoring
        const frameTime = performance.now() - startTime;
        this.lastFrameTime = frameTime;
        
        if (this.debugMode) {
            this.debugVisualizer.drawPerformanceOverlay();
        }
    } catch (error) {
        console.error('Critical rendering error:', error);
        // Attempt graceful degradation
        this.drawErrorState();
    }
}
```
**How it works:** The rendering pipeline processes shapes in a specific order to ensure correct visual layering:
1. **Clear and setup** - Prepare canvas with background, grid, and rulers
2. **Early exit** - Skip expensive operations if no shapes exist
3. **Shape rendering** - Draw each visible shape with error isolation
4. **UI overlays** - Add selection highlights, handles, and interactive elements
5. **Debug information** - Optional performance and diagnostic data
6. **Error handling** - Continue operating even if individual shapes fail to render

**Error isolation:** Each shape is rendered in a try-catch block so one malformed shape doesn't crash the entire renderer. This robustness is crucial for educational tools where users create experimental designs.

#### **Individual Shape Drawing**
```javascript
drawShape(shape, shapeName) {
    this.ctx.save();                                       // Preserve canvas state
    
    try {
        // Calculate and apply shape transformation
        const transformContext = this.transformManager.setupTransform(
            this.ctx, 
            shape, 
            this.coordinateSystem
        );

        // Apply visual styling
        this.styleManager.applyShapeStyle(this.ctx, shape);

        // Render based on shape type
        if (shape.type === 'path') {
            this.pathRenderer.drawPath(shape, transformContext);
        } else if (shape.params && shape.params.operation) {
            this.booleanRenderer.drawBooleanOperation(shape, transformContext);
        } else {
            this.shapeRenderer.drawGenericShape(shape, transformContext);
        }

        // Add shape-specific overlays
        if (this.selectedShape === shape) {
            this.drawSelectionUIInContext(shape, shapeName);
        }

        // Debug visualization
        if (this.debugMode) {
            this.debugVisualizer.visualizeShape(shape, transformContext, shapeName);
        }
    } catch (error) {
        console.error("Error drawing shape:", error);
        // Draw error indicator instead of crashing
        this.drawShapeError(shapeName);
    } finally {
        this.ctx.restore();                                // Always restore canvas state
    }
}
```
**How it works:** Individual shape rendering follows a structured pipeline:
1. **State preservation** - Save canvas state to isolate shape-specific changes
2. **Transform setup** - Apply position, rotation, and scaling transforms
3. **Style application** - Set colors, line widths, fill patterns
4. **Type-specific rendering** - Use appropriate renderer for shape complexity
5. **Selection overlay** - Add handles and highlights for selected shapes
6. **Debug visualization** - Optional geometric analysis and performance data
7. **State restoration** - Return canvas to clean state for next shape

**Transform isolation:** Each shape's transforms are applied in a save/restore block, ensuring that one shape's rotation doesn't affect subsequent shapes.

### Interactive Features

#### **Selection System Integration**
```javascript
drawSelectionUI() {
    if (!this.selectedShape) return;
    
    const shapeName = this.findShapeName(this.selectedShape);
    if (!shapeName) return;

    // Draw selection highlight
    this.selectionSystem.drawSelectionHighlight(this.selectedShape);
    
    // Draw manipulation handles
    this.handleSystem.drawHandles(this.selectedShape);
    
    // Draw shape information overlay
    this.drawShapeInfoOverlay(this.selectedShape, shapeName);
}

drawShapeInfoOverlay(shape, shapeName) {
    const transform = shape.transform;
    const position = transform.position || [0, 0];
    const rotation = transform.rotation || 0;
    
    // Create info panel
    const info = [
        `Name: ${shapeName}`,
        `Type: ${shape.type}`,
        `Position: [${position[0].toFixed(1)}, ${position[1].toFixed(1)}]`,
        `Rotation: ${rotation.toFixed(1)}°`,
        `Bounds: ${this.calculateShapeBounds(shape)}`
    ];
    
    this.drawInfoPanel(info);
}
```
**How it works:** The selection system provides visual feedback for user interactions:
- **Highlight rendering** - Visual indication of selected shapes
- **Handle display** - Interactive control points for manipulation
- **Information overlay** - Real-time display of shape properties
- **Dynamic updates** - Information changes as shapes are manipulated

#### **Mouse Interaction Handling**
```javascript
setupInteractivity() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
}

handleMouseDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const worldPos = this.coordinateSystem.screenToWorld(screenX, screenY);
    
    // Check for handle interaction first
    const handleHit = this.handleSystem.getHandleAtPoint(screenX, screenY);
    if (handleHit && this.selectedShape) {
        this.startHandleInteraction(handleHit, worldPos);
        return;
    }
    
    // Check for shape selection
    const hitShape = this.findShapeAtPoint(worldPos.x, worldPos.y);
    if (hitShape) {
        this.selectShape(hitShape);
        this.startShapeDrag(worldPos);
    } else {
        this.clearSelection();
    }
    
    this.redraw();
}
```
**How it works:** Mouse interaction processing follows a priority hierarchy:
1. **Handle interaction** - Highest priority for shape manipulation
2. **Shape selection** - Click on shapes to select them
3. **Background click** - Clear selection and start pan operation
4. **Coordinate conversion** - All interactions work in world coordinates

The interaction system converts screen coordinates (mouse pixels) to world coordinates (shape units) for consistent behavior regardless of zoom or pan state.

---

## Coordinate System (`coordinateSystem.mjs`)

### True 1:1 Scale Architecture

#### **CoordinateSystem Class**
```javascript
export class CoordinateSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // TRUE 1:1 scale - NO SCALING AT ALL
        this.scale = 1;                                    // Always exactly 1
        this.panOffset = { x: 0, y: 0 };                  // Camera position offset
        this.offsetX = 0;                                  // Canvas center X
        this.offsetY = 0;                                  // Canvas center Y
        
        // Grid and visual properties
        this.isGridEnabled = true;
        this.gridSize = 10;                                // 10mm grid spacing
        this.gridOpacity = 0.12;                           // Subtle grid appearance
        this.backgroundColor = '#FAFAFA';
        this.gridColor = '#D1D5DB';
        
        // Ruler properties - TRUE 1:1 scale
        this.rulerHeight = 30;                             // Pixel height of ruler
        this.rulerWidth = 30;                              // Pixel width of ruler  
        this.rulerColor = '#666666';
        this.rulerBackgroundColor = '#f8f8f8';
        this.rulerTextColor = '#333333';
        
        this.setupCanvas();
    }
}
```
**How it works:** AQUI's coordinate system maintains true 1:1 scale between screen pixels and millimeters:
- **No zoom factor** - Unlike typical graphics applications, AQUI doesn't scale shapes
- **Direct mapping** - 1 screen pixel = 1 millimeter in the design
- **Pan-only navigation** - Users move around the design space but don't zoom in/out
- **Professional accuracy** - Measurements on screen match real-world fabrication

**Why 1:1 scale?** This approach provides:
- **Fabrication accuracy** - What you see is exactly what gets manufactured
- **Measurement consistency** - Screen rulers show true dimensions
- **Educational clarity** - Students learn real-world scales, not abstract ratios
- **Professional workflow** - Matches CAD software conventions

#### **Canvas Setup and Sizing**
```javascript
setupCanvas() {
    try {
        const container = this.canvas.parentElement;
        
        // Set canvas size to exact pixel dimensions
        this.canvas.width = container.clientWidth;         // Logical pixels
        this.canvas.height = container.clientHeight;
        
        // Ensure no CSS scaling
        this.canvas.style.width = container.clientWidth + 'px';   // Physical pixels
        this.canvas.style.height = container.clientHeight + 'px';
        
        // Center coordinate system
        this.offsetX = this.canvas.width / 2;              // Center point X
        this.offsetY = this.canvas.height / 2;             // Center point Y
        
        // Optimize context for performance
        this.ctx.imageSmoothingEnabled = false;            // Crisp pixel-perfect rendering
        
    } catch (error) {
        // Fallback dimensions if container sizing fails
        this.offsetX = 400;
        this.offsetY = 300;
    }
}
```
**How it works:** Canvas setup ensures pixel-perfect rendering:
1. **Match container size** - Canvas dimensions exactly match parent element
2. **Prevent CSS scaling** - Explicit pixel dimensions avoid browser scaling
3. **Center origin** - Place coordinate origin at canvas center
4. **Disable smoothing** - Sharp edges for technical drawings

**Pixel accuracy:** The setup process ensures that canvas logical pixels match physical display pixels, preventing blurry rendering that can occur when browsers scale canvas content.

#### **Coordinate Transformation Methods**
```javascript
// Convert world coordinates to screen pixels
transformX(x) {
    return x + this.offsetX + this.panOffset.x;
}

transformY(y) {
    return -y + this.offsetY + this.panOffset.y;          // Flip Y axis for Cartesian coordinates
}

// Convert screen pixels to world coordinates  
screenToWorld(x, y) {
    return {
        x: x - this.offsetX - this.panOffset.x,
        y: -(y - this.offsetY - this.panOffset.y)         // Flip Y axis back to Cartesian
    };
}
```
**How it works:** Coordinate transformation handles the conversion between screen pixels and world coordinates:
- **X transformation** - Direct mapping with pan offset
- **Y transformation** - Flip vertical axis to match Cartesian convention (Y increases upward)
- **Bidirectional** - Convert both screen→world and world→screen

**Cartesian Y-axis:** Computer screens use Y-down coordinates (Y increases downward) while mathematical/engineering conventions use Y-up (Y increases upward). AQUI flips the Y-axis to match mathematical expectations.

### Grid and Ruler System

#### **Cartesian Grid Drawing**
```javascript
drawCartesianGrid() {
    const gridSize = this.gridSize;                        // TRUE 10mm grid
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = this.offsetX + this.panOffset.x;
    const centerY = this.offsetY + this.panOffset.y;
    
    const opacity = this.gridOpacity;
    
    // Calculate visible grid bounds for performance
    const startX = this.rulerWidth;                        // Don't draw grid under rulers
    const startY = this.rulerHeight;
    const gridLeft = Math.floor((startX - centerX) / gridSize) * gridSize;
    const gridRight = Math.ceil((width - centerX) / gridSize) * gridSize;
    const gridTop = Math.floor((startY - centerY) / gridSize) * gridSize;
    const gridBottom = Math.ceil((height - centerY) / gridSize) * gridSize;
    
    // Draw grid dots - optimized for performance
    this.ctx.fillStyle = `rgba(153, 153, 153, ${opacity})`;
    this.ctx.beginPath();
    
    for (let offsetX = gridLeft; offsetX <= gridRight; offsetX += gridSize) {
        for (let offsetY = gridTop; offsetY <= gridBottom; offsetY += gridSize) {
            const x = centerX + offsetX;
            const y = centerY - offsetY;                   // Cartesian Y
            
            if (x >= startX && x <= width && y >= startY && y <= height) {
                this.ctx.moveTo(x + 1.2, y);
                this.ctx.arc(x, y, 1.2, 0, Math.PI * 2);  // Small dots at grid intersections
            }
        }
    }
    this.ctx.fill();
}
```
**How it works:** Grid rendering provides visual reference for alignment and measurement:
1. **Performance optimization** - Only draw visible grid points
2. **Ruler integration** - Avoid drawing under ruler areas
3. **Dot pattern** - Small circles at intersections for clean appearance
4. **Cartesian spacing** - True 10mm spacing in both X and Y directions

**Grid optimization:** The calculation of `gridLeft`, `gridRight`, etc. ensures only visible grid points are drawn, maintaining smooth performance even for large design spaces.

#### **Professional Ruler System**  
```javascript
drawHorizontalRuler() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const centerX = this.offsetX + this.panOffset.x;
    
    // Draw ruler ticks and labels
    ctx.fillStyle = this.rulerTextColor;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const tickSpacing = 10;                                // 10mm per tick
    const majorTickSpacing = 50;                           // 50mm for major ticks
    
    // Calculate visible range
    const leftmostTick = Math.floor((this.rulerWidth - centerX) / tickSpacing) * tickSpacing;
    const rightmostTick = Math.ceil((width - centerX) / tickSpacing) * tickSpacing;
    
    for (let offset = leftmostTick; offset <= rightmostTick; offset += tickSpacing) {
        const x = centerX + offset;
        if (x < this.rulerWidth || x > width) continue;
        
        const isMajorTick = offset % majorTickSpacing === 0;
        const tickHeight = isMajorTick ? 8 : 4;
        
        // Draw tick mark
        ctx.strokeStyle = this.rulerColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, this.rulerHeight - tickHeight);
        ctx.lineTo(x, this.rulerHeight);
        ctx.stroke();
        
        // Draw label for major ticks
        if (isMajorTick) {
            const mmValue = offset;
            const displayValue = mmValue === 0 ? '0' : Math.abs(mmValue).toString();
            ctx.fillText(displayValue, x, 15);
        }
    }
}
```
**How it works:** The ruler system provides precise measurement references:
1. **True measurements** - Ruler markings correspond to actual millimeter distances
2. **Major/minor ticks** - Different tick sizes for different measurement precision
3. **Dynamic labeling** - Only major ticks get numeric labels to avoid clutter
4. **Performance optimization** - Only draw visible ruler sections

**Measurement accuracy:** The ruler calculations ensure that distances measured on screen correspond exactly to real-world millimeter measurements, crucial for fabrication workflows.

### Pan and Navigation

#### **Pan Operation Handling**
```javascript
pan(dx, dy) {
    this.panOffset.x += dx;                                // Accumulate horizontal movement
    this.panOffset.y += dy;                                // Accumulate vertical movement
}

setPanOffset(x, y) {
    this.panOffset.x = x;                                  // Set absolute pan position
    this.panOffset.y = y;
}

getViewportBounds() {
    const topLeft = this.screenToWorld(this.rulerWidth, this.rulerHeight);
    const bottomRight = this.screenToWorld(this.canvas.width, this.canvas.height);
    
    return {
        left: topLeft.x,                                   // Leftmost visible coordinate
        top: topLeft.y,                                    // Topmost visible coordinate  
        right: bottomRight.x,                              // Rightmost visible coordinate
        bottom: bottomRight.y,                             // Bottommost visible coordinate
        width: bottomRight.x - topLeft.x,                  // Visible width in world units
        height: topLeft.y - bottomRight.y                  // Visible height in world units
    };
}
```
**How it works:** Pan operations move the user's view around the design space:
- **Incremental panning** - Small movements accumulate for smooth interaction
- **Absolute positioning** - Direct positioning for programmatic control
- **Viewport calculation** - Determine what portion of the design space is visible

**Viewport bounds:** The calculation accounts for ruler space and provides world coordinates of the visible design area, useful for performance optimization and view management.

---

## Debug and Performance System (`debugVisualizer.mjs`)

### Performance Monitoring

#### **DebugVisualizer Class**
```javascript
export class DebugVisualizer {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = false;
        
        // Performance tracking
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = 0;
        this.frameTimeHistory = [];
        this.maxFrameTimeHistory = 60;                     // Keep last 60 frame times
        
        // Memory tracking
        this.memoryHistory = [];
        this.maxMemoryHistory = 100;
        
        // Render statistics
        this.shapeCount = 0;
        this.edgeCount = 0;
        this.selectedCount = 0;
    }
}
```
**How it works:** The debug visualizer provides comprehensive performance monitoring:
- **Frame rate tracking** - Measures actual rendering performance
- **Memory monitoring** - Tracks JavaScript memory usage over time
- **Render statistics** - Counts shapes, edges, and selection states
- **Historical data** - Maintains performance trends for analysis

#### **Real-Time Performance Overlay**
```javascript
drawPerformanceOverlay() {
    this.updatePerformanceMetrics();
    
    this.ctx.save();
    
    // Semi-transparent background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(10, 10, 200, 80);
    
    // Performance text
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    const perfInfo = [
        `FPS: ${this.fps}`,                                // Current frame rate
        `Frame: ${this.frameCount}`,                       // Total frames rendered
        `Memory: ${this.getMemoryUsage()}`,                // Current memory usage
        `Shapes: ${this.shapeCount}`,                      // Active shape count
        `Edges: ${this.edgeCount}`,                        // Total edge count
        `Selected: ${this.selectedCount}`                  // Selected objects
    ];

    perfInfo.forEach((line, i) => {
        this.ctx.fillText(line, 15, 15 + i * 12);
    });

    this.ctx.restore();
}
```
**How it works:** Performance overlay provides real-time system information:
1. **Metrics collection** - Gather current performance data
2. **Background rendering** - Semi-transparent panel for readability
3. **Information display** - Key metrics in monospace font for easy reading
4. **Continuous updates** - Refreshes with each frame for real-time monitoring

**Performance insights:** The overlay helps developers identify performance bottlenecks:
- **Low FPS** - Indicates rendering performance issues
- **High memory** - Suggests memory leaks or excessive object creation
- **Shape counts** - Shows complexity of current design

#### **Memory Usage Tracking**
```javascript
getMemoryUsage() {
    if (performance.memory) {
        const used = performance.memory.usedJSHeapSize;
        const total = performance.memory.totalJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        
        // Store for historical tracking
        this.memoryHistory.push({
            used: used,
            total: total,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.memoryHistory.length > this.maxMemoryHistory) {
            this.memoryHistory.shift();
        }
        
        return `${(used / 1048576).toFixed(1)}MB / ${(total / 1048576).toFixed(1)}MB`;
    }
    return 'N/A';
}
```
**How it works:** Memory tracking monitors JavaScript heap usage:
- **Browser API integration** - Uses Performance.memory when available
- **Historical tracking** - Maintains memory usage over time
- **Trend analysis** - Helps identify memory leaks or excessive allocation
- **Formatted output** - Human-readable megabyte values

### Shape Analysis and Debugging

#### **Shape Statistics Overlay**
```javascript
drawShapeStatsOverlay(shapes) {
    let consumedCount = 0;                                 // Shapes used in boolean operations
    let booleanCount = 0;                                  // Boolean operation results
    let pathCount = 0;                                     // Complex path shapes

    shapes.forEach(shape => {
        if (shape._consumedByBoolean) consumedCount++;
        if (shape.params.operation) booleanCount++;
        if (shape.type === 'path') pathCount++;
    });

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(10, 100, 200, 100);

    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = '12px monospace';

    const shapeInfo = [
        `Total Shapes: ${shapes.size}`,
        `Consumed: ${consumedCount}`,                      // Hidden by boolean operations
        `Boolean Ops: ${booleanCount}`,                    // Result shapes from operations
        `Paths: ${pathCount}`,                             // Complex path geometry
        `Visible: ${shapes.size - consumedCount}`          // Actually rendered shapes
    ];

    shapeInfo.forEach((line, i) => {
        this.ctx.fillText(line, 15, 105 + i * 15);
    });

    this.ctx.restore();
}
```
**How it works:** Shape statistics provide insights into design complexity:
- **Total vs Visible** - Shows how boolean operations affect shape count
- **Operation breakdown** - Categorizes shapes by type and usage
- **Performance correlation** - Higher counts often correlate with slower performance
- **Debug assistance** - Helps identify unexpected shape states

---

## Drag & Drop System (`dragDropSystem.mjs`)

### Shape Palette Integration

#### **DragDropSystem Class**
```javascript
export class DragDropSystem {
    constructor(canvas, renderer, editor, shapeManager) {
        this.canvas = canvas;                              // Target canvas for drops
        this.renderer = renderer;                          // Renderer for coordinate conversion
        this.editor = editor;                              // Code editor for insertion
        this.shapeManager = shapeManager;                  // Shape creation interface
        
        this.draggedShape = null;                          // Currently dragged shape type
        this.dragPreview = null;                           // Visual preview element
        this.dragOffset = { x: 0, y: 0 };                 // Mouse offset within dragged item
        this.shapeCounter = 1;                             // Unique name generation
        
        this.setupDragAndDrop();                           // Initialize event handlers
    }
}
```
**How it works:** The drag-and-drop system enables intuitive shape creation from a visual palette:
- **Visual feedback** - Shows preview of dragged shape during movement
- **Coordinate integration** - Converts drop position to world coordinates  
- **Code generation** - Creates AQUI code for dropped shapes
- **Editor integration** - Inserts generated code into the text editor

#### **Drag Operation Handling**
```javascript
handleDragStart(e, paletteItem) {
    this.draggedShape = paletteItem.dataset.shape;        // Extract shape type from palette item
    
    // Calculate mouse offset within the dragged item
    const rect = paletteItem.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
    
    this.createDragPreview(e, paletteItem);               // Create visual preview
    document.body.style.cursor = 'grabbing';              // Update cursor
}

createDragPreview(e, paletteItem) {
    this.dragPreview = paletteItem.cloneNode(true);       // Clone the palette item
    this.dragPreview.className = 'drag-preview';          // Apply preview styling
    this.dragPreview.style.left = (e.clientX - this.dragOffset.x) + 'px';
    this.dragPreview.style.top = (e.clientY - this.dragOffset.y) + 'px';
    
    document.body.appendChild(this.dragPreview);          // Add to DOM for visual feedback
}
```
**How it works:** Drag start operation sets up visual feedback:
1. **Shape identification** - Extract shape type from the dragged element
2. **Offset calculation** - Remember where within the item the user grabbed
3. **Preview creation** - Clone the palette item for drag visualization
4. **Cursor feedback** - Change cursor to indicate drag operation

#### **Drop and Code Generation**
```javascript
handleDrop(e) {
    const canvasRect = this.canvas.getBoundingClientRect();
    const isOverCanvas = (
        e.clientX >= canvasRect.left &&
        e.clientX <= canvasRect.right &&
        e.clientY >= canvasRect.top &&
        e.clientY <= canvasRect.bottom
    );

    if (isOverCanvas && this.draggedShape) {
        // Convert screen coordinates to canvas coordinates
        const canvasX = e.clientX - canvasRect.left;
        const canvasY = e.clientY - canvasRect.top;
        
        // Convert to world coordinates using renderer's coordinate system
        const worldPos = this.renderer.coordinateSystem.screenToWorld(canvasX, canvasY);
        
        this.createShapeAtPosition(this.draggedShape, worldPos.x, worldPos.y);
    }

    this.cleanupDrag();                                   // Remove preview and reset state
}

createShapeAtPosition(shapeType, x, y) {
    const shapeName = `${shapeType}${this.shapeCounter++}`;  // Generate unique name
    const shapeCode = this.generateShapeCode(shapeType, shapeName, x, y);
    
    // Insert the code into the editor
    this.insertCodeIntoEditor(shapeCode);
    
    // Run the code to create the shape
    if (window.runCode) {
        window.runCode();                                 // Execute AQUI code
    }
}
```
**How it works:** Drop operation creates shapes at the mouse position:
1. **Canvas detection** - Check if drop occurred over the canvas
2. **Coordinate conversion** - Convert mouse position to world coordinates
3. **Code generation** - Create AQUI code for the new shape
4. **Editor integration** - Insert code into the text editor
5. **Execution** - Run the code to immediately create the visual shape

**Coordinate accuracy:** The conversion from screen coordinates to world coordinates ensures shapes appear exactly where the user dropped them, regardless of pan offset or ruler spacing.

#### **AQUI Code Generation**
```javascript
generateShapeCode(type, name, x, y) {
    const defaultParams = this.getDefaultParams(type);     // Get shape-specific defaults
    const position = `[${Math.round(x)}, ${Math.round(y)}]`;  // Round to nearest integer
    
    let params = [`position: ${position}`];
    
    // Add shape-specific parameters
    for (const [key, value] of Object.entries(defaultParams)) {
        if (key !== 'position') {                          // Position already added
            if (typeof value === 'string') {
                params.push(`${key}: "${value}"`);
            } else {
                params.push(`${key}: ${value}`);
            }
        }
    }
    
    // Generate complete AQUI shape definition
    return `shape ${type} ${name} {\n${params.map(p => `  ${p}`).join('\n')}\n}\n\n`;
}
```
**How it works:** Code generation creates complete AQUI shape definitions:
- **Position integration** - Use the exact drop coordinates
- **Default parameters** - Include reasonable defaults for shape type
- **String formatting** - Proper quoting for string values
- **Code formatting** - Indented, readable AQUI syntax

---

## Export Systems

### SVG Export Pipeline (`svgExport.mjs`)

#### **SVG Generation Architecture**
```javascript
export function exportToSVG(interpreter, canvas) {
    try {
        if (!interpreter?.shapes?.size) {
            console.warn('No shapes to export');
            return { success: false, error: 'No shapes found' };
        }

        const canvasDims = calculateCanvasDimensions(interpreter.shapes);  // Determine export bounds
        const svgContent = createSVGDocument(canvasDims);                  // Create SVG wrapper

        let exportedShapes = 0;
        let exportedLayers = 0;

        // Export individual shapes
        interpreter.shapes.forEach((shape, shapeName) => {
            try {
                if (shape._consumedByBoolean) {
                    console.log(`Skipping consumed shape: ${shapeName}`);
                    return;                                // Skip boolean-consumed shapes
                }

                const svgElement = createSVGShapeElement(shape, shapeName, canvasDims);
                if (svgElement) {
                    svgContent.appendChild(svgElement);
                    exportedShapes++;
                }
            } catch (error) {
                console.warn(`Failed to export shape ${shapeName}:`, error.message);
            }
        });

        const svgString = new XMLSerializer().serializeToString(svgContent);
        downloadSVG(svgString, 'aqui_export.svg', canvasDims);

        return { success: true, shapes: exportedShapes, layers: exportedLayers, canvasDims };
        
    } catch (error) {
        console.error('SVG Export failed:', error);
        return { success: false, error: error.message };
    }
}
```
**How it works:** SVG export transforms AQUI shapes into vector graphics:
1. **Bounds calculation** - Determine export area from shape extents
2. **SVG document creation** - Set up proper SVG structure and viewBox
3. **Shape conversion** - Transform each shape into SVG elements
4. **Serialization** - Convert DOM structure to SVG text
5. **Download trigger** - Initiate browser download of the file

**Boolean shape handling:** Shapes consumed by boolean operations are excluded from individual export since they're incorporated into the operation results.

#### **Shape-to-SVG Conversion**
```javascript
function createSVGShapeElement(shape, shapeName, canvasTransform) {
    const convertedParams = convertShapeParamsToSVG(shape.type, shape.params);
    
    try {
        let svgElement;
        const type = shape.type.toLowerCase();
        
        switch (type) {
            case 'circle':
                svgElement = document.createElementNS(SVG_NS, 'circle');
                svgElement.setAttribute('r', convertedParams.radius);
                break;
                
            case 'rectangle':
                svgElement = document.createElementNS(SVG_NS, 'rect');
                svgElement.setAttribute('width', convertedParams.width);
                svgElement.setAttribute('height', convertedParams.height);
                // Center the rectangle
                svgElement.setAttribute('x', -convertedParams.width / 2);
                svgElement.setAttribute('y', -convertedParams.height / 2);
                break;
                
            case 'path':
                svgElement = document.createElementNS(SVG_NS, 'path');
                const pathData = convertPathToSVGPath(shape.params.points);
                svgElement.setAttribute('d', pathData);
                break;
                
            default:
                console.warn(`Unsupported shape type for SVG export: ${type}`);
                return null;
        }
        
        // Apply transforms and styling
        applyRendererTransformToSVG(svgElement, shape.transform, canvasTransform);
        applySVGStyling(svgElement, convertedParams);
        
        return svgElement;
        
    } catch (error) {
        console.error(`Error creating SVG element for ${type}:`, error);
        return null;
    }
}
```
**How it works:** Shape conversion creates appropriate SVG elements:
- **Element creation** - Use proper SVG namespace for elements
- **Parameter conversion** - Transform AQUI parameters to SVG attributes
- **Transform application** - Apply position, rotation, scaling
- **Style application** - Convert fill, stroke, and other visual properties

**Coordinate system mapping:** The conversion accounts for differences between AQUI's Cartesian coordinate system and SVG's screen coordinate system.

### Performance and Optimization

#### **Canvas Optimization Strategies**
```javascript
// High DPI display optimizations
if (window.devicePixelRatio > 1) {
    const scaleFactor = window.devicePixelRatio;
    
    // Scale canvas backing store
    canvas.width = container.clientWidth * scaleFactor;
    canvas.height = container.clientHeight * scaleFactor;
    
    // Scale CSS size back down
    canvas.style.width = container.clientWidth + 'px';
    canvas.style.height = container.clientHeight + 'px';
    
    // Scale drawing context
    ctx.scale(scaleFactor, scaleFactor);
}

// Optimize context for performance
ctx.imageSmoothingEnabled = false;                         // Sharp edges for technical drawings
ctx.textRenderingOptimization = 'optimizeSpeed';          // Fast text rendering
```
**How it works:** Performance optimizations ensure smooth interaction:
- **High DPI support** - Proper handling of retina and high-resolution displays
- **Sharp rendering** - Disable anti-aliasing for crisp technical drawings  
- **Text optimization** - Prioritize speed over quality for interactive use

#### **Rendering Pipeline Optimization**
```javascript
draw() {
    // Use requestAnimationFrame for smooth updates
    if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
    }
    
    this.animationFrameId = requestAnimationFrame(() => {
        this.performDraw();                                // Actual drawing logic
    });
}

performDraw() {
    const startTime = performance.now();
    
    // Early exit optimizations
    if (!this.shapes || this.shapes.size === 0) {
        this.coordinateSystem.clear();
        return;
    }
    
    // Viewport culling - only render visible shapes
    const viewport = this.coordinateSystem.getViewportBounds();
    const visibleShapes = this.filterVisibleShapes(viewport);
    
    // Render only visible shapes
    this.renderShapeSet(visibleShapes);
    
    const frameTime = performance.now() - startTime;
    this.recordPerformance(frameTime);
}
```
**How it works:** Rendering optimizations maintain smooth performance:
- **Animation frame scheduling** - Sync with browser refresh rate
- **Early exit strategies** - Skip expensive operations when possible
- **Viewport culling** - Only render shapes in the visible area
- **Performance monitoring** - Track frame times for optimization

---

## Integration and Extension Points

### Shape Manager Integration

#### **Renderer Registration**
```javascript
// In shapeManager.mjs
registerRenderer(renderer) {
    this.renderer = renderer;
    
    // Connect shape update callbacks
    this.onShapeChange = (change) => {
        if (renderer.updateCodeCallback) {
            renderer.updateCodeCallback(change);          // Sync changes back to code
        }
        renderer.redraw();                                // Update visual display
    };
    
    // Connect selection callbacks
    renderer.onSelectionChange = (shape, shapeName) => {
        this.selectedShape = shape;
        this.selectedShapeName = shapeName;
        this.updateParameterUI();                         // Update parameter panels
    };
}
```
**How it works:** Integration creates bidirectional communication:
- **Change notifications** - Renderer notifies shape manager of modifications
- **Code synchronization** - Visual changes update text editor
- **Selection coordination** - Selection state shared across systems
- **UI updates** - Parameter panels reflect current selection

### Constraint System Integration

#### **Constraint Visualization**
```javascript
// In renderer.mjs
drawOverlays() {
    // Draw constraint markers
    if (this.constraintEngine) {
        this.constraintOverlay.draw(this.ctx, this.coordinateSystem);
    }
    
    // Draw debug information
    if (this.debugMode) {
        this.debugVisualizer.drawAllOverlays();
    }
    
    // Custom overlay drawers
    this._overlayDrawers.forEach(drawer => {
        try {
            drawer(this.ctx, this.coordinateSystem);      // Call custom overlay function
        } catch (error) {
            console.warn('Overlay drawer error:', error);
        }
    });
}

// Method for adding custom overlays
addOverlayDrawer(drawFunction) {
    this._overlayDrawers.push(drawFunction);
}

removeOverlayDrawer(drawFunction) {
    const index = this._overlayDrawers.indexOf(drawFunction);
    if (index >= 0) {
        this._overlayDrawers.splice(index, 1);
    }
}
```
**How it works:** Overlay system enables modular additions:
- **Constraint markers** - Visual indicators of geometric relationships
- **Debug information** - Performance and diagnostic overlays
- **Custom extensions** - Third-party systems can add visual elements
- **Error isolation** - Individual overlay failures don't crash rendering

### Extension Patterns

#### **Adding New Visual Components**
```javascript
// Example: Adding a measurement overlay
class MeasurementOverlay {
    constructor(renderer) {
        this.renderer = renderer;
        this.measurements = [];
        
        // Register with renderer
        this.drawFunction = this.draw.bind(this);
        renderer.addOverlayDrawer(this.drawFunction);
    }
    
    draw(ctx, coordinateSystem) {
        ctx.save();
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 1;
        ctx.font = '12px Arial';
        
        for (const measurement of this.measurements) {
            this.drawMeasurementLine(ctx, coordinateSystem, measurement);
        }
        
        ctx.restore();
    }
    
    addMeasurement(startPoint, endPoint) {
        const distance = Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) + 
            Math.pow(endPoint.y - startPoint.y, 2)
        );
        
        this.measurements.push({
            start: startPoint,
            end: endPoint,
            distance: distance,
            label: `${distance.toFixed(1)}mm`
        });
        
        this.renderer.redraw();
    }
}
```
**How it works:** Extensions follow consistent patterns:
1. **Constructor registration** - Register drawing function with renderer
2. **Consistent interface** - Use standard draw(ctx, coordinateSystem) signature
3. **State management** - Maintain component-specific data structures
4. **Redraw triggering** - Request updates when state changes

This comprehensive renderer system provides the foundation for AQUI's interactive parametric design environment, combining mathematical precision with intuitive visual feedback and professional-quality output capabilities.
