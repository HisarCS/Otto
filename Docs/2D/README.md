# Aqui Programming Language Documentation

## Overview
Aqui is a domain-specific programming language designed for parametric shape creation and graphical design. It allows users to define parameters, shapes, and transformations through a structured syntax. The Aqui interpreter processes the input and renders the resulting graphics on an HTML5 Canvas. The language is particularly well-suited for teaching parametric design concepts and is designed with SIGGRAPH conference presentations in mind.

## Core Concepts

### **1. Parameters (`param`)**
Parameters allow defining variables that can be used throughout the script.
#### **Syntax:**
```aqui
param size 100
param isVisible true
param color "red"
```
- `size` is a numerical parameter.
- `isVisible` is a boolean parameter.
- `color` is a string parameter.

Parameters can be referenced using `param.name` inside shapes or conditions.

### **2. Shapes (`shape`)**
Shapes define geometric elements with configurable properties.
#### **Syntax:**
```aqui
shape circle myCircle {
    radius: 30
    position: [50, 50]
}
```
- `shape` is the keyword.
- `circle` is the shape type.
- `myCircle` is the shape name.
- Properties such as `radius` and `position` define the shape's attributes.

### **3. Layers (`layer`)**
Layers are used to group multiple shapes and apply transformations collectively.
#### **Syntax:**
```aqui
layer main {
    add myCircle
    rotate 45
}
```
- `add myCircle` adds a shape to the layer.
- `rotate 45` applies a 45-degree rotation to all elements in the layer.

### **4. Transformations (`transform`)**
Transformations modify the properties of shapes and layers.
#### **Syntax:**
```aqui
transform myCircle {
    scale: 2
    rotate: 30
    position: [100, 50]
}
```
- `scale: 2` doubles the size of the shape.
- `rotate: 30` rotates the shape by 30 degrees.
- `position: [100, 50]` moves the shape to coordinates [100, 50].

### **5. Conditional Statements (`if-else`)**
Aqui supports conditional statements to dynamically create shapes.
#### **Syntax:**
```aqui
if param.size > 50 {
    shape circle bigCircle {
        radius: param.size
        position: [100, 100]
    }
} else {
    shape circle smallCircle {
        radius: param.size / 2
        position: [100, 100]
    }
}
```
- If `size` is greater than 50, `bigCircle` is created.
- Otherwise, `smallCircle` is created.

Aqui supports complex conditions with logical operators:
```aqui
if (size > 50 and showDetails) or isSpecial {
    // Code to execute if condition is true
}
```

### **6. Functions (`def`)**
Functions allow creating reusable code blocks for shape generation.
#### **Syntax:**
```aqui
def functionName(param1, param2) {
    // Function body
    shape circle myCircle {
        radius: param1
        position: [param2, param2]
    }
    return myCircle
}

// Call the function
param circleInstance functionName(30, 50)
```
- Define functions with the `def` keyword
- Functions can accept parameters and return values
- Use functions to create reusable shape generators

#### **Example: Circle Grid**
```aqui
def createCircleGrid(startX, startY, rows, cols, spacing, baseRadius) {
    for i from 0 to rows - 1 {
        for j from 0 to cols - 1 {
            param x startX + j * spacing
            param y startY + i * spacing
            param radius baseRadius * (1 + 0.3 * (i + j) / (rows + cols))
            
            // Call another function
            createCircle(param.x, param.y, param.radius)
        }
    }
}

// Helper function
def createCircle(x, y, radius) {
    shape circle dynamicCircle {
        radius: radius
        position: [x, y]
    }
}

// Use the function
createCircleGrid(-100, -100, 5, 5, 40, 10)
```

### **7. Turtle Drawing (`draw`)**
Create paths using turtle-like drawing commands.
#### **Syntax:**
```aqui
draw myDrawing {
    forward 50
    right 90
    forward 50
    
    // More drawing commands
}
```
#### **Available Commands:**
- `forward <distance>` - Move forward by the specified distance
- `backward <distance>` - Move backward by the specified distance
- `right <angle>` - Turn right by the specified angle in degrees
- `left <angle>` - Turn left by the specified angle in degrees
- `goto [x, y]` - Move to the specified coordinates
- `penup` - Stop drawing while moving
- `pendown` - Resume drawing while moving

#### **Example: Drawing a Square**
```aqui
draw square {
    forward 50
    right 90
    forward 50
    right 90
    forward 50
    right 90
    forward 50
}
```

### **8. Boolean Operations**
Aqui supports boolean operations to combine shapes in various ways.

