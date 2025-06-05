// codeRunner.js - Handles code execution and interpretation

export class CodeRunner {
  constructor(lexer, parser, interpreter, renderer, editor, displayErrors, astOutput, parameterManager) {
    this.Lexer = lexer;
    this.Parser = parser;
    this.Interpreter = interpreter;
    this.renderer = renderer;
    this.editor = editor;
    this.displayErrors = displayErrors;
    this.astOutput = astOutput;
    this.parameterManager = parameterManager;
    this.interpreterInstance = null; // Current interpreter instance
  }

  runCode() {
    try {
      // Always clear in interactive mode since we'll be setting shapes
      this.renderer.clear();
      
      const code = this.editor.getValue();
      const lexer = new this.Lexer(code);
      const parser = new this.Parser(lexer);
      const ast = parser.parse();
      this.astOutput.textContent = JSON.stringify(ast, null, 2);

      this.interpreterInstance = new this.Interpreter();
      const result = this.interpreterInstance.interpret(ast);

      // Interactive mode is always on - make the renderer aware of all shapes
      if (!this.renderer.shapes) {
        this.renderer.shapes = new Map();
      }
      
      this.renderer.setShapes(result.shapes);
      
      // If parameter manager exists and the menu is visible, update the shapes
      if (this.parameterManager && this.parameterManager.menuVisible) {
        setTimeout(() => {
          this.parameterManager.updateWithLatestInterpreter();
        }, 100);
      }
      
      this.displayErrors([]);

    } catch (error) {
      console.error(error);
      this.displayErrors(error);
    }
  }

  // Get the current interpreter instance (for external access)
  getInterpreter() {
    return this.interpreterInstance;
  }

  // Set parameter manager reference
  setParameterManager(parameterManager) {
    this.parameterManager = parameterManager;
  }
}