# AQUI Shape System Documentation

## Architecture Overview

AQUI's shape system separates concerns into two distinct layers:
1. **Shape Definitions** (`Shapes.mjs`) - Pure mathematical geometry and transformations
2. **Shape Rendering** (`shapeRenderer.mjs`) - Visual representation and canvas interaction

**Why this separation?** The mathematical shapes are independent of how they're displayed. A circle is mathematically defined by a center and radius, regardless of whether it's drawn on canvas, exported to SVG, or used in collision detection. This separation allows the same shape to be rendered differently or exported to multiple formats.

---

## Shapes.mjs - Core Shape System

### Base Shape Class

#### **Shape Class Structure**
```javascript
class Shape {
    constructor() {
        this.position = [0, 0];      // [x, y] world coordinates
        this.rotation = 0;           // Degrees, clockwise
        this.scale = [1, 1];         // [scaleX, scaleY] multiplicative factors
        this.fill = false;           // Whether shape interior is filled
        this.fillColor = '#808080';  // Default gray fill
        this.stroke = true;          // Whether shape outline is drawn
        this.strokeColor = '#000000'; // Default black outline
        this.strokeWidth = 1;        // Line thickness in world units
    }
}
```
**How it works:** This is the foundation class that all shapes inherit from. It defines the common transform and visual properties that every shape needs. The default values ensure shapes are visible even if no properties are specified. Position uses an array `[x, y]` rather than separate properties to match AQUI's array syntax: `position: [100, 50]`.

**Why these defaults?** 
- `fill: false, stroke: true` - Shapes start as outlines, which is clearer for beginners
- `position: [0, 0]` - Origin is the natural starting point
- `scale: [1, 1]` - No scaling by default (identity transform)

#### **Abstract Methods**
```javascript
// Abstract methods - must be implemented by subclasses
getPoints() {
    throw new Error('getPoints() must be implemented by subclass');
}

getBoundingBox() {
    throw new Error('getBoundingBox() must be implemented by subclass');
}
```
**How it works:** These are abstract methods - the base class declares them but doesn't implement them. Each shape subclass must provide its own implementation. This enforces a consistent interface: every shape can provide its points and bounding box, but the calculation is shape-specific.

**Why abstract methods?** JavaScript doesn't have native abstract classes, so we simulate them by throwing errors. This catches programming mistakes early - if someone forgets to implement `getPoints()`, they'll get a clear error message rather than undefined behavior.

#### **Transform System**
```javascript
transformPoint(point) {
    const [px, py] = [point.x, point.y];        // Extract coordinates
    const [sx, sy] = this.scale;                // Extract scale factors
    const cos = Math.cos(this.rotation * Math.PI / 180);  // Convert degrees to radians
    const sin = Math.sin(this.rotation * Math.PI / 180);
    
    // Apply transforms in order: Scale → Rotate → Translate
    // Scale first (around origin)
    let x = px * sx;
    let y = py * sy;
    
    // Rotate around origin using rotation matrix
    const rotX = x * cos - y * sin;      // 2D rotation matrix multiplication
    const rotY = x * sin + y * cos;      // [cos -sin] [x]  = [x*cos - y*sin]
                                         // [sin  cos] [y]    [x*sin + y*cos]
    
    // Translate to final position
    return {
        x: rotX + this.position[0],
        y: rotY + this.position[1]
    };
}
```
**How it works:** This is the core of AQUI's transformation system. It applies transformations in the standard order: Scale → Rotate → Translate (SRT). Each shape defines its geometry around the origin `(0,0)`, then this method transforms those points to their final world positions.

**Why this order?** SRT is the standard in computer graphics because it's intuitive:
1. **Scale** first - resize the shape around its center
2. **Rotate** second - spin the scaled shape around its center  
3. **Translate** last - move the scaled, rotated shape to its final position

If we did translate first, rotation would spin the shape around the origin instead of around its center, which is rarely what users want.

### Basic Shape Implementations

#### **Rectangle Class**
```javascript
class Rectangle extends Shape {
    constructor(width, height) {
        super();                    // Call parent constructor for common properties
        this.width = width;         // Store dimensions as shape-specific properties
        this.height = height;
    }
    
    getPoints() {
        // Define rectangle centered at origin
        const hw = this.width / 2;   // Half-width for centering
        const hh = this.height / 2;  // Half-height for centering
        
        // Define corners in counter-clockwise order (standard for 2D graphics)
        const points = [
            { x: -hw, y: -hh },  // Top-left
            { x:  hw, y: -hh },  // Top-right  
            { x:  hw, y:  hh },  // Bottom-right
            { x: -hw, y:  hh }   // Bottom-left
        ];
        
        // Transform each point from local space to world space
        return points.map(p => this.transformPoint(p));
    }
}
```
**How it works:** Rectangle geometry is simple - four corners forming a rectangle. We define it centered at origin (negative and positive coordinates) so rotation and scaling work intuitively around the center. The `map()` call transforms each local coordinate to world space.

**Why counter-clockwise?** This is the standard winding order in 2D graphics. It affects how filled polygons are rendered and how boolean operations work. Counter-clockwise = "outside is on the right as you walk the perimeter."

