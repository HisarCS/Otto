# 3D Aqui Programming Language Documentation

## Overview
3D Aqui is a domain-specific programming language designed for parametric 3D shape creation and modeling. It extends the 2D Aqui language to the third dimension, allowing users to define parameters, 3D shapes, and transformations through a structured syntax. The 3D Aqui interpreter processes the input and renders the resulting 3D graphics using Three.js. The language is particularly well-suited for teaching parametric 3D design concepts, rapid prototyping, and creating interactive 3D visualizations.

## Core Concepts

### **1. Parameters (`param`)**
Parameters allow defining variables that can be used throughout the script.
#### **Syntax:**
```aqui
param size 50
param depth 20
param isVisible true
param material "metal"
```
- `size` and `depth` are numerical parameters.
- `isVisible` is a boolean parameter.
- `material` is a string parameter.

Parameters can be referenced using `param.name` inside shapes or conditions.

### **2. 3D Shapes (`shape3d`)**
Shapes define 3D geometric elements with configurable properties.
#### **Syntax:**
```aqui
shape3d rectangle myCube {
    width: 30
    height: 30
    depth: 30
    position: [0, 0, 0]
    material: {
        color: 0x1289d8
        metalness: 0.3
        roughness: 0.5
    }
}
```
- `shape3d` is the keyword.
- `rectangle` is the shape type.
- `myCube` is the shape name.
- Properties such as `width`, `height`, `depth`, `position`, and `material` define the shape's attributes.

### **3. Layers (`layer`)**
Layers are used to group multiple shapes and apply transformations collectively.
#### **Syntax:**
```aqui
layer main {
    add myCube
    add mySphere
    rotate: [0, 45, 0]
}
```
- `add myCube` adds a shape to the layer.
- `rotate: [0, 45, 0]` applies a 45-degree rotation around the Y axis to all elements in the layer.

### **4. Transformations (`transform`)**
Transformations modify the properties of shapes and layers.
#### **Syntax:**
```aqui
transform myCube {
    scale: [2, 1, 1]
    rotate: [0, 30, 0]
    position: [50, 0, 20]
}
```
- `scale: [2, 1, 1]` scales the shape along the X axis.
- `rotate: [0, 30, 0]` rotates the shape by 30 degrees around the Y axis.
- `position: [50, 0, 20]` moves the shape to coordinates [50, 0, 20].

### **5. Conditional Statements (`if-else`)**
3D Aqui supports conditional statements to dynamically create shapes.
#### **Syntax:**
```aqui
if param.size > 50 {
    shape3d circle bigCylinder {
        radius: param.size
        depth: param.depth
        position: [0, 0, 0]
    }
} else {
    shape3d circle smallCylinder {
        radius: param.size / 2
        depth: param.depth / 2
        position: [0, 0, 0]
    }
}
```
- If `size` is greater than 50, `bigCylinder` is created.
- Otherwise, `smallCylinder` is created.

### **6. Material Properties**
Materials define the appearance of 3D shapes.
#### **Syntax:**
```aqui
shape3d circle mySphere {
    radius: 30
    depth: 30
    position: [0, 0, 0]
    material: {
        color: 0xff0000
        metalness: 0.8
        roughness: 0.2
        wireframe: false
        transparent: true
        opacity: 0.8
    }
}
```
- `color`: Hexadecimal color code (e.g., 0xff0000 for red)
- `metalness`: Value between 0 and 1, with 1 being fully metallic
- `roughness`: Value between 0 and 1, with 0 being smooth/reflective
- `wireframe`: Boolean value to show the shape as wireframe
- `transparent`: Boolean to enable transparency
- `opacity`: Value between 0 and 1 for transparency level

### **7. Loops**
Create multiple shapes with loops.
#### **Syntax:**
```aqui
for i from 0 to 5 {
    shape3d circle cylinder {
        radius: 10
        depth: 20
        position: [i * 30, 0, 0]
    }
}
```
- Creates cylinders named `cylinder_0` through `cylinder_5`
- Iterator `i` can be used in expressions
- Shape names are automatically indexed

### **8. Complex Example**
```aqui
param size 50
param depth 20
param count 5
param rotation 0

// Create a row of gears
for i from 0 to count - 1 {
    shape3d gear gear {
        diameter: size * (0.8 + 0.4 * (i % 2))
        teeth: 12 + i * 2
        depth: depth * (0.7 + 0.3 * (i % 2))
        position: [i * size * 0.8, 0, 0]
        rotation: [0, rotation * (i % 2 == 0 ? 1 : -1), 0]
        material: {
            color: i % 2 == 0 ? 0x3366cc : 0xcc6633
            metalness: 0.8
            roughness: 0.2
        }
    }
}
```
- Creates a row of alternating gears with different sizes and colors
- Rotation directions alternate between gears
- Uses modulo to create pattern variations