#### **Syntax:**
```aqui
union resultShape {
    add shape1
    add shape2
}

difference resultShape {
    add baseShape
    add subtractShape
}

intersection resultShape {
    add shape1
    add shape2
}
```

#### **Operations:**
- `union` - Combines shapes by taking all points from both shapes
- `difference` - Subtracts the second shape from the first
- `intersection` - Creates a shape containing only the overlapping areas

#### **Example:**
```aqui
shape rectangle rect1 {
    width: 100
    height: 50
    position: [0, 0]
}

shape circle circ1 {
    radius: 30
    position: [0, 0]
}

union combined {
    add rect1
    add circ1
}

difference cutout {
    add rect1
    add circ1
}
```

## Loops

### **1. Basic Range Loop**
Iterates from a start value to an end value with an optional step.
#### **Syntax:**
```aqui
for iterator from start to end {
    // shape definitions and transformations
}
```
#### **Example:**
```aqui
for i from 0 to 5 {
    shape circle circle1 {
        radius: 10
        position: [i * 30, 50]
    }
}
```
- Creates circles named `circle1_0` through `circle1_5`
- Iterator `i` can be used in expressions
- Shape names are automatically indexed

### **2. Step Loop**
Includes a step value to control iteration increment.
#### **Syntax:**
```aqui
for iterator from start to end step stepValue {
    // shape definitions and transformations
}
```
#### **Example:**
```aqui
for i from 0 to 100 step 20 {
    shape circle circle1 {
        radius: i / 4
        position: [i, 50]
    }
}
```
- Creates circles with increasing radii
- Steps by 20 units each iteration
- Automatic naming applies as `circle1_0`, `circle1_20`, etc.

### **3. Shape Naming**
Loops automatically handle unique shape naming.
#### **Behavior:**
- Base shape name is suffixed with underscore and iteration number
- Format: `shapeName_iterationNumber`
- Enables referencing specific instances after loop execution

#### **Example with Transforms:**
```aqui
for i from 0 to 5 {
    shape circle circle1 {
        radius: 10
        position: [i * 30, 50]
    }
}

transform circle1_2 {
    rotate: 45
}
```
- Creates multiple circles
- Individual shapes can be referenced using generated names
- Transforms can target specific instances

### **4. Nested Loops**
Loops can be nested for creating grid-based patterns.

```aqui
for i from 0 to 3 {
    for j from 0 to 3 {
        shape circle gridCircle {
            radius: 10
            position: [i * 30, j * 30]
        }
    }
}
```

## Shape Classes
Aqui supports 20 predefined shape classes:

### **1. Rectangle**
```aqui
shape rectangle myRect {
    width: 100
    height: 50
    position: [50, 50]
}
```
- Defines a rectangle with width, height, and position.

### **2. Circle**
```aqui
shape circle myCircle {
    radius: 30
    position: [50, 50]
}
```
- Defines a circle with a radius and position.

### **3. Triangle**
```aqui
shape triangle myTriangle {
    base: 60
    height: 80
    position: [50, 50]
}
```
- Defines a triangle with a base and height.

### **4. Ellipse**
```aqui
shape ellipse myEllipse {
    radiusX: 40
    radiusY: 20
    position: [50, 50]
}
```
- Defines an ellipse with different X and Y radii.

### **5. Regular Polygon**
```aqui
shape polygon myPolygon {
    radius: 50
    sides: 6
    position: [50, 50]
}
```
- Defines a regular polygon with a specific number of sides.

### **6. Star**
```aqui
shape star myStar {
    outerRadius: 50
    innerRadius: 20
    points: 5
    position: [50, 50]
}
```
- Defines a star with outer and inner radii and number of points.

### **7. Arc**
```aqui
shape arc myArc {
    radius: 50
    startAngle: 0
    endAngle: 180
    position: [50, 50]
}
```
- Defines an arc with a radius and start/end angles (in degrees).

### **8. Rounded Rectangle**
```aqui
shape roundedRectangle myRoundRect {
    width: 100
    height: 50
    radius: 10
    position: [50, 50]
}
```
- Defines a rectangle with rounded corners.

### **9. Path**
```aqui
shape path myPath {
    points: [
        [0, 0],
        [50, 50],
        [100, 0]
    ]
    closed: true
}
```
- Defines a custom path with multiple points.
- The `closed` parameter (optional) determines if the path should be closed.

