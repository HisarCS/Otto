// Parser3D.mjs - Syntax analysis for the 3D Aqui language
import { Token } from './Lexer3D.mjs';

export class Parser3D {
  constructor(lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.getNextToken();
  }

  error(message) {
    throw new Error(`Parser error at line ${this.currentToken.line}, col ${this.currentToken.column}: ${message}`);
  }

  eat(tokenType) {
    if (this.currentToken.type === tokenType) {
      const token = this.currentToken;
      this.currentToken = this.lexer.getNextToken();
      return token;
    } else {
      this.error(`Expected ${tokenType} but got ${this.currentToken.type}`);
    }
  }

  // Parse conditional expressions
  parseCondition() {
    let expr = this.parseLogicalOr();
    return expr;
  }

  // Parse logical OR operations
  parseLogicalOr() {
    let expr = this.parseLogicalAnd();

    while (this.currentToken.type === 'OR') {
      this.eat('OR');
      expr = {
        type: 'logical_op',
        operator: 'or',
        left: expr,
        right: this.parseLogicalAnd()
      };
    }
    return expr;
  }

  // Parse logical AND operations
  parseLogicalAnd() {
    let expr = this.parseComparison();

    while (this.currentToken.type === 'AND') {
      this.eat('AND');
      expr = {
        type: 'logical_op',
        operator: 'and',
        left: expr,
        right: this.parseComparison()
      };
    }
    return expr;
  }

  // Parse comparison operations
  parseComparison() {
    let expr = this.parseExpression();

    if (['EQUALS', 'NOT_EQUALS', 'LESS', 'LESS_EQUALS', 'GREATER', 'GREATER_EQUALS'].includes(this.currentToken.type)) {
      const operator = this.currentToken.type.toLowerCase();
      this.eat(this.currentToken.type);
      expr = {
        type: 'comparison',
        operator,
        left: expr,
        right: this.parseExpression()
      };
    }
    return expr;
  }

  parseExpression() {
    let node = this.parseTerm();
    while (this.currentToken.type === 'PLUS' || this.currentToken.type === 'MINUS') {
      const operator = this.currentToken.type;
      this.eat(operator);
      node = {
        type: 'binary_op',
        operator: operator.toLowerCase(),
        left: node,
        right: this.parseTerm()
      };
    }
    return node;
  }

  parseTerm() {
    let node = this.parseFactor();
    while (this.currentToken.type === 'MULTIPLY' || this.currentToken.type === 'DIVIDE') {
      const operator = this.currentToken.type;
      this.eat(operator);
      node = {
        type: 'binary_op',
        operator: operator.toLowerCase(),
        left: node,
        right: this.parseFactor()
      };
    }
    return node;
  }

  parseFactor() {
    const token = this.currentToken;
    
    if (token.type === 'NUMBER') {
      this.eat('NUMBER');
      return { type: 'number', value: token.value };
    } 
    
    if (token.type === 'TRUE' || token.type === 'FALSE') {
      this.eat(token.type);
      return { type: 'boolean', value: token.type === 'TRUE' };
    }
    
    if (token.type === 'NOT') {
      this.eat('NOT');
      return {
        type: 'unary_op',
        operator: 'not',
        operand: this.parseFactor()
      };
    }
    
    if (token.type === 'IDENTIFIER' || 
        token.type === 'POSITION' || 
        token.type === 'COLOR' || 
        token.type === 'METALNESS' || 
        token.type === 'ROUGHNESS' || 
        token.type === 'WIREFRAME' || 
        token.type === 'MATERIAL' || 
        token.type === 'ROTATION') {
      const name = token.value;
      this.eat(token.type);
      
      // Check if this is a function call
      if (this.currentToken.type === 'LPAREN') {
        return this.parseFunctionCall(name);
      }
      
      if (this.currentToken.type === 'DOT') {
        this.eat('DOT');
        const prop = this.currentToken.value;
        this.eat('IDENTIFIER');
        return { type: 'param_ref', name, property: prop };
      }
      return { type: 'identifier', name };
    }
    
    if (token.type === 'MINUS') {
      this.eat('MINUS');
      return { 
        type: 'unary_op', 
        operator: 'minus', 
        operand: this.parseFactor() 
      };
    }
    
    if (token.type === 'LBRACKET') {
      return this.parseArray();
    }
    
    if (token.type === 'LBRACE') {
      return this.parseObjectLiteral();
    }
    
    if (token.type === 'QUOTE') {
      return this.parseStringLiteral();
    }
    
    if (token.type === 'LPAREN') {
      this.eat('LPAREN');
      const expr = this.parseCondition();
      this.eat('RPAREN');
      return expr;
    }
    
    this.error(`Unexpected token in factor: ${token.type}`);
  }

