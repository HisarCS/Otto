// edgeCalculator.mjs - New implementation that preserves shape instance state

import {
  StraightEdge,
  ArcEdge,
  BezierEdge,
  JointEdge,
  EdgeCollection,
  EdgeFactory
} from './edgeSystem.mjs';

import { ShapeRenderer } from '../shapeRenderer.mjs';

export class EdgeCalculator {
    constructor(options = {}) {
        this.options = {
            tolerance: 0.001,
            maxCurveSegments: 64,
            minCurveSegments: 8,
            edgeSimplification: true,
            skipFallbackEdges: true,
            ...options
        };
        
        // Use ShapeRenderer for consistent shape creation
        this.shapeRenderer = new ShapeRenderer(null);
    }
    
    /**
     * Main method: Convert a shape instance to edges
     * NEVER modifies the original shape instance
     */
    calculateEdges(shapeInstance, shapeType = null, shapeParams = {}) {
        if (!shapeInstance || typeof shapeInstance.getPoints !== 'function') {
            console.warn('Invalid shape instance - must have getPoints() method');
            return new EdgeCollection();
        }

        try {
            // Extract world position from shape instance
            const worldX = shapeInstance.position?.x || 0;
            const worldY = shapeInstance.position?.y || 0;

            // Get local points from shape (without modifying the instance)
            const localPoints = this.getShapePointsLocal(shapeInstance, shapeType);
            
            if (!localPoints || localPoints.length === 0) {
                if (this.options.skipFallbackEdges) {
                    return new EdgeCollection();
                }
                return this.createFallbackEdgeCollection(worldX, worldY);
            }
            
            // Transform local points to world coordinates
            const worldPoints = this.transformToWorldCoordinates(localPoints, worldX, worldY, shapeParams);
            
            // Convert points to edge data
            const edgeData = this.convertPointsToEdgeData(worldPoints, shapeType);
            
            // Create EdgeCollection
            const edgeCollection = this.createEdgeCollection(edgeData, shapeType, shapeParams, shapeInstance);
            
            return edgeCollection;
            
        } catch (error) {
            console.error('Error calculating edges:', error);
            return new EdgeCollection();
        }
    }

    /**
     * Get local points from shape without modifying the instance
     */
    getShapePointsLocal(shapeInstance, shapeType) {
        try {
            // Create a temporary copy of the shape for local coordinate extraction
            const tempInstance = this.createTemporaryShapeInstance(shapeInstance, shapeType);
            
            if (!tempInstance) {
                return this.getPointsDirectly(shapeInstance, shapeType);
            }
            
            return this.getPointsDirectly(tempInstance, shapeType);
            
        } catch (error) {
            console.warn(`Error getting local points for shape type ${shapeType}:`, error);
            return null;
        }
    }

