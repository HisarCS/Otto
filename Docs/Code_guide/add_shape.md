# AQUI Shape System Documentation

## Architecture Overview

AQUI's shape system consists of two main components:
1. **Shape Definitions** (`Shapes.mjs`) - Shape geometry and mathematical representations
2. **Shape Rendering** (`shapeRenderer.mjs`) - Canvas drawing and visual representation

---

## Shapes.mjs - Core Shape System

### Base Shape Class

#### **Shape Class Structure**
```javascript
class Shape {
    constructor() {
        this.position = [0, 0];
        this.rotation = 0;
        this.scale = [1, 1];
        this.fill = false;
        this.fillColor = '#808080';
        this.stroke = true;
        this.strokeColor = '#000000';
        this.strokeWidth = 1;
    }
    
    // Abstract methods - must be implemented by subclasses
    getPoints() {
        throw new Error('getPoints() must be implemented by subclass');
    }
    
    getBoundingBox() {
        throw new Error('getBoundingBox() must be implemented by subclass');
    }
}
```

#### **Transform System**
```javascript
transformPoint(point) {
    const [px, py] = [point.x, point.y];
    const [sx, sy] = this.scale;
    const cos = Math.cos(this.rotation * Math.PI / 180);
    const sin = Math.sin(this.rotation * Math.PI / 180);
    
    // Scale
    let x = px * sx;
    let y = py * sy;
    
    // Rotate
    const rotX = x * cos - y * sin;
    const rotY = x * sin + y * cos;
    
    // Translate
    return {
        x: rotX + this.position[0],
        y: rotY + this.position[1]
    };
}
```

### Basic Shape Implementations

#### **Rectangle Class**
```javascript
class Rectangle extends Shape {
    constructor(width, height) {
        super();
        this.width = width;
        this.height = height;
    }
    
    getPoints() {
        const hw = this.width / 2;
        const hh = this.height / 2;
        
        const points = [
            { x: -hw, y: -hh },  // Top-left
            { x:  hw, y: -hh },  // Top-right
            { x:  hw, y:  hh },  // Bottom-right
            { x: -hw, y:  hh }   // Bottom-left
        ];
        
        return points.map(p => this.transformPoint(p));
    }
    
    getBoundingBox() {
        const points = this.getPoints();
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        
        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys)
        };
    }
}
```

#### **Circle Class**
```javascript
class Circle extends Shape {
    constructor(radius) {
        super();
        this.radius = radius;
    }
    
    getPoints(resolution = 32) {
        const points = [];
        for (let i = 0; i < resolution; i++) {
            const angle = (i / resolution) * Math.PI * 2;
            points.push({
                x: Math.cos(angle) * this.radius,
                y: Math.sin(angle) * this.radius
            });
        }
        
        return points.map(p => this.transformPoint(p));
    }
    
    getBoundingBox() {
        const [cx, cy] = this.position;
        const r = this.radius * Math.max(this.scale[0], this.scale[1]);
        
        return {
            minX: cx - r,
            maxX: cx + r,
            minY: cy - r,
            maxY: cy + r
        };
    }
}
```

### Complex Shape Implementations

#### **Star Class**
```javascript
class Star extends Shape {
    constructor(outerRadius, innerRadius, points) {
        super();
        this.outerRadius = outerRadius;
        this.innerRadius = innerRadius;
        this.points = points;
    }
    
    getPoints() {
        const points = [];
        const angleStep = Math.PI / this.points;
        
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

#### **Gear Class** (Complex Mathematical Shape)
```javascript
class Gear extends Shape {
    constructor(pitchDiameter, teeth, pressureAngle = 20) {
        super();
        this.pitchDiameter = pitchDiameter;
        this.teeth = teeth;
        this.pressureAngle = pressureAngle;
        
        // Calculate gear geometry
        this.module = pitchDiameter / teeth;
        this.addendum = this.module;
        this.dedendum = 1.25 * this.module;
        this.baseRadius = (pitchDiameter / 2) * Math.cos(pressureAngle * Math.PI / 180);
    }
    
    getPoints(resolution = 4) {
        const points = [];
        const toothAngle = (2 * Math.PI) / this.teeth;
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
        // Complex involute curve calculation for gear teeth
        // Implementation details...
        return this.pitchDiameter / 2;
    }
}
```

### Fabrication Joint Shapes

#### **DovetailPin Class**
```javascript
class DovetailPin extends Shape {
    constructor(width, jointCount, depth, angle, thickness) {
        super();
        this.width = width;
        this.jointCount = jointCount;
        this.depth = depth;
        this.angle = angle;
        this.thickness = thickness;
    }
    
