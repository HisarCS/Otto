// Global variables
let interpreter;
let renderer;
let currentPanel = null;
let parameterManager = null;
let editor3D = null;
let renderer3D = null;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Ensure THREE.js is globally available
  window.THREE = THREE;
  console.log("THREE.js initialized globally:", !!window.THREE);
  
  // Initialize the application components
  initUI();
  
  // Import the necessary modules
  Promise.all([
    import('./lexer.mjs'),
    import('./parser.mjs'),
    import('./interpreter.mjs'),
    import('./renderer.mjs'),
    import('./turtleDrawer.mjs'),
    import('./2DParameters.mjs'),
    import('./svgExport.mjs')
  ]).then(modules => {
    const [
      { Lexer },
      { Parser },
      { Interpreter },
      { Renderer },
      { TurtleDrawer },
      { ParameterManager },
      { exportToSVG }
    ] = modules;
    
    // Initialize 2D functionality
    init2D(Lexer, Parser, Interpreter, Renderer, ParameterManager, exportToSVG);
    
    // Load documentation
    initDocs();
  }).catch(error => {
    console.error("Error loading modules:", error);
    document.getElementById('error-panel').innerHTML = 
      `<div class="error-message">Error loading modules: ${error.message}</div>`;
    document.getElementById('error-panel').classList.add('visible');
  });
});

// Initialize UI and event listeners
function initUI() {
  // Tab functionality
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Deactivate all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Activate clicked tab
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');
      
      // If switched to editor tab, refresh the canvas
      if (tabId === 'editor-tab' && interpreter) {
        renderer.setupCanvas();
        runCode();
      }
      
      // If switched to 3D tab, initialize Three.js if not already done
      if (tabId === '3d-tab') {
        initThreeJs(); // This is now safe to call multiple times
        
        // Resize renderer if it's already initialized
        if (renderer3D) {
          renderer3D.onWindowResize();
        }
        
        // Refresh the editor to ensure proper display
        if (editor3D) {
          editor3D.refresh();
        }
      }
      
      // If switched to docs tab, render documentation
      if (tabId === 'docs-tab') {
        renderDocumentation();
      }
    });
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    const activeTab = document.querySelector('.tab-content.active').id;
    
    if (activeTab === 'editor-tab' && renderer) {
      renderer.setupCanvas();
      runCode();
    } else if (activeTab === '3d-tab' && renderer3D) {
      renderer3D.onWindowResize();
    }
  });
}