  // Parse function definitions
  parseFunctionDefinition() {
    this.eat('DEF');
    const functionName = this.currentToken.value;
    this.eat('IDENTIFIER');
    
    // Parse parameters
    this.eat('LPAREN');
    const parameters = [];
    if (this.currentToken.type !== 'RPAREN') {
      parameters.push(this.currentToken.value);
      this.eat('IDENTIFIER');
      
      while (this.currentToken.type === 'COMMA') {
        this.eat('COMMA');
        parameters.push(this.currentToken.value);
        this.eat('IDENTIFIER');
      }
    }
    this.eat('RPAREN');
    
    // Parse function body
    this.eat('LBRACE');
    const body = [];
    while (this.currentToken.type !== 'RBRACE' && this.currentToken.type !== 'EOF') {
      if (this.currentToken.type === 'RETURN') {
        this.eat('RETURN');
        const returnValue = this.parseExpression();
        body.push({ type: 'return', value: returnValue });
      } else {
        body.push(this.parseStatement());
      }
    }
    this.eat('RBRACE');
    
    return {
      type: 'function_definition',
      name: functionName,
      parameters,
      body
    };
  }

  // Parse function calls
  parseFunctionCall(functionName) {
    this.eat('LPAREN');
    const args = [];
    
    if (this.currentToken.type !== 'RPAREN') {
      args.push(this.parseExpression());
      
      while (this.currentToken.type === 'COMMA') {
        this.eat('COMMA');
        args.push(this.parseExpression());
      }
    }
    
    this.eat('RPAREN');
    
    return {
      type: 'function_call',
      name: functionName,
      arguments: args
    };
  }

  // Parse if statements
  parseIfStatement() {
    this.eat('IF');
    const condition = this.parseCondition();
    this.eat('LBRACE');
    
    const thenBranch = [];
    while (this.currentToken.type !== 'RBRACE' && this.currentToken.type !== 'EOF') {
      thenBranch.push(this.parseStatement());
    }
    this.eat('RBRACE');
    
    let elseBranch = [];
    if (this.currentToken.type === 'ELSE') {
      this.eat('ELSE');
      this.eat('LBRACE');
      while (this.currentToken.type !== 'RBRACE' && this.currentToken.type !== 'EOF') {
        elseBranch.push(this.parseStatement());
      }
      this.eat('RBRACE');
    }
    
    return {
      type: 'if_statement',
      condition,
      thenBranch,
      elseBranch
    };
  }
  
  parseStringLiteral() {
    this.eat('QUOTE');
    const value = this.currentToken.value;
    this.eat('IDENTIFIER');
    this.eat('QUOTE');
    return { type: 'string', value: value };
  }

  parseArray() {
    this.eat('LBRACKET');
    const elements = [];
    
    if (this.currentToken.type !== 'RBRACKET') {
      elements.push(this.parseExpression());
      
      while (this.currentToken.type === 'COMMA') {
        this.eat('COMMA');
        elements.push(this.parseExpression());
      }
    }
    
    this.eat('RBRACKET');
    return { type: 'array', elements };
  }