#### **getBoundingBox Implementation**
```javascript
getBoundingBox() {
    const points = this.getPoints();           // Get transformed corner points
    const xs = points.map(p => p.x);           // Extract all X coordinates
    const ys = points.map(p => p.y);           // Extract all Y coordinates
    
    return {
        minX: Math.min(...xs),  // Leftmost point
        maxX: Math.max(...xs),  // Rightmost point
        minY: Math.min(...ys),  // Topmost point  
        maxY: Math.max(...ys)   // Bottommost point
    };
}
```
**How it works:** A bounding box is the smallest rectangle that contains the entire shape. For any polygon, we can find it by getting the minimum and maximum X and Y coordinates of all vertices. The spread operator `...` passes all array elements as individual arguments to `Math.min/max`.

**Why bounding boxes?** They're used for collision detection, viewport culling (don't render shapes outside the visible area), and UI interactions (mouse hit testing). They're much cheaper to calculate and test than exact shape geometry.

#### **Circle Class**
```javascript
class Circle extends Shape {
    constructor(radius) {
        super();
        this.radius = radius;
    }
    
    getPoints(resolution = 32) {         // Default 32 points for smooth curves
        const points = [];
        
        // Generate points around the circumference
        for (let i = 0; i < resolution; i++) {
            const angle = (i / resolution) * Math.PI * 2;    // 0 to 2π radians
            points.push({
                x: Math.cos(angle) * this.radius,            // Parametric circle: x = r*cos(θ)
                y: Math.sin(angle) * this.radius             // y = r*sin(θ)
            });
        }
        
        return points.map(p => this.transformPoint(p));
    }
}
```
**How it works:** Circles are approximated as regular polygons with many sides. We use parametric equations: `x = r*cos(θ), y = r*sin(θ)` to generate points evenly spaced around the circumference. Higher resolution = smoother curves but more computation.

**Why parametric generation?** It's mathematically precise and produces evenly-spaced points. The alternative (drawing with canvas arcs) would lock us into canvas-specific rendering, but this approach works for any output format.

#### **Circle Bounding Box Optimization**
```javascript
getBoundingBox() {
    const [cx, cy] = this.position;                    // Circle center
    const r = this.radius * Math.max(this.scale[0], this.scale[1]);  // Effective radius after scaling
    
    return {
        minX: cx - r,    // Left edge
        maxX: cx + r,    // Right edge  
        minY: cy - r,    // Top edge
        maxY: cy + r     // Bottom edge
    };
}
```
**How it works:** For circles, we can calculate the bounding box directly without generating all the points. This is much more efficient. We use the larger of the two scale factors because non-uniform scaling turns a circle into an ellipse, and we want the bounding box of the ellipse.

**Why this optimization?** Generating 32+ points and finding their min/max is expensive. Since circles have mathematical properties we can exploit, this direct calculation is orders of magnitude faster.

### Complex Shape Implementations

#### **Star Class**
```javascript
class Star extends Shape {
    constructor(outerRadius, innerRadius, points) {
        super();
        this.outerRadius = outerRadius;    // Distance to star points
        this.innerRadius = innerRadius;    // Distance to star valleys
        this.points = points;              // Number of points (5 for typical star)
    }
    
    getPoints() {
        const points = [];
        const angleStep = Math.PI / this.points;  // Angle between each point/valley
        
        // Alternate between outer points (tips) and inner points (valleys)
        for (let i = 0; i < this.points * 2; i++) {
            const angle = i * angleStep;
            const radius = i % 2 === 0 ? this.outerRadius : this.innerRadius;
            
            points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        
        return points.map(p => this.transformPoint(p));
    }
}
```
**How it works:** Stars alternate between outer points (tips) and inner points (valleys). We generate `points * 2` vertices, alternating the radius. The angle between each vertex is `π/points` radians (180°/points). The modulo operator `i % 2` determines if we're on an even (tip) or odd (valley) vertex.

**Why alternating radii?** This creates the classic star shape. If all points were the same radius, we'd get a regular polygon. The inner radius creates the "valleys" between the star tips.

#### **Gear Class** (Complex Mathematical Shape)
```javascript
class Gear extends Shape {
    constructor(pitchDiameter, teeth, pressureAngle = 20) {
        super();
        this.pitchDiameter = pitchDiameter;    // Fundamental gear dimension
        this.teeth = teeth;                    // Number of teeth
        this.pressureAngle = pressureAngle;    // Tooth profile angle (typically 20°)
        
        // Calculate derived gear parameters using standard formulas
        this.module = pitchDiameter / teeth;                              // Size per tooth
        this.addendum = this.module;                                      // Tooth height above pitch circle
        this.dedendum = 1.25 * this.module;                              // Tooth depth below pitch circle
        this.baseRadius = (pitchDiameter / 2) * Math.cos(pressureAngle * Math.PI / 180);  // Involute base circle
    }
}
```
**How it works:** Gears require precise mathematical calculations based on mechanical engineering standards. The constructor computes derived parameters from the basic inputs. These formulas ensure gears will mesh properly with other gears.