// Initialize 2D functionality
function init2D(Lexer, Parser, Interpreter, Renderer, ParameterManager, exportToSVG) {
  const canvas = document.getElementById('canvas');
  const runButton = document.getElementById('run-button');
  const viewAstButton = document.getElementById('view-ast');
  const viewErrorsButton = document.getElementById('view-errors');
  const exportSvgButton = document.getElementById('export-svg');
  const astPanel = document.getElementById('ast-panel');
  const errorPanel = document.getElementById('error-panel');
  const astOutput = document.getElementById('ast-output');
  const errorOutput = document.getElementById('error-output');
  const errorCount = document.getElementById('error-count');

  // Create and add Parameters button
  const paramsButton = document.createElement('button');
  paramsButton.className = 'button';
  paramsButton.id = 'params-button';
  paramsButton.textContent = 'Parameters';
  document.querySelector('.footer').appendChild(paramsButton);
  
  // Initialize CodeMirror for 2D editor
  CodeMirror.defineSimpleMode("aqui", {
    start: [
      { regex: /\/\/.*/, token: "comment" },
      { regex: /\b(param|shape|layer|transform|add|subtract|rotate|scale|position|isBezier|isHole|def|return|draw|forward|backward|right|left|goto|penup|pendown)\b/, token: "keyword" },
      { regex: /\b\d+(\.\d+)?\b/, token: "number" },
      { regex: /"(?:[^\\]|\\.)*?"/, token: "string" },
      { regex: /[\{\}\[\]:,()]/, token: "operator" }
    ]
  });

  const editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
    mode: "aqui",
    theme: "default",
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true
  });

  renderer = new Renderer(canvas);
  
  // Extended ParameterManager class with update button
  class ExtendedParameterManager extends ParameterManager {
    constructor(canvas, interpreter, editor, runCode) {
      super(canvas, interpreter, editor, runCode);
      this.addUpdateButton();
    }
    
    addUpdateButton() {
      // Create update button
      const updateButton = document.createElement('button');
      updateButton.className = 'update-button';
      updateButton.textContent = 'Update';
      
      // Enhanced styling for the update button
      updateButton.style.position = 'absolute';
      updateButton.style.bottom = '15px';
      updateButton.style.left = '15px';
      updateButton.style.padding = '8px 12px';
      updateButton.style.fontSize = '13px';
      updateButton.style.fontFamily = 'monospace';
      updateButton.style.backgroundColor = '#1289d8';
      updateButton.style.color = 'white';
      updateButton.style.border = 'none';
      updateButton.style.borderRadius = '4px';
      updateButton.style.cursor = 'pointer';
      updateButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      updateButton.style.transition = 'all 0.2s ease-in-out';
      
      // Add hover effect
      updateButton.addEventListener('mouseover', () => {
        updateButton.style.backgroundColor = '#0d6efd';
        updateButton.style.boxShadow = '0 3px 6px rgba(0,0,0,0.25)';
        updateButton.style.transform = 'translateY(-1px)';
      });
      updateButton.addEventListener('mouseout', () => {
        updateButton.style.backgroundColor = '#1289d8';
        updateButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        updateButton.style.transform = 'translateY(0)';
      });
      
      // Add active effect (when clicked)
      updateButton.addEventListener('mousedown', () => {
        updateButton.style.backgroundColor = '#0a58ca';
        updateButton.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';
        updateButton.style.transform = 'translateY(1px)';
      });
      updateButton.addEventListener('mouseup', () => {
        updateButton.style.backgroundColor = '#0d6efd';
        updateButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        updateButton.style.transform = 'translateY(0)';
      });
      
      // Add click handler to update shapes
      updateButton.addEventListener('click', () => {
        this.updateWithLatestInterpreter();
      });
      
      // Add to container
      this.container.appendChild(updateButton);
      
      // Improve the container styling to accommodate the button
      this.container.style.paddingBottom = '50px';
    }
    
    // Method to update directly from the current interpreter
    updateWithLatestInterpreter() {
      try {
        const updateButton = this.container.querySelector('.update-button');
        
        // Access the current interpreter from the global scope
        if (typeof interpreter !== 'undefined' && interpreter) {
          // Remember the current selection
          const currentSelectedShape = this.currentShape;
          
          // Update the reference to the interpreter
          this.interpreter = interpreter;
          
          // Refresh the shapes list with the current interpreter's shapes
          this.refreshShapeList();
          
          // Try to restore the previous selection if it still exists
          if (currentSelectedShape && this.shapeSelector) {
            // Find the option with the matching value
            for (let i = 0; i < this.shapeSelector.options.length; i++) {
              if (this.shapeSelector.options[i].value === currentSelectedShape) {
                this.shapeSelector.selectedIndex = i;
                this.onShapeSelected(); // Reload parameters for this shape
                break;
              }
            }
          }
          
          // Add visual feedback with improved styling for success
          if (updateButton) {
            const originalText = updateButton.textContent;
            updateButton.textContent = '✓ Updated!';
            updateButton.style.backgroundColor = '#28a745';
            
            setTimeout(() => {
              updateButton.textContent = originalText;
              updateButton.style.backgroundColor = '#1289d8';
            }, 1200);
          }
        } else {
          throw new Error("Interpreter not available");
        }
      } catch (e) {
        console.error("Error updating shapes:", e);
        const updateButton = this.container.querySelector('.update-button');
        
        // Provide visual feedback for error
        if (updateButton) {
          const originalText = updateButton.textContent;
          updateButton.textContent = '✗ Error!';
          updateButton.style.backgroundColor = '#dc3545';
          
          setTimeout(() => {
            updateButton.textContent = originalText;
            updateButton.style.backgroundColor = '#1289d8';
          }, 1200);
        }
      }
    }
  }

  // Create parameter manager when button is clicked
  paramsButton.addEventListener('click', () => {
    if (!parameterManager && interpreter) {
      // Use extended parameter manager with update button
      parameterManager = new ExtendedParameterManager(canvas, interpreter, editor, runCode);
    } else if (parameterManager) {
      // If the interpreter has changed, update the reference
      if (parameterManager.interpreter !== interpreter) {
        parameterManager.interpreter = interpreter;
      }
      
      parameterManager.toggleMenu();
      parameterManager.refreshShapeList();
    }
  });

  function showPanel(panel) {
    if (currentPanel) {
      currentPanel.classList.remove('visible');
    }
    if (currentPanel !== panel) {
      panel.classList.add('visible');
      currentPanel = panel;
    } else {
      currentPanel = null;
    }
  }

  function displayErrors(errors) {
    const errorArray = Array.isArray(errors) ? errors : [errors];
    errorOutput.innerHTML = errorArray.map(error => {
      const location = error.line ? 
        `<div class="error-location">Line ${error.line}, Column ${error.column}</div>` : '';
      return `<div class="error-message">${error.message}${location}</div>`;
    }).join('');

    errorCount.textContent = errorArray.length;
    errorCount.classList.toggle('visible', errorArray.length > 0);
    viewErrorsButton.classList.toggle('error', errorArray.length > 0);
  }

  // Main function to run the code
  window.runCode = function() {
    try {
      renderer.clear();
      const code = editor.getValue();
      const lexer = new Lexer(code);
      const parser = new Parser(lexer);
      const ast = parser.parse();
      astOutput.textContent = JSON.stringify(ast, null, 2);

      interpreter = new Interpreter();
      const result = interpreter.interpret(ast);

      // Draw shapes
      result.shapes.forEach(shape => {
        renderer.drawShape(shape);
      });

      // Draw layers with transformations
      result.layers.forEach(layer => {
        const { transform } = layer;
        layer.addedShapes.forEach(shapeName => {
          if (result.shapes.has(shapeName)) {
            const shape = result.shapes.get(shapeName);
            const combinedShape = {
              ...shape,
              transform: {
                position: shape.transform.position,
                rotation: (shape.transform.rotation || 0) + (transform.rotation || 0),
                scale: [
                  shape.transform.scale[0] * transform.scale[0],
                  shape.transform.scale[1] * transform.scale[1]
                ]
              }
            };
            renderer.drawShape(combinedShape);
          }
        });
      });
      
      // If parameter manager exists and the menu is visible, update the shapes
      if (parameterManager && parameterManager.menuVisible) {
        setTimeout(() => {
          parameterManager.updateWithLatestInterpreter();
        }, 100);
      }
      
      displayErrors([]);

    } catch (error) {
      console.error(error);
      displayErrors(error);
    }
  };

  // SVG Export functionality
  function handleSVGExport() {
    try {
      // Get filename from prompt with default value
      const filename = prompt("Enter filename for SVG export:", "aqui_drawing.svg");
      
      // If user cancels prompt, abort export
      if (filename === null) return;
      
      // Ensure filename has .svg extension
      const validFilename = filename.toLowerCase().endsWith('.svg') ? 
        filename : `${filename}.svg`;
      
      // Call the export function with interpreter, canvas and filename
      const result = exportToSVG(interpreter, canvas, validFilename);
      
      if (result !== true && result?.error) {
        displayErrors([{ message: `SVG Export failed: ${result.error}` }]);
      }
    } catch (error) {
      console.error('SVG Export error:', error);
      displayErrors([{ message: `SVG Export failed: ${error.message}` }]);
    }
  }

  // Event listeners
  runButton.addEventListener('click', runCode);
  viewAstButton.addEventListener('click', () => showPanel(astPanel));
  viewErrorsButton.addEventListener('click', () => showPanel(errorPanel));
  exportSvgButton.addEventListener('click', handleSVGExport);

  editor.on("keydown", (cm, event) => {
    if (event.shiftKey && event.key === "Enter") {
      event.preventDefault();
      runCode();
    }
  });

  // Initial run
  runCode();
}