## 3D Shape Classes
3D Aqui supports 20 shape classes, each with 3D properties:

### **1. Rectangle3D**
```aqui
shape3d rectangle myCube {
    width: 100
    height: 50
    depth: 30
    position: [0, 0, 0]
}
```
- Creates a 3D box with width, height, and depth.

### **2. Circle3D**
```aqui
shape3d circle myCylinder {
    radius: 30
    depth: 50
    position: [0, 0, 0]
}
```
- Creates a cylinder with specified radius and height (depth).

### **3. Triangle3D**
```aqui
shape3d triangle myPrism {
    base: 60
    height: 80
    depth: 40
    position: [0, 0, 0]
}
```
- Creates a triangular prism with specified base, height, and depth.

### **4. Ellipse3D**
```aqui
shape3d ellipse myEllipticalCylinder {
    radiusX: 40
    radiusY: 20
    depth: 30
    position: [0, 0, 0]
}
```
- Creates an elliptical cylinder with different X and Y radii.

### **5. RegularPolygon3D**
```aqui
shape3d polygon myPolygonalPrism {
    radius: 50
    sides: 6
    depth: 30
    position: [0, 0, 0]
}
```
- Creates a regular polygonal prism with a specific number of sides.

### **6. Star3D**
```aqui
shape3d star myStar {
    outerRadius: 50
    innerRadius: 20
    points: 5
    depth: 10
    position: [0, 0, 0]
}
```
- Creates a 3D star shape with specified outer/inner radii and depth.

### **7. Arc3D**
```aqui
shape3d arc myArc {
    radius: 50
    startAngle: 0
    endAngle: 180
    depth: 20
    position: [0, 0, 0]
}
```
- Creates a 3D arc segment with specified radius, angles, and depth.

### **8. RoundedRectangle3D**
```aqui
shape3d roundedRectangle myRoundedBox {
    width: 100
    height: 50
    depth: 30
    radius: 10
    position: [0, 0, 0]
}
```
- Creates a box with rounded edges.

### **9. Path3D**
```aqui
shape3d path myExtrusion {
    points: [
        {x: 0, y: 0},
        {x: 50, y: 50},
        {x: 100, y: 0}
    ]
    depth: 20
    closed: true
    position: [0, 0, 0]
}
```
- Creates an extruded shape from a 2D path.
- The `closed` parameter determines if the path should be closed.

### **10. Arrow3D**
```aqui
shape3d arrow myArrow {
    length: 100
    headWidth: 20
    headLength: 30
    depth: 10
    position: [0, 0, 0]
}
```
- Creates a 3D arrow with specified dimensions.

### **11. Text3D**
```aqui
shape3d text myText {
    text: "Hello 3D"
    fontSize: 20
    fontFamily: "Arial"
    depth: 10
    position: [0, 0, 0]
}
```
- Creates extruded 3D text with specified properties.

### **12. BezierCurve3D**
```aqui
shape3d bezierCurve myBezier {
    startPoint: [0, 0]
    controlPoint1: [50, 100]
    controlPoint2: [100, 100]
    endPoint: [150, 0]
    depth: 5
    position: [0, 0, 0]
}
```
- Creates a 3D tube following a bezier curve path.

### **13. Donut3D**
```aqui
shape3d donut myTorus {
    outerRadius: 50
    innerRadius: 20
    depth: 10
    position: [0, 0, 0]
}
```
- Creates a 3D torus (donut) shape with inner and outer radii.

### **14. Spiral3D**
```aqui
shape3d spiral mySpiral {
    startRadius: 10
    endRadius: 50
    turns: 5
    depth: 5
    position: [0, 0, 0]
}
```
- Creates a 3D spiral with specified turns and radii.

### **15. Cross3D**
```aqui
shape3d cross myCross {
    width: 50
    thickness: 10
    depth: 5
    position: [0, 0, 0]
}
```
- Creates a 3D cross with specified width, thickness, and depth.

### **16. Gear3D**
```aqui
shape3d gear myGear {
    diameter: 100
    teeth: 20
    depth: 10
    position: [0, 0, 0]
}
```
- Creates a 3D gear with specified diameter, teeth count, and thickness.

