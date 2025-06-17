// interpreter.mjs - FIXED VERSION with proper boolean integration
import { Environment } from './environment.mjs';
import { booleanOperator } from './BooleanOperators.mjs';
import { TurtleDrawer } from './turtleDrawer.mjs';

export class Interpreter {
    constructor() {
        this.env = new Environment();
        this.booleanOperator = booleanOperator;
        this.functions = new Map();
        this.currentReturn = null;
        this.functionCallCounters = new Map();
        this.turtleDrawer = new TurtleDrawer();
        
        // Color resolution map for named colors
        this.colorMap = {
            'red': '#FF0000',
            'green': '#008000',
            'blue': '#0000FF',
            'yellow': '#FFFF00',
            'orange': '#FFA500',
            'purple': '#800080',
            'pink': '#FFC0CB',
            'brown': '#A52A2A',
            'black': '#000000',
            'white': '#FFFFFF',
            'gray': '#808080',
            'grey': '#808080',
            'lightgray': '#D3D3D3',
            'lightgrey': '#D3D3D3',
            'darkgray': '#A9A9A9',
            'darkgrey': '#A9A9A9',
            'cyan': '#00FFFF',
            'magenta': '#FF00FF',
            'lime': '#00FF00',
            'navy': '#000080',
            'teal': '#008080',
            'silver': '#C0C0C0',
            'gold': '#FFD700',
            'transparent': 'transparent'
        };
    }

    interpret(ast) {
        let result = null;
        for (const node of ast) {
            result = this.evaluateNode(node);
        }
        return {
            parameters: this.env.parameters,
            shapes: this.env.shapes,
            layers: this.env.layers,
            functions: this.functions,
            result
        };
    }