    getPoints() {
        const points = [];
        const pinWidth = this.width / this.jointCount;
        const taper = Math.tan(this.angle * Math.PI / 180) * this.depth;
        
        const startX = -this.width / 2;
        const startY = -this.thickness / 2;
        
        // Generate dovetail profile
        for (let i = 0; i < this.jointCount; i++) {
            if (i % 2 === 0) { // Pin
                const left = startX + i * pinWidth;
                const right = left + pinWidth;
                
                // Pin profile with dovetail taper
                points.push({ x: left, y: startY });
                points.push({ x: right, y: startY });
                points.push({ x: right + taper, y: startY + this.depth });
                points.push({ x: left - taper, y: startY + this.depth });
            }
        }
        
        return points.map(p => this.transformPoint(p));
    }
}
```

#### **FingerJointPin Class**
```javascript
class FingerJointPin extends Shape {
    constructor(width, fingerCount, fingerWidth, depth, thickness) {
        super();
        this.width = width;
        this.fingerCount = fingerCount;
        this.fingerWidth = fingerWidth || width / fingerCount;
        this.depth = depth;
        this.thickness = thickness;
    }
    
    getPoints() {
        const points = [];
        const fingerWidth = this.fingerWidth;
        const startX = -this.width / 2;
        const startY = -this.thickness / 2;
        
        // Board outline
        points.push({ x: startX, y: startY });
        points.push({ x: startX + this.width, y: startY });
        points.push({ x: startX + this.width, y: startY + this.thickness });
        
        // Finger pattern
        for (let i = 0; i < this.fingerCount; i++) {
            const fingerLeft = startX + this.width - (i + 1) * fingerWidth;
            const fingerRight = fingerLeft + fingerWidth;
            
            if (i % 2 === 0) { // Extended finger
                points.push({ x: fingerRight, y: startY + this.thickness });
                points.push({ x: fingerRight, y: startY + this.thickness + this.depth });
                points.push({ x: fingerLeft, y: startY + this.thickness + this.depth });
                points.push({ x: fingerLeft, y: startY + this.thickness });
            }
        }
        
        points.push({ x: startX, y: startY + this.thickness });
        
        return points.map(p => this.transformPoint(p));
    }
}
```

### Adding New Shape Types

#### **1. Create Shape Class**
```javascript
class MyNewShape extends Shape {
    constructor(param1, param2, param3) {
        super();
        this.param1 = param1;
        this.param2 = param2;
        this.param3 = param3;
    }
    
    getPoints() {
        // Implement shape geometry
        const points = [];
        
        // Mathematical calculation for shape points
        // ...
        
        return points.map(p => this.transformPoint(p));
    }
    
    getBoundingBox() {
        // Calculate bounds
        const points = this.getPoints();
        // ... bounds calculation
        return { minX, maxX, minY, maxY };
    }
}
```

#### **2. Export Shape Class**
```javascript
// At bottom of Shapes.mjs
export {
    Shape,
    Rectangle,
    Circle,
    // ... existing exports
    MyNewShape  // Add new shape
};
```

---

## shapeRenderer.mjs - Rendering System

### Core Renderer Architecture

#### **ShapeRenderer Class**
```javascript
class ShapeRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.shapes = new Map();
        this.coordinateSystem = new CoordinateSystem(canvas);
    }
    
    render() {
        this.clear();
        
        for (const [name, shape] of this.shapes) {
            this.renderShape(shape, name);
        }
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
```

#### **Shape Rendering Pipeline**
```javascript
renderShape(shape, shapeName) {
    const points = shape.getPoints();
    
    if (points.length === 0) return;
    
    // Convert to screen coordinates
    const screenPoints = points.map(p => 
        this.coordinateSystem.worldToScreen(p)
    );
    
    // Set up canvas context
    this.setupShapeStyle(shape);
    
    // Draw shape path
    this.drawPath(screenPoints, shape.closed !== false);
    
    // Apply fill and stroke
    this.applyShapeStyle(shape);
}
```

### Coordinate System Management

#### **CoordinateSystem Class**
```javascript
class CoordinateSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.zoom = 1;
        this.panOffset = { x: 0, y: 0 };
        this.origin = { x: canvas.width / 2, y: canvas.height / 2 };
    }
    
    worldToScreen(worldPoint) {
        return {
            x: (worldPoint.x + this.panOffset.x) * this.zoom + this.origin.x,
            y: (worldPoint.y + this.panOffset.y) * this.zoom + this.origin.y
        };
    }
    
    screenToWorld(screenPoint) {
        return {
            x: (screenPoint.x - this.origin.x) / this.zoom - this.panOffset.x,
            y: (screenPoint.y - this.origin.y) / this.zoom - this.panOffset.y
        };
    }
}
```

### Drawing Methods

#### **Path Drawing**
```javascript
drawPath(points, closed = true) {
    if (points.length === 0) return;
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
    }
    
    if (closed) {
        this.ctx.closePath();
    }
}
```

#### **Style Application**
```javascript
setupShapeStyle(shape) {
    // Fill properties
    if (shape.fill) {
        this.ctx.fillStyle = this.parseColor(shape.fillColor);
    }
    
    // Stroke properties
    if (shape.stroke) {
        this.ctx.strokeStyle = this.parseColor(shape.strokeColor);
        this.ctx.lineWidth = shape.strokeWidth || 1;
    }
}