**Why these specific formulas?** These are standardized gear calculations from mechanical engineering. The module determines tooth size, addendum/dedendum define the tooth profile, and the base radius is used for involute curve generation (the mathematically optimal gear tooth shape).

#### **Gear Point Generation**
```javascript
getPoints(resolution = 4) {                    // Fewer points per tooth for performance
    const points = [];
    const toothAngle = (2 * Math.PI) / this.teeth;     // Angular space per tooth
    const pointsPerTooth = resolution;
    
    for (let t = 0; t < this.teeth; t++) {
        const baseAngle = t * toothAngle;
        
        // Generate involute curve for each tooth
        for (let p = 0; p < pointsPerTooth; p++) {
            const angle = baseAngle + (p / pointsPerTooth) * toothAngle;
            const radius = this.calculateInvoluteRadius(angle);
            
            points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
    }
    
    return points.map(p => this.transformPoint(p));
}

calculateInvoluteRadius(angle) {
    // Simplified gear tooth profile - real implementation would use involute curves
    // For educational purposes, we approximate with a simple radius variation
    const toothAngle = (2 * Math.PI) / this.teeth;
    const localAngle = angle % toothAngle;           // Position within current tooth
    const toothCenter = toothAngle / 2;              // Center of tooth
    const distFromCenter = Math.abs(localAngle - toothCenter);
    
    // Simple tooth profile: smaller radius at tooth center, larger at edges
    const toothDepth = this.addendum;
    const radiusVariation = toothDepth * (1 - distFromCenter / toothCenter);
    
    return (this.pitchDiameter / 2) + radiusVariation;
}
```
**How it works:** Gear teeth are generated by varying the radius as we move around the circumference. Real gears use involute curves, but for educational purposes, we approximate with a simpler profile that's easier to understand. Each tooth gets `resolution` points to define its shape.

**Why simplified profiles?** True involute gear geometry is mathematically complex. For an educational tool, the key insight is that gear teeth have varying radii. Students can understand the concept without the full mathematical complexity.

### Fabrication Joint Shapes

#### **DovetailPin Class**
```javascript
class DovetailPin extends Shape {
    constructor(width, jointCount, depth, angle, thickness) {
        super();
        this.width = width;           // Total width of the joint
        this.jointCount = jointCount; // Number of dovetail pins (odd numbers typical)
        this.depth = depth;           // How far pins extend outward
        this.angle = angle;           // Dovetail angle in degrees (7-15° typical)
        this.thickness = thickness;   // Board thickness
    }
    
    getPoints() {
        const points = [];
        const pinWidth = this.width / this.jointCount;        // Width per pin/socket pair
        const taper = Math.tan(this.angle * Math.PI / 180) * this.depth;  // Taper distance from angle
        
        const startX = -this.width / 2;    // Left edge of joint
        const startY = -this.thickness / 2; // Bottom of board
        
        // Generate board outline first
        points.push({ x: startX, y: startY });
        points.push({ x: startX + this.width, y: startY });
        points.push({ x: startX + this.width, y: startY + this.thickness });
        points.push({ x: startX, y: startY + this.thickness });
        
        // Add dovetail pins extending outward
        for (let i = 0; i < this.jointCount; i++) {
            if (i % 2 === 0) { // Only create pins on even indices (odd indices are sockets)
                const left = startX + i * pinWidth;
                const right = left + pinWidth;
                
                // Dovetail profile with taper (wider at the base)
                points.push({ x: left, y: startY + this.thickness });
                points.push({ x: left - taper, y: startY + this.thickness + this.depth });
                points.push({ x: right + taper, y: startY + this.thickness + this.depth });
                points.push({ x: right, y: startY + this.thickness });
            }
        }
        
        return points.map(p => this.transformPoint(p));
    }
}
```
**How it works:** Dovetails are trapezoidal joints that prevent pieces from pulling apart. The pins taper outward (`taper` calculation), making them wider at the end than at the base. This geometry creates mechanical locking. We alternate between pins (even indices) and gaps (odd indices).

**Why the taper calculation?** `tan(angle) * depth` gives us how much wider the pin becomes over the specified depth. This is basic trigonometry - the angle and depth define the taper width. The taper prevents the joint from pulling apart under load.

