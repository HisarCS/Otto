// BooleanOperators.mjs
import {
    Rectangle,
    Circle,
    Triangle,
    Ellipse,
    RegularPolygon,
    Star,
    Arc,
    RoundedRectangle,
    Path,
    Arrow,
    Text,
    BezierCurve,
    Donut,
    Spiral,
    Cross,
    Wave,
    Slot,
    ChamferRectangle,
    PolygonWithHoles
} from './Shapes.mjs';

class BooleanNaming {
    constructor() {
        this.operationSymbols = {
            'union': 'u',
            'difference': 'd',
            'intersection': 'i'
        };
        this.counter = new Map();
    }

    reset() {
        this.counter.clear();
    }

    getNextCount(operation) {
        const current = this.counter.get(operation) || 0;
        this.counter.set(operation, current + 1);
        return current + 1;
    }

    generateName(operation, shapes) {
        const opSymbol = this.operationSymbols[operation];
        const count = this.getNextCount(operation);
        const baseName = shapes[0] && typeof shapes[0] === 'string' ? shapes[0] : 'shape';
        return `${baseName}_${opSymbol}${count}`;
    }
}

export class BooleanOperator {
    constructor() {
        // Increase precision threshold for better numerical stability
        this.epsilon = 1e-10;
        this.naming = new BooleanNaming();
        
        // Resolution for approximating curved shapes
        this.curvedShapeResolution = 100;
    }

    // Create shape instance based on shape type
    createShapeInstance(shape) {
        if (!shape || !shape.type || !shape.params) {
            throw new Error('Invalid shape object');
        }
        
        try {
            switch (shape.type) {
                case 'rectangle':
                    return new Rectangle(shape.params.width, shape.params.height);
                case 'circle':
                    return new Circle(shape.params.radius);
                case 'triangle':
                    return new Triangle(shape.params.base, shape.params.height);
                case 'ellipse':
                    return new Ellipse(shape.params.radiusX, shape.params.radiusY);
                case 'polygon':
                    return new RegularPolygon(shape.params.radius, shape.params.sides);
                case 'star':
                    return new Star(shape.params.outerRadius, shape.params.innerRadius, shape.params.points);
                case 'arc':
                    return new Arc(shape.params.radius, shape.params.startAngle, shape.params.endAngle);
                case 'roundedRectangle':
                    return new RoundedRectangle(shape.params.width, shape.params.height, shape.params.radius);
                case 'arrow':
                    return new Arrow(shape.params.length, shape.params.headWidth, shape.params.headLength);
                case 'donut':
                    return new Donut(shape.params.outerRadius, shape.params.innerRadius);
                case 'spiral':
                    return new Spiral(shape.params.startRadius, shape.params.endRadius, shape.params.turns);
                case 'cross':
                    return new Cross(shape.params.width, shape.params.thickness);
                case 'wave':
                    return new Wave(shape.params.width, shape.params.amplitude, shape.params.frequency);
                case 'slot':
                    return new Slot(shape.params.length, shape.params.width);
                case 'chamferRectangle':
                    return new ChamferRectangle(shape.params.width, shape.params.height, shape.params.chamfer);
                case 'polygonWithHoles':
                    return new PolygonWithHoles(shape.params.outerPoints, shape.params.holes);
                default:
                    throw new Error(`Unsupported shape type: ${shape.type}`);
            }
        } catch (error) {
            throw new Error(`Error creating shape instance: ${error.message}`);
        }
    }

    // Get points representation of a shape
    getPoints(shape) {
        try {
            // If it's a path type with points, return those points
            if (shape.type === 'path' && shape.params.points) {
                // For turtle paths with subPaths, flatten them
                if (shape.params.isTurtlePath && Array.isArray(shape.params.subPaths)) {
                    const allPoints = [];
                    for (const subPath of shape.params.subPaths) {
                        if (subPath.length > 0) {
                            allPoints.push(...subPath);
                        }
                    }
                    return allPoints;
                }
                return shape.params.points;
            }

            // For primitive shapes, get points using shape classes
            const shapeInstance = this.createShapeInstance(shape);
            
            // Increase resolution for curved shapes
            const resolution = this.isShapeCurved(shape.type) ? 
                this.curvedShapeResolution : undefined;
            
            // Get points using the shape's built-in getPoints method
            const points = shapeInstance.getPoints(resolution);

            // Apply transformations and convert to [x,y] format
            return this.transformPoints(points, shape.transform);
        } catch (error) {
            throw new Error(`Error getting points for ${shape.type}: ${error.message}`);
        }
    }

