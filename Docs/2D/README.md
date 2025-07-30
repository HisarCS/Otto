# Aqui Programming Language Documentation

## Overview

Aqui is a domain-specific programming language designed for **parametric shape creation and graphical design**, particularly in digital fabrication contexts.

---

## 1. Language Structure

Aqui code consists of declarations and instructions. The language supports:

* Parameters (`param`)
* Shape definitions (`shape`)
* Conditional logic (`if`, `else`)
* Loops (`for`, `from`, `to`, `step`)
* Functions (`def`)
* Transformations (`transform`, `position`, `rotate`, `scale`)
* Boolean operations (`union`, `difference`, `intersection`)
* Layers (`layer`)
* Drawing commands (`draw`)

---

## 2. Tokens and Keywords

Aqui is case-insensitive. Reserved keywords include:

### Shape Keywords

`shape`, `rectangle`, `circle`, `triangle`, `ellipse`, `path`, `star`, `arc`, `text`, `beziercurve`, `donut`, `spiral`, `wave`, `gear`, `roundedrectangle`, `chamferrectangle`, `regularpolygon`, `arrow`, `cross`, `slot`, `polygonwithholes`, `dovetailpin`, `dovetailtail`, `fingerjointpin`, `fingerjointsocket`, `halflapmale`, `halflapfemale`, `crosslapvertical`, `crosslaphorizontal`, `slotboard`, `tabboard`, `fingercombmale`, `fingercombfemale`

### Logic Keywords

`if`, `else`, `and`, `or`, `not`, `true`, `false`

### Loop Keywords

`for`, `from`, `to`, `step`

### Function Keywords

`def`

### Boolean Operation Keywords

`union`, `difference`, `intersection`

### Transformation Keywords

`transform`, `position`, `rotate`, `scale`

### Drawing Keywords

`draw`, `forward`, `backward`, `right`, `left`, `goto`, `penup`, `pendown`

### Styling Tokens

`fill`, `filled`, `fillColor`, `stroke`, `strokeColor`, `strokeWidth`, `opacity`, `alpha`, `visible`, `hidden`, `color`, `background`, `border`, `thickness`

---

## 3. Parameters

```aqui
param size 100
param isVisible true
param color "red"
```

Parameters are global variables used in any part of the code.

---

## 4. Shape Declaration

```aqui
shape circle myCircle {
  radius: 30
  position: [50, 50]
}
```

Each shape block has:

* A **type**
* A **name**
* A list of parameters

All shape types and their required parameters are listed in section 13.

---

## 5. Boolean Operations

\$1

### Example

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

---

## 6. Transformations

```aqui
transform myShape {
  scale: 2
  rotate: 30
  position: [100, 50]
}
```

---

## 7. Conditional Logic

\$1

Aqui supports complex conditions with logical operators:

```aqui
if (size > 50 and showDetails) or isSpecial {
  // Code to execute if condition is true
}
```

---

## 8. Loops

\$1

### Shape Naming in Loops

Loop-generated shapes are automatically named with the format: `name_index`. This allows you to reference them later:

```aqui
transform circle1_2 {
  rotate: 45
}
```

### Nested Loops

You can nest loops for grids and matrices:

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

### Full Example

```aqui
def createCircleGrid(startX, startY, rows, cols, spacing, baseRadius) {
  for i from 0 to rows - 1 {
    for j from 0 to cols - 1 {
      param x startX + j * spacing
      param y startY + i * spacing
      param radius baseRadius * (1 + 0.3 * (i + j) / (rows + cols))
      createCircle(param.x, param.y, param.radius)
    }
  }
}

def createCircle(x, y, radius) {
  shape circle dynamicCircle {
    radius: radius
    position: [x, y]
  }
}

createCircleGrid(-100, -100, 5, 5, 40, 10)
```

---

## 9. Functions

```aqui
def createCircle(x, y, radius) {
  shape circle dynamicCircle {
    radius: radius
    position: [x, y]
  }
}
```

Functions define reusable blocks but do not return values.

---

