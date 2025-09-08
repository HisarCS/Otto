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
2. **Parametric Adjustable Wrench** - Design a 2D tool where you can modify the jaw size and handle length

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
// We will learn to create basic rectangles with width, height, and position
// We will create circles with radius and position
// We will understand how coordinates work in Aqui
```

### Exercise 1.1: Draw Your Name Initial
Students will create the first letter of their name using basic shapes (rectangles, circles, triangles).

### Exercise 1.2: Simple House Outline
```aqui
// Create a rectangular base for the house
// Add a triangular roof on top
// Position shapes to form a basic house silhouette
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
// Learn to declare parameters using 'param' keyword
// Use parameters in shape dimensions instead of fixed numbers
// Understand how changing one parameter affects the entire design
```

### Exercise 2.1: Parametric Rectangle
```aqui
// Create parameters for width, height, and position
// Use these parameters to create a rectangle
// Practice changing parameter values to see the effect
```

### Exercise 2.2: Parametric Simple Shape
```aqui
// Create a simple design using circles and rectangles
// Use parameters to control the size of features
// Experiment with different parameter values
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
// Create parameters for house dimensions: width, height
// Create parameter for roof height
// Build the main house body using a rectangle
// Add a triangular roof positioned on top of the house
// Use parameter values to ensure roof width matches house width
```

### Adding a Door
```aqui
// Create parameters for door dimensions: width, height
// Position the door at the center bottom of the house
// Use mathematical expressions to center the door automatically
```

### Adding Windows
```aqui
// Create parameters for window dimensions and count
// Use a loop to create multiple windows automatically
// Calculate window positions to distribute them evenly across the house
```

### Exercise 3.1: Complete Parametric House
```aqui
// Combine all house elements
// Test different parameter values to create house variations
// Ensure all elements scale properly together
```

---

## Session 4: Building a Parametric Adjustable Wrench

### Learning Objectives
- Apply parametric thinking to tool design
- Create functional 2D representations
- Use geometric relationships

### What is an Adjustable Wrench?
An adjustable wrench is a tool that can grip objects of different sizes. In our 2D version, we will show:
- Handle (main gripping area)
- Fixed jaw (one side of the gripping area)
- Movable jaw (adjustable side)
- Adjustment mechanism

### Basic Wrench Structure
```aqui
// Create parameters for wrench dimensions: handle length, handle width
// Create parameters for jaw dimensions: jaw length, jaw width
// Build the main handle using a rectangle
// Add the fixed jaw at one end of the handle
```

### Adding the Movable Jaw
```aqui
// Create the movable jaw component
// Position it to show the adjustable opening
// Use parameters to control the jaw opening distance
```

### Adding Details
```aqui
// Add the adjustment screw representation
// Add grip texture or markings on the handle
// Use small rectangles or circles for these details
```

### Exercise 4.1: Complete Parametric Wrench
```aqui
// Combine all wrench components
// Test different parameter settings for different wrench sizes
// Create small, medium, and large wrench variations by changing parameters
```

---

## Session 5: Advanced Features and Functions

### Learning Objectives
- Use functions to create reusable designs
- Apply conditional logic for design variations
- Create design families

### Using Functions for Reusable Designs
```aqui
// Create a function to generate houses with different parameters
// Create a function to generate wrenches with different specifications
// Learn how functions help organize and reuse code
```

### Adding Conditional Features
```aqui
// Add optional features to the house (chimney, garage door)
// Add optional features to the wrench (measurement marks, different jaw styles)
// Use if statements to include or exclude features
```

### Exercise 5.1: House Variations
```aqui
// Create functions that generate different house styles
// Add parameters for optional features like chimney or extra windows
// Generate a neighborhood of different houses
```

### Exercise 5.2: Wrench Set
```aqui
// Create a function that generates wrenches of different sizes
// Use loops to create a complete set of wrenches
// Arrange them in an organized layout
```

---

## Session 6: Project Completion and Review

### Learning Objectives
- Complete both parametric designs
- Understand design relationships and constraints
- Review parametric design principles

### Final House Design
```aqui
// Finalize the parametric house with all features
// Ensure all parameters work correctly together
// Add final details and styling
```

### Final Wrench Design
```aqui
// Complete the parametric wrench design
// Verify all dimensions scale properly
// Add finishing touches and details
```

### Exercise 6.2: Design Explanation
Students will write brief explanations of how their parametric designs work and what advantages parametric design offers over fixed designs.
