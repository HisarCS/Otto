# Aqui Programming Workshop: Parametric Design Fundamentals

---

## What is Parametric Design?

Parametric design is a method where you create designs using parameters (variables) that can be easily changed to modify the entire design. Instead of drawing a house that is always the same size, you create a house design where you can change numbers to make it taller, wider, or add more windows.

For example, if you set a parameter called `house_width = 100`, your entire house design uses this number. When you change it to `house_width = 150`, the whole house automatically becomes wider, and all the parts adjust accordingly.

This approach is used by:
- Architects designing buildings
- Engineers creating tools and machines
- Product designers making consumer goods
- Manufacturing companies that need to produce different sizes of the same item

---

## Course Overview

This workshop teaches parametric design through the Aqui programming language. You will complete two main projects:

1. **Parametric House Design** - Create a 2D house where you can easily adjust size, number of windows, and door style
2. **Parametric Car Design** - Design a 2D vehicle where you can modify the body size, wheel dimensions, and window configuration

---

## Session 1: Introduction to Aqui and Basic Shapes

### Learning Objectives
- Understand how Aqui creates shapes
- Learn basic shape commands
- Create your first simple drawings

### What is Aqui?
Aqui is a programming language designed specifically for creating 2D shapes and designs. Unlike general programming languages, Aqui focuses on geometric shapes and design operations.

### Basic Shape Creation

```aqui
shape rectangle rectangle3 {
    rotation: 93.66778805553145
    position: [-63.752293, 58.66383999999999]
    width: 108
    height: 158
    fill: false
}

shape circle circle4 {
    position: [-328.268051, 113.553201]
    radius: 110.42481611202095
    fill: false
}
```

### Exercise 1.1: Draw Your Name Initial
Students will create the first letter of their name using basic shapes (rectangles, circles, triangles).

### Exercise 1.2: Simple House Outline
```aqui
shape rectangle rectangle5 {
    position: [29, 50]
    width: 114
    height: 72
    fill: false
}

shape triangle triangle6 {
    rotation: -180
    position: [29, 134]
    base: 106
    height: 96
    fill: false
}
```

---

## Session 2: Understanding Parameters

### Learning Objectives
- Learn what parameters are and why they're useful
- Create designs that can be easily modified
- Understand the difference between fixed and parametric designs

### What Are Parameters?
Parameters are like containers that hold numbers. Instead of writing the number 100 directly in your code, you store it in a parameter and use the parameter name.

### Why Use Parameters?
When you want to make changes to your design, you only need to change parameter values instead of finding and changing numbers throughout your code.

```aqui
param width 25
param height 100
param windowCount 4
```

### Exercise 2.1: Parametric Rectangle
```aqui
param width 25
param height 100
param posX 100
param posY 50

shape rectangle a {
  width: width
  height: height
  position: [posX, posY]
}
```

### Exercise 2.2: Parametric Simple Shape
```aqui
param width 25
param height 100
param posX 100
param posY 50
param rad 200

shape rectangle a {
  width: width
  height: height
  position: [posX, posY]
}

shape circle b {
  radius: rad
}
```

---

## Session 3: Building a Parametric House

### Learning Objectives
- Combine multiple shapes into a complex design
- Use parameters to control overall design proportions
- Learn about positioning shapes relative to each other

### House Design Planning
Our 2D house will have these components:
- Main house body (rectangle)
- Roof (triangle)
- Door (rectangle)
- Windows (rectangles)

### Basic House Structure
```aqui
param width 100
param height 200
param roofheight 50

shape rectangle a {
  position: [7.5, -5.997118999999998]
  width: 100
  height: 200
}

shape triangle b {
  height: 50
  base: 100
  rotation: -180
  position: [7.500409, 119.002881]
  
}
```

### Adding a Door
```aqui
param width 100
param height 200
param roofheight 50
param doorWidth 20
param doorHeight 50

shape rectangle a {
  position: [0.75, 21.875449000000003]
  width: 100
  height: 200
}

shape triangle b {
  height: 50
  base: 100
  rotation: -180
  position: [0.75, 146.87504]
  
}

shape rectangle door {
  position: [0.75, -53.12496]
  width: 20
  height: 50
}
```

### Adding Windows
```aqui
param width 100
param height 200
param roofheight 50
param doorWidth 20
param doorHeight 50
param windowSidelength 30

shape rectangle a {
  position: [1.7503059999999948, 61.624221000000006]
  width: 160
  height: 124
}

shape triangle b {
  height: 50
  base: 100
  rotation: -180
  position: [1.750306, 148.623812]
  
}

shape rectangle door {
  position: [1.750306, 24.623812]
  width: 20
  height: 50
}

shape rectangle window1 {
  position: [-40, 80]
  width: 30
  height: 30
}

shape rectangle window2 {
  position: [40, 80]
  width: 30
  height: 30
}
```

### Exercise 3.1: Complete Parametric House
```aqui
param width 100
param height 200
param roofheight 50
param doorWidth 20
param doorHeight 50
param windowSidelength 30

shape rectangle a {
  position: [1.7503059999999948, 61.624221000000006]
  width: width
  height: height
}

shape triangle b {
  height: roofheight
  base: width
  rotation: -180
  position: [1.750306, 148.623812]
  
}

shape rectangle door {
  position: [1.750306, 24.623812]
  width: doorWidth
  height: doorHeight
}

shape rectangle window1 {
  position: [-40, 80]
  width: windowSidelength
  height: windowSidelength
}

shape rectangle window2 {
  position: [40, 80]
  width: windowSidelength
  height: windowSidelength
}

constraints {
  coincident a.rect_mt b.tri_apex
  coincident a.rect_mb door.rect_mb
}
```

---

## Session 4: Building a Parametric Car

### Learning Objectives
- Apply parametric thinking to vehicle design
- Create functional 2D representations
- Use geometric relationships for automotive proportions

### What Makes a Good 2D Car Design?
A recognizable 2D car needs these key components:
- Main body (rectangular chassis)
- Wheels (circles positioned under the body)
- Windows (rectangles for windshield, side windows)
- Headlights (circles or rectangles at the front)

### Exercise 4.1: Complete Parametric Car
```aqui
// Parametric Car Design - keeping original values
param wheelRadius 25
param carWidth 200
param carHeight 58
param arcRadius 70.69235507299915
param headlightRadius 30

shape circle frontWheel {
  position: [-8, 46]
  radius: wheelRadius
  fill: false
}

shape circle rearWheel {
  position: [-94, 45]
  radius: wheelRadius
  fill: false
}

shape arc arc1 {
    radius: 26.53426032087915
    position: [-77, 141]
    startAngle: 0
    endAngle: -180
    fill: false
}

shape circle c1 {
  radius: headlightRadius
}

shape rectangle rectangle4 {
    position: [-54, 79]
    width: carWidth
    height: carHeight
    fill: false
}
```

---

## Session 6: Project Completion and Review

### Learning Objectives
- Complete both parametric designs
- Understand design relationships and constraints
- Review parametric design principles

### Exercise 6.1: Design Gallery
Students will create variations of their house and car designs by adjusting parameters to show the flexibility of parametric design.

### Exercise 6.2: Design Explanation
Students will write brief explanations of how their parametric designs work and what advantages parametric design offers over fixed designs.

### Key Takeaways
- Parametric design allows for rapid design iterations
- Parameters make designs flexible and reusable
- Geometric relationships and constraints maintain design integrity
- 2D representations can effectively communicate 3D design concepts