#### **FingerJointPin Class**
```javascript
class FingerJointPin extends Shape {
    constructor(width, fingerCount, fingerWidth, depth, thickness) {
        super();
        this.width = width;
        this.fingerCount = fingerCount;
        this.fingerWidth = fingerWidth || width / fingerCount;  // Auto-calculate if not specified
        this.depth = depth;             // How far fingers extend
        this.thickness = thickness;     // Board thickness
    }
    
    getPoints() {
        const points = [];
        const fingerWidth = this.fingerWidth;
        const startX = -this.width / 2;
        const startY = -this.thickness / 2;
        
        // Main board outline
        points.push({ x: startX, y: startY });
        points.push({ x: startX + this.width, y: startY });
        points.push({ x: startX + this.width, y: startY + this.thickness });
        
        // Generate finger pattern from right to left
        for (let i = 0; i < this.fingerCount; i++) {
            const fingerLeft = startX + this.width - (i + 1) * fingerWidth;
            const fingerRight = fingerLeft + fingerWidth;
            
            if (i % 2 === 0) { // Extended finger
                points.push({ x: fingerRight, y: startY + this.thickness });
                points.push({ x: fingerRight, y: startY + this.thickness + this.depth });
                points.push({ x: fingerLeft, y: startY + this.thickness + this.depth });
                points.push({ x: fingerLeft, y: startY + this.thickness });
            } else { // Gap (no extension)
                points.push({ x: fingerRight, y: startY + this.thickness });
                // No vertical extension - stays at board level
            }
        }
        
        points.push({ x: startX, y: startY + this.thickness });
        
        return points.map(p => this.transformPoint(p));
    }
}
```
**How it works:** Finger joints alternate between extending fingers and gaps. Unlike dovetails, fingers are rectangular (no taper). We generate the base board outline, then add rectangular extensions for the fingers. The alternating pattern (even = finger, odd = gap) ensures proper interlocking with the matching socket piece.

**Why rectangular fingers?** Finger joints rely on glue for strength rather than mechanical locking. The rectangular shape is easier to cut and provides good glue surface area. The tight tolerances provide the mechanical connection.

### Adding New Shape Types

#### **1. Create Shape Class**
```javascript
class MyNewShape extends Shape {
    constructor(param1, param2, param3) {
        super();                    // Always call parent constructor first
        // Validate parameters if needed
        if (param1 <= 0) {
            throw new Error('param1 must be positive');
        }
        
        this.param1 = param1;       // Store shape-specific parameters
        this.param2 = param2;
        this.param3 = param3;
    }
    
    getPoints() {
        const points = [];
        
        // Implement your shape's geometry here
        // Example: Generate points based on parameters
        for (let i = 0; i < this.param3; i++) {
            const angle = (i / this.param3) * Math.PI * 2;
            const radius = this.param1 + this.param2 * Math.sin(angle * 3);
            
            points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        
        return points.map(p => this.transformPoint(p));
    }
    
    getBoundingBox() {
        // Option 1: Use the generic method (slower but always correct)
        const points = this.getPoints();
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys)
        };
        
        // Option 2: If you can calculate bounds directly (faster)
        // const maxRadius = this.param1 + this.param2;  // Example calculation
        // const [cx, cy] = this.position;
        // return {
        //     minX: cx - maxRadius,
        //     maxX: cx + maxRadius,
        //     minY: cy - maxRadius,
        //     maxY: cy + maxRadius
        // };
    }
}
```
**How it works:** New shapes follow the same pattern: constructor stores parameters, `getPoints()` generates geometry, `getBoundingBox()` calculates bounds. Always call `super()` to initialize common properties. Parameter validation catches errors early.

**Design considerations:**
- **Parameter validation** - Catch invalid inputs early with meaningful errors
- **Geometry generation** - Use mathematical formulas appropriate to your shape
- **Bounding box optimization** - Use direct calculation if possible, fallback to point-based calculation
- **Transform integration** - Always call `this.transformPoint()` on generated points

#### **2. Export Shape Class**
```javascript
// At bottom of Shapes.mjs
export {
    Shape,
    Rectangle,
    Circle,
    // ... existing exports
    MyNewShape  // Add new shape to exports
};
```
**How it works:** ES6 modules require explicit exports. Without this, other files can't import your new shape class. The export makes it available to the interpreter and shape factory.

---

## shapeRenderer.mjs - Rendering System

### Core Renderer Architecture

#### **ShapeRenderer Class**
```javascript
class ShapeRenderer {
    constructor(canvas) {
        this.canvas = canvas;                                    // HTML5 Canvas element
        this.ctx = canvas.getContext('2d');                     // 2D rendering context
        this.shapes = new Map();                                // Shape name → Shape instance
        this.coordinateSystem = new CoordinateSystem(canvas);   // Handles world-to-screen transforms
        this.isDirty = true;                                    // Needs redraw flag
    }
    
    render() {
        if (!this.isDirty) return;  // Skip if nothing changed (performance optimization)
        
        this.clear();                // Erase previous frame
        
        for (const [name, shape] of this.shapes) {
            this.renderShape(shape, name);
        }
        
        this.isDirty = false;        // Mark as clean
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
```
**How it works:** The renderer manages the visual display of shapes. It maintains a collection of shapes and draws them to the canvas. The `isDirty` flag implements a common optimization - we only redraw when something has changed, saving CPU time.

**Why a Map for shapes?** Maps preserve insertion order and provide O(1) lookup by name. This allows shapes to be rendered in the order they were created (important for layering) while still allowing fast access by name for updates.

