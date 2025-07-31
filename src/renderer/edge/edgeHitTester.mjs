// edgeHitTester.mjs - Precise mouse interaction detection for individual edges

import {
  StraightEdge,
  ArcEdge,
  BezierEdge,
  JointEdge,
  CornerEdge
} from './edgeSystem.mjs';

/**
 * EdgeHitTester - Handles mouse interaction with edges
 */
export class EdgeHitTester {
  constructor(options = {}) {
    this.options = {
      // Hit detection tolerances
      defaultTolerance: 8,        // Default hit distance in pixels
      straightEdgeTolerance: 8,   // Tolerance for straight edges
      arcEdgeTolerance: 12,       // Tolerance for arc edges (wider for curves)
      bezierEdgeTolerance: 15,    // Tolerance for bezier curves (widest)
      jointEdgeTolerance: 10,     // Tolerance for joint edges
      cornerTolerance: 12,        // Tolerance for corner points
      
      // Selection preferences
      preferShortestDistance: true,  // Prefer closest edge when multiple hits
      enableEdgeHover: true,         // Enable hover detection
      enableMultiSelect: false,      // Allow multiple edge selection
      
      // Performance settings
      useQuadTree: false,           // Use spatial partitioning (for large edge counts)
      maxEdgesForBruteForce: 500,   // Switch to spatial partitioning above this
      
      ...options
    };
    
    this.selectedEdges = new Set();
    this.hoveredEdge = null;
    this.edgeCache = new Map();
  }

  /**
   * Test if a point hits any edges in the collection
   */
  hitTest(x, y, edges, options = {}) {
    const testOptions = { ...this.options, ...options };
    const results = [];
    
    // Convert single edge to array
    const edgeArray = Array.isArray(edges) ? edges : [edges];
    
    for (const edge of edgeArray) {
      const distance = this.getDistanceToEdge(x, y, edge);
      const tolerance = this.getToleranceForEdge(edge, testOptions);
      
      if (distance <= tolerance) {
        results.push({
          edge: edge,
          distance: distance,
          tolerance: tolerance,
          hitPoint: this.getClosestPointOnEdge(x, y, edge),
          metadata: this.getEdgeMetadata(edge)
        });
      }
    }
    
    // Sort by distance if multiple hits
    if (testOptions.preferShortestDistance) {
      results.sort((a, b) => a.distance - b.distance);
    }
    
    return results;
  }

  /**
   * Test hit on a single edge
   */
  hitTestEdge(x, y, edge, options = {}) {
    const results = this.hitTest(x, y, [edge], options);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find the closest edge to a point
   */
  findClosestEdge(x, y, edges, maxDistance = null) {
    let closestEdge = null;
    let closestDistance = maxDistance || Infinity;
    let closestHitInfo = null;
    
    const edgeArray = Array.isArray(edges) ? edges : [edges];
    
    for (const edge of edgeArray) {
      const distance = this.getDistanceToEdge(x, y, edge);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEdge = edge;
        closestHitInfo = {
          edge: edge,
          distance: distance,
          hitPoint: this.getClosestPointOnEdge(x, y, edge),
          tolerance: this.getToleranceForEdge(edge),
          metadata: this.getEdgeMetadata(edge)
        };
      }
    }
    
    return closestHitInfo;
  }

  /**
   * Get distance from point to edge based on edge type
   */
  getDistanceToEdge(x, y, edge) {
    const cacheKey = `${x},${y},${edge.id || edge.index}`;
    
    if (this.edgeCache.has(cacheKey)) {
      return this.edgeCache.get(cacheKey);
    }
    
    let distance;
    
    switch (edge.type) {
      case 'straight':
        distance = this.distanceToStraightEdge(x, y, edge);
        break;
      case 'arc':
        distance = this.distanceToArcEdge(x, y, edge);
        break;
      case 'bezier':
        distance = this.distanceToBezierEdge(x, y, edge);
        break;
      case 'joint':
        distance = this.distanceToJointEdge(x, y, edge);
        break;
      case 'corner':
        distance = this.distanceToCorner(x, y, edge);
        break;
      default:
        // Treat unknown types as straight edges
        distance = this.distanceToStraightEdge(x, y, edge);
    }
    
    // Cache the result
    this.edgeCache.set(cacheKey, distance);
    
    return distance;
  }