    // Determine if a shape should be approximated with higher resolution
    isShapeCurved(shapeType) {
        return ['circle', 'ellipse', 'arc', 'roundedRectangle', 'spiral', 
                'donut', 'wave', 'bezier'].includes(shapeType);
    }

    // Apply transformations to points
    transformPoints(points, transform) {
        if (!transform) return points.map(p => [p.x, p.y]);
        if (!Array.isArray(points) || points.length === 0) return [];

        const { position, rotation, scale } = transform;
        return points.map(p => {
            // Handle numeric instability
            if (typeof p.x !== 'number' || typeof p.y !== 'number' || 
                isNaN(p.x) || isNaN(p.y)) {
                return [0, 0]; // Default for invalid points
            }
            
            // Scale
            let x = p.x * (scale?.[0] || 1);
            let y = p.y * (scale?.[1] || 1);
            
            // Rotate
            if (rotation) {
                const rad = rotation * Math.PI / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const rx = x * cos - y * sin;
                const ry = x * sin + y * cos;
                x = rx;
                y = ry;
            }
            
            // Translate
            if (position) {
                x += position[0] || 0;
                y += position[1] || 0;
            }
            
            return [x, y];
        });
    }

    // Enhanced point-in-polygon test with improved numerical stability
    isPointInPolygon(point, polygon) {
        if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
            return false;
        }
        
        let inside = false;
        const x = point[0], y = point[1];
        
