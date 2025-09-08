# AQUI Woodworking Joints Documentation

## Overview

AQUI provides comprehensive support for creating precise woodworking joints commonly used in furniture making, cabinetry, and general woodworking. These joints are designed with parametric control for digital fabrication workflows including CNC routing, laser cutting, and traditional hand tools.

All woodworking joints in AQUI are designed to be manufacturable and include proper tolerances for real-world construction.

---

## Traditional Joinery

### **dovetailPin**

Creates the male portion of a dovetail joint with tapered pins that expand outward. Dovetails are prized for their mechanical strength and resistance to pulling forces.

**Parameters:**
- `width` - Total width of the joint
- `jointCount` - Number of pins (odd numbers recommended)
- `depth` - How deep the pins extend
- `angle` - Dovetail angle in degrees (7-15° typical)
- `thickness` - Board thickness
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape dovetailPin drawerFront {
  width: 100        // Total width of the joint
  jointCount: 5     // Number of pins (odd numbers recommended)
  depth: 30         // How deep the pins extend
  angle: 15         // Dovetail angle in degrees (7-15° typical)
  thickness: 20     // Board thickness
  position: [300, 100]
  rotation: 0
}
```

**Use Cases:** Drawer construction, box corners, high-stress joints

---

### **dovetailTail**

Creates the female portion of a dovetail joint with corresponding sockets that receive the pins.

**Parameters:**
- `width` - Must match corresponding pin width
- `jointCount` - Must match corresponding pin count
- `depth` - Socket depth (slightly deeper than pin)
- `angle` - Must match pin angle exactly
- `thickness` - Board thickness
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape dovetailTail drawerSide {
  width: 100        // Must match corresponding pin width
  jointCount: 5     // Must match corresponding pin count
  depth: 30         // Socket depth (slightly deeper than pin)
  angle: 15         // Must match pin angle exactly
  thickness: 20     // Board thickness
  position: [300, 200]
  rotation: 0
}
```

**Use Cases:** Mating piece for dovetail pins, drawer sides

---

## Box Joints & Finger Joints

### **fingerJointPin**

Creates the male portion of a finger joint (box joint) with rectangular fingers extending outward.

**Parameters:**
- `width` - Total joint width
- `fingerCount` - Number of fingers
- `fingerWidth` - Width of each finger (auto-calculated if not specified)
- `depth` - How far fingers extend
- `thickness` - Board thickness
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape fingerJointPin boxSide {
  width: 100        // Total joint width
  fingerCount: 5    // Number of fingers
  fingerWidth: 20   // Width of each finger
  depth: 30         // How far fingers extend
  thickness: 15     // Board thickness
  position: [100, 100]
  rotation: 0
}
```

**Use Cases:** Box construction, cabinet corners, simple strong joints

---

### **fingerJointSocket**

Creates the female portion of a finger joint with rectangular sockets that receive the fingers.

**Parameters:**
- `width` - Must match corresponding pin width
- `fingerCount` - Must match corresponding pin count
- `fingerWidth` - Must match pin finger width
- `depth` - Socket depth
- `thickness` - Board thickness
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape fingerJointSocket boxEnd {
  width: 100        // Must match corresponding pin width
  fingerCount: 5    // Must match corresponding pin count
  fingerWidth: 20   // Must match pin finger width
  depth: 30         // Socket depth
  thickness: 15     // Board thickness
  position: [100, 200]
  rotation: 0
}
```

**Use Cases:** Mating piece for finger joint pins

---

## Lap Joints

### **halfLapMale**

Creates the male portion of a half-lap joint where material is removed from the bottom half of the board.

**Parameters:**
- `width` - Total board width
- `height` - Total board height
- `lapLength` - Length of the lap cut
- `lapDepth` - Depth of material removal (typically half the board thickness)
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape halfLapMale frameHorizontal {
  width: 100        // Total board width
  height: 50        // Total board height
  lapLength: 30     // Length of the lap cut
  lapDepth: 25      // Depth of material removal
  position: [100, 100]
  rotation: 0
}
```

**Use Cases:** Frame construction, overlapping joints, picture frames

---

### **halfLapFemale**

Creates the female portion of a half-lap joint where material is removed from the top half of the board.

**Parameters:**
- `width` - Must match corresponding male width
- `height` - Must match corresponding male height
- `lapLength` - Must match male lap length
- `lapDepth` - Must match male lap depth
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape halfLapFemale frameVertical {
  width: 100        // Must match corresponding male width
  height: 50        // Must match corresponding male height
  lapLength: 30     // Must match male lap length
  lapDepth: 25      // Must match male lap depth
  position: [100, 200]
  rotation: 0
}
```