  /**
   * Distance from point to straight edge (line segment)
   */
  distanceToStraightEdge(x, y, edge) {
    const startPoint = edge.startPoint || edge.start;
    const endPoint = edge.endPoint || edge.end;
    
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      // Edge is a point
      const pdx = x - startPoint.x;
      const pdy = y - startPoint.y;
      return Math.sqrt(pdx * pdx + pdy * pdy);
    }
    
    // Calculate parameter t for closest point on line
    const t = Math.max(0, Math.min(1, 
      ((x - startPoint.x) * dx + (y - startPoint.y) * dy) / (length * length)
    ));
    
    // Find closest point on line segment
    const closestX = startPoint.x + t * dx;
    const closestY = startPoint.y + t * dy;
    
    // Return distance to closest point
    const distX = x - closestX;
    const distY = y - closestY;
    return Math.sqrt(distX * distX + distY * distY);
  }

  /**
   * Distance from point to arc edge
   */
  distanceToArcEdge(x, y, edge) {
    const { center, radius, startAngle, endAngle, clockwise } = edge.properties || {};
    
    if (!center || !radius) {
      // Fallback to straight line if arc properties missing
      return this.distanceToStraightEdge(x, y, edge);
    }
    
    // Distance from point to arc center
    const centerDx = x - center.x;
    const centerDy = y - center.y;
    const distanceToCenter = Math.sqrt(centerDx * centerDx + centerDy * centerDy);
    
    // Angle of point relative to center
    const pointAngle = Math.atan2(centerDy, centerDx);
    
    // Check if point angle is within arc range
    const isInArcRange = this.isAngleInRange(pointAngle, startAngle, endAngle, clockwise);
    
    if (isInArcRange) {
      // Point is within arc angular range - distance to arc circumference
      return Math.abs(distanceToCenter - radius);
    } else {
      // Point is outside arc range - distance to nearest endpoint
      const startPoint = {
        x: center.x + radius * Math.cos(startAngle),
        y: center.y + radius * Math.sin(startAngle)
      };
      const endPoint = {
        x: center.x + radius * Math.cos(endAngle),
        y: center.y + radius * Math.sin(endAngle)
      };
      
      const distToStart = Math.sqrt(
        Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
      );
      const distToEnd = Math.sqrt(
        Math.pow(x - endPoint.x, 2) + Math.pow(y - endPoint.y, 2)
      );
      
      return Math.min(distToStart, distToEnd);
    }
  }

  /**
   * Distance from point to bezier curve edge
   */
  distanceToBezierEdge(x, y, edge) {
    const { controlPoint1, controlPoint2 } = edge.properties || {};
    
    if (!controlPoint1 || !controlPoint2) {
      return this.distanceToStraightEdge(x, y, edge);
    }
    
    // Sample the bezier curve and find minimum distance
    const startPoint = edge.startPoint || edge.start;
    const endPoint = edge.endPoint || edge.end;
    const samples = 20; // Number of samples along curve
    let minDistance = Infinity;
    
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const curvePoint = this.getBezierPoint(t, startPoint, controlPoint1, controlPoint2, endPoint);
      
      const dx = x - curvePoint.x;
      const dy = y - curvePoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }

  /**
   * Distance from point to joint edge (treated as straight with special tolerance)
   */
  distanceToJointEdge(x, y, edge) {
    // Joint edges are essentially straight edges with special properties
    return this.distanceToStraightEdge(x, y, edge);
  }

  /**
   * Distance from point to corner (point-to-point distance)
   */
  distanceToCorner(x, y, edge) {
    const cornerPoint = edge.startPoint || edge.point;
    if (!cornerPoint) return Infinity;
    
    const dx = x - cornerPoint.x;
    const dy = y - cornerPoint.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get closest point on edge to given coordinates
   */
  getClosestPointOnEdge(x, y, edge) {
    switch (edge.type) {
      case 'straight':
      case 'joint':
        return this.getClosestPointOnStraightEdge(x, y, edge);
      case 'arc':
        return this.getClosestPointOnArcEdge(x, y, edge);
      case 'bezier':
        return this.getClosestPointOnBezierEdge(x, y, edge);
      case 'corner':
        return edge.startPoint || edge.point;
      default:
        return this.getClosestPointOnStraightEdge(x, y, edge);
    }
  }

  /**
   * Get closest point on straight edge
   */
  getClosestPointOnStraightEdge(x, y, edge) {
    const startPoint = edge.startPoint || edge.start;
    const endPoint = edge.endPoint || edge.end;
    
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return startPoint;
    
    const t = Math.max(0, Math.min(1, 
      ((x - startPoint.x) * dx + (y - startPoint.y) * dy) / (length * length)
    ));
    
    return {
      x: startPoint.x + t * dx,
      y: startPoint.y + t * dy,
      parameter: t
    };
  }

  /**
   * Get closest point on arc edge
   */
  getClosestPointOnArcEdge(x, y, edge) {
    const { center, radius, startAngle, endAngle, clockwise } = edge.properties || {};
    
    if (!center || !radius) {
      return this.getClosestPointOnStraightEdge(x, y, edge);
    }
    
    const pointAngle = Math.atan2(y - center.y, x - center.x);
    
    if (this.isAngleInRange(pointAngle, startAngle, endAngle, clockwise)) {
      return {
        x: center.x + radius * Math.cos(pointAngle),
        y: center.y + radius * Math.sin(pointAngle),
        angle: pointAngle
      };
    } else {
      // Return closest endpoint
      const startPoint = {
        x: center.x + radius * Math.cos(startAngle),
        y: center.y + radius * Math.sin(startAngle)
      };
      const endPoint = {
        x: center.x + radius * Math.cos(endAngle),
        y: center.y + radius * Math.sin(endAngle)
      };
      
      const distToStart = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
      const distToEnd = Math.sqrt(Math.pow(x - endPoint.x, 2) + Math.pow(y - endPoint.y, 2));
      
      return distToStart < distToEnd ? startPoint : endPoint;
    }
  }

  /**
   * Get closest point on bezier curve
   */
  getClosestPointOnBezierEdge(x, y, edge) {
    const { controlPoint1, controlPoint2 } = edge.properties || {};
    
    if (!controlPoint1 || !controlPoint2) {
      return this.getClosestPointOnStraightEdge(x, y, edge);
    }
    
    const startPoint = edge.startPoint || edge.start;
    const endPoint = edge.endPoint || edge.end;
    const samples = 20;
    let closestPoint = startPoint;
    let closestDistance = Infinity;
    let closestT = 0;
    
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const curvePoint = this.getBezierPoint(t, startPoint, controlPoint1, controlPoint2, endPoint);
      
      const distance = Math.sqrt(
        Math.pow(x - curvePoint.x, 2) + Math.pow(y - curvePoint.y, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = curvePoint;
        closestT = t;
      }
    }
    
    return {
      ...closestPoint,
      parameter: closestT
    };
  }

  /**
   * Get appropriate tolerance for edge type
   */
  getToleranceForEdge(edge, options = {}) {
    const opts = { ...this.options, ...options };
    
    switch (edge.type) {
      case 'straight':
        return opts.straightEdgeTolerance;
      case 'arc':
        return opts.arcEdgeTolerance;
      case 'bezier':
        return opts.bezierEdgeTolerance;
      case 'joint':
        return opts.jointEdgeTolerance;
      case 'corner':
        return opts.cornerTolerance;
      default:
        return opts.defaultTolerance;
    }
  }

  /**
   * Get metadata for edge
   */
  getEdgeMetadata(edge) {
    return {
      type: edge.type,
      id: edge.id,
      index: edge.index,
      length: edge.getLength ? edge.getLength() : this.calculateEdgeLength(edge),
      properties: edge.properties || {},
      selectable: edge.selectable !== false,
      category: edge.category || 'unknown'
    };
  }

  /**
   * Calculate edge length for edges without getLength method
   */
  calculateEdgeLength(edge) {
    const startPoint = edge.startPoint || edge.start;
    const endPoint = edge.endPoint || edge.end;
    
    if (!startPoint || !endPoint) return 0;
    
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if angle is within arc range
   */
  isAngleInRange(angle, startAngle, endAngle, clockwise) {
    // Normalize angles to [0, 2π]
    const normalizeAngle = (a) => {
      while (a < 0) a += 2 * Math.PI;
      while (a >= 2 * Math.PI) a -= 2 * Math.PI;
      return a;
    };
    
    const normAngle = normalizeAngle(angle);
    const normStart = normalizeAngle(startAngle);
    const normEnd = normalizeAngle(endAngle);
    
    if (clockwise) {
      if (normStart > normEnd) {
        return normAngle >= normStart || normAngle <= normEnd;
      } else {
        return normAngle >= normStart && normAngle <= normEnd;
      }
    } else {
      if (normStart < normEnd) {
        return normAngle <= normStart || normAngle >= normEnd;
      } else {
        return normAngle <= normStart && normAngle >= normEnd;
      }
    }
  }

  /**
   * Get point on bezier curve at parameter t
   */
  getBezierPoint(t, p0, p1, p2, p3) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    
    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
    };
  }

  /**
   * Selection management
   */
  selectEdge(edge) {
    if (edge && edge.selectable !== false) {
      this.selectedEdges.add(edge);
      return true;
    }
    return false;
  }

  deselectEdge(edge) {
    return this.selectedEdges.delete(edge);
  }

  clearSelection() {
    this.selectedEdges.clear();
  }

  isEdgeSelected(edge) {
    return this.selectedEdges.has(edge);
  }

  getSelectedEdges() {
    return Array.from(this.selectedEdges);
  }

  /**
   * Hover management
   */
  setHoveredEdge(edge) {
    if (this.options.enableEdgeHover) {
      this.hoveredEdge = edge;
      return true;
    }
    return false;
  }

  clearHover() {
    this.hoveredEdge = null;
  }

  getHoveredEdge() {
    return this.hoveredEdge;
  }

  /**
   * Batch hit testing for multiple points
   */
  batchHitTest(points, edges, options = {}) {
    const results = [];
    
    for (const point of points) {
      const hitResults = this.hitTest(point.x, point.y, edges, options);
      if (hitResults.length > 0) {
        results.push({
          point: point,
          hits: hitResults
        });
      }
    }
    
    return results;
  }

  /**
   * Clear internal caches
   */
  clearCache() {
    this.edgeCache.clear();
  }

  /**
   * Get hit testing statistics
   */
  getStats() {
    return {
      selectedEdgeCount: this.selectedEdges.size,
      hoveredEdge: this.hoveredEdge ? this.hoveredEdge.id || 'unnamed' : null,
      cacheSize: this.edgeCache.size,
      options: { ...this.options }
    };
  }
}

/**
 * Convenience function to create EdgeHitTester and test point
 */
export function testEdgeHit(x, y, edges, options = {}) {
  const tester = new EdgeHitTester(options);
  return tester.hitTest(x, y, edges, options);
}

/**
 * Convenience function to find closest edge
 */
export function findClosestEdge(x, y, edges, maxDistance = null, options = {}) {
  const tester = new EdgeHitTester(options);
  return tester.findClosestEdge(x, y, edges, maxDistance);
}

export default EdgeHitTester;
