# AQUI Language Build Documentation

## Architecture Overview

AQUI follows a classic interpreter architecture with three main phases:
1. **Lexical Analysis** (`lexer.mjs`) - Convert source code into tokens
2. **Parsing** (`parser.mjs`) - Convert tokens into Abstract Syntax Tree (AST)  
3. **Interpretation** (`interpreter.mjs`) - Execute the AST

---

## Lexer (`lexer.mjs`)

### Purpose
The lexer is the first phase of compilation. It reads raw source code character by character and groups them into meaningful tokens (keywords, identifiers, numbers, operators, etc.). This process is called tokenization.

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
**How it works:** Each token represents a single meaningful unit from the source code. The `type` tells us what kind of token it is, `value` holds the actual content, and `line`/`column` help with error reporting. For example, the code `shape circle` would create two tokens: `Token('SHAPE', 'shape', 1, 1)` and `Token('IDENTIFIER', 'circle', 1, 7)`.

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
**How it works:** The lexer maintains a cursor (`position`) that moves through the source code. `currentChar` always holds the character we're currently examining. `line` and `column` track our position for error messages. The lexer works by examining one character at a time and deciding what token to create based on what it sees.

### Adding New Keywords
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
**How it works:** When the lexer encounters an identifier (like `param` or `mynewkeyword`), it first checks if it's a reserved keyword in this object. If found, it creates a keyword token; otherwise, it's treated as a regular identifier. The mapping allows us to distinguish between `shape` (keyword) and `myShape` (identifier).

### Token Types
Current token types include:
- `IDENTIFIER` - Variable/function names (myCircle, radius)
- `NUMBER` - Numeric literals (50, 3.14, -10)
- `STRING` - String literals ("red", "hello world")
- `KEYWORD` - Language keywords (shape, param, if)
- `OPERATOR` - Mathematical operators (+, -, *, /)
- `PUNCTUATION` - Braces, brackets, colons, etc.

### Key Methods

#### **getNextToken()**
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
**How it works:** This is the main tokenization loop. It examines the current character and decides what to do:
1. **Whitespace**: Skip over spaces, tabs, newlines
2. **Comments**: Skip `//` comments entirely
3. **Letters**: Start reading an identifier or keyword
4. **Digits**: Start reading a number
5. **Other chars**: Handle operators, punctuation, etc.

The `while` loop continues until we reach the end of the source code, producing one token per call.

#### **identifier() Method**
```javascript
identifier() {
    let result = '';
    while (this.currentChar !== null && 
           (this.isAlpha(this.currentChar) || this.isDigit(this.currentChar) || this.currentChar === '_')) {
        result += this.currentChar;
        this.advance();
    }
    
    // Check if it's a keyword
    const tokenType = this.keywords[result.toLowerCase()] || 'IDENTIFIER';
    return new Token(tokenType, result, this.line, this.column);
}
```
**How it works:** When we encounter a letter, we keep reading characters until we hit something that can't be part of an identifier (space, operator, etc.). We then check if the collected string is a keyword. If `result` is "shape", we return a SHAPE token; if it's "myCircle", we return an IDENTIFIER token.

#### **number() Method**
```javascript
number() {
    let result = '';
    let decimalSeen = false;
    
    while (this.currentChar !== null && 
           (this.isDigit(this.currentChar) || 
           (this.currentChar === '.' && !decimalSeen))) {
        
        if (this.currentChar === '.') {
            decimalSeen = true;
        }
        
        result += this.currentChar;
        this.advance();
    }
    
    return new Token('NUMBER', parseFloat(result), this.line, this.column);
}
```
**How it works:** Numbers can be integers (50) or decimals (3.14). We read digits and at most one decimal point. The `decimalSeen` flag prevents multiple decimal points (which would be invalid). We use `parseFloat()` to convert the string to an actual number value.

#### **Adding New Token Types**
```javascript
// Example: Adding support for @ symbol
if (this.currentChar === '@') {
    this.advance();
    return new Token('AT', '@', this.line, this.column);
}
```
**How it works:** To add new single-character tokens, add a condition in `getNextToken()`. For multi-character tokens, create a method similar to `identifier()` or `number()` that reads multiple characters. Always call `advance()` to move the cursor forward.