### **17. Wave3D**
```aqui
shape3d wave myWave {
    width: 100
    amplitude: 20
    frequency: 3
    depth: 5
    position: [0, 0, 0]
}
```
- Creates a 3D sinusoidal wave extrusion.

### **18. Slot3D**
```aqui
shape3d slot mySlot {
    length: 100
    width: 20
    depth: 10
    position: [0, 0, 0]
}
```
- Creates a 3D slot shape (extruded stadium shape).

### **19. ChamferRectangle3D**
```aqui
shape3d chamferRectangle myChamferBox {
    width: 100
    height: 50
    depth: 30
    chamfer: 10
    position: [0, 0, 0]
}
```
- Creates a 3D box with chamfered (angled) corners.

### **20. PolygonWithHoles3D**
```aqui
shape3d polygonWithHoles myExtrusion {
    outerPath: [[0, 0], [100, 0], [100, 100], [0, 100]]
    holes: [[[30, 30], [70, 30], [70, 70], [30, 70]]]
    depth: 20
    position: [0, 0, 0]
}
```
- Creates an extruded shape with holes.
- `outerPath` defines the outer boundary.
- `holes` is an array of point arrays, each defining a hole.

## Material Properties in Detail

Materials define how 3D shapes appear with lighting and rendering:

### **1. Color**
```aqui
material: {
    color: 0xff0000  // Red
}
```
- Uses hexadecimal color codes (0xRRGGBB format)
- Common colors: 0xff0000 (red), 0x00ff00 (green), 0x0000ff (blue), etc.

### **2. Metalness**
```aqui
material: {
    metalness: 0.8  // Highly metallic
}
```
- Range: 0.0 to 1.0
- Higher values create more metallic appearances
- Affects how light reflects from the surface

### **3. Roughness**
```aqui
material: {
    roughness: 0.2  // Smooth and reflective
}
```
- Range: 0.0 to 1.0
- Lower values create smoother, more reflective surfaces
- Higher values create more diffused light reflection

### **4. Wireframe**
```aqui
material: {
    wireframe: true  // Show only edges
}
```
- Boolean value (true/false)
- Shows the geometry as wireframe when true

### **5. Transparency**
```aqui
material: {
    transparent: true
    opacity: 0.5  // Semi-transparent
}
```
- `transparent` must be true to enable transparency
- `opacity` ranges from 0.0 (invisible) to 1.0 (solid)

### **6. Combined Properties**
```aqui
material: {
    color: 0x1289d8
    metalness: 0.7
    roughness: 0.3
    transparent: true
    opacity: 0.8
}
```
- Multiple properties can be combined for complex materials

## 3D Transformations

3D transformations use arrays to specify values for each axis:

### **1. Position**
```aqui
position: [x, y, z]
```
- X: Left/right positioning
- Y: Up/down positioning
- Z: Forward/backward positioning

### **2. Rotation**
```aqui
rotation: [x, y, z]
```
- X: Rotation around X axis (pitch)
- Y: Rotation around Y axis (yaw)
- Z: Rotation around Z axis (roll)
- Values in degrees

### **3. Scale**
```aqui
scale: [x, y, z]
```
- X: Scaling along X axis
- Y: Scaling along Y axis
- Z: Scaling along Z axis
- Values are multipliers (1.0 is no change)

### **4. Examples**
```aqui
// Position only
shape3d rectangle cube1 {
    width: 50
    height: 50
    depth: 50
    position: [100, 0, -50]
}

// Position and rotation
shape3d rectangle cube2 {
    width: 50
    height: 50
    depth: 50
    position: [0, 50, 0]
    rotation: [0, 45, 0]
}

// Full transformation
shape3d rectangle cube3 {
    width: 50
    height: 50
    depth: 50
    position: [-100, 0, 0]
    rotation: [30, 45, 0]
    scale: [2, 1, 1]
}
```

## Layer Operations in 3D

Layers in 3D Aqui allow grouping and collective transformations:

### **1. Basic Layer**
```aqui
layer mainObjects {
    add cube1
    add cylinder1
}
```
- Simply groups shapes together

### **2. Layer with Transformation**
```aqui
layer rotatedGroup {
    add gear1
    add gear2
    
    // Apply rotation to all shapes in the layer
    rotate: [0, 45, 0]
}
```
- Rotates all objects in the layer by 45 degrees around Y axis

### **3. Layer with Multiple Transformations**
```aqui
layer complexGroup {
    add star1
    add donut1
    
    // Apply multiple transformations
    position: [0, 50, 0]
    rotate: [30, 0, 0]
    scale: [1, 1, 2]
}
```
- Applies position, rotation, and scale to all shapes in the layer
