// Lexer3D.mjs - Lexical analysis for the 3D Aqui language
export class Token {
    constructor(type, value, line, column) {
      this.type = type;
      this.value = value;
      this.line = line;
      this.column = column;
    }
  }
  
  export class Lexer3D {
    constructor(input) {
      this.input = input;
      this.position = 0;
      this.line = 1;
      this.column = 1;
      this.currentChar = this.input[0] || null;
    }
  
    error(message) {
      throw new Error(`Lexer error at line ${this.line}, col ${this.column}: ${message}`);
    }
  
    advance() {
      this.position++;
      if (this.position >= this.input.length) {
        this.currentChar = null;
      } else {
        this.currentChar = this.input[this.position];
        this.column++;
      }
    }
  
    skipComment() {
      this.advance();
      this.advance();
      while (this.currentChar !== null && this.currentChar !== '\n') {
        this.advance();
      }
    }
  
    skipWhitespace() {
      while (this.currentChar && /\s/.test(this.currentChar)) {
        if (this.currentChar === '\n') {
          this.line++;
          this.column = 1;
        }
        this.advance();
      }
    }
  
    // Handle both regular numbers and hex numbers
    number() {
      const startColumn = this.column;
      let result = '';
      
      // Check for hexadecimal format
      if (this.currentChar === '0' && this.peek() && this.peek().toLowerCase() === 'x') {
        result += '0x';
        this.advance(); // Skip '0'
        this.advance(); // Skip 'x'
        
        // Parse hex digits
        const isHexDigit = (char) => /[0-9a-fA-F]/.test(char);
        while (this.currentChar && isHexDigit(this.currentChar)) {
          result += this.currentChar;
          this.advance();
        }
        
        // Return a number token with the parsed hex value
        return new Token('NUMBER', parseInt(result, 16), this.line, startColumn);
      }
      
      // Parse regular decimal numbers
      while (this.currentChar && /\d/.test(this.currentChar)) {
        result += this.currentChar;
        this.advance();
      }
      
      // Handle decimal points
      if (this.currentChar === '.') {
        result += '.';
        this.advance();
        while (this.currentChar && /\d/.test(this.currentChar)) {
          result += this.currentChar;
          this.advance();
        }
      }
      
      return new Token('NUMBER', parseFloat(result), this.line, startColumn);
    }
  
    // Helper to peek at the next character without advancing
    peek() {
      if (this.position + 1 >= this.input.length) {
        return null;
      }
      return this.input[this.position + 1];
    }
  
    identifier() {
      const startColumn = this.column;
      let result = '';
      while (this.currentChar && /[a-zA-Z0-9_.]/.test(this.currentChar)) {
        result += this.currentChar;
        this.advance();
      }
      
      // 3D language keywords
      const keywords = {
        'param': 'PARAM',
        'shape3d': 'SHAPE3D',
        'layer': 'LAYER',
        'transform': 'TRANSFORM',
        'add': 'ADD',
        'rotate': 'ROTATE',
        'rotation': 'ROTATION',
        'scale': 'SCALE',
        'position': 'POSITION',
        'depth': 'DEPTH',
        'extrude': 'EXTRUDE',
        'bevel': 'BEVEL',
        'material': 'MATERIAL',
        'color': 'COLOR', // Added color keyword
        'metalness': 'METALNESS', // Added metalness keyword
        'roughness': 'ROUGHNESS', // Added roughness keyword
        'wireframe': 'WIREFRAME', // Added wireframe keyword
        'if': 'IF',
        'else': 'ELSE',
        'endif': 'ENDIF',
        'true': 'TRUE',
        'false': 'FALSE',
        'and': 'AND',
        'or': 'OR',
        'not': 'NOT',
        'for': 'FOR',
        'from': 'FROM',
        'to': 'TO',
        'step': 'STEP',
        'def': 'DEF',
        'return': 'RETURN'
      };
      
      const type = keywords[result.toLowerCase()] || 'IDENTIFIER';
      return new Token(type, result, this.line, startColumn);
    }
  
    getNextToken() {
      while (this.currentChar !== null) {
        if (this.currentChar === '/' && this.input[this.position + 1] === '/') {
          this.skipComment();
          continue;
        }
        
        if (/\s/.test(this.currentChar)) {
          this.skipWhitespace();
          continue;
        }
        
        // First check if the current character is a digit or starts with '0x'
        if (/\d/.test(this.currentChar) || 
            (this.currentChar === '0' && this.peek() && this.peek().toLowerCase() === 'x')) {
          return this.number();
        }
        
        if (/[a-zA-Z_]/.test(this.currentChar)) {
          return this.identifier();
        }
  
        // Comparison operators
        if (this.currentChar === '=' && this.input[this.position + 1] === '=') {
          this.advance();
          this.advance();
          return new Token('EQUALS', '==', this.line, this.column - 1);
        }
  
        if (this.currentChar === '!' && this.input[this.position + 1] === '=') {
          this.advance();
          this.advance();
          return new Token('NOT_EQUALS', '!=', this.line, this.column - 1);
        }
  
        if (this.currentChar === '<') {
          this.advance();
          if (this.currentChar === '=') {
            this.advance();
            return new Token('LESS_EQUALS', '<=', this.line, this.column - 1);
          }
          return new Token('LESS', '<', this.line, this.column);
        }
  
        if (this.currentChar === '>') {
          this.advance();
          if (this.currentChar === '=') {
            this.advance();
            return new Token('GREATER_EQUALS', '>=', this.line, this.column - 1);
          }
          return new Token('GREATER', '>', this.line, this.column);
        }
  
        // Basic operators and symbols
        const startColumn = this.column;
        const char = this.currentChar;
        this.advance();
        
        switch (char) {
          case '{':
            return new Token('LBRACE', '{', this.line, startColumn);
          case '}':
            return new Token('RBRACE', '}', this.line, startColumn);
          case '[':
            return new Token('LBRACKET', '[', this.line, startColumn);
          case ']':
            return new Token('RBRACKET', ']', this.line, startColumn);
          case ':':
            return new Token('COLON', ':', this.line, startColumn);
          case ',':
            return new Token('COMMA', ',', this.line, startColumn);
          case '*':
            return new Token('MULTIPLY', '*', this.line, startColumn);
          case '/':
            return new Token('DIVIDE', '/', this.line, startColumn);
          case '+':
            return new Token('PLUS', '+', this.line, startColumn);
          case '-':
            return new Token('MINUS', '-', this.line, startColumn);
          case '.':
            return new Token('DOT', '.', this.line, startColumn);
          case '"':
            return new Token('QUOTE', '"', this.line, startColumn);
          case '(':
            return new Token('LPAREN', '(', this.line, startColumn);
          case ')':
            return new Token('RPAREN', ')', this.line, startColumn);
          default:
            this.error(`Unknown character: ${char}`);
        }
      }
      return new Token('EOF', null, this.line, this.column);
    }
  }