---

## Parser (`parser.mjs`)

### Purpose
The parser takes the stream of tokens from the lexer and builds an Abstract Syntax Tree (AST). It understands the grammar rules of AQUI and ensures the code follows the correct syntax. The AST represents the hierarchical structure of the program.

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
**How it works:** The parser always looks at one token ahead (`currentToken`). The `eat()` method is crucial - it checks if the current token matches what we expect, then advances to the next token. If the token doesn't match, we have a syntax error. This implements predictive parsing - we predict what should come next based on the grammar rules.

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
**How it works:** AQUI programs are sequences of statements. We keep parsing statements until we hit End-Of-File. Each statement becomes a node in our AST. The resulting array represents the entire program structure.

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
**How it works:** This implements the core grammar rule: `statement → param | shape | boolean_op | if | for`. We look at the first token to decide which type of statement we're parsing. This is called LL(1) parsing - we can decide the rule based on looking ahead one token.

#### **parseShape() Method**
```javascript
parseShape() {
    this.eat('SHAPE');                    // Consume 'shape' keyword
    const shapeType = this.currentToken.value;
    this.eat('IDENTIFIER');               // Consume shape type (circle, rectangle, etc.)
    const name = this.currentToken.value;
    this.eat('IDENTIFIER');               // Consume shape name
    this.eat('LBRACE');                   // Consume '{'
    
    const properties = [];
    while (this.currentToken.type !== 'RBRACE') {
        const property = this.parseProperty();
        properties.push(property);
    }
    
    this.eat('RBRACE');                   // Consume '}'
    
    return {
        type: 'shape',
        shapeType: shapeType,
        name: name,
        properties: properties
    };
}
```
**How it works:** This parses the grammar rule: `shape → SHAPE IDENTIFIER IDENTIFIER '{' property* '}'`. We consume each expected token in order and collect the properties. The `while` loop handles zero or more properties. The result is an AST node representing the shape definition.

#### **parseProperty() Method**
```javascript
parseProperty() {
    const key = this.currentToken.value;
    this.eat('IDENTIFIER');               // Property name (radius, position, etc.)
    this.eat('COLON');                    // ':'
    const value = this.parseExpression(); // Property value
    
    return {
        type: 'property',
        key: key,
        value: value
    };
}
```
**How it works:** Properties follow the pattern `key: value`. We parse the key as an identifier, expect a colon, then parse the value as an expression. Expressions can be numbers, strings, arrays, or complex mathematical expressions.

### Adding New Language Constructs

#### **1. Add Token to Lexer**
```javascript
// lexer.mjs
const keywords = {
    'repeat': 'REPEAT',  // New keyword
    // ...
};
```
**How it works:** First, make the lexer recognize our new keyword. When the lexer sees `repeat` in the source code, it will create a REPEAT token instead of treating it as a regular identifier.

#### **2. Add Parser Method**
```javascript
// parser.mjs
parseRepeatStatement() {
    this.eat('REPEAT');                   // Consume 'repeat'
    const count = this.parseExpression(); // How many times to repeat
    this.eat('LBRACE');                   // '{'
    
    const body = [];
    while (this.currentToken.type !== 'RBRACE') {
        body.push(this.parseStatement()); // Parse statements inside repeat block
    }
    this.eat('RBRACE');                   // '}'
    
    return {
        type: 'repeat_statement',
        count: count,
        body: body
    };
}
```
**How it works:** This implements the grammar rule: `repeat → REPEAT expression '{' statement* '}'`. We consume the keyword, parse the count expression, then parse all statements inside the braces. The AST node contains both the count and the body statements.

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
**How it works:** We add our new statement type to the main statement dispatcher. Now when the parser encounters a REPEAT token, it knows to call our `parseRepeatStatement()` method.

### Expression Parsing