#### **Shape Rendering Pipeline**
```javascript
renderShape(shape, shapeName) {
    // Step 1: Get shape geometry in world coordinates
    const points = shape.getPoints();
    
    if (points.length === 0) return;  // Skip empty shapes
    
    // Step 2: Transform world coordinates to screen coordinates
    const screenPoints = points.map(p => 
        this.coordinateSystem.worldToScreen(p)
    );
    
    // Step 3: Set up canvas drawing style
    this.setupShapeStyle(shape);
    
    // Step 4: Draw the shape path
    this.drawPath(screenPoints, shape.closed !== false);  // Default to closed
    
    // Step 5: Apply fill and stroke
    this.applyShapeStyle(shape);
}
```
**How it works:** This is the core rendering pipeline. Each step has a specific responsibility:
1. **Get geometry** - Shape provides points in world coordinates
2. **Transform coordinates** - Convert from world space to screen pixels
3. **Setup style** - Configure colors, line width, etc.
4. **Draw path** - Create the shape outline on canvas
5. **Apply style** - Fill and/or stroke the path

**Why this pipeline?** Separating concerns makes the code maintainable and allows optimizations. For example, coordinate transformation could be batched, or style setup could be cached.

### Coordinate System Management

#### **CoordinateSystem Class**
```javascript
class CoordinateSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.zoom = 1;                                          // Scale factor (1 = normal, 2 = 2x zoom)
        this.panOffset = { x: 0, y: 0 };                       // Camera offset in world units
        this.origin = { x: canvas.width / 2, y: canvas.height / 2 };  // Screen center
    }
    
    worldToScreen(worldPoint) {
        return {
            // Apply pan, then zoom, then translate to screen center
            x: (worldPoint.x + this.panOffset.x) * this.zoom + this.origin.x,
            y: (worldPoint.y + this.panOffset.y) * this.zoom + this.origin.y
        };
    }
    
    screenToWorld(screenPoint) {
        return {
            // Reverse the worldToScreen calculation
            x: (screenPoint.x - this.origin.x) / this.zoom - this.panOffset.x,
            y: (screenPoint.y - this.origin.y) / this.zoom - this.panOffset.y
        };
    }
}
```
**How it works:** This class handles the mapping between world coordinates (where shapes are defined) and screen coordinates (canvas pixels). World coordinates are centered at (0,0) with y-up (mathematical convention), while screen coordinates have (0,0) at top-left with y-down.

**Transform order:** Pan → Zoom → Screen offset. This means:
- Pan moves the camera in world space
- Zoom scales everything around the current view center
- Screen offset centers the view on the canvas

**Why separate coordinate systems?** Shapes think in world units (meters, inches, etc.) while the canvas thinks in pixels. This separation allows zooming and panning without modifying every shape, and makes the math cleaner.

### Drawing Methods

#### **Path Drawing**
```javascript
drawPath(points, closed = true) {
    if (points.length === 0) return;
    
    this.ctx.beginPath();                    // Start new path
    this.ctx.moveTo(points[0].x, points[0].y);  // Move to first point (don't draw)
    
    // Draw lines to each subsequent point
    for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
    }
    
    if (closed) {
        this.ctx.closePath();  // Automatically connect last point to first
    }
    
    // Note: Path is defined but not yet drawn - call fill() or stroke() to draw
}
```
**How it works:** Canvas drawing uses a "path" metaphor - you define a series of line segments, then fill or stroke the path. `beginPath()` starts fresh, `moveTo()` positions without drawing, `lineTo()` adds line segments. `closePath()` automatically connects the end back to the start.

**Why not draw each line immediately?** The path-based approach is more efficient and enables advanced features like dashed lines, gradient fills, and boolean operations on paths.

#### **Style Application**
```javascript
setupShapeStyle(shape) {
    // Configure fill properties
    if (shape.fill) {
        this.ctx.fillStyle = this.parseColor(shape.fillColor);
    }
    
    // Configure stroke properties  
    if (shape.stroke) {
        this.ctx.strokeStyle = this.parseColor(shape.strokeColor);
        this.ctx.lineWidth = shape.strokeWidth || 1;
        this.ctx.lineCap = 'round';      // Rounded line endings
        this.ctx.lineJoin = 'round';     // Rounded corners
    }
}

applyShapeStyle(shape) {
    // Apply styles to the current path
    if (shape.fill) {
        this.ctx.fill();    // Fill the enclosed area
    }
    
    if (shape.stroke) {
        this.ctx.stroke();  // Draw the outline
    }
}
```
**How it works:** Canvas styling works in two phases: setup (configure) and apply (draw). Setup configures the drawing context with colors and line properties. Apply actually draws using those settings. We can fill and/or stroke the same path.

**Why separate setup and apply?** This allows sharing style setup between similar shapes, and ensures the path is only calculated once even if we're both filling and stroking it.

#### **Color Parsing**
```javascript
parseColor(colorValue) {
    // Handle named colors
    const namedColors = {
        'red': '#FF0000',
        'blue': '#0000FF', 
        'green': '#00FF00',
        'black': '#000000',
        'white': '#FFFFFF',
        'gray': '#808080',
        'yellow': '#FFFF00',
        'cyan': '#00FFFF',
        'magenta': '#FF00FF'
    };
    
    // Check named colors first (case-insensitive)
    const lowerColor = colorValue.toString().toLowerCase();
    if (namedColors[lowerColor]) {
        return namedColors[lowerColor];
    }
    
    // Handle hex colors (#FF0000, #F00)
    if (colorValue.toString().startsWith('#')) {
        return colorValue.toString();
    }
    
    // Handle CSS color functions (rgb(255,0,0), etc.)
    if (colorValue.toString().includes('(')) {
        return colorValue.toString();
    }
    
    // Default fallback
    return '#808080';  // Gray
}
```
**How it works:** AQUI supports multiple color formats for user convenience. We check named colors first (most user-friendly), then hex codes (most precise), then CSS functions (most flexible). The fallback ensures we always return a valid color.