        // Ray casting algorithm with improved precision
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];
            
            // Point is on the edge
            if (this.isPointOnSegment(point, [xi, yi], [xj, yj])) {
                return true;
            }
            
            // Ray casting test with strict inequality to avoid edge cases
            const intersect = ((yi > y) !== (yj > y)) && 
                              (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        
        return inside;
    }

    // Find intersection between two line segments with improved precision
    findIntersection(p1, p2, p3, p4) {
        const x1 = p1[0], y1 = p1[1];
        const x2 = p2[0], y2 = p2[1];
        const x3 = p3[0], y3 = p3[1];
        const x4 = p4[0], y4 = p4[1];

        // Check if segments are parallel
        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denominator) < this.epsilon) return null;

        // Calculate parameters t and u
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

        // Check if intersection is within both segments
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            // Calculate intersection point with higher precision
            return [
                x1 + t * (x2 - x1),
                y1 + t * (y2 - y1)
            ];
        }

        return null;
    }

    // Find all intersections between two polygons
    findAllIntersections(shape1Points, shape2Points) {
        if (!Array.isArray(shape1Points) || !Array.isArray(shape2Points) ||
            shape1Points.length < 3 || shape2Points.length < 3) {
            return [];
        }
        
        const intersections = [];
        
        for (let i = 0; i < shape1Points.length; i++) {
            const p1 = shape1Points[i];
            const p2 = shape1Points[(i + 1) % shape1Points.length];

            for (let j = 0; j < shape2Points.length; j++) {
                const p3 = shape2Points[j];
                const p4 = shape2Points[(j + 1) % shape2Points.length];

                // Skip calculation if segments share an endpoint
                if (this.pointsEqual(p1, p3) || this.pointsEqual(p1, p4) ||
                    this.pointsEqual(p2, p3) || this.pointsEqual(p2, p4)) {
                    continue;
                }

                const intersection = this.findIntersection(p1, p2, p3, p4);
                if (intersection) {
                    // Only add unique intersection points
                    this.addUniquePoint(intersections, intersection);
                }
            }
        }

        return intersections;
    }
    
    // Check if two points are equal (within epsilon)
    pointsEqual(p1, p2) {
        return Math.abs(p1[0] - p2[0]) < this.epsilon && 
               Math.abs(p1[1] - p2[1]) < this.epsilon;
    }
    
    // Add a point if it's not already in the array
    addUniquePoint(points, point) {
        if (!points.some(p => this.pointsEqual(p, point))) {
            points.push(point);
        }
    }
    
    // Remove duplicate points with higher precision
    removeDuplicatePoints(points) {
        if (!Array.isArray(points)) return [];
        
        const result = [];
        for (const point of points) {
            this.addUniquePoint(result, point);
        }
        return result;
    }

    // Order points in counter-clockwise order
    orderPoints(points) {
        if (!Array.isArray(points) || points.length <= 2) return points;

        try {
            // Calculate the centroid with greater precision
            const centroid = this.calculateCentroid(points);
            
            // Sort points by angle from centroid
            return [...points].sort((a, b) => {
                // Handle numerical instability
                if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) {
                    return 0;
                }
                
                const angleA = Math.atan2(a[1] - centroid[1], a[0] - centroid[0]);
                const angleB = Math.atan2(b[1] - centroid[1], b[0] - centroid[0]);
                
                if (Math.abs(angleA - angleB) < this.epsilon) {
                    // If angles are very close, sort by distance from centroid
                    const distA = this.distance(a, centroid);
                    const distB = this.distance(b, centroid);
                    return distA - distB;
                }
                
                return angleA - angleB;
            });
        } catch (error) {
            console.error('Error ordering points:', error);
            return points; // Return original points if ordering fails
        }
    }
    
    // Calculate centroid (geometric center) of points
    calculateCentroid(points) {
        if (points.length === 0) return [0, 0];
        
        // Calculate average of x and y coordinates
        let sumX = 0, sumY = 0;
        for (const point of points) {
            sumX += point[0];
            sumY += point[1];
        }
        
        return [sumX / points.length, sumY / points.length];
    }

    // Implementation of union operation with improved edge case handling
    union(shapes) {
        if (!Array.isArray(shapes) || shapes.length === 0) {
            throw new Error('Union operation requires at least one shape');
        }
        
        if (shapes.length === 1) {
            return this.getPoints(shapes[0]);
        }
        
        try {
            const firstShape = shapes[0];
            let resultPoints = this.getPoints(firstShape);
            
            if (!Array.isArray(resultPoints) || resultPoints.length < 3) {
                throw new Error('Invalid shape points for union');
            }

            for (let i = 1; i < shapes.length; i++) {
                const nextShape = shapes[i];
                const nextPoints = this.getPoints(nextShape);
                
                if (!Array.isArray(nextPoints) || nextPoints.length < 3) {
                    continue; // Skip invalid shapes
                }
                
                // Find intersections between shapes
                const intersections = this.findAllIntersections(resultPoints, nextPoints);
                
                // Get boundary points
                let boundaryPoints = [];
                
                // Add points from first shape that are outside second shape
                resultPoints.forEach(p => {
                    if (!this.isPointInPolygon(p, nextPoints)) {
                        boundaryPoints.push(p);
                    }
                });

                // Add points from second shape that are outside first shape
                nextPoints.forEach(p => {
                    if (!this.isPointInPolygon(p, resultPoints)) {
                        boundaryPoints.push(p);
                    }
                });

                // Add intersection points
                boundaryPoints = [...boundaryPoints, ...intersections];

                // Special case: if no intersections and one shape is inside the other
                if (intersections.length === 0) {
                    if (this.isPointInPolygon(resultPoints[0], nextPoints)) {
                        // Result completely inside next shape, use next shape
                        boundaryPoints = nextPoints;
                    } else if (this.isPointInPolygon(nextPoints[0], resultPoints)) {
                        // Next shape completely inside result, keep result
                        boundaryPoints = resultPoints;
                    }
                    // If neither contains the other, we already have correct boundary points
                }

                // Remove duplicates
                boundaryPoints = this.removeDuplicatePoints(boundaryPoints);

                // Order points by angle from centroid
                resultPoints = this.orderPoints(boundaryPoints);
            }

            return resultPoints;
        } catch (error) {
            console.error('Error performing union:', error);
            // Return points from first shape if union fails
            return this.getPoints(shapes[0]);
        }
    }

    // Implementation of difference operation with improved robustness
    difference(shapes) {
        if (!Array.isArray(shapes) || shapes.length < 2) {
            throw new Error('Difference operation requires at least two shapes');
        }
        
        try {
            const baseShape = shapes[0];
            const subtractShape = shapes[1];
            
            let resultPoints = this.getPoints(baseShape);
            let subtractPoints = this.getPoints(subtractShape);
            
            if (!Array.isArray(resultPoints) || resultPoints.length < 3 || 
                !Array.isArray(subtractPoints) || subtractPoints.length < 3) {
                throw new Error('Invalid shape points for difference');
            }

            // Find all intersection points
            const intersections = this.findAllIntersections(resultPoints, subtractPoints);
            
            // Check for no intersection cases
            if (intersections.length === 0) {
                // If base shape is completely inside subtract shape, result is empty
                if (this.isPointInPolygon(resultPoints[0], subtractPoints)) {
                    return []; 
                }
                // If no intersections and base shape is not inside subtract shape, 
                // return original shape
                return resultPoints;
            }

            // Use more robust polygon clipping approach
            return this.robustDifference(resultPoints, subtractPoints, intersections);
        } catch (error) {
            console.error('Error performing difference:', error);
            // Return points from first shape if difference fails
            return this.getPoints(shapes[0]);
        }
    }
    
    // More robust implementation of polygon difference
    robustDifference(basePoints, subtractPoints, intersections) {
        // Create a map to track which segments of the base shape are inside/outside
        const baseSegments = [];
        for (let i = 0; i < basePoints.length; i++) {
            const start = basePoints[i];
            const end = basePoints[(i + 1) % basePoints.length];
            const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
            
            baseSegments.push({
                start,
                end,
                isInside: this.isPointInPolygon(midpoint, subtractPoints)
            });
        }
        
        // Build the result polygon using outside segments and intersection points
        let resultPoints = [];
        let currentPoint = null;
        let isTracing = false;
        
        // Start from a segment that's outside
        const startSegmentIndex = baseSegments.findIndex(seg => !seg.isInside);
        if (startSegmentIndex === -1) {
            return []; // All segments are inside, result is empty
        }
        
        // Traverse base polygon segments
        for (let i = 0; i < baseSegments.length; i++) {
            const segmentIndex = (startSegmentIndex + i) % baseSegments.length;
            const segment = baseSegments[segmentIndex];
            
            if (!segment.isInside) {
                // If not already tracing, add start point
                if (!isTracing) {
                    resultPoints.push(segment.start);
                    isTracing = true;
                }
                
                // Add end point
                resultPoints.push(segment.end);
                currentPoint = segment.end;
            } else {
                // We're entering subtract shape, find the intersection
                if (isTracing) {
                    // Find intersection with subtract shape
                    for (let j = 0; j < subtractPoints.length; j++) {
                        const p3 = subtractPoints[j];
                        const p4 = subtractPoints[(j + 1) % subtractPoints.length];
                        
                        const intersection = this.findIntersection(
                            segment.start, segment.end, p3, p4);
                        
                        if (intersection) {
                            resultPoints.push(intersection);
                            isTracing = false;
                            break;
                        }
                    }
                }
            }
        }
        
        // Remove duplicates and order points
        resultPoints = this.removeDuplicatePoints(resultPoints);
        return this.orderPoints(resultPoints);
    }

    // Implementation of intersection operation with improved robustness
    intersection(shapes) {
        if (!Array.isArray(shapes) || shapes.length < 2) {
            throw new Error('Intersection operation requires at least two shapes');
        }
        
        try {
            const firstShape = shapes[0];
            let resultPoints = this.getPoints(firstShape);
            
            if (!Array.isArray(resultPoints) || resultPoints.length < 3) {
                throw new Error('Invalid shape points for intersection');
            }

            for (let i = 1; i < shapes.length; i++) {
                const nextShape = shapes[i];
                const nextPoints = this.getPoints(nextShape);
                
                if (!Array.isArray(nextPoints) || nextPoints.length < 3) {
                    return []; // If any shape is invalid, intersection is empty
                }
                
                // Find intersections between shapes
                const intersections = this.findAllIntersections(resultPoints, nextPoints);
                
                // Special case: if no intersections, check if one shape is inside the other
                if (intersections.length === 0) {
                    if (this.isPointInPolygon(resultPoints[0], nextPoints)) {
                        // Result completely inside next shape, keep result
                        continue;
                    } else if (this.isPointInPolygon(nextPoints[0], resultPoints)) {
                        // Next shape completely inside result, use next shape
                        resultPoints = nextPoints;
                        continue;
                    } else {
                        // No intersections and neither contains the other, result is empty
                        return [];
                    }
                }
                
                // Get intersection points
                let intersectionPoints = [
                    ...resultPoints.filter(p => this.isPointInPolygon(p, nextPoints)),
                    ...nextPoints.filter(p => this.isPointInPolygon(p, resultPoints)),
                    ...intersections
                ];

                // Remove duplicates
                intersectionPoints = this.removeDuplicatePoints(intersectionPoints);
                
                // If no points remain, intersection is empty
                if (intersectionPoints.length === 0) {
                    return [];
                }
                
                // Order points by angle from centroid
                resultPoints = this.orderPoints(intersectionPoints);
            }

            return resultPoints;
        } catch (error) {
            console.error('Error performing intersection:', error);
            return []; // Return empty array if intersection fails
        }
    }

    // Distance between two points
    distance(p1, p2) {
        if (!Array.isArray(p1) || !Array.isArray(p2) || p1.length < 2 || p2.length < 2) {
            return Infinity;
        }
        return Math.sqrt(
            Math.pow(p2[0] - p1[0], 2) + 
            Math.pow(p2[1] - p1[1], 2)
        );
    }

    // Check if a point lies on a line segment
    isPointOnSegment(point, start, end) {
        const d1 = this.distance(point, start);
        const d2 = this.distance(point, end);
        const lineLen = this.distance(start, end);
        return Math.abs(d1 + d2 - lineLen) < this.epsilon;
    }

    // Create result shape from points
    createResultShape(points, operation, shapes) {
        try {
            // Generate a name based on the operation and input shapes
            const name = this.naming.generateName(
                operation, 
                shapes.map(s => s.name || 'shape')
            );
            
            // Create a path shape from the points
            return {
                type: 'path',
                name: name,
                params: {
                    points: points,
                    closed: true,
                    operation: operation
                },
                transform: {
                    position: [0, 0],
                    rotation: 0,
                    scale: [1, 1]
                }
            };
        } catch (error) {
            console.error('Error creating result shape:', error);
            // Return empty shape if creation fails
            return {
                type: 'path',
                name: `error_${operation}`,
                params: { points: [], closed: true, operation },
                transform: { position: [0, 0], rotation: 0, scale: [1, 1] }
            };
        }
    }

    // Public API methods with error handling
    performDifference(shapes) {
        try {
            if (!Array.isArray(shapes) || shapes.length < 2) {
                throw new Error('Difference operation requires at least two shapes');
            }
            
            const resultPoints = this.difference(shapes);
            if (!Array.isArray(resultPoints) || resultPoints.length < 3) {
                throw new Error('Difference operation resulted in invalid shape');
            }
            
            return this.createResultShape(resultPoints, 'difference', shapes);
        } catch (error) {
            console.error('Error in performDifference:', error);
            // Return empty shape on error
            return this.createResultShape([], 'difference', shapes);
        }
    }

    performUnion(shapes) {
        try {
            if (!Array.isArray(shapes) || shapes.length < 2) {
                throw new Error('Union operation requires at least two shapes');
            }
            
            const resultPoints = this.union(shapes);
            if (!Array.isArray(resultPoints) || resultPoints.length < 3) {
                throw new Error('Union operation resulted in invalid shape');
            }
            
            return this.createResultShape(resultPoints, 'union', shapes);
        } catch (error) {
            console.error('Error in performUnion:', error);
            // Fall back to first shape on error
            const firstShape = shapes[0];
            const points = firstShape ? this.getPoints(firstShape) : [];
            return this.createResultShape(points, 'union', shapes);
        }
    }

    performIntersection(shapes) {
        try {
            if (!Array.isArray(shapes) || shapes.length < 2) {
                throw new Error('Intersection operation requires at least two shapes');
            }
            
            const resultPoints = this.intersection(shapes);
            if (!Array.isArray(resultPoints) || resultPoints.length < 3) {
                // Empty intersection is a valid result
                return this.createResultShape([], 'intersection', shapes);
            }
            
            return this.createResultShape(resultPoints, 'intersection', shapes);
        } catch (error) {
            console.error('Error in performIntersection:', error);
            // Return empty shape on error
            return this.createResultShape([], 'intersection', shapes);
        }
    }

    resetNaming() {
        this.naming.reset();
    }
}

// Export singleton instance
export const booleanOperator = new BooleanOperator();