#### **parseExpression() - Arithmetic Expressions**
```javascript
parseExpression() {
    let node = this.parseTerm();
    
    while (this.currentToken.type === 'PLUS' || this.currentToken.type === 'MINUS') {
        const operator = this.currentToken.type.toLowerCase();
        this.eat(this.currentToken.type);
        node = {
            type: 'binary_op',
            operator: operator,
            left: node,
            right: this.parseTerm()
        };
    }
    
    return node;
}
```
**How it works:** This handles operator precedence using recursive descent. Addition/subtraction have lower precedence than multiplication/division. We parse terms first, then if we see + or -, we create a binary operation node. The left-associative loop handles chains like `a + b + c` correctly.

#### **parseTerm() - Higher Precedence Operations**
```javascript
parseTerm() {
    let node = this.parseFactor();
    
    while (this.currentToken.type === 'MULTIPLY' || this.currentToken.type === 'DIVIDE') {
        const operator = this.currentToken.type.toLowerCase();
        this.eat(this.currentToken.type);
        node = {
            type: 'binary_op',
            operator: operator,
            left: node,
            right: this.parseFactor()
        };
    }
    
    return node;
}
```
**How it works:** Similar to `parseExpression()` but for higher-precedence operations. By calling this from `parseExpression()`, we ensure that `2 + 3 * 4` is parsed as `2 + (3 * 4)`, not `(2 + 3) * 4`.

### AST Node Structure
Each AST node follows this pattern:
```javascript
{
    type: 'node_type',          // Required - identifies the node type
    // Node-specific properties
    line: tokenLine,            // Optional: for error reporting
    column: tokenColumn         // Optional: for error reporting
}
```
**How it works:** The `type` field is crucial - it tells the interpreter what kind of node this is and how to execute it. Other fields contain the data needed for that specific node type. Line/column information helps with runtime error reporting.

#### **Example AST Nodes**
```javascript
// Shape node
{
    type: 'shape',
    shapeType: 'circle',
    name: 'myCircle',
    properties: [
        { 
            type: 'property',
            key: 'radius', 
            value: { type: 'number', value: 50 } 
        }
    ]
}
```
**How it works:** This AST node represents `shape circle myCircle { radius: 50 }`. The hierarchical structure captures the relationship between the shape and its properties. Each property is itself a node with a key and value.

```javascript
// Parameter node  
{
    type: 'param',
    name: 'size',
    value: { type: 'number', value: 100 }
}
```
**How it works:** This represents `param size 100`. The value field contains another AST node - this allows parameters to have complex expressions like `param size 50 + 20`.

---

## Interpreter (`interpreter.mjs`)

### Purpose
The interpreter walks through the AST and executes each node. It maintains a runtime environment with variables, shapes, and other program state. This is where the actual computation happens.

### Core Structure

