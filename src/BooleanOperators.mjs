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
        this.epsilon = 1e-8;
        this.naming = new BooleanNaming();
        this.curvedShapeResolution = 64;
    }

    createShapeInstance(shape) {
        if (!shape || !shape.type || !shape.params) {
            throw new Error('Invalid shape object');
        }
        
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
    }

    getPoints(shape) {
        if (shape.type === 'path' && shape.params.points) {
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

        const shapeInstance = this.createShapeInstance(shape);
        const resolution = this.isShapeCurved(shape.type) ? this.curvedShapeResolution : undefined;
        const points = shapeInstance.getPoints(resolution);
        return this.transformPoints(points, shape.transform);
    }

    isShapeCurved(shapeType) {
        return ['circle', 'ellipse', 'arc', 'roundedRectangle', 'spiral', 
                'donut', 'wave', 'bezier'].includes(shapeType);
    }

    transformPoints(points, transform) {
        if (!transform) return points.map(p => [p.x, p.y]);
        if (!Array.isArray(points) || points.length === 0) return [];

        const { position, rotation, scale } = transform;
        return points.map(p => {
            if (typeof p.x !== 'number' || typeof p.y !== 'number' || 
                isNaN(p.x) || isNaN(p.y)) {
                return [0, 0];
            }
            
            let x = p.x * (scale?.[0] || 1);
            let y = p.y * (scale?.[1] || 1);
            
            if (rotation) {
                const rad = rotation * Math.PI / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const rx = x * cos - y * sin;
                const ry = x * sin + y * cos;
                x = rx;
                y = ry;
            }
            
            if (position) {
                x += position[0] || 0;
                y += position[1] || 0;
            }
            
            return [x, y];
        });
    }

    pointsEqual(p1, p2) {
        return Math.abs(p1[0] - p2[0]) < this.epsilon && 
               Math.abs(p1[1] - p2[1]) < this.epsilon;
    }

    distance(p1, p2) {
        if (!Array.isArray(p1) || !Array.isArray(p2) || p1.length < 2 || p2.length < 2) {
            return Infinity;
        }
        return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
    }

    isPointInPolygon(point, polygon) {
        if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
            return false;
        }
        
        let inside = false;
        const x = point[0], y = point[1];
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];
            
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    findIntersection(p1, p2, p3, p4) {
        const x1 = p1[0], y1 = p1[1];
        const x2 = p2[0], y2 = p2[1];
        const x3 = p3[0], y3 = p3[1];
        const x4 = p4[0], y4 = p4[1];

        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denominator) < this.epsilon) return null;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return [
                x1 + t * (x2 - x1),
                y1 + t * (y2 - y1)
            ];
        }

        return null;
    }

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

                if (this.pointsEqual(p1, p3) || this.pointsEqual(p1, p4) ||
                    this.pointsEqual(p2, p3) || this.pointsEqual(p2, p4)) {
                    continue;
                }

                const intersection = this.findIntersection(p1, p2, p3, p4);
                if (intersection) {
                    this.addUniquePoint(intersections, intersection);
                }
            }
        }

        return intersections;
    }

    addUniquePoint(points, point) {
        if (!points.some(p => this.pointsEqual(p, point))) {
            points.push(point);
        }
    }

    removeDuplicatePoints(points) {
        if (!Array.isArray(points)) return [];
        
        const result = [];
        for (const point of points) {
            if (!result.some(p => this.pointsEqual(p, point))) {
                result.push(point);
            }
        }
        return result;
    }

    difference(shapes) {
        if (!Array.isArray(shapes) || shapes.length < 2) {
            throw new Error('Difference operation requires at least two shapes');
        }
        
        const baseShape = shapes[0];
        const subtractShape = shapes[1];
        
        if (this.areShapesParametricallyIdentical(baseShape, subtractShape)) {
            return [];
        }
        
        let basePoints = this.getPoints(baseShape);
        let subtractPoints = this.getPoints(subtractShape);
        
        if (!Array.isArray(basePoints) || basePoints.length < 3 || 
            !Array.isArray(subtractPoints) || subtractPoints.length < 3) {
            throw new Error('Invalid shape points for difference');
        }

        const intersections = this.findAllIntersections(basePoints, subtractPoints);
        
        if (intersections.length === 0) {
            if (this.isShapeCompletelyInside(basePoints, subtractPoints)) {
                return [];
            }
            if (this.isShapeCompletelyInside(subtractPoints, basePoints)) {
                return this.createDonutPath(basePoints, subtractPoints);
            }
            return basePoints;
        }

        return this.clipDifference(basePoints, subtractPoints, intersections);
    }

    areShapesParametricallyIdentical(shape1, shape2) {
        if (shape1.type !== shape2.type) return false;
        
        const params1 = shape1.params;
        const params2 = shape2.params;
        const transform1 = shape1.transform;
        const transform2 = shape2.transform;
        
        if (shape1.type === 'circle') {
            const sameRadius = Math.abs(params1.radius - params2.radius) < this.epsilon;
            const sameX = Math.abs((transform1?.position?.[0] || 0) - (transform2?.position?.[0] || 0)) < this.epsilon;
            const sameY = Math.abs((transform1?.position?.[1] || 0) - (transform2?.position?.[1] || 0)) < this.epsilon;
            return sameRadius && sameX && sameY;
        }
        
        if (shape1.type === 'rectangle') {
            const sameWidth = Math.abs(params1.width - params2.width) < this.epsilon;
            const sameHeight = Math.abs(params1.height - params2.height) < this.epsilon;
            const sameX = Math.abs((transform1?.position?.[0] || 0) - (transform2?.position?.[0] || 0)) < this.epsilon;
            const sameY = Math.abs((transform1?.position?.[1] || 0) - (transform2?.position?.[1] || 0)) < this.epsilon;
            return sameWidth && sameHeight && sameX && sameY;
        }
        
        return false;
    }

    isShapeCompletelyInside(testPoints, containerPoints) {
        return testPoints.every(point => this.isPointInPolygon(point, containerPoints));
    }

    createDonutPath(outerPoints, innerPoints) {
        return [...outerPoints, null, ...innerPoints.slice().reverse()];
    }

    clipDifference(basePoints, subtractPoints, intersections) {
        if (intersections.length < 2) {
            return basePoints.filter(p => !this.isPointInPolygon(p, subtractPoints));
        }

        const clippedPaths = this.performBoundaryTracing(basePoints, subtractPoints, intersections);
        
        if (clippedPaths.length === 0) {
            return [];
        }

        return clippedPaths[0];
    }

    performBoundaryTracing(basePoints, subtractPoints, intersections) {
        const augmentedBase = this.insertIntersections(basePoints, intersections, subtractPoints);
        const augmentedSubtract = this.insertIntersections(subtractPoints, intersections, basePoints);
        
        const startPoint = this.findStartingPoint(augmentedBase, subtractPoints);
        if (startPoint === -1) return [];

        const result = [];
        let currentPath = augmentedBase;
        let currentIndex = startPoint;
        let onBase = true;
        const visited = new Set();
        const maxIterations = Math.min(1000, (augmentedBase.length + augmentedSubtract.length) * 4);

        for (let iterations = 0; iterations < maxIterations; iterations++) {
            const point = currentPath[currentIndex];
            const pointKey = `${Math.round(point[0] / this.epsilon)},${Math.round(point[1] / this.epsilon)}`;
            
            if (visited.has(pointKey) && result.length > 2) {
                break;
            }
            visited.add(pointKey);
            
            result.push(point);

            if (this.isIntersectionPoint(point, intersections)) {
                if (onBase) {
                    const subtractIndex = this.findPointInPath(augmentedSubtract, point);
                    if (subtractIndex !== -1) {
                        currentPath = augmentedSubtract;
                        currentIndex = subtractIndex;
                        onBase = false;
                    }
                } else {
                    const baseIndex = this.findPointInPath(augmentedBase, point);
                    if (baseIndex !== -1) {
                        currentPath = augmentedBase;
                        currentIndex = baseIndex;
                        onBase = true;
                    }
                }
            }

            if (onBase) {
                currentIndex = (currentIndex + 1) % currentPath.length;
                // Skip points that are inside the subtract shape
                while (this.isPointInPolygon(currentPath[currentIndex], subtractPoints) && 
                       !this.isIntersectionPoint(currentPath[currentIndex], intersections)) {
                    currentIndex = (currentIndex + 1) % currentPath.length;
                    if (currentIndex === startPoint) break;
                }
            } else {
                currentIndex = (currentIndex - 1 + currentPath.length) % currentPath.length;
            }

            // Check if we've returned to start
            if (currentIndex === startPoint && onBase && iterations > 2) {
                break;
            }
        }

        return [this.removeDuplicatePoints(result)];
    }

    insertIntersections(pathPoints, intersections, otherShapePoints) {
        const result = [...pathPoints];
        
        for (const intersection of intersections) {
            let bestIndex = -1;
            let minDist = Infinity;
            
            for (let i = 0; i < result.length; i++) {
                const p1 = result[i];
                const p2 = result[(i + 1) % result.length];
                
                if (this.isPointOnSegment(intersection, p1, p2)) {
                    const dist = this.distance(intersection, p1);
                    if (dist < minDist && dist > this.epsilon) {
                        minDist = dist;
                        bestIndex = i + 1;
                    }
                }
            }
            
            if (bestIndex !== -1) {
                result.splice(bestIndex, 0, intersection);
            }
        }
        
        return result;
    }

    isPointOnSegment(point, start, end) {
        const d1 = this.distance(point, start);
        const d2 = this.distance(point, end);
        const lineLen = this.distance(start, end);
        return Math.abs(d1 + d2 - lineLen) < this.epsilon;
    }

    findStartingPoint(augmentedBase, subtractPoints) {
        for (let i = 0; i < augmentedBase.length; i++) {
            if (!this.isPointInPolygon(augmentedBase[i], subtractPoints)) {
                return i;
            }
        }
        return -1;
    }

    isIntersectionPoint(point, intersections) {
        return intersections.some(int => this.pointsEqual(point, int));
    }

    findPointInPath(path, point) {
        for (let i = 0; i < path.length; i++) {
            if (this.pointsEqual(path[i], point)) {
                return i;
            }
        }
        return -1;
    }

    findNextIntersection(path, startIndex, intersections) {
        for (let offset = 1; offset < path.length; offset++) {
            const index = (startIndex + offset) % path.length;
            if (this.isIntersectionPoint(path[index], intersections)) {
                return index;
            }
        }
        return -1;
    }

    union(shapes) {
        if (!Array.isArray(shapes) || shapes.length === 0) {
            throw new Error('Union operation requires at least one shape');
        }
        
        if (shapes.length === 1) {
            return this.getPoints(shapes[0]);
        }
        
        const firstShape = shapes[0];
        let resultPoints = this.getPoints(firstShape);
        
        if (!Array.isArray(resultPoints) || resultPoints.length < 3) {
            throw new Error('Invalid shape points for union');
        }

        for (let i = 1; i < shapes.length; i++) {
            const nextShape = shapes[i];
            const nextPoints = this.getPoints(nextShape);
            
            if (!Array.isArray(nextPoints) || nextPoints.length < 3) {
                continue;
            }
            
            const intersections = this.findAllIntersections(resultPoints, nextPoints);
            
            let boundaryPoints = [];
            
            resultPoints.forEach(p => {
                if (!this.isPointInPolygon(p, nextPoints)) {
                    boundaryPoints.push(p);
                }
            });

            nextPoints.forEach(p => {
                if (!this.isPointInPolygon(p, resultPoints)) {
                    boundaryPoints.push(p);
                }
            });

            boundaryPoints = [...boundaryPoints, ...intersections];

            if (intersections.length === 0) {
                if (this.isPointInPolygon(resultPoints[0], nextPoints)) {
                    boundaryPoints = nextPoints;
                } else if (this.isPointInPolygon(nextPoints[0], resultPoints)) {
                    boundaryPoints = resultPoints;
                }
            }

            boundaryPoints = this.removeDuplicatePoints(boundaryPoints);
            resultPoints = this.orderPointsByAngle(boundaryPoints);
        }

        return resultPoints;
    }

    intersection(shapes) {
        if (!Array.isArray(shapes) || shapes.length < 2) {
            throw new Error('Intersection operation requires at least two shapes');
        }
        
        const firstShape = shapes[0];
        let resultPoints = this.getPoints(firstShape);
        
        if (!Array.isArray(resultPoints) || resultPoints.length < 3) {
            throw new Error('Invalid shape points for intersection');
        }

        for (let i = 1; i < shapes.length; i++) {
            const nextShape = shapes[i];
            const nextPoints = this.getPoints(nextShape);
            
            if (!Array.isArray(nextPoints) || nextPoints.length < 3) {
                return [];
            }
            
            const intersections = this.findAllIntersections(resultPoints, nextPoints);
            
            if (intersections.length === 0) {
                if (this.isPointInPolygon(resultPoints[0], nextPoints)) {
                    continue;
                } else if (this.isPointInPolygon(nextPoints[0], resultPoints)) {
                    resultPoints = nextPoints;
                    continue;
                } else {
                    return [];
                }
            }
            
            let intersectionPoints = [
                ...resultPoints.filter(p => this.isPointInPolygon(p, nextPoints)),
                ...nextPoints.filter(p => this.isPointInPolygon(p, resultPoints)),
                ...intersections
            ];

            intersectionPoints = this.removeDuplicatePoints(intersectionPoints);
            
            if (intersectionPoints.length === 0) {
                return [];
            }
            
            resultPoints = this.orderPointsByAngle(intersectionPoints);
        }

        return resultPoints;
    }

    orderPointsByAngle(points) {
        if (!Array.isArray(points) || points.length <= 2) return points;

        const centroid = this.calculateCentroid(points);
        
        return [...points].sort((a, b) => {
            if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) {
                return 0;
            }
            
            const angleA = Math.atan2(a[1] - centroid[1], a[0] - centroid[0]);
            const angleB = Math.atan2(b[1] - centroid[1], b[0] - centroid[0]);
            
            if (Math.abs(angleA - angleB) < this.epsilon) {
                const distA = this.distance(a, centroid);
                const distB = this.distance(b, centroid);
                return distA - distB;
            }
            
            return angleA - angleB;
        });
    }
    
    calculateCentroid(points) {
        if (points.length === 0) return [0, 0];
        
        let sumX = 0, sumY = 0;
        for (const point of points) {
            sumX += point[0];
            sumY += point[1];
        }
        
        return [sumX / points.length, sumY / points.length];
    }

    createResultShape(points, operation, shapes) {
        const name = this.naming.generateName(
            operation, 
            shapes.map(s => s.name || 'shape')
        );
        
        if (operation === 'difference' && Array.isArray(points) && points.includes(null)) {
            const nullIndex = points.indexOf(null);
            const outerPath = points.slice(0, nullIndex);
            const innerPath = points.slice(nullIndex + 1);
            
            return {
                type: 'path',
                name: name,
                params: {
                    points: outerPath,
                    subPaths: [outerPath, innerPath],
                    closed: true,
                    operation: operation,
                    isDonut: true
                },
                transform: {
                    position: [0, 0],
                    rotation: 0,
                    scale: [1, 1]
                }
            };
        }
        
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
    }

    performDifference(shapes) {
        try {
            if (!Array.isArray(shapes) || shapes.length < 2) {
                throw new Error('Difference operation requires at least two shapes');
            }
            
            const resultPoints = this.difference(shapes);
            if (!Array.isArray(resultPoints)) {
                throw new Error('Difference operation resulted in invalid shape');
            }
            
            return this.createResultShape(resultPoints, 'difference', shapes);
        } catch (error) {
            console.error('Error in performDifference:', error);
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
            if (!Array.isArray(resultPoints)) {
                return this.createResultShape([], 'intersection', shapes);
            }
            
            return this.createResultShape(resultPoints, 'intersection', shapes);
        } catch (error) {
            console.error('Error in performIntersection:', error);
            return this.createResultShape([], 'intersection', shapes);
        }
    }

    resetNaming() {
        this.naming.reset();
    }
}

export const booleanOperator = new BooleanOperator();
