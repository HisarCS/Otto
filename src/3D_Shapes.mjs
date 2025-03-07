// 3D_Shapes.mjs - 3D versions of the shapes from Shapes.mjs
// This file converts 2D shapes to 3D using Three.js

// Base 3D Shape class
class Shape3D {
    constructor() {
      this.position = { x: 0, y: 0, z: 0 };
      this.rotation = { x: 0, y: 0, z: 0 };
      this.scale = { x: 1, y: 1, z: 1 };
      this.material = new THREE.MeshStandardMaterial({
        color: 0x1289d8,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
    }
  
    setPosition(x, y, z = 0) {
      this.position = { x, y, z };
      return this;
    }
  
    setRotation(x, y, z) {
      this.rotation = { x, y, z };
      return this;
    }
  
    setScale(x, y, z = 1) {
      this.scale = { x, y, z };
      return this;
    }
  
    setMaterial(material) {
      this.material = material;
      return this;
    }
  
    // Create a Three.js mesh from the shape
    createMesh(depth = 10) {
      const geometry = this.createGeometry(depth);
      const mesh = new THREE.Mesh(geometry, this.material);
      
      mesh.position.set(this.position.x, this.position.y, this.position.z);
      mesh.rotation.set(
        this.rotation.x * Math.PI / 180,
        this.rotation.y * Math.PI / 180,
        this.rotation.z * Math.PI / 180
      );
      mesh.scale.set(this.scale.x, this.scale.y, this.scale.z);
      
      return mesh;
    }
  
    // To be overridden by subclasses
    createGeometry(depth) {
      return new THREE.BufferGeometry();
    }
    
    // Convert 2D points to a 3D extruded geometry
    extrudeFromPoints(points, depth = 10, bevelEnabled = false) {
      // Create a shape from the points
      const shape = new THREE.Shape();
      
      if (points.length < 3) return new THREE.BufferGeometry();
      
      shape.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].x, points[i].y);
      }
      shape.closePath();
      
