# AQUI Language Build Documentation

## Architecture Overview

AQUI follows a classic interpreter architecture with three main phases:
1. **Lexical Analysis** (`lexer.mjs`) - Convert source code into tokens
2. **Parsing** (`parser.mjs`) - Convert tokens into Abstract Syntax Tree (AST)  
3. **Interpretation** (`interpreter.mjs`) - Execute the AST

---

## Lexer (`lexer.mjs`)

### Purpose
Converts raw AQUI source code into a stream of tokens for the parser.

### Core Classes

#### **Token Class**
```javascript
class Token {
    constructor(type, value, line, column) {
        this.type = type;     // Token type (e.g., 'IDENTIFIER', 'NUMBER')
        this.value = value;   // Token value (e.g., 'myCircle', 50)
        this.line = line;     // Line number for error reporting
        this.column = column; // Column for error reporting
    }
}
```

#### **Lexer Class** 
```javascript
class Lexer {
    constructor(text) {
        this.text = text;
        this.position = 0;
        this.currentChar = this.text[this.position];
        this.line = 1;
        this.column = 1;
    }
}
```

### Adding New Keywords
To add a new keyword to AQUI:

```javascript
// In lexer.mjs, find the keywords object
const keywords = {
    // Existing keywords...
    'mynewkeyword': 'MYNEWKEYWORD',  // Add here
    
    // Core language keywords
    'param': 'PARAM',
    'shape': 'SHAPE',
    // ...
};
```

### Token Types
Current token types include:
- `IDENTIFIER` - Variable/function names
- `NUMBER` - Numeric literals  
- `STRING` - String literals
- `KEYWORD` - Language keywords
- `OPERATOR` - Mathematical operators (+, -, *, /)
- `PUNCTUATION` - Braces, brackets, colons, etc.

### Key Methods

#### **getNextToken()**
Main tokenization method:
```javascript
getNextToken() {
    while (this.currentChar !== null) {
        if (this.isSpace(this.currentChar)) {
            this.skipWhitespace();
            continue;
        }
        
        if (this.currentChar === '/' && this.peek() === '/') {
            this.skipComment();
            continue;
        }
        
        if (this.isAlpha(this.currentChar)) {
            return this.identifier();
        }
        
        if (this.isDigit(this.currentChar)) {
            return this.number();
        }
        
        // Handle operators, punctuation, etc.
    }
}
```

#### **Adding New Token Types**
```javascript
// Example: Adding support for @ symbol
if (this.currentChar === '@') {
    this.advance();
    return new Token('AT', '@', this.line, this.column);
}
```

---

## Parser (`parser.mjs`)

### Purpose
Converts token stream into Abstract Syntax Tree (AST) using recursive descent parsing.

### Core Structure

#### **Parser Class**
```javascript
class Parser {
    constructor(lexer) {
        this.lexer = lexer;
        this.currentToken = this.lexer.getNextToken();
    }
    
    error(message) {
        throw new Error(`Parser error: ${message}`);
    }
    
    eat(tokenType) {
        if (this.currentToken.type === tokenType) {
            this.currentToken = this.lexer.getNextToken();
        } else {
            this.error(`Expected ${tokenType}`);
        }
    }
}
```

### Grammar Structure

#### **Main Parse Method**
```javascript
parse() {
    const statements = [];
    
    while (this.currentToken.type !== 'EOF') {
        statements.push(this.parseStatement());
    }
    
    return statements;
}
```

#### **Statement Parsing**
```javascript
parseStatement() {
    switch (this.currentToken.type) {
        case 'PARAM':
            return this.parseParam();
        case 'SHAPE':
            return this.parseShape();
        case 'UNION':
        case 'DIFFERENCE':
        case 'INTERSECTION':
            return this.parseBooleanOperation();
        case 'IF':
            return this.parseIfStatement();
        case 'FOR':
            return this.parseForLoop();
        default:
            this.error(`Unexpected token: ${this.currentToken.type}`);
    }
}
```

### Adding New Language Constructs

#### **1. Add Token to Lexer**
```javascript
// lexer.mjs
const keywords = {
    'repeat': 'REPEAT',  // New keyword
    // ...
};
```

#### **2. Add Parser Method**
```javascript
// parser.mjs
parseRepeatStatement() {
    this.eat('REPEAT');
    const count = this.parseExpression();
    this.eat('LBRACE');
    
    const body = [];
    while (this.currentToken.type !== 'RBRACE') {
        body.push(this.parseStatement());
    }
    this.eat('RBRACE');
    
    return {
        type: 'repeat_statement',
        count: count,
        body: body
    };
}
```

#### **3. Add to Statement Parser**
```javascript
parseStatement() {
    switch (this.currentToken.type) {
        // Existing cases...
        case 'REPEAT':
            return this.parseRepeatStatement();
        // ...
    }
}
```

### AST Node Structure
Each AST node follows this pattern:
```javascript
{
    type: 'node_type',          // Required
    // Node-specific properties
    line: tokenLine,            // Optional: for error reporting
    column: tokenColumn         // Optional: for error reporting
}
```