**Use Cases:** Mating piece for half-lap male joints

---

## Cross Lap Joints

### **crossLapVertical**

Creates a vertical board with a horizontal slot for cross-lap joinery.

**Parameters:**
- `width` - Board width
- `height` - Board height
- `slotWidth` - Width of the crossing slot
- `slotDepth` - How deep the slot cuts into the board
- `slotPosition` - Vertical position of the slot center
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape crossLapVertical verticalMember {
  width: 80         // Board width
  height: 200       // Board height
  slotWidth: 20     // Width of the crossing slot
  slotDepth: 40     // How deep the slot cuts
  slotPosition: 100 // Vertical position of slot center
  position: [300, 300]
  rotation: 0
}
```

**Use Cases:** Grid structures, lattice work, intersecting frame members

---

### **crossLapHorizontal**

Creates a horizontal board with a vertical slot for cross-lap joinery.

**Parameters:**
- `width` - Board width
- `height` - Board height
- `slotWidth` - Width of the crossing slot
- `slotDepth` - How deep the slot cuts into the board
- `slotPosition` - Horizontal position of the slot center
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape crossLapHorizontal horizontalMember {
  width: 200        // Board width
  height: 80        // Board height
  slotWidth: 20     // Width of the crossing slot
  slotDepth: 40     // How deep the slot cuts
  slotPosition: 100 // Horizontal position of slot center
  position: [200, 300]
  rotation: 0
}
```

**Use Cases:** Mating piece for cross-lap vertical joints

---

## Modular Systems

### **slotBoard**

Creates a board with multiple slots for modular assembly systems.

**Parameters:**
- `width` - Total board width
- `height` - Total board height
- `slotCount` - Number of slots
- `slotWidth` - Width of each slot
- `slotDepth` - Depth of each slot
- `slotPosition` - Vertical position (0.0 = top, 0.5 = center, 1.0 = bottom)
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape slotBoard shelfSupport {
  width: 300        // Total board width
  height: 200       // Total board height
  slotCount: 3      // Number of slots
  slotWidth: 20     // Width of each slot
  slotDepth: 50     // Depth of each slot
  slotPosition: 0.5 // Center position
  position: [200, 200]
  rotation: 0
}
```

**Use Cases:** Shelving systems, modular furniture, adjustable structures

---

### **tabBoard**

Creates a board with protruding tabs for modular assembly systems.

**Parameters:**
- `width` - Total board width
- `height` - Total board height
- `tabCount` - Number of tabs
- `tabWidth` - Width of each tab
- `tabDepth` - How far tabs protrude
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape tabBoard shelfPanel {
  width: 300        // Total board width
  height: 200       // Total board height
  tabCount: 3       // Number of tabs
  tabWidth: 30      // Width of each tab
  tabDepth: 40      // How far tabs protrude
  position: [200, 300]
  rotation: 0
}
```

**Use Cases:** Mating piece for slot boards, modular panels

---

## Specialty Joints

### **fingerCombMale**

Creates a decorative finger comb joint with alternating projections.

**Parameters:**
- `width` - Total width
- `height` - Total height
- `toothCount` - Number of teeth/segments
- `toothDepth` - How far teeth project
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape fingerCombMale combMale {
  width: 100        // Total width
  height: 40        // Total height
  toothCount: 8     // Number of teeth
  toothDepth: 10    // How far teeth project
  position: [100, 100]
  rotation: 0
}
```

**Use Cases:** Decorative joints, interlocking mechanisms

---

### **fingerCombFemale**

Creates the mating piece for finger comb joints with reciprocal indentations.

**Parameters:**
- `width` - Must match male width
- `height` - Must match male height
- `toothCount` - Must match male tooth count
- `toothDepth` - Must match male tooth depth
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape fingerCombFemale combFemale {
  width: 100        // Must match male width
  height: 40        // Must match male height
  toothCount: 8     // Must match male tooth count
  toothDepth: 10    // Must match male tooth depth
  position: [100, 200]
  rotation: 0
}
```