// Documentation content
const documentationMarkdown = `3D_docs: https://github.com/EmreDay1/Aqui/tree/main/Docs/3D
2D_docs: https://github.com/EmreDay1/Aqui/blob/main/Docs/2D/README.md`;

// Initialize documentation functionality
function initDocs() {
  // Get the documentation content element
  const markdownContent = document.getElementById('markdown-content');
  
  // Render documentation when requested
  renderDocumentation();
  
  function renderDocumentation() {
    if (!markdownContent.innerHTML) {
      markdownContent.innerHTML = marked.parse(documentationMarkdown);
    }
  }
}

// Initialize Three.js for 3D rendering
function initThreeJs() {
  // Prevent multiple initializations of the editor
  if (editor3D) {
    console.log("3D editor already initialized, skipping initialization");
    return;
  }
  
  try {
    const canvas3D = document.getElementById('canvas-3d');
    const statusElement = document.getElementById('status-3d');
    const runButton3D = document.getElementById('run-button-3d');
    const resetViewButton = document.getElementById('reset-view');
    const toggleGridButton = document.getElementById('toggle-grid');
    
    // Define the mode for Aqui3D
    CodeMirror.defineSimpleMode("aqui3d", {
      start: [
        { regex: /\/\/.*/, token: "comment" },
        { regex: /\b(param|shape3d|layer|transform|add|rotate|scale|position|depth|extrude|bevel|material|if|else|for|from|to|step|def|return)\b/, token: "keyword" },
        { regex: /\b\d+(\.\d+)?\b/, token: "number" },
        { regex: /\b(0x[0-9a-fA-F]+)\b/, token: "number" }, // Hex color support
        { regex: /"(?:[^\\]|\\.)*?"/, token: "string" },
        { regex: /true|false/, token: "atom" },
        { regex: /[\{\}\[\]:,()]/, token: "operator" }
      ]
    });

    // Initialize the editor once
    const textArea = document.getElementById('code-editor-3d');
    // Reset content to ensure there are no extra newlines
    textArea.value = "//Aqui 3D";
    
    editor3D = CodeMirror.fromTextArea(textArea, {
      mode: "aqui3d",
      theme: "default",
      lineNumbers: true,
      autoCloseBrackets: true,
      indentUnit: 2,
      tabSize: 2
    });
    
    // Import necessary modules for 3D
    Promise.all([
      import('./Lexer3D.mjs'),
      import('./Parser3D.mjs'),
      import('./Interpreter3D.mjs'),
      import('./Renderer3D.mjs')
    ]).then(([
      { Lexer3D },
      { Parser3D },
      { Interpreter3D },
      { Renderer3D }
    ]) => {
      // Initialize 3D renderer
      try {
        renderer3D = new Renderer3D(canvas3D);
        console.log("Renderer3D initialized successfully");
      } catch (error) {
        console.error("Error initializing 3D renderer:", error);
        statusElement.textContent = `Error initializing renderer: ${error.message}`;
        statusElement.className = "status error";
      }
      
      // Function to run 3D code
      function run3DCode() {
        try {
          statusElement.textContent = "Processing...";
          statusElement.className = "status";
          
          const code = editor3D.getValue();
          
          // Use the full language infrastructure
          console.log("Creating lexer...");
          const lexer = new Lexer3D(code);
          
          console.log("Creating parser...");
          const parser = new Parser3D(lexer);
          
          console.log("Parsing code...");
          const ast = parser.parse();
          console.log("AST:", ast);
          
          // Execute code
          console.log("Interpreting code...");
          const interpreter = new Interpreter3D();
          const results = interpreter.interpret(ast);
          console.log("Interpretation results:", results);
          
          // Render results
          console.log("Rendering results...");
          renderer3D.renderResults(results);
          
          statusElement.textContent = "Code executed successfully";
        } catch (error) {
          console.error("Error executing code:", error);
          statusElement.textContent = `Error: ${error.message}`;
          statusElement.className = "status error";
        }
      }
      
      // Add event listeners
      runButton3D.addEventListener('click', run3DCode);
      
      resetViewButton.addEventListener('click', () => {
        renderer3D.resetView();
      });
      
      toggleGridButton.addEventListener('click', () => {
        renderer3D.toggleGrid();
      });
      
      // Add Shift+Enter shortcut for running code
      editor3D.on("keydown", (cm, event) => {
        if (event.shiftKey && event.key === "Enter") {
          event.preventDefault();
          run3DCode();
        }
      });
      
      // Make run3DCode accessible globally
      window.run3DCode = run3DCode;
      
      // Initial run of 3D code
      setTimeout(() => {
        try {
          console.log("Running initial 3D code...");
          run3DCode();
        } catch (error) {
          console.error("Error running initial 3D code:", error);
          statusElement.textContent = `Initialization error: ${error.message}`;
          statusElement.className = "status error";
        }
      }, 300);
    }).catch(error => {
      console.error("Error loading 3D modules:", error);
      statusElement.textContent = `Error loading 3D modules: ${error.message}`;
      statusElement.className = "status error";
    });
  } catch (error) {
    console.error("Error initializing 3D:", error);
    document.getElementById('status-3d').textContent = `Error initializing 3D: ${error.message}`;
    document.getElementById('status-3d').className = "status error";
  }
}