      // Extrusion settings
      const extrudeSettings = {
        steps: 1,
        depth: depth,
        bevelEnabled: bevelEnabled,
        bevelThickness: bevelEnabled ? depth * 0.1 : 0,
        bevelSize: bevelEnabled ? depth * 0.1 : 0,
        bevelOffset: 0,
        bevelSegments: bevelEnabled ? 3 : 0
      };
      
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
  }
  
  // 1. Rectangle3D
  class Rectangle3D extends Shape3D {
    constructor(width, height) {
      super();
      this.width = width;
      this.height = height;
    }
    
    createGeometry(depth) {
      return new THREE.BoxGeometry(this.width, this.height, depth);
    }
  }
  
  // 2. Circle3D
  class Circle3D extends Shape3D {
    constructor(radius) {
      super();
      this.radius = radius;
    }
    
    createGeometry(depth) {
      const cylinderGeometry = new THREE.CylinderGeometry(
        this.radius, // top radius
        this.radius, // bottom radius
        depth,       // height
        32           // radial segments
      );
      
      // Rotate to match the 2D orientation
      cylinderGeometry.rotateX(Math.PI / 2);
      
      return cylinderGeometry;
    }
  }
  
  // 3. Triangle3D
  class Triangle3D extends Shape3D {
    constructor(base, height) {
      super();
      this.base = base;
      this.height = height;
    }
    
    createGeometry(depth) {
      const points = [
        { x: -this.base/2, y: -this.height/2 },
        { x: this.base/2, y: -this.height/2 },
        { x: 0, y: this.height/2 }
      ];
      
      return this.extrudeFromPoints(points, depth);
    }
  }
  
  // 4. Ellipse3D
  class Ellipse3D extends Shape3D {
    constructor(radiusX, radiusY) {
      super();
      this.radiusX = radiusX;
      this.radiusY = radiusY;
    }
    
    createGeometry(depth) {
      // Create a shape for the ellipse
      const shape = new THREE.Shape();
      shape.ellipse(0, 0, this.radiusX, this.radiusY, 0, Math.PI * 2);
      
      // Extrusion settings
      const extrudeSettings = {
        steps: 1,
        depth: depth,
        bevelEnabled: false
      };
      
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
  }
  
  // 5. RegularPolygon3D
  class RegularPolygon3D extends Shape3D {
    constructor(radius, sides) {
      super();
      this.radius = radius;
      this.sides = sides;
    }
    
    createGeometry(depth) {
      const points = [];
      
      for (let i = 0; i < this.sides; i++) {
        const angle = (i / this.sides) * Math.PI * 2;
        points.push({
          x: Math.cos(angle) * this.radius,
          y: Math.sin(angle) * this.radius
        });
      }
      
      return this.extrudeFromPoints(points, depth);
    }
  }
  
  // 6. Star3D
  class Star3D extends Shape3D {
    constructor(outerRadius, innerRadius, points) {
      super();
      this.outerRadius = outerRadius;
      this.innerRadius = innerRadius;
      this.points = points;
    }
    
    createGeometry(depth) {
      const vertices = [];
      
      for (let i = 0; i < this.points * 2; i++) {
        const angle = (i / (this.points * 2)) * Math.PI * 2;
        const radius = i % 2 === 0 ? this.outerRadius : this.innerRadius;
        vertices.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });
      }
      
      return this.extrudeFromPoints(vertices, depth);
    }
  }
  
  // 7. Arc3D
  class Arc3D extends Shape3D {
    constructor(radius, startAngle, endAngle) {
      super();
      this.radius = radius;
      this.startAngle = startAngle * Math.PI / 180;
      this.endAngle = endAngle * Math.PI / 180;
    }
    
    createGeometry(depth) {
      const shape = new THREE.Shape();
      
      // Start at center
      shape.moveTo(0, 0);
      
      // Draw line to start of arc
      const startX = Math.cos(this.startAngle) * this.radius;
      const startY = Math.sin(this.startAngle) * this.radius;
      shape.lineTo(startX, startY);
      
      // Draw the arc
      shape.absarc(0, 0, this.radius, this.startAngle, this.endAngle, false);
      
      // Close path back to center
      shape.lineTo(0, 0);
      
      // Extrusion settings
      const extrudeSettings = {
        steps: 1,
        depth: depth,
        bevelEnabled: false
      };
      
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
  }
  
  // 8. RoundedRectangle3D
  class RoundedRectangle3D extends Shape3D {
    constructor(width, height, radius) {
      super();
      this.width = width;
      this.height = height;
      this.radius = Math.min(radius, width/2, height/2);
    }
    
    createGeometry(depth) {
      const shape = new THREE.Shape();
      
      const w = this.width / 2;
      const h = this.height / 2;
      const r = this.radius;
      
      shape.moveTo(-w + r, -h);
      shape.lineTo(w - r, -h);
      shape.quadraticCurveTo(w, -h, w, -h + r);
      shape.lineTo(w, h - r);
      shape.quadraticCurveTo(w, h, w - r, h);
      shape.lineTo(-w + r, h);
      shape.quadraticCurveTo(-w, h, -w, h - r);
      shape.lineTo(-w, -h + r);
      shape.quadraticCurveTo(-w, -h, -w + r, -h);
      
      const extrudeSettings = {
        steps: 1,
        depth: depth,
        bevelEnabled: false
      };
      
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
  }
  
  // 9. Path3D
  class Path3D extends Shape3D {
    constructor(points, closed = true) {
      super();
      this.points = points || [];
      this.closed = closed;
    }
    
    addPoint(x, y) {
      this.points.push({ x, y });
      return this;
    }
    
    createGeometry(depth) {
      if (this.points.length < 3) {
        console.warn('Path3D needs at least 3 points to create a geometry');
        return new THREE.BufferGeometry();
      }
      
      if (this.closed) {
        return this.extrudeFromPoints(this.points, depth);
      } else {
        // For open paths, we need to handle differently
        // Creating a thin strip along the path
        const shape = new THREE.Shape();
        const lineWidth = depth * 0.1;  // Thin line
  
        // Create a strip by offsetting the path perpendicularly
        shape.moveTo(this.points[0].x, this.points[0].y - lineWidth/2);
        
        for (let i = 1; i < this.points.length; i++) {
          shape.lineTo(this.points[i].x, this.points[i].y - lineWidth/2);
        }
        
        // Go back along the offset path
        for (let i = this.points.length - 1; i >= 0; i--) {
          shape.lineTo(this.points[i].x, this.points[i].y + lineWidth/2);
        }
        
        shape.closePath();
        
        const extrudeSettings = {
          steps: 1,
          depth: depth,
          bevelEnabled: false
        };
        
        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
      }
    }
  }
  
  // 10. Arrow3D
  class Arrow3D extends Shape3D {
    constructor(length, headWidth, headLength) {
      super();
      this.length = length;
      this.headWidth = headWidth;
      this.headLength = headLength;
    }
    
    createGeometry(depth) {
      const shaftWidth = this.headWidth * 0.4;
      
      const shape = new THREE.Shape();
      
      // Define the arrow shape
      shape.moveTo(0, -shaftWidth/2);
      shape.lineTo(this.length - this.headLength, -shaftWidth/2);
      shape.lineTo(this.length - this.headLength, -this.headWidth/2);
      shape.lineTo(this.length, 0);
      shape.lineTo(this.length - this.headLength, this.headWidth/2);
      shape.lineTo(this.length - this.headLength, shaftWidth/2);
      shape.lineTo(0, shaftWidth/2);
      shape.closePath();
      
      const extrudeSettings = {
        steps: 1,
        depth: depth,
        bevelEnabled: false
      };
      
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
  }
  
  // 11. Text3D
  class Text3D extends Shape3D {
    constructor(text, fontSize = 12, fontFamily = 'Arial') {
      super();
      this.text = text;
      this.fontSize = fontSize;
      this.fontFamily = fontFamily;
    }
    
    createGeometry(depth) {
      // Text geometry requires loaded fonts which is complex in Three.js
      // For simplicity, we'll create a placeholder geometry
      console.warn('Text3D requires font loading. Using placeholder geometry.');
      
      // Create a placeholder geometry (flat box with text dimensions)
      const width = this.text.length * this.fontSize * 0.6;
      const height = this.fontSize;
      
      return new THREE.BoxGeometry(width, height, depth * 0.1);
    }
    
    // In a full implementation, this would need to use THREE.FontLoader and TextGeometry
  }
  
  // 12. BezierCurve3D
  class BezierCurve3D extends Shape3D {
    constructor(startPoint, controlPoint1, controlPoint2, endPoint) {
      super();
      this.startPoint = startPoint;
      this.controlPoint1 = controlPoint1;
      this.controlPoint2 = controlPoint2;
      this.endPoint = endPoint;
    }
    
    createGeometry(depth) {
      // Create a shape for the curve
      const shape = new THREE.Shape();
      shape.moveTo(this.startPoint[0], this.startPoint[1]);
      shape.bezierCurveTo(
        this.controlPoint1[0], this.controlPoint1[1],
        this.controlPoint2[0], this.controlPoint2[1],
        this.endPoint[0], this.endPoint[1]
      );
      
      // To make it visible in 3D, we need to give it some width
      const lineWidth = depth * 0.2;
      
      // Create a path from the shape
      const path = new THREE.Path(shape.getPoints(50));
      const geometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          path.getPoints(50).map(p => new THREE.Vector3(p.x, p.y, 0))
        ),
        50,    // tubular segments
        lineWidth / 2,  // tube radius
        8,     // radial segments
        false  // closed
      );
      
      return geometry;
    }
  }
  
  // 13. Donut3D
  class Donut3D extends Shape3D {
    constructor(outerRadius, innerRadius) {
      super();
      this.outerRadius = outerRadius;
      this.innerRadius = innerRadius;
    }
    
    createGeometry(depth) {
      const shape = new THREE.Shape();
      
      // Outer circle
      shape.absarc(0, 0, this.outerRadius, 0, Math.PI * 2, false);
      
      // Inner circle (hole)
      const hole = new THREE.Path();
      hole.absarc(0, 0, this.innerRadius, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      
      const extrudeSettings = {
        steps: 1,
        depth: depth,
        bevelEnabled: false
      };
      
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
  }
  
  // 14. Spiral3D
  class Spiral3D extends Shape3D {
    constructor(startRadius, endRadius, turns) {
      super();
      this.startRadius = startRadius;
      this.endRadius = endRadius;
      this.turns = turns;
    }
    
    createGeometry(depth) {
      // Create a shape for the spiral
      const shape = new THREE.Shape();
      const segments = 100 * this.turns;
      const lineWidth = depth * 0.2;
      
      // Generate spiral points
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const angle = t * this.turns * Math.PI * 2;
        const radius = this.startRadius + (this.endRadius - this.startRadius) * t;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0
        ));
      }
      
      // Create a tube along the spiral
      const geometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        segments,  // tubular segments
        lineWidth / 2,   // tube radius
        8,         // radial segments
        false      // closed
      );
      
      return geometry;
    }
  }
  
  // 15. Cross3D
  class Cross3D extends Shape3D {
    constructor(width, thickness) {
      super();
      this.width = width;
      this.thickness = thickness;
    }
    
    createGeometry(depth) {
      const w = this.width / 2;
      const t = this.thickness / 2;
      
      const points = [
        { x: -t, y: -w }, { x: t, y: -w },
        { x: t, y: -t }, { x: w, y: -t },
        { x: w, y: t }, { x: t, y: t },
        { x: t, y: w }, { x: -t, y: w },
        { x: -t, y: t }, { x: -w, y: t },
        { x: -w, y: -t }, { x: -t, y: -t }
      ];
      
      return this.extrudeFromPoints(points, depth);
    }
  }
  
  // 16. Gear3D
  class Gear3D extends Shape3D {
    constructor(diameter, teeth, shaftType = 'circle') {
      super();
      this.diameter = diameter;
      this.teeth = teeth;
      this.shaftType = shaftType;
    }
    
    createGeometry(depth) {
      const r = this.diameter / 2;          // Pitch radius
      const toothHeight = this.diameter * 0.1; // Height of teeth
      const outerRadius = r + toothHeight;  // Outer radius with teeth
      const shape = new THREE.Shape();
      
      // Generate gear teeth
      for (let i = 0; i < this.teeth; i++) {
        const angle1 = (i / this.teeth) * Math.PI * 2;
        const angle2 = ((i + 0.4) / this.teeth) * Math.PI * 2;
        const angle3 = ((i + 0.5) / this.teeth) * Math.PI * 2;
        const angle4 = ((i + 0.6) / this.teeth) * Math.PI * 2;
        const angle5 = ((i + 1) / this.teeth) * Math.PI * 2;
        
        const x1 = Math.cos(angle1) * r;
        const y1 = Math.sin(angle1) * r;
        const x2 = Math.cos(angle2) * r;
        const y2 = Math.sin(angle2) * r;
        const x3 = Math.cos(angle3) * outerRadius;
        const y3 = Math.sin(angle3) * outerRadius;
        const x4 = Math.cos(angle4) * outerRadius;
        const y4 = Math.sin(angle4) * outerRadius;
        const x5 = Math.cos(angle5) * r;
        const y5 = Math.sin(angle5) * r;
        
        if (i === 0) {
          shape.moveTo(x1, y1);
        } else {
          shape.lineTo(x1, y1);
        }
        
        shape.lineTo(x2, y2);
        shape.lineTo(x3, y3);
        shape.lineTo(x4, y4);
        shape.lineTo(x5, y5);
      }
      
      shape.closePath();
      
      // Create hole for shaft
      const hole = new THREE.Path();
      const shaftRadius = this.diameter * 0.1;
      
      if (this.shaftType === 'circle') {
        hole.absarc(0, 0, shaftRadius, 0, Math.PI * 2, true);
        shape.holes.push(hole);
      } else if (this.shaftType === 'square') {
        const shaftSize = shaftRadius * 1.5;
        hole.moveTo(-shaftSize/2, -shaftSize/2);
        hole.lineTo(shaftSize/2, -shaftSize/2);
        hole.lineTo(shaftSize/2, shaftSize/2);
        hole.lineTo(-shaftSize/2, shaftSize/2);
        hole.closePath();
        shape.holes.push(hole);
      }
      
      const extrudeSettings = {
        steps: 1,
        depth: depth,
        bevelEnabled: true,
        bevelThickness: depth * 0.05,
        bevelSize: depth * 0.05,
        bevelOffset: 0,
        bevelSegments: 3
      };
      
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
  }
  
  // 17. Wave3D
  class Wave3D extends Shape3D {
    constructor(width, amplitude, frequency) {
      super();
      this.width = width;
      this.amplitude = amplitude;
      this.frequency = frequency;
    }
    
    createGeometry(depth) {
      const segments = 50;
      const lineWidth = depth * 0.2;
      
      // Generate wave points
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * this.width - this.width / 2;
        const y = Math.sin((x * this.frequency * Math.PI * 2) / this.width) * this.amplitude;
        points.push(new THREE.Vector3(x, y, 0));
      }
      
      // Create a tube along the wave
      const geometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        segments,  // tubular segments
        lineWidth / 2,   // tube radius
        8,         // radial segments
        false      // closed
      );
      
      return geometry;
    }
  }
  
  // 18. Slot3D
  class Slot3D extends Shape3D {
    constructor(length, width) {
      super();
      this.length = length;
      this.width = width;
      this.radius = width / 2;
    }
    
    createGeometry(depth) {
      const shape = new THREE.Shape();
      const centerDist = (this.length - this.width) / 2;
      
      // Draw the slot shape
      shape.absarc(centerDist, 0, this.radius, Math.PI / 2, -Math.PI / 2, true);
      shape.absarc(-centerDist, 0, this.radius, -Math.PI / 2, Math.PI / 2, true);
      shape.closePath();
      
      const extrudeSettings = {
        steps: 1,
        depth: depth,
        bevelEnabled: false
      };
      
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
  }
  
  // 19. ChamferRectangle3D
  class ChamferRectangle3D extends Shape3D {
    constructor(width, height, chamfer) {
      super();
      this.width = width;
      this.height = height;
      this.chamfer = Math.min(chamfer, width/2, height/2);
    }
    
    createGeometry(depth) {
      const w = this.width / 2;
      const h = this.height / 2;
      const c = this.chamfer;
      
      const points = [
        { x: -w + c, y: -h }, { x: w - c, y: -h },
        { x: w, y: -h + c }, { x: w, y: h - c },
        { x: w - c, y: h }, { x: -w + c, y: h },
        { x: -w, y: h - c }, { x: -w, y: -h + c }
      ];
      
      return this.extrudeFromPoints(points, depth);
    }
  }
  
  // 20. PolygonWithHoles3D
  class PolygonWithHoles3D extends Shape3D {
    constructor(outerPath, holes = []) {
      super();
      this.outerPath = outerPath;
      this.holes = holes;
    }
    
    createGeometry(depth) {
      if (!this.outerPath || this.outerPath.length < 3) {
        console.warn('PolygonWithHoles3D needs at least 3 points in outerPath');
        return new THREE.BufferGeometry();
      }
      
      // Create the main shape
      const shape = new THREE.Shape();
      
      shape.moveTo(this.outerPath[0][0], this.outerPath[0][1]);
      for (let i = 1; i < this.outerPath.length; i++) {
        shape.lineTo(this.outerPath[i][0], this.outerPath[i][1]);
      }
      shape.closePath();
      
      // Add holes
      for (const hole of this.holes) {
        if (hole.length >= 3) {
          const holePath = new THREE.Path();
          holePath.moveTo(hole[0][0], hole[0][1]);
          for (let i = 1; i < hole.length; i++) {
            holePath.lineTo(hole[i][0], hole[i][1]);
          }
          holePath.closePath();
          shape.holes.push(holePath);
        }
      }
      
      const extrudeSettings = {
        steps: 1,
        depth: depth,
        bevelEnabled: false
      };
      
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
  }
  
  // Export all 3D shapes
  export {
    Shape3D,
    Rectangle3D,
    Circle3D,
    Triangle3D,
    Ellipse3D,
    RegularPolygon3D,
    Star3D,
    Arc3D,
    RoundedRectangle3D,
    Path3D,
    Arrow3D,
    Text3D,
    BezierCurve3D,
    Donut3D,
    Spiral3D,
    Cross3D,
    Gear3D,
    Wave3D,
    Slot3D,
    ChamferRectangle3D,
    PolygonWithHoles3D
  };
  
  // Helper function to convert a 2D shape to 3D
  export function convert2DTo3D(shape2D, depth = 10) {
    // Identify the 2D shape type and create corresponding 3D shape
    const type = shape2D.constructor.name;
    
    switch (type) {
      case 'Rectangle':
        return new Rectangle3D(shape2D.width, shape2D.height)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Circle':
        return new Circle3D(shape2D.radius)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Triangle':
        return new Triangle3D(shape2D.base, shape2D.height)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Ellipse':
        return new Ellipse3D(shape2D.radiusX, shape2D.radiusY)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'RegularPolygon':
        return new RegularPolygon3D(shape2D.radius, shape2D.sides)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Star':
        return new Star3D(shape2D.outerRadius, shape2D.innerRadius, shape2D.points)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Arc':
        return new Arc3D(shape2D.radius, shape2D.startAngle, shape2D.endAngle)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'RoundedRectangle':
        return new RoundedRectangle3D(shape2D.width, shape2D.height, shape2D.radius)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Path':
        return new Path3D(shape2D.points, shape2D.closed)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Arrow':
        return new Arrow3D(shape2D.length, shape2D.headWidth, shape2D.headLength)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Text':
        return new Text3D(shape2D.text, shape2D.fontSize, shape2D.fontFamily)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'BezierCurve':
        return new BezierCurve3D(shape2D.start, shape2D.cp1, shape2D.cp2, shape2D.end)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Donut':
        return new Donut3D(shape2D.outerRadius, shape2D.innerRadius)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Spiral':
        return new Spiral3D(shape2D.startRadius, shape2D.endRadius, shape2D.turns)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Cross':
        return new Cross3D(shape2D.width, shape2D.thickness)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Gear':
        return new Gear3D(shape2D.pitch_diameter, shape2D.teeth)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Wave':
        return new Wave3D(shape2D.width, shape2D.amplitude, shape2D.frequency)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'Slot':
        return new Slot3D(shape2D.length, shape2D.width)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'ChamferRectangle':
        return new ChamferRectangle3D(shape2D.width, shape2D.height, shape2D.chamfer)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      case 'PolygonWithHoles':
        return new PolygonWithHoles3D(shape2D.outerPath, shape2D.holes)
          .setPosition(shape2D.position.x, shape2D.position.y)
          .createMesh(depth);
          
      default:
        console.warn(`Unknown shape type: ${type}`);
        return null;
    }
  }