#### **Interpreter Class**
```javascript
class Interpreter {
    constructor() {
        this.env = {
            params: new Map(),      // Parameter name → value
            shapes: new Map(),      // Shape name → shape object
            layers: new Map()       // Layer name → layer object
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
**How it works:** The interpreter maintains an environment (`env`) that holds all runtime state. The `interpret()` method processes each statement in order. The environment is returned so the renderer can access the created shapes.

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
**How it works:** This is the main execution dispatcher. Based on the AST node type, we call the appropriate execution method. Each method knows how to handle its specific node type. If we encounter an unknown node type, we throw an error.

#### **executeParam() Method**
```javascript
executeParam(node) {
    const value = this.evaluateExpression(node.value);
    this.env.params.set(node.name, value);
}
```
**How it works:** Parameters are stored in a Map for fast lookup. We evaluate the parameter's value expression (which might be a complex calculation) and store the result. Later, when we see `param.size`, we can quickly look up the value.

#### **executeShape() Method**
```javascript
executeShape(node) {
    // Create base shape instance
    const shape = this.createShape(node.shapeType, {});
    
    // Apply properties
    for (const prop of node.properties) {
        const value = this.evaluateExpression(prop.value);
        this.applyProperty(shape, prop.key, value);
    }
    
    // Store in environment
    this.env.shapes.set(node.name, shape);
}
```
**How it works:** Shape execution involves three steps:
1. Create a base shape instance using the factory
2. Evaluate and apply each property
3. Store the configured shape in the environment

The separation allows properties to reference parameters: `radius: param.size` gets evaluated to the actual parameter value.

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
**How it works:** First, we evaluate the count expression to get the actual number. We validate it's a number (runtime type checking). Then we execute each statement in the body `count` times. The nested loops handle multiple statements inside the repeat block.

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
**How it works:** We add our new statement type to the execution dispatcher. Now when the interpreter encounters a repeat_statement AST node, it will call our execution method.

### Expression Evaluation

#### **evaluateExpression() Method**
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
**How it works:** Expression evaluation is recursive. Literals (numbers, strings) return their values directly. Parameter references look up values from the environment. Binary operations evaluate their operands recursively, then apply the operator. Arrays evaluate each element.

#### **evaluateBinaryOp() Method**
```javascript
evaluateBinaryOp(node) {
    const left = this.evaluateExpression(node.left);
    const right = this.evaluateExpression(node.right);
    
    switch (node.operator) {
        case 'plus':
            return left + right;
        case 'minus':
            return left - right;
        case 'multiply':
            return left * right;
        case 'divide':
            return left / right;
        default:
            throw new Error(`Unknown operator: ${node.operator}`);
    }
}
```
**How it works:** Binary operations evaluate both operands first, then apply the operator. This handles complex expressions like `(a + b) * c` correctly - the parentheses are encoded in the AST structure, so evaluation happens in the right order.

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
**How it works:** The environment uses Maps for efficient key-value storage. Parameters and shapes are stored by name. When resolving references (like `param.size`), we look up the name in the appropriate Map. If not found, we can throw a meaningful error message.

#### **Scope Handling (For Future Extension)**
```javascript
class Interpreter {
    constructor() {
        this.scopes = [new Map()]; // Stack of scopes
    }
    
    pushScope() {
        this.scopes.push(new Map());
    }
    
    popScope() {
        this.scopes.pop();
    }
    
    setVariable(name, value) {
        this.scopes[this.scopes.length - 1].set(name, value);
    }
    
    getVariable(name) {
        // Search from innermost to outermost scope
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(name)) {
                return this.scopes[i].get(name);
            }
        }
        throw new Error(`Undefined variable: ${name}`);
    }
}
```
**How it works:** This shows how to implement lexical scoping for functions and blocks. Each scope is a Map, and we maintain a stack of scopes. Variable resolution searches from innermost (top of stack) to outermost (bottom of stack) scope.

---

## Integration Points

### **Lexer → Parser**
```javascript
// Parser uses lexer to get tokens
const parser = new Parser(lexer);
parser.currentToken = lexer.getNextToken();
```
**How it works:** The parser requests tokens one at a time from the lexer. This lazy evaluation means we only tokenize as much as we need. The parser maintains one token of lookahead to make parsing decisions.

### **Parser → Interpreter**
```javascript
// Interpreter executes the AST from parser
const ast = parser.parse();
const interpreter = new Interpreter();
const result = interpreter.interpret(ast);
```
**How it works:** The parser produces a complete AST before the interpreter runs. This two-phase approach allows for optimizations and error checking before execution. The interpreter result contains all the shapes and parameters for rendering.

### **Main Application Flow**
```javascript
// In app.js
function runCode() {
    const code = editor.getValue();           // Get source code
    const lexer = new Lexer(code);           // Tokenize
    const parser = new Parser(lexer);        // Parse to AST
    const ast = parser.parse();              // Get complete AST
    
    const interpreter = new Interpreter();   // Create interpreter
    const result = interpreter.interpret(ast); // Execute AST
    
    // Render shapes on canvas
    renderer.setShapes(result.shapes);
}
```
**How it works:** This shows the complete pipeline from source code to rendered shapes. Each phase is independent - the lexer doesn't know about parsing, the parser doesn't know about execution. This separation makes the system modular and testable.

---

## Error Handling

### **Lexer Errors**
```javascript
// In lexer
if (this.currentChar === null) {
    throw new Error(`Unexpected end of input at line ${this.line}`);
}