  // Parse object literals (e.g., for material)
  parseObjectLiteral() {
    this.eat('LBRACE');
    const properties = {};
    
    while (this.currentToken.type !== 'RBRACE' && this.currentToken.type !== 'EOF') {
      // Accept specific property names as tokens too
      if (this.currentToken.type === 'IDENTIFIER' || 
          this.currentToken.type === 'COLOR' || 
          this.currentToken.type === 'METALNESS' || 
          this.currentToken.type === 'ROUGHNESS' || 
          this.currentToken.type === 'WIREFRAME') {
        
        const key = this.currentToken.value;
        this.eat(this.currentToken.type);
        
        this.eat('COLON');
        properties[key] = this.parseExpression();
        
        // Optional comma between properties
        if (this.currentToken.type === 'COMMA') {
          this.eat('COMMA');
        }
      } else {
        this.error(`Expected property name, got ${this.currentToken.type}`);
      }
    }
    
    this.eat('RBRACE');
    return { type: 'object', properties };
  }
  
  parseParam() {
    this.eat('PARAM');
    const name = this.currentToken.value;
    this.eat('IDENTIFIER');
    const value = this.parseExpression();
    return { type: 'param', name, value };
  }

  parseShape3D() {
    this.eat('SHAPE3D');
    const shapeType = this.currentToken.value;
    this.eat('IDENTIFIER');
    let shapeName = null;
    
    if (this.currentToken.type === 'IDENTIFIER') {
      shapeName = this.currentToken.value;
      this.eat('IDENTIFIER');
    }
    
    this.eat('LBRACE');
    const params = {};
    
    while (this.currentToken.type !== 'RBRACE' && this.currentToken.type !== 'EOF') {
      if (this.currentToken.type === 'IDENTIFIER' || 
          this.currentToken.type === 'POSITION' || 
          this.currentToken.type === 'DEPTH' ||
          this.currentToken.type === 'EXTRUDE' ||
          this.currentToken.type === 'BEVEL' ||
          this.currentToken.type === 'ROTATION' ||
          this.currentToken.type === 'MATERIAL') {
        
        const paramName = this.currentToken.value;
        this.eat(this.currentToken.type);
        
        this.eat('COLON');
        params[paramName] = this.parseExpression(); // This will now handle nested objects too
      } else {
        this.error(`Expected shape property, got ${this.currentToken.type}`);
      }
    }
    
    this.eat('RBRACE');
    
    return { 
      type: 'shape3d', 
      shapeType, 
      name: shapeName, 
      params 
    };
  }

  parseLayer() {
    this.eat('LAYER');
    const name = this.currentToken.value;
    this.eat('IDENTIFIER');
    this.eat('LBRACE');
    
    const commands = [];
    
    while (this.currentToken.type !== 'RBRACE' && this.currentToken.type !== 'EOF') {
      if (this.currentToken.type === 'IF') {
        commands.push(this.parseIfStatement());
      } else if (this.currentToken.type === 'ADD') {
        this.eat('ADD');
        commands.push({ type: 'add', shape: this.currentToken.value });
        this.eat('IDENTIFIER');
      } else if (this.currentToken.type === 'ROTATE') {
        this.eat('ROTATE');
        this.eat('COLON');
        commands.push({ type: 'rotate', angle: this.parseExpression() });
      } else if (this.currentToken.type === 'POSITION') {
        this.eat('POSITION');
        this.eat('COLON');
        commands.push({ type: 'position', value: this.parseExpression() });
      } else if (this.currentToken.type === 'SCALE') {
        this.eat('SCALE');
        this.eat('COLON');
        commands.push({ type: 'scale', value: this.parseExpression() });
      } else {
        this.error(`Unknown layer command: ${this.currentToken.type}`);
      }
    }
    
    this.eat('RBRACE');
    
    return { 
      type: 'layer', 
      name, 
      commands 
    };
  }