**Why this priority order?** Named colors are easiest for beginners ("red" vs "#FF0000"). Hex codes are unambiguous. CSS functions provide advanced features like transparency. The fallback prevents errors from breaking the entire render.

### Shape-Specific Rendering

#### **Circle Rendering Optimization**
```javascript
renderCircle(shape) {
    // Transform center point to screen coordinates
    const center = this.coordinateSystem.worldToScreen({
        x: shape.position[0],
        y: shape.position[1]
    });
    
    // Calculate screen radius (affected by zoom and scaling)
    const worldRadius = shape.radius * Math.max(shape.scale[0], shape.scale[1]);
    const screenRadius = worldRadius * this.coordinateSystem.zoom;
    
    // Use native canvas arc drawing (much faster than polygon approximation)
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, screenRadius, 0, Math.PI * 2);
    
    this.setupShapeStyle(shape);
    this.applyShapeStyle(shape);
}
```
**How it works:** For circles, we can bypass the generic polygon rendering and use the canvas's native arc method. This is much faster and produces perfect circles at any zoom level. We calculate the effective radius considering both shape scaling and camera zoom.

**Why this optimization?** Drawing 32-point polygons for every circle is expensive. Native arc drawing is hardware-accelerated and mathematically precise. The trade-off is shape-specific code, but the performance gain is substantial.

#### **Text Rendering**
```javascript
renderText(shape) {
    const position = this.coordinateSystem.worldToScreen({
        x: shape.position[0],
        y: shape.position[1]
    });
    
    // Configure text properties
    const fontSize = (shape.fontSize || 16) * this.coordinateSystem.zoom;  // Scale with zoom
    this.ctx.font = `${fontSize}px ${shape.fontFamily || 'Arial'}`;
    this.ctx.textAlign = shape.textAlign || 'center';
    this.ctx.textBaseline = 'middle';
    
    // Apply text styling and draw
    if (shape.fill) {
        this.ctx.fillStyle = this.parseColor(shape.fillColor);
        this.ctx.fillText(shape.text, position.x, position.y);
    }
    
    if (shape.stroke) {
        this.ctx.strokeStyle = this.parseColor(shape.strokeColor);
        this.ctx.lineWidth = shape.strokeWidth || 1;
        this.ctx.strokeText(shape.text, position.x, position.y);
    }
}
```
**How it works:** Text rendering requires different canvas methods (`fillText`, `strokeText`) than shape rendering. We scale the font size with zoom level so text remains readable. Text alignment and baseline ensure consistent positioning.

**Why scale font size with zoom?** Without scaling, text would become unreadably small when zoomed out, or take up the entire screen when zoomed in. Scaling maintains the relationship between text and shapes.

### Shape Factory Integration

#### **Creating Shapes from Parameters**
```javascript
createShapeFromParams(type, params) {
    const lowerType = type.toLowerCase();
    
    try {
        switch (lowerType) {
            case 'circle':
                return new Circle(params.radius || 50);
                
            case 'rectangle':
                return new Rectangle(
                    params.width || 100,
                    params.height || 100
                );
                
            case 'star':
                return new Star(
                    params.outerRadius || 50,
                    params.innerRadius || 25,
                    params.points || 5
                );
                
            case 'dovetailpin':
                return new DovetailPin(
                    params.width || 100,
                    params.jointCount || 3,
                    params.depth || 20,
                    params.angle || 12,
                    params.thickness || 15
                );
                
            default:
                console.warn(`Unknown shape type: ${type}, using default rectangle`);
                return new Rectangle(50, 50); // Safe fallback
        }
    } catch (error) {
        console.error(`Error creating shape ${type}:`, error);
        return new Rectangle(50, 50); // Error recovery
    }
}
```
**How it works:** This factory method creates shape instances from the parameters parsed by the interpreter. It provides sensible defaults for missing parameters and handles unknown shape types gracefully. The try-catch provides error recovery.

**Why defaults for every parameter?** Users often specify only the parameters they want to change. Defaults ensure shapes can be created even with minimal input. For example, `shape circle myCircle {}` creates a valid circle with radius 50.

**Error handling strategy:** Unknown shapes become rectangles (visible but obviously wrong), parameter errors are logged but don't crash the program. This "fail gracefully" approach keeps the educational tool usable even with buggy code.

### Performance Optimizations

