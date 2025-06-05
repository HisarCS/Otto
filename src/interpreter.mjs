// interpreter.mjs
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
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    // Add method to evaluate draw statements
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
                isTurtlePath: true
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

    evaluateBooleanOperation(node) {
        const { operation, name, shapes: shapeNames } = node;
        const shapes = [];

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
            } catch (error) {
                throw new Error(`Error in boolean operation ${operation}: ${error.message}`);
            }
        }

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

        result.name = name;
        this.env.addShape(name, result);
        return result;
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
            params[key] = this.evaluateExpression(expr);
        }
        
        const shape = this.env.createShapeWithName(node.shapeType, shapeName, params);
        return shape;
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

    evaluateExpression(expr) {
        switch (expr.type) {
            case 'number':
                return expr.value;
            case 'string':
                return expr.value;
            case 'boolean':
                return expr.value;
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
}