applyShapeStyle(shape) {
    if (shape.fill) {
        this.ctx.fill();
    }
    
    if (shape.stroke) {
        this.ctx.stroke();
    }
}
```

#### **Color Parsing**
```javascript
parseColor(colorValue) {
    // Named colors
    const namedColors = {
        'red': '#FF0000',
        'blue': '#0000FF',
        'green': '#00FF00',
        'black': '#000000',
        'white': '#FFFFFF'
    };
    
    if (namedColors[colorValue]) {
        return namedColors[colorValue];
    }
    
    // Hex colors
    if (colorValue.startsWith('#')) {
        return colorValue;
    }
    
    // Default
    return '#808080';
}
```

### Shape-Specific Rendering

#### **Circle Rendering Optimization**
```javascript
renderCircle(shape) {
    const center = this.coordinateSystem.worldToScreen({
        x: shape.position[0],
        y: shape.position[1]
    });
    
    const radius = shape.radius * this.coordinateSystem.zoom;
    
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    
    this.setupShapeStyle(shape);
    this.applyShapeStyle(shape);
}
```

#### **Text Rendering**
```javascript
renderText(shape) {
    const position = this.coordinateSystem.worldToScreen({
        x: shape.position[0],
        y: shape.position[1]
    });
    
    this.ctx.font = `${shape.fontSize}px ${shape.fontFamily}`;
    this.ctx.textAlign = shape.textAlign || 'center';
    this.ctx.textBaseline = 'middle';
    
    if (shape.fill) {
        this.ctx.fillStyle = this.parseColor(shape.fillColor);
        this.ctx.fillText(shape.text, position.x, position.y);
    }
    
    if (shape.stroke) {
        this.ctx.strokeStyle = this.parseColor(shape.strokeColor);
        this.ctx.strokeText(shape.text, position.x, position.y);
    }
}
```

### Shape Factory Integration

#### **Creating Shapes from Parameters**
```javascript
createShapeFromParams(type, params) {
    const lowerType = type.toLowerCase();
    
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
            console.warn(`Unknown shape type: ${type}`);
            return new Rectangle(50, 50); // Fallback
    }
}
```

### Performance Optimizations

#### **Viewport Culling**
```javascript
isShapeInViewport(shape) {
    const bounds = shape.getBoundingBox();
    const viewport = this.getViewportBounds();
    
    return !(bounds.maxX < viewport.minX || 
             bounds.minX > viewport.maxX ||
             bounds.maxY < viewport.minY || 
             bounds.minY > viewport.maxY);
}

render() {
    this.clear();
    
    for (const [name, shape] of this.shapes) {
        if (this.isShapeInViewport(shape)) {
            this.renderShape(shape, name);
        }
    }
}
```

#### **Resolution Scaling**
```javascript
getShapeResolution(shapeType) {
    const curved = ['circle', 'ellipse', 'arc', 'spiral'];
    const baseResolution = curved.includes(shapeType) ? 32 : 4;
    
    // Adjust based on zoom level
    return Math.max(8, Math.min(64, baseResolution * this.coordinateSystem.zoom));
}
```

### Adding New Rendering Features

#### **1. Shape-Specific Renderer**
```javascript
// Add to renderShape method
renderShape(shape, shapeName) {
    // Check for specialized renderer
    const rendererMethod = `render${shape.constructor.name}`;
    if (typeof this[rendererMethod] === 'function') {
        this[rendererMethod](shape);
        return;
    }
    
    // Fall back to generic path rendering
    this.renderGenericShape(shape);
}
```

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
        this.ctx.shadowColor = shape.shadow.color;
        this.ctx.shadowBlur = shape.shadow.blur;
        this.ctx.shadowOffsetX = shape.shadow.offsetX;
        this.ctx.shadowOffsetY = shape.shadow.offsetY;
    }
}
```

---

## Integration Points

### **Interpreter → Shapes**
```javascript
// In interpreter.mjs
createShape(type, params) {
    const shape = this.shapeFactory.createShape(type, params);
    
    // Apply properties from AST
    if (params.position) shape.position = params.position;
    if (params.rotation) shape.rotation = params.rotation;
    if (params.fill !== undefined) shape.fill = params.fill;
    
    return shape;
}
```

### **Shapes → Renderer**
```javascript
// In main app
const result = interpreter.interpret(ast);
renderer.setShapes(result.shapes);
renderer.render();
```

### **Interactive Updates**
```javascript
// When shape is modified interactively
updateShapeProperty(shapeName, property, value) {
    const shape = this.shapes.get(shapeName);
    if (shape) {
        shape[property] = value;
        this.render(); // Re-render
        
        // Update code editor
        this.syncCodeEditor(shapeName, property, value);
    }
}
```

---

## Testing New Shapes

### **1. Shape Class Test**
```javascript
// Test geometry generation
const myShape = new MyNewShape(param1, param2);
myShape.position = [100, 100];
const points = myShape.getPoints();
console.log('Shape points:', points);
```

### **2. Renderer Test**
```javascript
// Test rendering
renderer.shapes.set('testShape', myShape);
renderer.render();
```

### **3. Integration Test**
```javascript
// Test through interpreter
const code = `
shape myNewShape test {
    param1: 50
    param2: 100
}
`;
runCode(code);
```

This architecture provides a flexible, extensible shape system that separates mathematical geometry from visual rendering, making it easy to add new shapes and rendering features.