#### **Viewport Culling**
```javascript
isShapeInViewport(shape) {
    const bounds = shape.getBoundingBox();
    const viewport = this.getViewportBounds();
    
    // Check if bounding boxes overlap
    return !(bounds.maxX < viewport.minX ||   // Shape is completely left of viewport
             bounds.minX > viewport.maxX ||   // Shape is completely right of viewport
             bounds.maxY < viewport.minY ||   // Shape is completely above viewport
             bounds.minY > viewport.maxY);    // Shape is completely below viewport
}

getViewportBounds() {
    // Calculate world coordinates of screen corners
    const topLeft = this.coordinateSystem.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.coordinateSystem.screenToWorld({ 
        x: this.canvas.width, 
        y: this.canvas.height 
    });
    
    return {
        minX: topLeft.x,
        maxX: bottomRight.x,
        minY: topLeft.y,        // Remember: world coordinates have y-up
        maxY: bottomRight.y
    };
}

render() {
    this.clear();
    
    for (const [name, shape] of this.shapes) {
        if (this.isShapeInViewport(shape)) {  // Only render visible shapes
            this.renderShape(shape, name);
        }
    }
}
```
**How it works:** Viewport culling skips rendering shapes that are completely outside the visible area. We use bounding box intersection tests, which are much faster than checking every point. The logic uses De Morgan's law: "shapes overlap" = NOT "shapes don't overlap".

**Why this optimization?** Rendering invisible shapes wastes CPU time. In complex designs with hundreds of shapes, most may be outside the viewport. This optimization can improve performance by 10x or more.

#### **Resolution Scaling**
```javascript
getShapeResolution(shapeType) {
    const curved = ['circle', 'ellipse', 'arc', 'spiral', 'gear'];
    const baseResolution = curved.includes(shapeType) ? 32 : 4;
    
    // Adjust based on zoom level - more detail when zoomed in
    const zoomFactor = Math.max(0.25, Math.min(2, this.coordinateSystem.zoom));
    const scaledResolution = Math.round(baseResolution * zoomFactor);
    
    // Clamp to reasonable range
    return Math.max(8, Math.min(64, scaledResolution));
}
```
**How it works:** This adjusts the number of points used to approximate curved shapes based on zoom level. When zoomed out, fewer points are sufficient (and faster). When zoomed in, more points are needed for smooth curves.

**Why adaptive resolution?** Fixed resolution wastes computation when zoomed out (invisible detail) and looks jagged when zoomed in (visible polygonal edges). Adaptive resolution balances quality and performance automatically.

### Adding New Rendering Features

#### **1. Shape-Specific Renderer**
```javascript
renderShape(shape, shapeName) {
    // Check for specialized renderer method
    const rendererMethod = `render${shape.constructor.name}`;
    if (typeof this[rendererMethod] === 'function') {
        this[rendererMethod](shape, shapeName);
        return;
    }
    
    // Fall back to generic path rendering
    this.renderGenericShape(shape, shapeName);
}

// Example specialized renderer
renderGear(shape, shapeName) {
    // Custom gear rendering with teeth highlighting, center hole, etc.
    const center = this.coordinateSystem.worldToScreen({
        x: shape.position[0],
        y: shape.position[1]
    });
    
    // Render gear body
    this.renderGenericShape(shape, shapeName);
    
    // Add center hole
    const holeRadius = (shape.pitchDiameter * 0.2) * this.coordinateSystem.zoom;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, holeRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'white';
    this.ctx.fill();
    this.ctx.strokeStyle = 'black';
    this.ctx.stroke();
}
```
**How it works:** The renderer checks if a specialized method exists for each shape type. If found, it uses that; otherwise, it falls back to generic rendering. This allows shapes to have custom rendering behavior while maintaining backward compatibility.

**When to add specialized renderers?** When generic polygon rendering isn't sufficient - for example, gears might need center holes, text needs different drawing methods, or complex shapes need performance optimizations.

#### **2. Style Extensions**
```javascript
setupAdvancedStyle(shape) {
    // Gradient support
    if (shape.fillGradient) {
        const gradient = this.createGradient(shape.fillGradient);
        this.ctx.fillStyle = gradient;
    }
    
    // Shadow support
    if (shape.shadow) {
        this.ctx.shadowColor = shape.shadow.color || 'black';
        this.ctx.shadowBlur = shape.shadow.blur || 0;
        this.ctx.shadowOffsetX = shape.shadow.offsetX || 0;
        this.ctx.shadowOffsetY = shape.shadow.offsetY || 0;
    }
    
    // Pattern support
    if (shape.fillPattern && this.patterns[shape.fillPattern]) {
        this.ctx.fillStyle = this.patterns[shape.fillPattern];
    }
}

createGradient(gradientSpec) {
    // Create linear gradient from specification
    const gradient = this.ctx.createLinearGradient(
        gradientSpec.x1, gradientSpec.y1,
        gradientSpec.x2, gradientSpec.y2
    );
    
    // Add color stops
    for (const stop of gradientSpec.stops) {
        gradient.addColorStop(stop.position, stop.color);
    }
    
    return gradient;
}
```
**How it works:** Advanced styling extends the basic fill/stroke system with gradients, shadows, and patterns. These features use canvas's advanced drawing capabilities. The gradient creation shows how to build complex canvas objects from simple specifications.

**Design pattern:** Keep the API simple (`shape.shadow = { color: 'red', blur: 5 }`) but translate to the more complex canvas API internally. This hides complexity from users while providing advanced features.

---

## Integration Points