**Use Cases:** Mating piece for finger comb male

---

### **rabbetJoint**

Creates a rabbet (rebate) joint with an L-shaped groove cut from the edge.

**Parameters:**
- `width` - Board width
- `height` - Board height
- `slotWidth` - Width of the rabbet cut
- `slotDepth` - Depth of the rabbet cut
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape rabbetJoint cabinetBack {
  width: 100        // Board width
  height: 200       // Board height
  slotWidth: 40     // Width of the rabbet cut
  slotDepth: 20     // Depth of the rabbet cut
  position: [100, 100]
  rotation: 0
}
```

**Use Cases:** Cabinet backs, panel insets, picture frame backs

---

### **rabbetPlain**

Creates a plain board with a protruding tab for rabbet joints.

**Parameters:**
- `width` - Main board width
- `height` - Board height
- `tabWidth` - Width of the protruding tab
- `tabLength` - Length of the tab protrusion
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape rabbetPlain cabinetSide {
  width: 150        // Main board width
  height: 200       // Board height
  tabWidth: 100     // Width of the protruding tab
  tabLength: 20     // Length of the tab protrusion
  position: [100, 200]
  rotation: 0
}
```

**Use Cases:** Mating piece for rabbet joints

---

### **flexureMesh**

Creates a flexible mesh pattern for living hinges and bendable materials.

**Parameters:**
- `totalWidth` - Overall mesh width
- `totalHeight` - Overall mesh height
- `slotLength` - Length of each flex slot
- `slotWidth` - Width of each flex slot
- `bridgeWidth` - Width of material between slots
- `rowSpacing` - Vertical spacing between rows
- `staggerOffset` - Horizontal offset for staggered pattern (0.0-1.0)
- `cornerRadius` - Radius for rounded slot corners
- `pattern` - Pattern type ('staggered' or 'aligned')
- `position` - [x, y] coordinates
- `rotation` - Rotation angle in degrees

```aqui
shape flexureMesh livingHinge {
  totalWidth: 200      // Overall mesh width
  totalHeight: 100     // Overall mesh height
  slotLength: 15       // Length of each flex slot
  slotWidth: 2         // Width of each flex slot
  bridgeWidth: 3       // Width between slots
  rowSpacing: 8        // Vertical spacing
  staggerOffset: 0.5   // 50% stagger
  cornerRadius: 0.5    // Slightly rounded corners
  pattern: "staggered" // Staggered pattern
  position: [200, 200]
  rotation: 0
}
```

**Use Cases:** Living hinges, flexible panels, bendable joints

---

## Best Practices

### Tolerance Planning
```aqui
param tolerance 0.1  // Add slight clearance for real-world fit

shape fingerJointPin boxSide {
  width: 100
  fingerCount: 5
  fingerWidth: 20 - param.tolerance  // Slightly smaller for clearance
  depth: 30
  thickness: 15
}
```

### Matching Joint Pairs
```aqui
// Define common parameters to ensure joints match
param jointWidth 100
param jointCount 5
param jointDepth 30

shape dovetailPin drawer_front {
  width: param.jointWidth
  jointCount: param.jointCount
  depth: param.jointDepth
  angle: 15
  thickness: 20
}

shape dovetailTail drawer_side {
  width: param.jointWidth
  jointCount: param.jointCount
  depth: param.jointDepth + 2  // Slightly deeper socket
  angle: 15
  thickness: 20
}
```

### Modular Systems
```aqui
def createSlottedShelf(width, slotSpacing) {
  param slotCount width / slotSpacing
  
  shape slotBoard shelf {
    width: width
    height: 200
    slotCount: param.slotCount
    slotWidth: 20
    slotDepth: 15
    slotPosition: 0.1  // Near top edge
  }
}

// Create shelves of different sizes with consistent slot spacing
createSlottedShelf(300, 50)
createSlottedShelf(600, 50)
```

### Material Considerations
```aqui
// Adjust joint parameters based on material thickness
param materialThickness 18  // 18mm plywood
param kerf 3.2              // Laser cut kerf width

shape fingerJointPin adapted {
  width: 100
  fingerCount: 5
  fingerWidth: 20 + param.kerf  // Compensate for kerf
  depth: param.materialThickness
  thickness: param.materialThickness
}
```