  parseTransform() {
    this.eat('TRANSFORM');
    const target = this.currentToken.value;
    this.eat('IDENTIFIER');
    this.eat('LBRACE');
    
    const operations = [];
    
    while (this.currentToken.type !== 'RBRACE' && this.currentToken.type !== 'EOF') {
      if (this.currentToken.type === 'IF') {
        operations.push(this.parseIfStatement());
      } else if (this.currentToken.type === 'SCALE') {
        this.eat('SCALE');
        this.eat('COLON');
        operations.push({ type: 'scale', value: this.parseExpression() });
      } else if (this.currentToken.type === 'ROTATE') {
        this.eat('ROTATE');
        this.eat('COLON');
        operations.push({ type: 'rotate', angle: this.parseExpression() });
      } else if (this.currentToken.type === 'POSITION') {
        this.eat('POSITION');
        this.eat('COLON');
        operations.push({ type: 'translate', value: this.parseExpression() });
      } else if (this.currentToken.type === 'EXTRUDE') {
        this.eat('EXTRUDE');
        this.eat('COLON');
        operations.push({ type: 'extrude', value: this.parseExpression() });
      } else if (this.currentToken.type === 'BEVEL') {
        this.eat('BEVEL');
        this.eat('COLON');
        operations.push({ type: 'bevel', value: this.parseExpression() });
      } else if (this.currentToken.type === 'DEPTH') {
        this.eat('DEPTH');
        this.eat('COLON');
        operations.push({ type: 'depth', value: this.parseExpression() });
      } else {
        this.error(`Unknown transform operation: ${this.currentToken.type}`);
      }
    }
    
    this.eat('RBRACE');
    
    return { 
      type: 'transform', 
      target, 
      operations 
    };
  }

  parseForLoop() {
    this.eat('FOR');
    const iterator = this.currentToken.value;
    this.eat('IDENTIFIER');
    this.eat('FROM');
    const start = this.parseExpression();
    this.eat('TO');
    const end = this.parseExpression();
    
    let step = { type: 'number', value: 1 };  // Default step
    if (this.currentToken.type === 'STEP') {
      this.eat('STEP');
      step = this.parseExpression();
    }
    
    this.eat('LBRACE');
    const body = [];
    while (this.currentToken.type !== 'RBRACE' && this.currentToken.type !== 'EOF') {
      body.push(this.parseStatement());
    }
    this.eat('RBRACE');
    
    return {
      type: 'for_loop',
      iterator,
      start,
      end,
      step,
      body
    };
  }

  parseStatement() {
    let statement;
    
    switch (this.currentToken.type) {
      case 'IF':
        statement = this.parseIfStatement();
        break;
      case 'PARAM':
        statement = this.parseParam();
        break;
      case 'SHAPE3D':
        statement = this.parseShape3D();
        break;
      case 'LAYER':
        statement = this.parseLayer();
        break;
      case 'TRANSFORM':
        statement = this.parseTransform();
        break;
      case 'FOR':
        statement = this.parseForLoop();
        break;
      case 'ADD':
        this.eat('ADD');
        statement = { 
          type: 'add', 
          shape: this.currentToken.value 
        };
        this.eat('IDENTIFIER');
        break;
      case 'ROTATE':
        this.eat('ROTATE');
        this.eat('COLON');
        statement = {
          type: 'rotate',
          angle: this.parseExpression()
        };
        break;
      case 'DEF':
        statement = this.parseFunctionDefinition();
        break;
      case 'IDENTIFIER':
        // Check if this is a function call
        const name = this.currentToken.value;
        this.eat('IDENTIFIER');
        if (this.currentToken.type === 'LPAREN') {
          statement = this.parseFunctionCall(name);
        } else {
          this.error(`Unexpected identifier: ${name}`);
        }
        break;
      default:
        this.error(`Unexpected token: ${this.currentToken.type}`);
    }
    
    return statement;
  }

  parse() {
    const statements = [];
    while (this.currentToken.type !== 'EOF') {
      statements.push(this.parseStatement());
    }
    return statements;
  }
}