// edgeSystem.mjs - Core Edge Representation System
// Foundation data structure for representing edges in 2D shapes

/**
 * Base Edge class - Foundation for all edge types
 */
class Edge {
  constructor(type, startPoint, endPoint, properties = {}) {
    this.id = this.generateId();
    this.type = type;
    this.startPoint = { ...startPoint };
    this.endPoint = { ...endPoint };
    this.properties = { ...properties };
    this.metadata = {
      created: Date.now(),
      parentShape: null,
      index: null, // Position in parent shape's edge array
    };
  }

  generateId() {
    return `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get edge length
  getLength() {
    const dx = this.endPoint.x - this.startPoint.x;
    const dy = this.endPoint.y - this.startPoint.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Get edge direction (angle in radians)
  getDirection() {
    const dx = this.endPoint.x - this.startPoint.x;
    const dy = this.endPoint.y - this.startPoint.y;
    return Math.atan2(dy, dx);
  }

  // Get normalized direction vector
  getDirectionVector() {
    const length = this.getLength();
    if (length === 0) return { x: 0, y: 0 };
    
    const dx = this.endPoint.x - this.startPoint.x;
    const dy = this.endPoint.y - this.startPoint.y;
    return { x: dx / length, y: dy / length };
  }

  // Get perpendicular vector (normal)
  getNormal() {
    const dir = this.getDirectionVector();
    return { x: -dir.y, y: dir.x };
  }

  // Get midpoint
  getMidpoint() {
    return {
      x: (this.startPoint.x + this.endPoint.x) / 2,
      y: (this.startPoint.y + this.endPoint.y) / 2
    };
  }

  // Get bounding box
  getBounds() {
    const minX = Math.min(this.startPoint.x, this.endPoint.x);
    const maxX = Math.max(this.startPoint.x, this.endPoint.x);
    const minY = Math.min(this.startPoint.y, this.endPoint.y);
    const maxY = Math.max(this.startPoint.y, this.endPoint.y);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  // Transform edge (translate, rotate, scale)
  transform(transformation) {
    if (transformation.translate) {
      this.startPoint.x += transformation.translate.x;
      this.startPoint.y += transformation.translate.y;
      this.endPoint.x += transformation.translate.x;
      this.endPoint.y += transformation.translate.y;
    }

    if (transformation.rotate) {
      const { angle, center = { x: 0, y: 0 } } = transformation.rotate;
      this.startPoint = this.rotatePoint(this.startPoint, center, angle);
      this.endPoint = this.rotatePoint(this.endPoint, center, angle);
    }

    if (transformation.scale) {
      const { sx, sy, center = { x: 0, y: 0 } } = transformation.scale;
      this.startPoint = this.scalePoint(this.startPoint, center, sx, sy);
      this.endPoint = this.scalePoint(this.endPoint, center, sx, sy);
    }
  }

  rotatePoint(point, center, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  }

  scalePoint(point, center, sx, sy) {
    return {
      x: center.x + (point.x - center.x) * sx,
      y: center.y + (point.y - center.y) * sy
    };
  }

  // Clone edge
  clone() {
    const cloned = new this.constructor(
      this.type,
      this.startPoint,
      this.endPoint,
      this.properties
    );
    cloned.metadata = { ...this.metadata };
    return cloned;
  }

  // Convert to serializable object
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      startPoint: this.startPoint,
      endPoint: this.endPoint,
      properties: this.properties,
      metadata: this.metadata
    };
  }
}

/**
 * Straight Line Edge
 */
class StraightEdge extends Edge {
  constructor(startPoint, endPoint, properties = {}) {
    super('straight', startPoint, endPoint, properties);
  }

  // Get point at parameter t (0 to 1)
  getPointAt(t) {
    return {
      x: this.startPoint.x + t * (this.endPoint.x - this.startPoint.x),
      y: this.startPoint.y + t * (this.endPoint.y - this.startPoint.y)
    };
  }

  // Check if point is on edge (within tolerance)
  containsPoint(point, tolerance = 1.0) {
    const d = this.distanceToPoint(point);
    return d <= tolerance;
  }

  // Distance from point to edge
  distanceToPoint(point) {
    const dx = this.endPoint.x - this.startPoint.x;
    const dy = this.endPoint.y - this.startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      const pdx = point.x - this.startPoint.x;
      const pdy = point.y - this.startPoint.y;
      return Math.sqrt(pdx * pdx + pdy * pdy);
    }

    const t = Math.max(0, Math.min(1, 
      ((point.x - this.startPoint.x) * dx + (point.y - this.startPoint.y) * dy) / (length * length)
    ));

    const projection = this.getPointAt(t);
    const pdx = point.x - projection.x;
    const pdy = point.y - projection.y;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }
}

/**
 * Arc Edge (circular arc)
 */
class ArcEdge extends Edge {
  constructor(startPoint, endPoint, properties = {}) {
    super('arc', startPoint, endPoint, {
      center: { x: 0, y: 0 },
      radius: 0,
      startAngle: 0,
      endAngle: 0,
      clockwise: true,
      ...properties
    });
  }

  getLength() {
    const { radius, startAngle, endAngle, clockwise } = this.properties;
    let angleSpan = clockwise ? 
      (endAngle - startAngle) : 
      (startAngle - endAngle);
    
    if (angleSpan < 0) angleSpan += 2 * Math.PI;
    return radius * angleSpan;
  }

  getPointAt(t) {
    const { center, radius, startAngle, endAngle, clockwise } = this.properties;
    const angle = clockwise ? 
      startAngle + t * (endAngle - startAngle) :
      startAngle - t * (startAngle - endAngle);
    
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    };
  }

  getMidpoint() {
    return this.getPointAt(0.5);
  }

  getBounds() {
    // For arcs, we need to consider potential extrema
    const { center, radius } = this.properties;
    return {
      x: center.x - radius,
      y: center.y - radius,
      width: radius * 2,
      height: radius * 2
    };
  }
}

/**
 * Bezier Curve Edge
 */
class BezierEdge extends Edge {
  constructor(startPoint, endPoint, properties = {}) {
    super('bezier', startPoint, endPoint, {
      controlPoint1: startPoint,
      controlPoint2: endPoint,
      ...properties
    });
  }

  getPointAt(t) {
    const { controlPoint1, controlPoint2 } = this.properties;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: mt3 * this.startPoint.x + 
         3 * mt2 * t * controlPoint1.x + 
         3 * mt * t2 * controlPoint2.x + 
         t3 * this.endPoint.x,
      y: mt3 * this.startPoint.y + 
         3 * mt2 * t * controlPoint1.y + 
         3 * mt * t2 * controlPoint2.y + 
         t3 * this.endPoint.y
    };
  }

  getLength() {
    // Approximate length using subdivision
    let length = 0;
    const segments = 20;
    let prevPoint = this.startPoint;
    
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const point = this.getPointAt(t);
      const dx = point.x - prevPoint.x;
      const dy = point.y - prevPoint.y;
      length += Math.sqrt(dx * dx + dy * dy);
      prevPoint = point;
    }
    
    return length;
  }
}

/**
 * Corner Edge (represents a corner/vertex between two edges)
 */
class CornerEdge extends Edge {
  constructor(point, properties = {}) {
    super('corner', point, point, {
      angle: 0, // Interior angle
      radius: 0, // Fillet radius if applicable
      leftEdge: null, // Reference to incoming edge
      rightEdge: null, // Reference to outgoing edge
      ...properties
    });
  }

  getLength() {
    return 0; // Corners have no length
  }

  // Get the bisector direction of the corner
  getBisector() {
    const { leftEdge, rightEdge } = this.properties;
    if (!leftEdge || !rightEdge) return { x: 0, y: 0 };

    const leftDir = leftEdge.getDirectionVector();
    const rightDir = rightEdge.getDirectionVector();
    
    const bisectorX = leftDir.x + rightDir.x;
    const bisectorY = leftDir.y + rightDir.y;
    const length = Math.sqrt(bisectorX * bisectorX + bisectorY * bisectorY);
    
    return length > 0 ? 
      { x: bisectorX / length, y: bisectorY / length } :
      { x: 0, y: 0 };
  }
}

/**
 * Joint Edge (specialized for woodworking joints)
 */
class JointEdge extends Edge {
  constructor(startPoint, endPoint, properties = {}) {
    super('joint', startPoint, endPoint, {
      jointType: 'unknown', // dovetail, finger, lap, etc.
      maleProfile: true, // true for pin, false for socket
      tolerance: 0.1,
      depth: 0,
      ...properties
    });
  }

  // Check if this edge can mate with another joint edge
  canMateWith(otherEdge) {
    if (!(otherEdge instanceof JointEdge)) return false;
    
    const { jointType, maleProfile } = this.properties;
    const { jointType: otherType, maleProfile: otherMale } = otherEdge.properties;
    
    return jointType === otherType && maleProfile !== otherMale;
  }

  // Get mating tolerance
  getTolerance() {
    return this.properties.tolerance || 0.1;
  }
}

/**
 * Edge Collection - Manages groups of edges
 */
class EdgeCollection {
  constructor() {
    this.edges = [];
    this.metadata = {
      created: Date.now(),
      parentShape: null,
      closed: false
    };
  }

  addEdge(edge) {
    edge.metadata.index = this.edges.length;
    this.edges.push(edge);
    return this;
  }

  removeEdge(edgeId) {
    const index = this.edges.findIndex(e => e.id === edgeId);
    if (index !== -1) {
      this.edges.splice(index, 1);
      // Update indices
      this.edges.forEach((edge, i) => {
        edge.metadata.index = i;
      });
    }
    return this;
  }

  getEdge(edgeId) {
    return this.edges.find(e => e.id === edgeId);
  }

  getEdgeAt(index) {
    return this.edges[index];
  }

  getEdgeCount() {
    return this.edges.length;
  }

  // Get edges by type
  getEdgesByType(type) {
    return this.edges.filter(e => e.type === type);
  }

  // Get total perimeter
  getTotalLength() {
    return this.edges.reduce((total, edge) => total + edge.getLength(), 0);
  }

  // Get bounding box of all edges
  getBounds() {
    if (this.edges.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    this.edges.forEach(edge => {
      const bounds = edge.getBounds();
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  // Transform all edges
  transform(transformation) {
    this.edges.forEach(edge => edge.transform(transformation));
    return this;
  }

  // Convert to array of points (for rendering)
  toPoints() {
    const points = [];
    this.edges.forEach(edge => {
      if (edge.type === 'straight') {
        points.push(edge.startPoint);
      } else {
        // For curves, sample points
        const segments = 10;
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          points.push(edge.getPointAt(t));
        }
      }
    });
    return points;
  }

  // Clone collection
  clone() {
    const cloned = new EdgeCollection();
    cloned.metadata = { ...this.metadata };
    this.edges.forEach(edge => {
      cloned.addEdge(edge.clone());
    });
    return cloned;
  }

  // Convert to JSON
  toJSON() {
    return {
      edges: this.edges.map(e => e.toJSON()),
      metadata: this.metadata
    };
  }
}

/**
 * Edge Factory - Creates edges of different types
 */
class EdgeFactory {
  static createEdge(type, startPoint, endPoint, properties = {}) {
    switch (type) {
      case 'straight':
      case 'line':
        return new StraightEdge(startPoint, endPoint, properties);
      
      case 'arc':
        return new ArcEdge(startPoint, endPoint, properties);
      
      case 'bezier':
      case 'curve':
        return new BezierEdge(startPoint, endPoint, properties);
      
      case 'corner':
        return new CornerEdge(startPoint, properties);
      
      case 'joint':
        return new JointEdge(startPoint, endPoint, properties);
      
      default:
        return new StraightEdge(startPoint, endPoint, properties);
    }
  }

  static createFromPoints(points, edgeType = 'straight') {
    const collection = new EdgeCollection();
    
    for (let i = 0; i < points.length - 1; i++) {
      const edge = this.createEdge(edgeType, points[i], points[i + 1]);
      collection.addEdge(edge);
    }
    
    return collection;
  }

  static createClosedPath(points, edgeType = 'straight') {
    const collection = this.createFromPoints(points, edgeType);
    
    // Close the path if not already closed
    if (points.length > 2) {
      const lastPoint = points[points.length - 1];
      const firstPoint = points[0];
      
      if (lastPoint.x !== firstPoint.x || lastPoint.y !== firstPoint.y) {
        const closingEdge = this.createEdge(edgeType, lastPoint, firstPoint);
        collection.addEdge(closingEdge);
      }
    }
    
    collection.metadata.closed = true;
    return collection;
  }
}

// Export the edge system
export {
  Edge,
  StraightEdge,
  ArcEdge,
  BezierEdge,
  CornerEdge,
  JointEdge,
  EdgeCollection,
  EdgeFactory
};
