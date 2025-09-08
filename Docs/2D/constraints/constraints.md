# AQUI Constraints System Documentation

## Constraint Block Syntax

All constraints are defined within a `constraints` block

## Constraint Types

### **coincident**

Makes two anchor points occupy the same position in space.

**Syntax:**
```aqui
coincident <anchor_a> <anchor_b>
```

**Example:**
```aqui
shape circle centerCircle {
  radius: 30
  position: [100, 100]
}

shape rectangle alignedRect {
  width: 60
  height: 40
  position: [150, 150]
}

constraints {
  coincident centerCircle.center alignedRect.center
}
```

---

### **distance**

Maintains a specific distance between two anchor points.

**Syntax:**
```aqui
distance <anchor_a> <anchor_b> <distance_expression>
```

**Example:**
```aqui
param spacing 50

shape circle leftCircle {
  radius: 20
  position: [0, 0]
}

shape circle rightCircle {
  radius: 20
  position: [100, 0]
}

constraints {
  distance leftCircle.center rightCircle.center param.spacing
}
```

---

### **horizontal**

Constrains two anchor points to maintain the same Y-coordinate (horizontal alignment).

**Syntax:**
```aqui
horizontal <anchor_a> <anchor_b>
```

**Example:**
```aqui
shape rectangle leftBox {
  width: 40
  height: 60
  position: [50, 100]
}

shape rectangle rightBox {
  width: 40
  height: 80
  position: [150, 120]
}

constraints {
  horizontal leftBox.center rightBox.center
}
```

---

### **vertical**

Constrains two anchor points to maintain the same X-coordinate (vertical alignment).

**Syntax:**
```aqui
vertical <anchor_a> <anchor_b>
```

**Example:**
```aqui
shape rectangle topBox {
  width: 60
  height: 30
  position: [100, 50]
}

shape rectangle bottomBox {
  width: 80
  height: 30
  position: [120, 150]
}

constraints {
  vertical topBox.center bottomBox.center
}
```

---

## Anchor Point References

### Standard Anchor Points

Most shapes support these anchor point references:

**Rectangle, RoundedRectangle, ChamferRectangle:**
- `shape.center` - Geometric center
- `shape.top` - Top edge center
- `shape.bottom` - Bottom edge center
- `shape.left` - Left edge center
- `shape.right` - Right edge center
- `shape.topLeft` - Top-left corner
- `shape.topRight` - Top-right corner
- `shape.bottomLeft` - Bottom-left corner
- `shape.bottomRight` - Bottom-right corner

**Circle, Ellipse:**
- `shape.center` - Center point
- `shape.top` - Topmost point
- `shape.bottom` - Bottommost point
- `shape.left` - Leftmost point
- `shape.right` - Rightmost point

**Line, Path:**
- `shape.start` - First point
- `shape.end` - Last point
- `shape.center` - Midpoint