## 10. Turtle Drawing

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

Commands:

* `forward`, `backward`, `right`, `left`
* `goto [x, y]`, `penup`, `pendown`

---

## 11. Layers

```aqui
layer main {
  add shape1
  add shape2
}
```

Applies to grouped shapes.

---

## 12. Paths & Custom Geometry

```aqui
shape path myPath {
  points: [[0,0], [20,0], [10,30]]
  closed: true
}
```

---

## 13. Supported Shape Types and Parameters

### rectangle

* `width`, `height`, `position`, `rotation`, `scale`

### circle

* `radius`, `position`, `rotation`, `scale`

### triangle

* `base`, `height`, `position`, `rotation`, `scale`

### ellipse

* `radiusX`, `radiusY`, `position`, `rotation`, `scale`

### regularpolygon

* `radius`, `sides`, `position`, `rotation`, `scale`

### star

* `outerRadius`, `innerRadius`, `points`, `position`, `rotation`, `scale`

### arc

* `radius`, `startAngle`, `endAngle`, `position`, `rotation`, `scale`

### roundedrectangle

* `width`, `height`, `radius`, `position`, `rotation`, `scale`

### chamferrectangle

* `width`, `height`, `chamfer`, `position`, `rotation`, `scale`

### path

* `points`, `closed`, `position`, `rotation`, `scale`

### arrow

* `length`, `headWidth`, `headLength`, `position`, `rotation`, `scale`

### text

* `text`, `fontSize`, `fontFamily`, `position`, `rotation`, `scale`

### beziercurve

* `startPoint`, `controlPoint1`, `controlPoint2`, `endPoint`, `position`, `rotation`, `scale`

### donut

* `outerRadius`, `innerRadius`, `position`, `rotation`, `scale`

### spiral

* `startRadius`, `endRadius`, `turns`, `position`, `rotation`, `scale`

### wave

* `width`, `amplitude`, `frequency`, `position`, `rotation`, `scale`

### cross

* `width`, `thickness`, `position`, `rotation`, `scale`

### gear

* `pitch_diameter`, `teeth`, `pressure_angle`, `position`, `rotation`, `scale`

### slot

* `length`, `width`, `position`, `rotation`, `scale`

### polygonwithholes

* `outerPath`, `holes`, `position`, `rotation`, `scale`

### dovetailpin / dovetailtail

* `width`, `jointCount`, `depth`, `angle`, `thickness`, `position`, `rotation`, `scale`

### fingerjointpin / fingerjointsocket

* `width`, `fingerCount`, `fingerWidth`, `depth`, `thickness`, `position`, `rotation`, `scale`

### halflapmale / halflapfemale

* `width`, `height`, `lapLength`, `lapDepth`, `position`, `rotation`, `scale`

### crosslapvertical / crosslaphorizontal

* `width`, `height`, `slotWidth`, `slotDepth`, `slotPosition`, `position`, `rotation`, `scale`

### slotboard

* `width`, `height`, `slotCount`, `slotWidth`, `slotDepth`, `slotPosition`, `position`, `rotation`, `scale`

### tabboard

* `width`, `height`, `tabCount`, `tabWidth`, `tabDepth`, `tabPosition`, `position`, `rotation`, `scale`

### fingercombmale / fingercombfemale

* `width`, `depth`, `fingerCount`, `position`, `rotation`, `scale`

---

## 14. Style and Appearance

Each shape may also include styling options:

* `fill`, `fillColor`, `stroke`, `strokeColor`, `strokeWidth`, `opacity`, `visible`, `hidden`, `color`, `background`, `border`, `thickness`

---

## 15. Comments

```aqui
// This is a comment
```

---

## 16. Error Handling

* Errors are shown in console and error display
* Lexer/parser includes line number

---

## Tips and Best Practices

### 1. Organizing with Layers

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

### 2. Parameterizing Designs

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

### 3. Function Reuse

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

createFlower(0, 0, 5, 50)
createFlower(100, 100, 8, 30)
```

### 4. Using Boolean Operations

```aqui
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