    /**
     * Create a temporary shape instance for local coordinate extraction
     */
    createTemporaryShapeInstance(originalInstance, shapeType) {
        try {
            // If we have the constructor and parameters, create a fresh instance
            if (originalInstance.constructor) {
                // Try to create new instance with same parameters
                const newInstance = Object.create(originalInstance.constructor.prototype);
                
                // Copy essential properties but reset position
                Object.assign(newInstance, originalInstance);
                newInstance.position = { x: 0, y: 0 };
                
                return newInstance;
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get points directly from instance
     */
    getPointsDirectly(instance, shapeType) {
        const complexity = this.shapeRenderer.getShapeComplexity(shapeType);
        
        if (complexity === 'simple') {
            return instance.getPoints();
        } else {
            const segments = this.getOptimalSegmentCount(shapeType);
            return instance.getPoints(segments);
        }
    }

    /**
     * Get optimal segment count based on shape complexity
     */
    getOptimalSegmentCount(shapeType) {
        const complexity = this.shapeRenderer.getShapeComplexity(shapeType);
        
        switch (complexity) {
            case 'complex':
                return 128;
            case 'curved':
                return 64;
            default:
                return 32;
        }
    }

    /**
     * Transform local points to world coordinates
     */
    transformToWorldCoordinates(localPoints, worldX, worldY, properties = {}) {
        const rotation = properties.rotation || 0;
        const scaleX = properties.scaleX || properties.scale || 1;
        const scaleY = properties.scaleY || properties.scale || 1;
        
        return localPoints.map(localPoint => {
            let x = localPoint.x * scaleX;
            let y = localPoint.y * scaleY;
            
            // Apply rotation if specified
            if (rotation !== 0) {
                const rad = rotation * Math.PI / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const rotatedX = x * cos - y * sin;
                const rotatedY = x * sin + y * cos;
                x = rotatedX;
                y = rotatedY;
            }
            
            // Apply world translation
            return {
                x: x + worldX,
                y: y + worldY
            };
        });
    }

    /**
     * Convert world points to edge data
     */
    convertPointsToEdgeData(worldPoints, shapeType) {
        if (worldPoints.length < 2) return [];
        
        const edges = [];
        const isClosedShape = this.isClosedShapeType(shapeType);
        
        // Create edges between consecutive points
        for (let i = 0; i < worldPoints.length - 1; i++) {
            edges.push(this.createEdgeData(worldPoints[i], worldPoints[i + 1], i));
        }
        
        // Close the shape if needed
        if (isClosedShape && worldPoints.length > 2) {
            edges.push(this.createEdgeData(
                worldPoints[worldPoints.length - 1], 
                worldPoints[0], 
                worldPoints.length - 1
            ));
        }
        
        return edges;
    }

    /**
     * Create edge data object
     */
    createEdgeData(startPoint, endPoint, index) {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        return {
            index: index,
            start: { x: startPoint.x, y: startPoint.y },
            end: { x: endPoint.x, y: endPoint.y },
            midpoint: {
                x: (startPoint.x + endPoint.x) / 2,
                y: (startPoint.y + endPoint.y) / 2
            },
            vector: { x: dx, y: dy },
            normal: length > 0 ? { x: -dy / length, y: dx / length } : { x: 0, y: 0 },
            length: length,
            angle: angle,
            slope: dx === 0 ? Infinity : dy / dx,
            isHorizontal: Math.abs(dy) < this.options.tolerance,
            isVertical: Math.abs(dx) < this.options.tolerance,
            boundingBox: {
                minX: Math.min(startPoint.x, endPoint.x),
                maxX: Math.max(startPoint.x, endPoint.x),
                minY: Math.min(startPoint.y, endPoint.y),
                maxY: Math.max(startPoint.y, endPoint.y)
            }
        };
    }

    /**
     * Create EdgeCollection from edge data
     */
    createEdgeCollection(edgeDataArray, shapeType, shapeParams, originalInstance) {
        const edgeCollection = new EdgeCollection();
        
        // Set metadata
        edgeCollection.metadata.parentShape = {
            type: shapeType,
            params: shapeParams,
            instance: originalInstance
        };

        // Process edges
        let processedEdgeData = edgeDataArray;
        
        if (this.options.edgeSimplification) {
            processedEdgeData = this.simplifyEdges(processedEdgeData);
        }
        
        processedEdgeData = this.categorizeEdges(processedEdgeData, shapeType);
        processedEdgeData = this.calculateEdgeMetadata(processedEdgeData);

        // Create edge objects and add to collection
        processedEdgeData.forEach((edgeData, index) => {
            const edgeObj = this.createEdgeObject(edgeData);
            if (edgeObj) {
                edgeCollection.addEdge(edgeObj);
            }
        });

        return edgeCollection;
    }

    /**
     * Create Edge object from edge data
     */
    createEdgeObject(edgeData) {
        const startPoint = { x: edgeData.start.x, y: edgeData.start.y };
        const endPoint = { x: edgeData.end.x, y: edgeData.end.y };
        
        const properties = {
            category: edgeData.category,
            shapeType: edgeData.shapeType,
            edgeId: edgeData.edgeId,
            length: edgeData.length,
            angle: edgeData.angle,
            isHorizontal: edgeData.isHorizontal,
            isVertical: edgeData.isVertical,
            relativeLength: edgeData.relativeLength,
            percentOfPerimeter: edgeData.percentOfPerimeter
        };

        // Always create straight edges for now
        return new StraightEdge(startPoint, endPoint, properties);
    }

    /**
     * Simplify edges by removing collinear segments
     */
    simplifyEdges(edges) {
        if (edges.length < 3) return edges;
        
        const simplified = [edges[0]];
        
        for (let i = 1; i < edges.length - 1; i++) {
            const prev = edges[i - 1];
            const current = edges[i];
            const next = edges[i + 1];
            
            if (!this.isCollinear(prev, current, next)) {
                simplified.push(current);
            }
        }
        
        simplified.push(edges[edges.length - 1]);
        return simplified;
    }

    /**
     * Check if three edges are collinear
     */
    isCollinear(edge1, edge2, edge3) {
        const tolerance = this.options.tolerance;
        const angleDiff1 = Math.abs(edge2.angle - edge1.angle);
        const angleDiff2 = Math.abs(edge3.angle - edge2.angle);
        return angleDiff1 < tolerance && angleDiff2 < tolerance;
    }

    /**
     * Categorize edges by direction
     */
    categorizeEdges(edges, type) {
        return edges.map((edge, index) => ({
            ...edge,
            category: this.getEdgeCategory(edge, type),
            shapeType: type,
            edgeId: `${type}_${index}`
        }));
    }

    /**
     * Get edge category based on direction
     */
    getEdgeCategory(edge, type) {
        if (edge.isHorizontal) return 'horizontal';
        if (edge.isVertical) return 'vertical';
        
        const absAngle = Math.abs(edge.angle);
        if (absAngle < Math.PI / 8 || absAngle > 7 * Math.PI / 8) return 'horizontal';
        if (absAngle > 3 * Math.PI / 8 && absAngle < 5 * Math.PI / 8) return 'vertical';
        
        return 'diagonal';
    }

    /**
     * Calculate additional edge metadata
     */
    calculateEdgeMetadata(edges) {
        const totalPerimeter = edges.reduce((sum, edge) => sum + edge.length, 0);
        const averageLength = totalPerimeter / edges.length || 1;
        
        return edges.map(edge => ({
            ...edge,
            relativeLength: edge.length / averageLength,
            percentOfPerimeter: (edge.length / totalPerimeter) * 100,
            normalizedAngle: this.normalizeAngle(edge.angle)
        }));
    }

    /**
     * Normalize angle to [0, 2π]
     */
    normalizeAngle(angle) {
        let normalized = angle;
        while (normalized < 0) normalized += 2 * Math.PI;
        while (normalized >= 2 * Math.PI) normalized -= 2 * Math.PI;
        return normalized;
    }

    /**
     * Check if shape type should be closed
     */
    isClosedShapeType(type) {
        const openShapes = ['arc', 'wave', 'arrow', 'spiral'];
        return !openShapes.includes(type);
    }

    /**
     * Create fallback edge collection for error cases
     */
    createFallbackEdgeCollection(x, y) {
        const edgeCollection = new EdgeCollection();
        
        // Create simple square fallback
        const size = 25;
        const points = [
            { x: x - size, y: y - size },
            { x: x + size, y: y - size },
            { x: x + size, y: y + size },
            { x: x - size, y: y + size }
        ];
        
        for (let i = 0; i < points.length; i++) {
            const nextIndex = (i + 1) % points.length;
            const edgeData = this.createEdgeData(points[i], points[nextIndex], i);
            edgeData.isFallback = true;
            edgeData.category = 'fallback';
            
            const edgeObj = this.createEdgeObject(edgeData);
            if (edgeObj) {
                edgeCollection.addEdge(edgeObj);
            }
        }
        
        return edgeCollection;
    }
}

/**
 * Convenience function to create EdgeCalculator and process shape
 */
export function calculateShapeEdges(shapeInstance, shapeType = null, shapeParams = {}, options = {}) {
    const calculator = new EdgeCalculator(options);
    return calculator.calculateEdges(shapeInstance, shapeType, shapeParams);
}

export default EdgeCalculator;