    evaluateNode(node) {
        if (node.type === 'shape' && this.currentLoopCounter !== undefined) {
            node = {
                ...node,
                name: `${node.name}_${this.currentLoopCounter}`
            };
        }

        switch (node.type) {
            case 'param':
                return this.evaluateParam(node);
            case 'shape':
                return this.evaluateShape(node);
            case 'layer':
                return this.evaluateLayer(node);
            case 'transform':
                return this.evaluateTransform(node);
            case 'if_statement':
                return this.evaluateIfStatement(node);
            case 'for_loop':
                return this.evaluateForLoop(node);
            case 'boolean_operation':
                return this.evaluateBooleanOperation(node);
            case 'function_definition':
                return this.evaluateFunctionDefinition(node);
            case 'function_call':
                return this.evaluateFunctionCall(node);
            case 'return':
                this.currentReturn = this.evaluateExpression(node.value);
                return this.currentReturn;
            case 'draw':
                return this.evaluateDraw(node);
            case 'draw_command':
                return this.evaluateDrawCommand(node);
            case 'fill_statement':
                return this.evaluateFillStatement(node);
            case 'style_block':
                return this.evaluateStyleBlock(node);
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    // FIXED: Enhanced boolean operation evaluation with proper shape consumption
    evaluateBooleanOperation(node) {
        const { operation, name, shapes: shapeNames } = node;
        const shapes = [];

        console.log(`🔧 FIXED: Evaluating boolean operation: ${operation} -> ${name}`);
        console.log(`🔧 Input shapes: ${shapeNames.join(', ')}`);

        // Collect input shapes
        for (const shapeName of shapeNames) {
            try {
                const shape = this.env.getShape(shapeName);
                if (!shape) {
                    throw new Error(`Shape not found: ${shapeName}`);
                }
                shapes.push({
                    ...shape,
                    name: shapeName
                });
                console.log(`✅ Found input shape: ${shapeName} (${shape.type})`);
            } catch (error) {
                throw new Error(`Error in boolean operation ${operation}: ${error.message}`);
            }
        }

        // Perform the boolean operation
        let result;
        try {
            switch (operation) {
                case 'union':
                    result = this.booleanOperator.performUnion(shapes);
                    break;
                case 'difference':
                    result = this.booleanOperator.performDifference(shapes);
                    break;
                case 'intersection':
                    result = this.booleanOperator.performIntersection(shapes);
                    break;
                default:
                    throw new Error(`Unknown boolean operation: ${operation}`);
            }
        } catch (error) {
            throw new Error(`Failed to perform ${operation}: ${error.message}`);
        }

        console.log(`🎯 Boolean operation result:`, {
            name: result.name,
            type: result.type,
            hasHoles: result.params.hasHoles,
            pointCount: result.params.points ? result.params.points.length : 0
        });

        // CRITICAL FIX: Mark input shapes as consumed and hide them
        for (const shapeName of shapeNames) {
            if (this.env.shapes.has(shapeName)) {
                const originalShape = this.env.shapes.get(shapeName);
                // Mark as consumed so renderer won't display it
                originalShape._consumedByBoolean = true;
                console.log(`🚫 Marked ${shapeName} as consumed by boolean operation`);
            }
        }

        // Add the result shape to environment
        result.name = name;
        this.env.addShape(name, result);
        console.log(`✅ Added boolean result shape: ${name}`);

        return result;
    }

    // New method to evaluate fill statements
    evaluateFillStatement(node) {
        try {
            const targetShape = this.env.getShape(node.target);
            if (!targetShape) {
                throw new Error(`Shape not found for fill: ${node.target}`);
            }
            
            // Set fill properties
            targetShape.params.fill = node.fill;
            if (node.fillColor) {
                targetShape.params.fillColor = this.resolveColor(node.fillColor);
            }
            
            return targetShape;
        } catch (error) {
            console.warn(`Fill statement error: ${error.message}`);
            return null;
        }
    }

    // New method to evaluate style blocks
    evaluateStyleBlock(node) {
        try {
            const targetShape = this.env.getShape(node.target);
            if (!targetShape) {
                throw new Error(`Shape not found for style: ${node.target}`);
            }
            
            // Apply all style properties
            for (const [styleName, styleValue] of Object.entries(node.styles)) {
                const resolvedValue = this.evaluateExpression(styleValue);
                targetShape.params[styleName] = this.resolveStyleValue(styleName, resolvedValue);
            }
            
            return targetShape;
        } catch (error) {
            console.warn(`Style block error: ${error.message}`);
            return null;
        }
    }

    // Helper method to resolve style values
    resolveStyleValue(styleName, value) {
        const colorProperties = ['color', 'fillcolor', 'strokecolor', 'fill', 'stroke'];
        
        if (colorProperties.includes(styleName.toLowerCase())) {
            return this.resolveColor(value);
        }
        
        return value;
    }

    // Enhanced method to evaluate draw statements
    evaluateDraw(node) {
        // Reset the turtle drawer
        this.turtleDrawer.reset();
        
        // Execute all commands
        for (const command of node.commands) {
            this.evaluateDrawCommand(command);
        }
        
        // Get the paths from the turtle drawer
        const paths = this.turtleDrawer.getDrawingPaths();
        
        // Create a shape only if we have valid paths
        if (paths.length === 0) {
            return null;
        }
        
        // Flatten all points for the shape
        const allPoints = [];
        for (const path of paths) {
            for (const point of path) {
                allPoints.push(point);
            }
        }
        
        // Create a path shape
        const shape = {
            type: 'path',
            id: `draw_${node.name}_${Date.now()}`,
            params: {
                points: allPoints,
                subPaths: paths,
                isTurtlePath: true,
                // Default styling for drawn paths
                fill: false,
                strokeColor: '#000000',
                strokeWidth: 2
            },
            transform: {
                position: [0, 0],
                rotation: 0,
                scale: [1, 1]
            },
            layerName: null
        };
        
        // Add to environment
        this.env.shapes.set(node.name, shape);
        return shape;
    }
    
    // Method to evaluate individual draw commands
    evaluateDrawCommand(command) {
        switch (command.command) {
            case 'forward':
                this.turtleDrawer.forward(this.evaluateExpression(command.value));
                break;
            case 'backward':
                this.turtleDrawer.backward(this.evaluateExpression(command.value));
                break;
            case 'right':
                this.turtleDrawer.right(this.evaluateExpression(command.value));
                break;
            case 'left':
                this.turtleDrawer.left(this.evaluateExpression(command.value));
                break;
            case 'goto':
                this.turtleDrawer.goto(this.evaluateExpression(command.value));
                break;
            case 'penup':
                this.turtleDrawer.penup();
                break;
            case 'pendown':
                this.turtleDrawer.pendown();
                break;
            default:
                throw new Error(`Unknown draw command: ${command.command}`);
        }
        return null;
    }

    // Store function definition in the functions map
    evaluateFunctionDefinition(node) {
        this.functions.set(node.name, {
            parameters: node.parameters,
            body: node.body
        });
        this.functionCallCounters.set(node.name, 0);
        return node.name;
    }

    // Execute function call with unique instance support
    evaluateFunctionCall(node) {
        const func = this.functions.get(node.name);
        if (!func) {
            throw new Error(`Function not found: ${node.name}`);
        }

        // Increment call counter for this function
        const callCount = (this.functionCallCounters.get(node.name) || 0) + 1;
        this.functionCallCounters.set(node.name, callCount);
        
        // Store current function context
        const previousFuncContext = this.currentFunctionContext;
        this.currentFunctionContext = {
            name: node.name,
            callId: callCount
        };

        // Evaluate all arguments
        const args = node.arguments.map(arg => this.evaluateExpression(arg));

        // Create a new scope for function execution
        const previousParams = new Map(this.env.parameters);
        
        // Clear return value
        this.currentReturn = null;

        // Set parameters in the environment
        for (let i = 0; i < func.parameters.length; i++) {
            if (i < args.length) {
                this.env.setParameter(func.parameters[i], args[i]);
            } else {
                throw new Error(`Missing argument for parameter: ${func.parameters[i]}`);
            }
        }

        // Execute function body
        let result = null;
        for (const statement of func.body) {
            result = this.evaluateNode(statement);
            
            // If we hit a return statement, stop execution
            if (this.currentReturn !== null) {
                result = this.currentReturn;
                break;
            }
        }

        // Restore previous environment and context
        this.env.parameters = previousParams;
        this.currentFunctionContext = previousFuncContext;
        
        // Clear the return value so it doesn't affect other code
        const returnValue = this.currentReturn;
        this.currentReturn = null;
        
        return returnValue !== null ? returnValue : result;
    }

    evaluateForLoop(node) {
        const start = this.evaluateExpression(node.start);
        const end = this.evaluateExpression(node.end);
        const step = this.evaluateExpression(node.step);
        
        const outerLoopCounter = this.currentLoopCounter;
        
        for (let i = start; i <= end; i += step) {
            this.env.setParameter(node.iterator, i);
            this.currentLoopCounter = i;
            
            for (const statement of node.body) {
                this.evaluateNode(statement);
                
                // Check if a return was encountered in the loop
                if (this.currentReturn !== null) {
                    break;
                }
            }
            
            // If a return was encountered, break out of the loop
            if (this.currentReturn !== null) {
                break;
            }
        }
        
        this.currentLoopCounter = outerLoopCounter;
        this.env.parameters.delete(node.iterator);
        
        // Return the return value if set
        return this.currentReturn;
    }

    evaluateIfStatement(node) {
        const condition = this.evaluateExpression(node.condition);
        if (this.isTruthy(condition)) {
            for (const statement of node.thenBranch) {
                this.evaluateNode(statement);
                // Check if a return was encountered
                if (this.currentReturn !== null) {
                    break;
                }
            }
        } else if (node.elseBranch && node.elseBranch.length > 0) {
            for (const statement of node.elseBranch) {
                this.evaluateNode(statement);
                // Check if a return was encountered
                if (this.currentReturn !== null) {
                    break;
                }
            }
        }
        
        // Return the return value if set
        return this.currentReturn;
    }

    evaluateParam(node) {
        const value = this.evaluateExpression(node.value);
        this.env.setParameter(node.name, value);
        return value;
    }

    // Enhanced shape evaluation with comprehensive fill and color support
    evaluateShape(node) {
        // Create a unique name for shapes in function calls
        let shapeName = node.name;
        if (this.currentFunctionContext) {
            shapeName = `${shapeName}_${this.currentFunctionContext.name}_${this.currentFunctionContext.callId}`;
        } else if (this.currentLoopCounter !== undefined) {
            shapeName = `${shapeName}_${this.currentLoopCounter}`;
        }

        const params = {};
        for (const [key, expr] of Object.entries(node.params)) {
            const evaluatedValue = this.evaluateExpression(expr);
            params[key] = this.processShapeParameter(key, evaluatedValue);
        }
        
        // Apply shape-specific defaults and process fill parameters
        this.processShapeFillParameters(node.shapeType, params);
        
        const shape = this.env.createShapeWithName(node.shapeType, shapeName, params);
        console.log(`✅ Created shape: ${shapeName} (${node.shapeType})`);
        return shape;
    }

    // New method to process shape parameters with special handling for colors and fills
    processShapeParameter(key, value) {
        const colorParams = ['color', 'fillcolor', 'strokecolor', 'fill', 'stroke', 'background', 'border'];
        
        if (colorParams.includes(key.toLowerCase())) {
            // Handle color parameters
            if (typeof value === 'string') {
                return this.resolveColor(value);
            } else if (typeof value === 'boolean' && key.toLowerCase() === 'fill') {
                // Boolean fill parameter
                return value;
            }
        }
        
        return value;
    }

    // New method to process fill parameters for shapes
    processShapeFillParameters(shapeType, params) {
        // Handle various fill parameter combinations
        if (params.fill === true || params.filled === true) {
            // Enable fill
            params.fill = true;
            
            // Set default fill color if none specified
            if (!params.fillColor && !params.color) {
                params.fillColor = '#808080'; // Default gray
            } else if (params.color && !params.fillColor) {
                // Use color as fill color if no specific fill color is set
                params.fillColor = this.resolveColor(params.color);
            }
        } else if (params.fillColor) {
            // If fillColor is specified, enable fill
            params.fill = true;
            params.fillColor = this.resolveColor(params.fillColor);
        }
        
        // Handle stroke parameters
        if (params.strokeColor) {
            params.strokeColor = this.resolveColor(params.strokeColor);
        }
        
        // Set default opacity if not specified
        if (params.opacity === undefined && params.alpha !== undefined) {
            params.opacity = params.alpha;
        }
        
        // Shape-specific fill defaults
        const textShapes = ['text'];
        if (textShapes.includes(shapeType) && params.fill === undefined && params.fillColor === undefined) {
            // Text shapes are filled by default
            params.fill = true;
            params.fillColor = '#000000'; // Black text by default
        }
    }

    // Enhanced color resolution method
    resolveColor(colorValue) {
        if (typeof colorValue !== 'string') {
            return colorValue;
        }
        
        // Handle hex colors
        if (colorValue.startsWith('#')) {
            return colorValue;
        }
        
        // Handle rgb/rgba colors
        if (colorValue.startsWith('rgb')) {
            return colorValue;
        }
        
        // Handle hsl/hsla colors
        if (colorValue.startsWith('hsl')) {
            return colorValue;
        }
        
        // Handle named colors
        const namedColor = this.colorMap[colorValue.toLowerCase()];
        if (namedColor) {
            return namedColor;
        }
        
        // Return as-is if not recognized
        return colorValue;
    }

    evaluateLayer(node) {
        const layer = this.env.createLayer(node.name);
        for (const cmd of node.commands) {
            switch (cmd.type) {
                case 'add': {
                    this.env.addShapeToLayer(node.name, cmd.shape);
                    break;
                }
                case 'rotate': {
                    const angle = this.evaluateExpression(cmd.angle);
                    layer.transform.rotation += angle;
                    break;
                }
            }
        }
        return layer;
    }

    evaluateTransform(node) {
        const target = this.env.shapes.get(node.target) || this.env.layers.get(node.target);
        if (!target) {
            throw new Error(`Transform target not found: ${node.target}`);
        }

        for (const op of node.operations) {
            switch (op.type) {
                case 'scale': {
                    const scaleVal = this.evaluateExpression(op.value);
                    target.transform.scale = [scaleVal, scaleVal];
                    break;
                }
                case 'rotate': {
                    const angle = this.evaluateExpression(op.angle);
                    target.transform.rotation += angle;
                    break;
                }
                case 'translate': {
                    const [x, y] = this.evaluateExpression(op.value);
                    target.transform.position = [x, y];
                    break;
                }
                default:
                    throw new Error(`Unknown transform operation: ${op.type}`);
            }
        }
        return target;
    }

    // Enhanced expression evaluation with color support
    evaluateExpression(expr) {
        switch (expr.type) {
            case 'number':
                return expr.value;
            case 'string':
                return expr.value;
            case 'boolean':
                return expr.value;
            case 'color':
                return this.resolveColor(expr.value);
            case 'identifier':
                if (expr.name.startsWith('param.')) {
                    const paramName = expr.name.split('.')[1];
                    return this.env.getParameter(paramName);
                }
                return this.env.getParameter(expr.name);
            case 'binary_op':
                return this.evaluateBinaryOp(expr);
            case 'comparison':
                return this.evaluateComparison(expr);
            case 'logical_op':
                return this.evaluateLogicalOp(expr);
            case 'unary_op':
                return this.evaluateUnaryOp(expr);
            case 'array':
                return expr.elements.map(e => this.evaluateExpression(e));
            case 'function_call':
                return this.evaluateFunctionCall(expr);
            default:
                throw new Error(`Unknown expression type: ${expr.type}`);
        }
    }

    evaluateBinaryOp(expr) {
        const left = this.evaluateExpression(expr.left);
        const right = this.evaluateExpression(expr.right);
        
        switch (expr.operator) {
            case 'plus':
                return left + right;
            case 'minus':
                return left - right;
            case 'multiply':
                return left * right;
            case 'divide':
                if (right === 0) throw new Error('Division by zero');
                return left / right;
            default:
                throw new Error(`Unknown binary operator: ${expr.operator}`);
        }
    }

    evaluateComparison(expr) {
        const left = this.evaluateExpression(expr.left);
        const right = this.evaluateExpression(expr.right);
        
        switch (expr.operator) {
            case 'equals':
                return left === right;
            case 'not_equals':
                return left !== right;
            case 'less':
                return left < right;
            case 'less_equals':
                return left <= right;
            case 'greater':
                return left > right;
            case 'greater_equals':
                return left >= right;
            default:
                throw new Error(`Unknown comparison operator: ${expr.operator}`);
        }
    }

    evaluateLogicalOp(expr) {
        const left = this.evaluateExpression(expr.left);
        
        if (expr.operator === 'and') {
            return this.isTruthy(left) ? this.isTruthy(this.evaluateExpression(expr.right)) : false;
        }
        if (expr.operator === 'or') {
            return this.isTruthy(left) ? true : this.isTruthy(this.evaluateExpression(expr.right));
        }
        
        throw new Error(`Unknown logical operator: ${expr.operator}`);
    }

    evaluateUnaryOp(expr) {
        const operand = this.evaluateExpression(expr.operand);
        switch (expr.operator) {
            case 'not':
                return !this.isTruthy(operand);
            case 'minus':
                return -operand;
            case 'plus':
                return +operand;
            default:
                throw new Error(`Unknown unary operator: ${expr.operator}`);
        }
    }

    isTruthy(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') return value.length > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (value === null || value === undefined) return false;
        return true;
    }

    // Helper method to validate and normalize color values
    validateColor(color) {
        if (typeof color !== 'string') {
            return false;
        }
        
        // Check hex colors
        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color)) {
            return true;
        }
        
        // Check rgb/rgba colors
        if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(color)) {
            return true;
        }
        
        // Check hsl/hsla colors
        if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/.test(color)) {
            return true;
        }
        
        // Check named colors
        return !!this.colorMap[color.toLowerCase()];
    }

    // Method to get shape fill information for debugging
    getShapeFillInfo(shapeName) {
        const shape = this.env.shapes.get(shapeName);
        if (!shape) {
            return null;
        }
        
        return {
            shapeName,
            shapeType: shape.type,
            fill: shape.params.fill,
            fillColor: shape.params.fillColor,
            color: shape.params.color,
            strokeColor: shape.params.strokeColor,
            opacity: shape.params.opacity
        };
    }
}