throw new Error(`Unexpected character: ${this.currentChar} at line ${this.line}`);
```
**How it works:** Lexer errors occur when we encounter invalid characters or unexpected end of input. We include line numbers for debugging. These are typically syntax errors like invalid characters or unterminated strings.

### **Parser Errors**  
```javascript
// In parser
error(message) {
    throw new Error(`Parser error at line ${this.currentToken.line}: ${message}`);
}

eat(tokenType) {
    if (this.currentToken.type !== tokenType) {
        this.error(`Expected ${tokenType} but got ${this.currentToken.type}`);
    }
    this.currentToken = this.lexer.getNextToken();
}
```
**How it works:** Parser errors occur when the token stream doesn't match the expected grammar. The `eat()` method is where most syntax errors are caught. We provide both expected and actual token types for better error messages.

### **Runtime Errors**
```javascript
// In interpreter
executeParam(node) {
    if (this.env.params.has(node.name)) {
        console.warn(`Parameter '${node.name}' already defined, overwriting`);
    }
    
    const value = this.evaluateExpression(node.value);
    this.env.params.set(node.name, value);
}

evaluateParameterRef(node) {
    if (!this.env.params.has(node.name)) {
        throw new Error(`Undefined parameter: ${node.name}`);
    }
    return this.env.params.get(node.name);
}
```
**How it works:** Runtime errors occur during execution - undefined variables, type mismatches, etc. We can provide warnings for non-fatal issues (like redefining parameters) and throw errors for fatal issues (like using undefined parameters).

---

## Testing New Features

### **1. Write Test Code**
```aqui
// test.aqui
mynewkeyword 5 {
    // test content
}
```
**How it works:** Start with minimal test cases. This tests just the basic parsing of your new construct. Gradually add complexity once the basic case works.

### **2. Test Lexer**
```javascript
const lexer = new Lexer(testCode);
let token;
while ((token = lexer.getNextToken()).type !== 'EOF') {
    console.log(token);
}
```
**How it works:** This shows the raw token stream. Check that your new keywords are tokenized correctly. Common issues: case sensitivity, keyword conflicts with identifiers.

### **3. Test Parser**
```javascript
const parser = new Parser(lexer);
const ast = parser.parse();
console.log(JSON.stringify(ast, null, 2));
```
**How it works:** This shows the AST structure. Verify that the hierarchy is correct and all properties are captured. The JSON format makes it easy to see the tree structure.

### **4. Test Interpreter**
```javascript
const interpreter = new Interpreter();
const result = interpreter.interpret(ast);
console.log(result);
```
**How it works:** This tests execution. Check that your new construct produces the expected side effects (creates shapes, modifies environment, etc.). Use `console.log()` to trace execution flow.

---

## Common Extension Patterns

### **Adding New Shape Types**
1. **Lexer**: Add keyword if needed (`'gear': 'GEAR'`)
2. **Parser**: Handle in `parseShape()` method  
3. **Interpreter**: Add to `createShape()` method
4. **Shapes**: Add shape class to `Shapes.mjs`

**How it works:** Most shape additions don't need grammar changes - they're just new identifiers. The main work is in the shape class implementation and interpreter integration.

### **Adding New Operators**
1. **Lexer**: Add to operator handling (`'**': 'POWER'`)
2. **Parser**: Add to expression parsing with correct precedence
3. **Interpreter**: Add to `evaluateBinaryOp()`

**How it works:** Operators require careful precedence handling. Addition has lower precedence than multiplication, so `a + b * c` parses as `a + (b * c)`. The parser structure enforces this through the call hierarchy.

### **Adding New Control Structures**
1. **Lexer**: Add keywords (`'while': 'WHILE'`)
2. **Parser**: Add parsing method (`parseWhileStatement()`)
3. **Interpreter**: Add execution method (`executeWhileStatement()`)
4. **Integration**: Handle in main statement switch

**How it works:** Control structures usually involve parsing conditions and statement blocks. The parser builds the structure, and the interpreter handles the control flow logic (loops, conditionals, etc.).

This architecture makes AQUI highly extensible while maintaining clean separation of concerns. Each phase has a single responsibility, making it easy to understand, test, and extend.
