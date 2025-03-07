// Interpreter3D.mjs - Execution for the 3D Aqui language
import { Environment3D } from './Environment3D.mjs';

export class Interpreter3D {
  constructor() {
    this.env = new Environment3D();
    this.currentReturn = null;
    this.functionCallCounters = new Map();
    this.currentFunctionContext = null;
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
      functions: this.env.functions,
      result
    };
  }

  evaluateNode(node) {
    // Handle shape naming in loops
    if (node.type === 'shape3d' && this.currentLoopCounter !== undefined) {
      node = {
        ...node,
        name: `${node.name}_${this.currentLoopCounter}`
      };
    }

    switch (node.type) {
      case 'param':
        return this.evaluateParam(node);
      case 'shape3d':
        return this.evaluateShape3D(node);
      case 'layer':
        return this.evaluateLayer(node);
      case 'transform':
        return this.evaluateTransform(node);
      case 'if_statement':
        return this.evaluateIfStatement(node);
      case 'for_loop':
        return this.evaluateForLoop(node);
      case 'function_definition':
        return this.evaluateFunctionDefinition(node);
      case 'function_call':
        return this.evaluateFunctionCall(node);
      case 'return':
        this.currentReturn = this.evaluateExpression(node.value);
        return this.currentReturn;
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  evaluateForLoop(node) {
    const start = this.evaluateExpression(node.start);
    const end = this.evaluateExpression(node.end);
    const step = this.evaluateExpression(node.step);
    
    const outerLoopCounter = this.currentLoopCounter;
    
    for (let i = start; i <= end; i += step) {
      // Set the loop iterator value in the environment
      this.env.setParameter(node.iterator, i);
      this.currentLoopCounter = i;
      
      // Execute all statements in the loop body
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
    
    // Restore the outer loop counter
    this.currentLoopCounter = outerLoopCounter;
    
    // Clean up the iterator parameter
    this.env.parameters.delete(node.iterator);
    
    // Return the return value if set
    return this.currentReturn;
  }

  evaluateIfStatement(node) {
    const condition = this.evaluateExpression(node.condition);
    
    if (this.isTruthy(condition)) {
      // Execute the 'then' branch
      for (const statement of node.thenBranch) {
        this.evaluateNode(statement);
        // Check if a return was encountered
        if (this.currentReturn !== null) {
          break;
        }
      }
    } else if (node.elseBranch && node.elseBranch.length > 0) {
      // Execute the 'else' branch
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

  evaluateShape3D(node) {
    // Create a unique name for shapes in function calls
    let shapeName = node.name;
    if (this.currentFunctionContext) {
      shapeName = `${shapeName}_${this.currentFunctionContext.name}_${this.currentFunctionContext.callId}`;
    } else if (this.currentLoopCounter !== undefined) {
      shapeName = `${shapeName}_${this.currentLoopCounter}`;
    }

    // Resolve all parameter expressions
    const params = {};
    for (const [key, expr] of Object.entries(node.params)) {
      params[key] = this.evaluateExpression(expr);
    }
    
    // Set depth explicitly for 3D shapes
    if (!params.depth) {
      params.depth = 10; // Default depth
    }
    
    // Create the shape in the environment
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
          
          // Handle both single angle (rotates around Y) or [x,y,z] rotations
          if (typeof angle === 'number') {
            // Default to Y-axis rotation if just a number
            layer.transform.rotation[1] += angle;
          } else if (Array.isArray(angle)) {
            // Apply full rotation vector
            for (let i = 0; i < 3; i++) {
              layer.transform.rotation[i] += angle[i] || 0;
            }
          }
          break;
        }
        case 'position': {
          const position = this.evaluateExpression(cmd.value);
          
          if (Array.isArray(position)) {
            layer.transform.position = [
              position[0] || 0,
              position[1] || 0,
              position[2] || 0
            ];
          }
          break;
        }
        case 'scale': {
          const scaleValue = this.evaluateExpression(cmd.value);
          
          if (typeof scaleValue === 'number') {
            layer.transform.scale = [scaleValue, scaleValue, scaleValue];
          } else if (Array.isArray(scaleValue)) {
            layer.transform.scale = [
              scaleValue[0] || 1,
              scaleValue[1] || 1,
              scaleValue[2] || 1
            ];
          }
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
          const scaleValue = this.evaluateExpression(op.value);
          
          // Check if it's a uniform scale (number) or vector [x,y,z]
          if (typeof scaleValue === 'number') {
            target.transform.scale = [scaleValue, scaleValue, scaleValue];
          } else if (Array.isArray(scaleValue)) {
            target.transform.scale = [
              scaleValue[0] || 1,
              scaleValue[1] || 1,
              scaleValue[2] || 1
            ];
          }
          break;
        }
        case 'rotate': {
          const rotateValue = this.evaluateExpression(op.angle);
          
          // Handle both single angle (rotates around Y) or [x,y,z] rotations
          if (typeof rotateValue === 'number') {
            target.transform.rotation[1] += rotateValue;
          } else if (Array.isArray(rotateValue)) {
            for (let i = 0; i < 3; i++) {
              target.transform.rotation[i] += rotateValue[i] || 0;
            }
          }
          break;
        }
        case 'translate': {
          const position = this.evaluateExpression(op.value);
          
          if (Array.isArray(position)) {
            target.transform.position = [
              position[0] || 0,
              position[1] || 0,
              position[2] || 0
            ];
          }
          break;
        }
        case 'extrude': {
          // Handle extrusion operation
          const extrudeValue = this.evaluateExpression(op.value);
          
          if (typeof extrudeValue === 'number') {
            // Simple extrusion with depth only
            target.params.depth = extrudeValue;
          } else if (typeof extrudeValue === 'object') {
            // Advanced extrusion with multiple settings
            target.params.extrudeSettings = {
              ...target.params.extrudeSettings,
              ...extrudeValue
            };
          }
          break;
        }
        case 'bevel': {
          // Handle bevel operation
          const bevelValue = this.evaluateExpression(op.value);
          
          if (!target.params.extrudeSettings) {
            target.params.extrudeSettings = {
              depth: target.params.depth || 10,
              bevelEnabled: true
            };
          }
          
          if (typeof bevelValue === 'boolean') {
            target.params.extrudeSettings.bevelEnabled = bevelValue;
          } else if (typeof bevelValue === 'number') {
            target.params.extrudeSettings.bevelEnabled = true;
            target.params.extrudeSettings.bevelThickness = bevelValue;
            target.params.extrudeSettings.bevelSize = bevelValue;
          } else if (typeof bevelValue === 'object') {
            target.params.extrudeSettings.bevelEnabled = true;
            Object.assign(target.params.extrudeSettings, bevelValue);
          }
          break;
        }
        case 'depth': {
          // Handle direct depth setting
          const depthValue = this.evaluateExpression(op.value);
          if (typeof depthValue === 'number') {
            target.params.depth = depthValue;
          }
          break;
        }
        default:
          throw new Error(`Unknown transform operation: ${op.type}`);
      }
    }
    
    return target;
  }

  // Store function definition
  evaluateFunctionDefinition(node) {
    this.env.addFunction(node.name, node.parameters, node.body);
    this.functionCallCounters.set(node.name, 0);
    return node.name;
  }

  // Execute function call
  evaluateFunctionCall(node) {
    const func = this.env.getFunction(node.name);
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

    // Create a new scope for function execution by storing current parameters
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

  evaluateExpression(expr) {
    switch (expr?.type) {
      case 'number':
        return expr.value;
      case 'string':
        return expr.value;
      case 'boolean':
        return expr.value;
      case 'identifier':
        return this.env.getParameter(expr.name);
      case 'param_ref':
        return this.env.getParameter(expr.property);
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
      case 'object':
        // Handle object literals by evaluating each property
        const result = {};
        for (const [key, value] of Object.entries(expr.properties)) {
          result[key] = this.evaluateExpression(value);
        }
        return result;
      case 'function_call':
        return this.evaluateFunctionCall(expr);
      default:
        // Return the expression directly if it's not a complex type
        return expr;
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
    // Short-circuit evaluation
    const left = this.evaluateExpression(expr.left);
    
    if (expr.operator === 'and') {
      // Return right only if left is truthy
      return this.isTruthy(left) ? this.isTruthy(this.evaluateExpression(expr.right)) : false;
    }
    if (expr.operator === 'or') {
      // Return true if left is truthy, otherwise evaluate right
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