### **Interpreter → Shapes**
```javascript
// In interpreter.mjs
createShape(type, params) {
    // Use factory to create shape instance
    const shape = this.shapeFactory.createShape(type, params);
    
    // Apply properties from AST nodes
    if (params.position) shape.position = this.evaluateExpression(params.position);
    if (params.rotation) shape.rotation = this.evaluateExpression(params.rotation);
    if (params.scale) shape.scale = this.evaluateExpression(params.scale);
    if (params.fill !== undefined) shape.fill = this.evaluateExpression(params.fill);
    if (params.fillColor) shape.fillColor = this.evaluateExpression(params.fillColor);
    
    return shape;
}
```
**How it works:** The interpreter acts as a bridge between the parsed AST and the shape system. It creates shape instances using the factory, then applies all properties specified in the code. Expression evaluation handles cases like `position: [param.x, param.y]`.

**Why through a factory?** The factory centralizes shape creation logic and provides error handling. The interpreter doesn't need to know about every shape type - it just passes the type and parameters to the factory.

### **Shapes → Renderer**
```javascript
// In main app
function runCode() {
    // ... lexer, parser, interpreter steps ...
    const result = interpreter.interpret(ast);
    
    // Update renderer with new shapes
    renderer.setShapes(result.shapes);
    renderer.render();
}

// In renderer
setShapes(shapeMap) {
    this.shapes = shapeMap;      // Store reference to shape collection
    this.isDirty = true;         // Mark for redraw
}
```
**How it works:** The main application passes the interpreter's shape collection to the renderer. The renderer stores a reference and marks itself dirty for redraw. This loose coupling means shapes can be updated without the renderer knowing about the interpreter.

### **Interactive Updates**
```javascript
// When shape is modified interactively (mouse drag, parameter slider, etc.)
updateShapeProperty(shapeName, property, value) {
    const shape = this.shapes.get(shapeName);
    if (shape) {
        // Update shape property
        shape[property] = value;
        
        // Mark renderer dirty
        this.isDirty = true;
        
        // Re-render immediately for responsive UI
        this.render();
        
        // Update code editor to reflect change
        this.syncCodeEditor(shapeName, property, value);
    }
}

syncCodeEditor(shapeName, property, value) {
    // Find the shape definition in the code
    const code = this.editor.getValue();
    const lines = code.split('\n');
    
    // Locate the shape block and property line
    // Update the property value
    // Update the editor
    // This maintains the connection between visual and textual representations
}
```
**How it works:** Interactive updates modify shape properties directly, then sync back to the code editor. This bidirectional connection allows users to edit either visually (drag shapes) or textually (edit code) and see both representations update.

**Why immediate rendering?** Interactive operations expect immediate visual feedback. Delayed updates feel sluggish and break the user's mental model of direct manipulation.

---

## Testing New Shapes

### **1. Shape Class Test**
```javascript
// Test geometry generation
const myShape = new MyNewShape(param1, param2);
myShape.position = [100, 100];
myShape.rotation = 45;
myShape.scale = [1.5, 1.0];

const points = myShape.getPoints();
console.log('Generated points:', points);

// Verify transform application
const expectedPoint0 = {
    x: /* calculate expected x */,
    y: /* calculate expected y */
};
console.assert(
    Math.abs(points[0].x - expectedPoint0.x) < 0.001,
    'Transform calculation incorrect'
);
```
**How it works:** Direct shape testing validates the geometry generation and transform math. We set known transform values and verify the output points match our calculations. This catches math errors early.

### **2. Renderer Test**
```javascript
// Test rendering without full application
const canvas = document.createElement('canvas');
const renderer = new ShapeRenderer(canvas);

renderer.shapes.set('testShape', myShape);
renderer.render();

// Visual inspection or automated testing
// For automated testing, you could:
// 1. Render to offscreen canvas
// 2. Extract pixel data
// 3. Compare against reference images
```
**How it works:** Isolated renderer testing verifies visual output without involving the full application. For automated testing, you can render to offscreen canvases and compare pixel data, though this is complex for continuous shapes.

### **3. Integration Test**
```javascript
// Test through complete pipeline
const code = `
param size 50
param color red

shape myNewShape test {
    param1: size
    param2: size * 0.5
    param3: 8
    fillColor: color
    position: [100, 50]
}
`;

// Run through full pipeline
const lexer = new Lexer(code);
const parser = new Parser(lexer);
const ast = parser.parse();
const interpreter = new Interpreter();
const result = interpreter.interpret(ast);

// Verify shape was created correctly
const testShape = result.shapes.get('test');
console.assert(testShape instanceof MyNewShape, 'Shape type incorrect');
console.assert(testShape.param1 === 50, 'Parameter binding incorrect');
```
**How it works:** Integration testing runs through the complete pipeline from source code to rendered shape. This tests the language integration, parameter binding, and property application - all the connections between components.

**Testing strategy:**
- **Unit tests** - Individual shape geometry
- **Rendering tests** - Visual output verification  
- **Integration tests** - Complete pipeline
- **Interactive tests** - Manual testing of user interactions

This comprehensive testing approach ensures new shapes work correctly at all levels of the system, from mathematical correctness to user experience.