#### **Example AST Nodes**
```javascript
// Shape node
{
    type: 'shape',
    shapeType: 'circle',
    name: 'myCircle',
    properties: [
        { key: 'radius', value: { type: 'number', value: 50 } }
    ]
}

// Parameter node  
{
    type: 'param',
    name: 'size',
    value: { type: 'number', value: 100 }
}
```

---

## Interpreter (`interpreter.mjs`)

### Purpose
Executes the AST by walking through nodes and performing the corresponding operations.

### Core Structure

#### **Interpreter Class**
```javascript
class Interpreter {
    constructor() {
        this.env = {
            params: new Map(),
            shapes: new Map(),
            layers: new Map()
        };
    }
    
    interpret(ast) {
        const statements = Array.isArray(ast) ? ast : [ast];
        
        for (const statement of statements) {
            this.executeStatement(statement);
        }
        
        return this.env;
    }
}
```

#### **Statement Execution**
```javascript
executeStatement(node) {
    switch (node.type) {
        case 'param':
            return this.executeParam(node);
        case 'shape':
            return this.executeShape(node);
        case 'boolean_operation':
            return this.executeBooleanOperation(node);
        case 'if_statement':
            return this.executeIfStatement(node);
        case 'for_loop':
            return this.executeForLoop(node);
        default:
            throw new Error(`Unknown statement type: ${node.type}`);
    }
}
```

### Adding New Statement Types

#### **1. Create Execution Method**
```javascript
executeRepeatStatement(node) {
    const count = this.evaluateExpression(node.count);
    
    if (typeof count !== 'number') {
        throw new Error('Repeat count must be a number');
    }
    
    for (let i = 0; i < count; i++) {
        for (const stmt of node.body) {
            this.executeStatement(stmt);
        }
    }
}
```

#### **2. Add to Statement Switch**
```javascript
executeStatement(node) {
    switch (node.type) {
        // Existing cases...
        case 'repeat_statement':
            return this.executeRepeatStatement(node);
        // ...
    }
}
```

### Expression Evaluation
```javascript
evaluateExpression(node) {
    switch (node.type) {
        case 'number':
            return node.value;
        case 'string':
            return node.value;
        case 'boolean':
            return node.value;
        case 'parameter_ref':
            return this.env.params.get(node.name);
        case 'binary_op':
            return this.evaluateBinaryOp(node);
        case 'array':
            return node.elements.map(el => this.evaluateExpression(el));
        default:
            throw new Error(`Unknown expression type: ${node.type}`);
    }
}
```

### Environment Management
```javascript
// Store parameter
this.env.params.set(paramName, paramValue);

// Store shape
const shapeInstance = this.createShape(node.shapeType, properties);
this.env.shapes.set(node.name, shapeInstance);

// Resolve parameter reference
if (this.env.params.has(paramName)) {
    return this.env.params.get(paramName);
}
```

---

## Integration Points

### **Lexer → Parser**
```javascript
// Parser uses lexer to get tokens
const parser = new Parser(lexer);
parser.currentToken = lexer.getNextToken();
```

### **Parser → Interpreter**
```javascript
// Interpreter executes the AST from parser
const ast = parser.parse();
const interpreter = new Interpreter();
const result = interpreter.interpret(ast);
```

### **Main Application Flow**
```javascript
// In app.js
function runCode() {
    const code = editor.getValue();
    const lexer = new Lexer(code);
    const parser = new Parser(lexer);
    const ast = parser.parse();
    
    const interpreter = new Interpreter();
    const result = interpreter.interpret(ast);
    
    // Render shapes on canvas
    renderer.setShapes(result.shapes);
}
```

---

## Error Handling

### **Lexer Errors**
```javascript
// In lexer
throw new Error(`Unexpected character: ${this.currentChar} at line ${this.line}`);
```

### **Parser Errors**  
```javascript
// In parser
error(message) {
    throw new Error(`Parser error at line ${this.currentToken.line}: ${message}`);
}
```

### **Runtime Errors**
```javascript
// In interpreter
throw new Error(`Runtime error: Unknown parameter '${paramName}'`);
```

---

## Testing New Features

### **1. Write Test Code**
```aqui
// test.aqui
mynewkeyword 5 {
    // test content
}
```

### **2. Test Lexer**
```javascript
const lexer = new Lexer(testCode);
let token;
while ((token = lexer.getNextToken()).type !== 'EOF') {
    console.log(token);
}
```

### **3. Test Parser**
```javascript
const parser = new Parser(lexer);
const ast = parser.parse();
console.log(JSON.stringify(ast, null, 2));
```

### **4. Test Interpreter**
```javascript
const interpreter = new Interpreter();
const result = interpreter.interpret(ast);
console.log(result);
```

---

## Common Extension Patterns

### **Adding New Shape Types**
1. Add to lexer keywords (if new keyword needed)
2. Handle in parser's `parseShape()` method  
3. Add shape creation in interpreter's `createShape()` method
4. Add shape class to `Shapes.mjs`

### **Adding New Operators**
1. Add to lexer's operator handling
2. Add to parser's expression parsing
3. Add evaluation in interpreter's `evaluateBinaryOp()`

### **Adding New Control Structures**
1. Add keywords to lexer
2. Add parsing method to parser
3. Add execution method to interpreter
4. Handle in main statement switch

This architecture makes AQUI highly extensible while maintaining clean separation of concern
