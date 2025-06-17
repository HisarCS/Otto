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

/**
 * Result naming utility for boolean operations
 */
class BooleanNaming {
    constructor() {
        this.operationSymbols = {
            'union': 'U',
            'difference': 'D', 
            'intersection': 'I',
            'xor': 'X'
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

/**
 * Main Boolean Operations class using Martinez-Rueda algorithm
 */
export class BooleanOperator {
    constructor() {
        this.naming = new BooleanNaming();
        this.debugMode = false;
        
        // Check Martinez-Rueda availability
        this.polygonClipping = null;
        this.isLibraryAvailable = this.initializeMartinezRueda();
        
        // Operation colors for visual feedback
        this.operationColors = {
            'union': '#4CAF50',
            'difference': '#FF5722', 
            'intersection': '#2196F3',
            'xor': '#9C27B0'
        };

        console.log(`🔧 BooleanOperator initialized - Martinez-Rueda: ${this.isLibraryAvailable ? '✅' : '❌'}`);
    }

    /**
     * Initialize Martinez-Rueda polygon clipping library
     */
    initializeMartinezRueda() {
        try {
            // Check if library is available globally
            if (typeof window !== 'undefined' && window.polygonClipping) {
                this.polygonClipping = window.polygonClipping;
                console.log('✅ Martinez-Rueda polygon-clipping library found');
                return true;
            }

            // Try requiring it (Node.js environment)
            try {
                this.polygonClipping = require('polygon-clipping');
                console.log('✅ Martinez-Rueda polygon-clipping library loaded via require');
                return true;
            } catch (e) {
                // Ignore require error in browser
            }

            console.error('❌ Martinez-Rueda polygon-clipping library not found!');
            console.error('📋 Add to HTML: <script src="https://unpkg.com/polygon-clipping@0.15.3/dist/polygon-clipping.umd.min.js"></script>');
            return false;

        } catch (error) {
            console.error('❌ Error initializing Martinez-Rueda:', error);
            return false;
        }
    }

    /**
     * Enable/disable debug logging
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🔧 BooleanOperator debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }

    /**
     * Debug logging helper
     */
    log(...args) {
        if (this.debugMode) {
            console.log('[BooleanOp]', ...args);
        }
    }

    // ==================== MAIN BOOLEAN OPERATIONS ====================

    /**
     * Perform union operation on shapes
     */
    performUnion(shapes) {
        this.log('🔄 Starting UNION operation...');
        
        if (!this.validateLibrary()) {
            throw new Error('Martinez-Rueda library not available');
        }

        if (!this.validateShapes(shapes, 1)) {
            throw new Error('Union requires at least 1 shape');
        }

        try {
            const resultPoints = this.union(shapes);
            const resultShape = this.createResultShape(resultPoints, 'union', shapes);
            
            this.log('✅ Union completed successfully');
            return resultShape;

        } catch (error) {
            console.error('❌ Union operation failed:', error);
            throw new Error(`Union failed: ${error.message}`);
        }
    }

    /**
     * Perform difference operation on shapes
     */
    performDifference(shapes) {
        this.log('🔄 Starting DIFFERENCE operation...');
        
        if (!this.validateLibrary()) {
            throw new Error('Martinez-Rueda library not available');
        }

        if (!this.validateShapes(shapes, 2, 2)) {
            throw new Error('Difference requires exactly 2 shapes');
        }

        try {
            const resultPoints = this.difference(shapes);
            const resultShape = this.createResultShape(resultPoints, 'difference', shapes);
            
            this.log('✅ Difference completed successfully');
            return resultShape;

        } catch (error) {
            console.error('❌ Difference operation failed:', error);
            throw new Error(`Difference failed: ${error.message}`);
        }
    }

    /**
     * Perform intersection operation on shapes
     */
    performIntersection(shapes) {
        this.log('🔄 Starting INTERSECTION operation...');
        
        if (!this.validateLibrary()) {
            throw new Error('Martinez-Rueda library not available');
        }

        if (!this.validateShapes(shapes, 2)) {
            throw new Error('Intersection requires at least 2 shapes');
        }

        try {
            const resultPoints = this.intersection(shapes);
            const resultShape = this.createResultShape(resultPoints, 'intersection', shapes);
            
            this.log('✅ Intersection completed successfully');
            return resultShape;

        } catch (error) {
            console.error('❌ Intersection operation failed:', error);
            throw new Error(`Intersection failed: ${error.message}`);
        }
    }

    /**
     * Perform XOR operation on shapes
     */
    performXor(shapes) {
        this.log('🔄 Starting XOR operation...');
        
        if (!this.validateLibrary()) {
            throw new Error('Martinez-Rueda library not available');
        }

        if (!this.validateShapes(shapes, 2, 2)) {
            throw new Error('XOR requires exactly 2 shapes');
        }

        try {
            const resultPoints = this.xor(shapes);
            const resultShape = this.createResultShape(resultPoints, 'xor', shapes);
            
            this.log('✅ XOR completed successfully');
            return resultShape;

        } catch (error) {
            console.error('❌ XOR operation failed:', error);
            throw new Error(`XOR failed: ${error.message}`);
        }
    }

    // ==================== CORE MARTINEZ-RUEDA OPERATIONS ====================

    /**
     * Union operation using Martinez-Rueda
     */
    union(shapes) {
        if (shapes.length === 1) {
            return this.extractShapePoints(shapes[0]);
        }

        let resultPolygon = this.shapeToMartinezPolygon(shapes[0]);
        
        for (let i = 1; i < shapes.length; i++) {
            const nextPolygon = this.shapeToMartinezPolygon(shapes[i]);
            resultPolygon = this.polygonClipping.union(resultPolygon, nextPolygon);
            
            if (!resultPolygon || resultPolygon.length === 0) {
                this.log('⚠️ Union resulted in empty geometry');
                return [];
            }
        }

        return this.martinezPolygonToPoints(resultPolygon);
    }

    /**
     * Difference operation using Martinez-Rueda
     */
    difference(shapes) {
        const polygon1 = this.shapeToMartinezPolygon(shapes[0]);
        const polygon2 = this.shapeToMartinezPolygon(shapes[1]);
        
        const result = this.polygonClipping.difference(polygon1, polygon2);
        
        if (!result || result.length === 0) {
            this.log('⚠️ Difference resulted in empty geometry');
            return [];
        }

        return this.martinezPolygonToPoints(result);
    }

    /**
     * Intersection operation using Martinez-Rueda
     */
    intersection(shapes) {
        let resultPolygon = this.shapeToMartinezPolygon(shapes[0]);
        
        for (let i = 1; i < shapes.length; i++) {
            const nextPolygon = this.shapeToMartinezPolygon(shapes[i]);
            resultPolygon = this.polygonClipping.intersection(resultPolygon, nextPolygon);
            
            if (!resultPolygon || resultPolygon.length === 0) {
                this.log('⚠️ Intersection resulted in empty geometry');
                return [];
            }
        }

        return this.martinezPolygonToPoints(resultPolygon);
    }

    /**
     * XOR operation using Martinez-Rueda
     */
    xor(shapes) {
        const polygon1 = this.shapeToMartinezPolygon(shapes[0]);
        const polygon2 = this.shapeToMartinezPolygon(shapes[1]);
        
        const result = this.polygonClipping.xor(polygon1, polygon2);
        
        if (!result || result.length === 0) {
            this.log('⚠️ XOR resulted in empty geometry');
            return [];
        }

        return this.martinezPolygonToPoints(result);
    }

    // ==================== SHAPE CONVERSION ====================

    /**
     * Convert Aqui shape to Martinez-Rueda polygon format
     */
    shapeToMartinezPolygon(shape) {
        try {
            const points = this.extractShapePoints(shape);
            
            if (!points || points.length < 3) {
                throw new Error(`Shape has insufficient points: ${points ? points.length : 0}`);
            }

            // Check for holes (null separators)
            const nullIndex = points.findIndex(p => p === null);
            
            if (nullIndex !== -1) {
                // Handle polygon with holes
                return this.convertPolygonWithHoles(points, nullIndex);
            } else {
                // Simple polygon
                return this.convertSimplePolygon(points);
            }

        } catch (error) {
            console.error('Error converting shape to Martinez polygon:', error);
            throw error;
        }
    }

    /**
     * Convert simple polygon points to Martinez format
     */
    convertSimplePolygon(points) {
        const cleanPoints = points
            .filter(p => p !== null && Array.isArray(p) && p.length >= 2)
            .map(p => [p[0], p[1]]);
        
        if (cleanPoints.length < 3) {
            throw new Error('Insufficient valid points for polygon');
        }

        // Martinez-Rueda expects: [[[x,y], [x,y], ...]]
        return [cleanPoints];
    }

    /**
     * Convert polygon with holes to Martinez format
     */
    convertPolygonWithHoles(points, nullIndex) {
        // Outer ring
        const outerRing = points.slice(0, nullIndex)
            .filter(p => p !== null && Array.isArray(p) && p.length >= 2)
            .map(p => [p[0], p[1]]);

        if (outerRing.length < 3) {
            throw new Error('Insufficient points for outer ring');
        }

        // Collect holes
        const holes = [];
        let currentIndex = nullIndex + 1;
        
        while (currentIndex < points.length) {
            const nextNullIndex = points.findIndex((p, i) => i > currentIndex && p === null);
            const endIndex = nextNullIndex !== -1 ? nextNullIndex : points.length;
            
            const hole = points.slice(currentIndex, endIndex)
                .filter(p => p !== null && Array.isArray(p) && p.length >= 2)
                .map(p => [p[0], p[1]]);
            
            if (hole.length >= 3) {
                holes.push(hole);
            }
            
            currentIndex = endIndex + 1;
        }

        // Martinez-Rueda format: [outerRing, hole1, hole2, ...]
        return [outerRing, ...holes];
    }

    /**
     * Convert Martinez-Rueda result back to Aqui points format
     */
    martinezPolygonToPoints(martinezResult) {
        if (!martinezResult || martinezResult.length === 0) {
            return [];
        }

        // Handle multiple polygons - use the largest one
        if (martinezResult.length > 1) {
            martinezResult = this.selectLargestPolygon(martinezResult);
        }

        const polygon = martinezResult[0];
        if (!polygon || polygon.length === 0) {
            return [];
        }

        const result = [];

        // Add outer ring
        const outerRing = polygon[0];
        if (outerRing && outerRing.length >= 3) {
            for (const point of outerRing) {
                if (Array.isArray(point) && point.length >= 2) {
                    result.push([point[0], point[1]]);
                }
            }
        }

        // Add holes with null separators
        for (let i = 1; i < polygon.length; i++) {
            const hole = polygon[i];
            if (hole && hole.length >= 3) {
                result.push(null); // Null separator
                
                for (const point of hole) {
                    if (Array.isArray(point) && point.length >= 2) {
                        result.push([point[0], point[1]]);
                    }
                }
            }
        }

        this.log(`Converted Martinez result: ${result.length} points, holes: ${result.includes(null)}`);
        return result;
    }

    /**
     * Select the largest polygon from multiple results
     */
    selectLargestPolygon(polygons) {
        let largestIndex = 0;
        let largestArea = 0;

        for (let i = 0; i < polygons.length; i++) {
            const polygon = polygons[i];
            if (polygon && polygon[0] && polygon[0].length >= 3) {
                const area = Math.abs(this.calculatePolygonArea(polygon[0]));
                if (area > largestArea) {
                    largestArea = area;
                    largestIndex = i;
                }
            }
        }

        return [polygons[largestIndex]];
    }

    // ==================== SHAPE POINT EXTRACTION ====================

    /**
     * Extract points from any Aqui shape
     */
    extractShapePoints(shape) {
        try {
            if (!shape || !shape.type) {
                throw new Error('Invalid shape object');
            }

            this.log(`Extracting points from ${shape.type} shape`);

            // Handle path shapes
            if (shape.type === 'path' && shape.params && shape.params.points) {
                return this.handlePathShape(shape);
            }

            // Handle regular shapes
            return this.handleRegularShape(shape);

        } catch (error) {
            console.error(`Error extracting points from ${shape.type}:`, error);
            throw error;
        }
    }

    /**
     * Handle path-type shapes
     */
    handlePathShape(shape) {
        const { params } = shape;
        let points = params.points;

        // Handle turtle paths
        if (params.isTurtlePath && Array.isArray(params.subPaths)) {
            const allPoints = [];
            for (const subPath of params.subPaths) {
                if (subPath && subPath.length > 0) {
                    allPoints.push(...subPath.map(p => 
                        Array.isArray(p) ? p : [p.x || 0, p.y || 0]
                    ));
                }
            }
            points = allPoints;
        } else {
            // Regular path points
            points = points.map(p => 
                p === null ? null : (Array.isArray(p) ? p : [p.x || 0, p.y || 0])
            );
        }

        return this.applyTransform(points, shape.transform);
    }

    /**
     * Handle regular geometric shapes
     */
    handleRegularShape(shape) {
        const shapeInstance = this.createShapeInstance(shape);
        if (!shapeInstance) {
            throw new Error(`Could not create instance for ${shape.type}`);
        }

        // Get points with appropriate resolution
        const resolution = this.getShapeResolution(shape.type);
        const points = shapeInstance.getPoints(resolution);

        if (!points || points.length === 0) {
            throw new Error(`No points generated for ${shape.type}`);
        }

        // Convert to [x, y] format
        const formattedPoints = points.map(p => [
            typeof p.x === 'number' ? p.x : 0,
            typeof p.y === 'number' ? p.y : 0
        ]);

        return this.applyTransform(formattedPoints, shape.transform);
    }

    /**
     * Create shape instance based on type
     */
    createShapeInstance(shape) {
        const { type, params } = shape;

        try {
            switch (type) {
                case 'rectangle':
                    return new Rectangle(params.width || 100, params.height || 100);
                case 'circle':
                    return new Circle(params.radius || 50);
                case 'triangle':
                    return new Triangle(params.base || 60, params.height || 80);
                case 'ellipse':
                    return new Ellipse(params.radiusX || 60, params.radiusY || 40);
                case 'polygon':
                    return new RegularPolygon(params.radius || 50, params.sides || 6);
                case 'star':
                    return new Star(params.outerRadius || 50, params.innerRadius || 20, params.points || 5);
                case 'arc':
                    return new Arc(params.radius || 50, params.startAngle || 0, params.endAngle || 90);
                case 'roundedRectangle':
                    return new RoundedRectangle(params.width || 100, params.height || 100, params.radius || 10);
                case 'arrow':
                    return new Arrow(params.length || 100, params.headWidth || 30, params.headLength || 25);
                case 'donut':
                    return new Donut(params.outerRadius || 50, params.innerRadius || 20);
                case 'spiral':
                    return new Spiral(params.startRadius || 10, params.endRadius || 50, params.turns || 3);
                case 'cross':
                    return new Cross(params.width || 100, params.thickness || 20);
                case 'wave':
                    return new Wave(params.width || 100, params.amplitude || 20, params.frequency || 2);
                case 'slot':
                    return new Slot(params.length || 100, params.width || 20);
                case 'chamferRectangle':
                    return new ChamferRectangle(params.width || 100, params.height || 100, params.chamfer || 10);
                default:
                    console.warn(`Unknown shape type: ${type}, using default rectangle`);
                    return new Rectangle(100, 100);
            }
        } catch (error) {
            console.error(`Error creating ${type} instance:`, error);
            return new Rectangle(100, 100);
        }
    }

    /**
     * Get appropriate resolution for curved shapes
     */
    getShapeResolution(shapeType) {
        const curvedShapes = ['circle', 'ellipse', 'arc', 'roundedRectangle', 'spiral', 'donut', 'wave'];
        return curvedShapes.includes(shapeType) ? 64 : 32;
    }

    /**
     * Apply transform to points
     */
    applyTransform(points, transform) {
        if (!transform || !Array.isArray(points)) {
            return points || [];
        }

        const { position = [0, 0], rotation = 0, scale = [1, 1] } = transform;

        return points.map(p => {
            if (p === null) return null;
            if (!Array.isArray(p) || p.length < 2) return [0, 0];

            let x = p[0] * scale[0];
            let y = p[1] * scale[1];

            // Apply rotation
            if (rotation !== 0) {
                const rad = rotation * Math.PI / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const rotatedX = x * cos - y * sin;
                const rotatedY = x * sin + y * cos;
                x = rotatedX;
                y = rotatedY;
            }

            // Apply translation
            x += position[0];
            y += position[1];

            return [x, y];
        });
    }

    // ==================== RESULT CREATION ====================

    /**
     * Create result shape from operation
     */
    createResultShape(points, operation, inputShapes) {
        const name = this.naming.generateName(
            operation,
            inputShapes.map(s => s.name || 'shape')
        );

        const baseShape = inputShapes[0];
        const styling = this.extractStyling(baseShape, operation);

        const hasHoles = Array.isArray(points) && points.includes(null);

        const resultShape = {
            type: 'path',
            name: name,
            params: {
                points: points || [],
                closed: true,
                operation: operation,
                hasHoles: hasHoles,
                ...styling
            },
            transform: { position: [0, 0], rotation: 0, scale: [1, 1] }
        };

        this.log(`Created ${operation} result: ${name} with ${points ? points.length : 0} points`);
        return resultShape;
    }

    /**
     * Extract styling from base shape
     */
    extractStyling(baseShape, operation) {
        const defaultStyling = {
            fill: true,
            fillColor: this.operationColors[operation] || '#808080',
            strokeColor: '#000000',
            strokeWidth: 2,
            opacity: 0.8
        };

        if (!baseShape || !baseShape.params) {
            return defaultStyling;
        }

        const params = baseShape.params;
        const styling = { ...defaultStyling };

        // Extract existing styling
        if (params.fill !== undefined) styling.fill = params.fill;
        if (params.fillColor) styling.fillColor = params.fillColor;
        if (params.color && !params.fillColor) styling.fillColor = params.color;
        if (params.strokeColor) styling.strokeColor = params.strokeColor;
        if (params.strokeWidth !== undefined) styling.strokeWidth = params.strokeWidth;
        if (params.opacity !== undefined) styling.opacity = params.opacity;

        return styling;
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Validate Martinez-Rueda library availability
     */
    validateLibrary() {
        if (!this.isLibraryAvailable) {
            console.error('❌ Martinez-Rueda library not available!');
            return false;
        }
        return true;
    }

    /**
     * Validate shapes array
     */
    validateShapes(shapes, minCount, maxCount = Infinity) {
        if (!Array.isArray(shapes)) {
            console.error('❌ Shapes must be an array');
            return false;
        }

        if (shapes.length < minCount) {
            console.error(`❌ Need at least ${minCount} shapes, got ${shapes.length}`);
            return false;
        }

        if (shapes.length > maxCount) {
            console.error(`❌ Need at most ${maxCount} shapes, got ${shapes.length}`);
            return false;
        }

        return true;
    }

    /**
     * Calculate polygon area for size comparison
     */
    calculatePolygonArea(points) {
        if (!points || points.length < 3) return 0;

        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i][0] * points[j][1];
            area -= points[j][0] * points[i][1];
        }
        return Math.abs(area / 2);
    }

    /**
     * Reset naming counter
     */
    resetNaming() {
        this.naming.reset();
    }

    /**
     * Get library status
     */
    getStatus() {
        return {
            libraryAvailable: this.isLibraryAvailable,
            debugMode: this.debugMode,
            library: this.polygonClipping ? 'polygon-clipping' : 'none'
        };
    }
}

// Export singleton instance
export const booleanOperator = new BooleanOperator();