### **10. Arrow**
```aqui
shape arrow myArrow {
    length: 100
    headWidth: 20
    headLength: 30
    position: [50, 50]
}
```
- Defines an arrow shape with shaft and head properties.

### **11. Text**
```aqui
shape text myText {
    text: "Hello Aqui"
    fontSize: 20
    fontFamily: "Arial"
    position: [50, 50]
}
```
- Defines a text shape with content, size, and font options.

### **12. Bezier Curve**
```aqui
shape bezier myBezier {
    startPoint: [0, 0]
    controlPoint1: [50, 100]
    controlPoint2: [100, 100]
    endPoint: [150, 0]
}
```
- Defines a cubic Bezier curve with start, end, and control points.

### **13. Donut**
```aqui
shape donut myDonut {
    outerRadius: 50
    innerRadius: 20
    position: [50, 50]
}
```
- Defines a donut (annulus) shape with inner and outer radii.

### **14. Spiral**
```aqui
shape spiral mySpiral {
    startRadius: 10
    endRadius: 50
    turns: 5
    position: [50, 50]
}
```
- Defines a spiral shape with specified turns and radii.

### **15. Cross**
```aqui
shape cross myCross {
    width: 50
    thickness: 10
    position: [50, 50]
}
```
- Defines a cross shape with specified width and thickness.

### **16. Gear**
```aqui
shape gear myGear {
    diameter: 100
    teeth: 20
    shaft: "square"
    shaftSize: 20
    position: [50, 50]
}
```
- Defines a gear with specific teeth count and optional shaft.
- Shaft can be "square" or "circle".

### **17. Wave**
```aqui
shape wave myWave {
    width: 100
    amplitude: 20
    frequency: 3
    position: [50, 50]
}
```
- Defines a sinusoidal wave with width, amplitude, and frequency.

### **18. Slot**
```aqui
shape slot mySlot {
    length: 100
    width: 20
    position: [50, 50]
}
```
- Defines a slot shape (rounded rectangle with semicircular ends).

### **19. Chamfer Rectangle**
```aqui
shape chamferRectangle myChamfer {
    width: 100
    height: 50
    chamfer: 10
    position: [50, 50]
}
```
- Defines a rectangle with chamfered (angled) corners.

### **20. Polygon with Holes**
```aqui
shape polygonWithHoles myPoly {
    outerPoints: [[0, 0], [100, 0], [100, 100], [0, 100]]
    holes: [[[30, 30], [70, 30], [70, 70], [30, 70]]]
    position: [50, 50]
}
```
- Defines a polygon with internal holes.
- `outerPoints` defines the outer polygon boundary.
- `holes` is an array of point arrays, each defining a hole.

## SVG Export

Aqui provides functionality to export your designs as SVG files:

- Click the "Export SVG" button in the interface
- Enter a filename for your exported SVG
- The SVG will maintain all shapes, layers, and transformations from your design
- SVG exports can be used in vector graphics software or for web display

## Tips and Best Practices

### **1. Organizing with Layers**
Use layers to group related shapes and apply transformations collectively:

```aqui
layer background {
    add bg_rect
}

layer foreground {
    add circle1
    add circle2
    rotate 15
}
```

### **2. Parameterizing Designs**
Use parameters to make your designs easily customizable:

```aqui
param gridSize 5
param spacing 30
param baseRadius 10

for i from 0 to param.gridSize {
    for j from 0 to param.gridSize {
        shape circle grid_circle {
            radius: param.baseRadius * (1 + (i + j) / (param.gridSize * 2))
            position: [i * param.spacing, j * param.spacing]
        }
    }
}
```

### **3. Function Reuse**
Create and reuse functions for common patterns:

```aqui
def createFlower(x, y, petalCount, petalLength) {
    for i from 0 to petalCount - 1 {
        param angle 360 / petalCount * i
        shape ellipse petal {
            radiusX: petalLength
            radiusY: petalLength / 4
            position: [x, y]
            rotate: angle
        }
    }
    
    shape circle center {
        radius: petalLength / 5
        position: [x, y]
    }
}

// Create multiple flowers
createFlower(0, 0, 5, 50)
createFlower(100, 100, 8, 30)
```

### **4. Using Boolean Operations**
Combine shapes with boolean operations to create complex forms:

```aqui
// Create a rounded rectangle with a circular hole
shape roundedRectangle baseShape {
    width: 100
    height: 60
    radius: 10
    position: [0, 0]
}

shape circle cutout {
    radius: 20
    position: [0, 0]
}

difference resultShape {
    add baseShape
    add cutout
}
```


