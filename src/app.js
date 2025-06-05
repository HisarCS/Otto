// app.js - Complete integration with real-time bidirectional sync

// Import custom modified renderer.mjs
import { Renderer } from './renderer.mjs';
import { shapeManager } from './shapeManager.mjs';

// Expose the Renderer class globally for use with other modules
window.AquiRenderer = Renderer;

// Global variables
let interpreter;
let renderer;
let currentPanel = null;
let parameterManager = null;
let editor = null;
let astOutput = null;
let errorOutput = null;
let errorCount = null;

// Global interpreter reference for parameter manager
window.interpreter = null;

const interactiveMode = true; // Interactive mode is always on

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Aqui application...');
  
  // Initialize the application components
  initUI();
  
  // Import the necessary modules
  Promise.all([
    import('./lexer.mjs'),
    import('./parser.mjs'),
    import('./interpreter.mjs'),
    import('./turtleDrawer.mjs'),
    import('./2DParameters.mjs'),
    import('./svgExport.mjs')
  ]).then(modules => {
    const [
      { Lexer },
      { Parser },
      { Interpreter },
      { TurtleDrawer },
      { ParameterManager },
      { exportToSVG }
    ] = modules;
    
    console.log('📦 Modules loaded successfully');
    
    // Initialize 2D functionality with the globally available Renderer
    init2D(Lexer, Parser, Interpreter, window.AquiRenderer, ParameterManager, exportToSVG);
    
    // Load documentation
    initDocs();
    
    console.log('✅ Application initialized successfully');
  }).catch(error => {
    console.error("❌ Error loading modules:", error);
    document.getElementById('error-panel').innerHTML = 
      `<div class="error-message">Error loading modules: ${error.message}</div>`;
    document.getElementById('error-panel').classList.add('visible');
  });
});

// Initialize UI and event listeners
function initUI() {
  console.log('🎨 Initializing UI...');
  
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
      if (tabId === 'editor-tab' && renderer) {
        renderer.setupCanvas();
        runCode();
      }
      
      // If switched to 3D tab, initialize Three.js
      if (tabId === '3d-tab') {
        initThreeJs();
        
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
  console.log('🔧 Initializing 2D functionality...');
  
  const canvas = document.getElementById('canvas');
  const runButton = document.getElementById('run-button');
  const viewAstButton = document.getElementById('view-ast');
  const viewErrorsButton = document.getElementById('view-errors');
  const exportSvgButton = document.getElementById('export-svg');
  const astPanel = document.getElementById('ast-panel');
  const errorPanel = document.getElementById('error-panel');
  
  // Store references globally
  astOutput = document.getElementById('ast-output');
  errorOutput = document.getElementById('error-output');
  errorCount = document.getElementById('error-count');

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

  editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
    mode: "aqui",
    theme: "default",
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true
  });

  console.log('✏️ CodeMirror editor initialized');

  // Initialize the renderer FIRST
  renderer = new Renderer(canvas);
  renderer.shapes = new Map(); // Ensure shapes is initialized
  
  console.log('🎨 Renderer initialized');
  
  // Register renderer with ShapeManager immediately
  shapeManager.registerRenderer(renderer);
  shapeManager.registerEditor(editor);
  
  console.log('🔗 ShapeManager connections established');
  
  // Always set up interactive callbacks since interactive mode is always on
  renderer.setUpdateCodeCallback(updateCodeFromShapeChange);
  
  // Initialize the property editor
  const propertiesModal = document.getElementById('shape-properties-modal');
  const propertyFields = document.getElementById('property-fields');
  const cancelButton = document.getElementById('cancel-properties');
  const applyButton = document.getElementById('apply-properties');
  let currentEditShape = null;
  
  // Property editor event handlers
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      propertiesModal.style.display = 'none';
    });
  }
  
  if (applyButton) {
    applyButton.addEventListener('click', () => {
      if (currentEditShape) {
        // Update shape properties from form
        const inputs = propertyFields.querySelectorAll('input');
        inputs.forEach(input => {
          const propName = input.getAttribute('data-property');
          const value = input.type === 'number' ? parseFloat(input.value) : input.value;
          
          if (propName.startsWith('position.')) {
            const index = propName === 'position.x' ? 0 : 1;
            currentEditShape.transform.position[index] = value;
          } else if (propName === 'rotation') {
            currentEditShape.transform.rotation = value;
          } else if (propName.startsWith('scale.')) {
            const index = propName === 'scale.x' ? 0 : 1;
            currentEditShape.transform.scale[index] = value;
          } else {
            // Handle shape-specific properties
            if (typeof currentEditShape.params[propName] === 'number') {
              currentEditShape.params[propName] = value;
            } else if (typeof currentEditShape.params[propName] === 'string') {
              currentEditShape.params[propName] = value;
            }
          }
        });
        
        // Notify of shape changes
        if (renderer.updateCodeCallback) {
          renderer.updateCodeCallback({
            action: 'update',
            name: currentEditShape.name,
            shape: currentEditShape
          });
        }
        
        // Redraw
        renderer.redraw();
      }
      
      propertiesModal.style.display = 'none';
    });
  }
  
  // Function to show shape property editor
  function showPropertyEditor(shape) {
    currentEditShape = shape;
    if (propertyFields) {
      propertyFields.innerHTML = '';
      
      // Create form fields for common properties
      addPropertyField('position.x', 'Position X', shape.transform.position[0], 'number');
      addPropertyField('position.y', 'Position Y', shape.transform.position[1], 'number');
      addPropertyField('rotation', 'Rotation', shape.transform.rotation, 'number');
      addPropertyField('scale.x', 'Scale X', shape.transform.scale[0], 'number');
      addPropertyField('scale.y', 'Scale Y', shape.transform.scale[1], 'number');
      
      // Shape-specific properties
      for (const [key, value] of Object.entries(shape.params)) {
        if (typeof value === 'number') {
          addPropertyField(key, key.charAt(0).toUpperCase() + key.slice(1), value, 'number');
        } else if (typeof value === 'string') {
          addPropertyField(key, key.charAt(0).toUpperCase() + key.slice(1), value, 'text');
        }
      }
      
      propertiesModal.style.display = 'block';
    }
  }
  
  // Helper to add property field to the form
  function addPropertyField(property, label, value, type) {
    if (!propertyFields) return;
    
    const field = document.createElement('div');
    field.className = 'property-field';
    
    const fieldLabel = document.createElement('label');
    fieldLabel.textContent = label;
    field.appendChild(fieldLabel);
    
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.setAttribute('data-property', property);
    
    if (type === 'number') {
      input.step = property.includes('scale') ? 0.1 : 1;
    }
    
    field.appendChild(input);
    propertyFields.appendChild(field);
  }
  
  // Enhanced ParameterManager with ShapeManager integration
  class IntegratedParameterManager extends ParameterManager {
    constructor(canvas, interpreter, editor, runCode) {
      super(canvas, interpreter, editor, runCode);
      
      console.log('🔧 IntegratedParameterManager initialized');
      
      // Register with ShapeManager
      shapeManager.registerParameterManager(this);
      
      this.addUpdateButton();
    }
    
    addUpdateButton() {
      // Create update button
      const updateButton = document.createElement('button');
      updateButton.className = 'update-button';
      updateButton.textContent = 'Refresh';
      
      // Enhanced styling for the update button
      updateButton.style.position = 'absolute';
      updateButton.style.bottom = '15px';
      updateButton.style.left = '15px';
      updateButton.style.padding = '8px 12px';
      updateButton.style.fontSize = '13px';
      updateButton.style.fontFamily = 'monospace';
      updateButton.style.backgroundColor = '#FF5722';
      updateButton.style.color = 'white';
      updateButton.style.border = 'none';
      updateButton.style.borderRadius = '4px';
      updateButton.style.cursor = 'pointer';
      updateButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      updateButton.style.transition = 'all 0.2s ease-in-out';
      
      // Add hover effect
      updateButton.addEventListener('mouseover', () => {
        updateButton.style.backgroundColor = '#E64A19';
        updateButton.style.boxShadow = '0 3px 6px rgba(0,0,0,0.25)';
        updateButton.style.transform = 'translateY(-1px)';
      });
      updateButton.addEventListener('mouseout', () => {
        updateButton.style.backgroundColor = '#FF5722';
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
        if (window.interpreter && window.interpreter.env && window.interpreter.env.shapes) {
          // Remember the current selection
          const currentSelectedShape = this.currentShape;
          
          // Update the reference to the interpreter
          this.interpreter = window.interpreter;
          
          // Update ShapeManager with latest interpreter
          shapeManager.registerInterpreter(window.interpreter);
          shapeManager.refreshShapes();
          
          // Refresh the shapes list with the current interpreter's shapes
          this.refreshShapeList();
          
          // Try to restore the previous selection if it still exists
          if (currentSelectedShape && this.shapeSelector) {
            for (let i = 0; i < this.shapeSelector.options.length; i++) {
              if (this.shapeSelector.options[i].value === currentSelectedShape) {
                this.shapeSelector.selectedIndex = i;
                this.onShapeSelected();
                break;
              }
            }
          }
          
          // Visual feedback
          if (updateButton) {
            const originalText = updateButton.textContent;
            updateButton.textContent = '✓ Updated!';
            updateButton.style.backgroundColor = '#4CAF50';
            
            setTimeout(() => {
              updateButton.textContent = originalText;
              updateButton.style.backgroundColor = '#FF5722';
            }, 1200);
          }
          
          console.log('✅ Parameter manager refreshed with', window.interpreter.env.shapes.size, 'shapes');
        } else {
          throw new Error("No shapes available in interpreter");
        }
      } catch (e) {
        console.error("❌ Error updating shapes:", e);
        const updateButton = this.container.querySelector('.update-button');
        
        if (updateButton) {
          const originalText = updateButton.textContent;
          updateButton.textContent = '✗ Error!';
          updateButton.style.backgroundColor = '#dc3545';
          
          setTimeout(() => {
            updateButton.textContent = originalText;
            updateButton.style.backgroundColor = '#FF5722';
          }, 1200);
        }
      }
    }
  }

  // Create parameter manager when button is clicked
  paramsButton.addEventListener('click', () => {
    console.log('📊 Parameters button clicked');
    
    if (!parameterManager && window.interpreter) {
      console.log('🔧 Creating parameter manager...');
      parameterManager = new IntegratedParameterManager(canvas, window.interpreter, editor, runCode);
    } else if (parameterManager) {
      // Update reference if interpreter has changed
      if (parameterManager.interpreter !== window.interpreter) {
        parameterManager.interpreter = window.interpreter;
        shapeManager.registerInterpreter(window.interpreter);
      }
      
      parameterManager.toggleMenu();
      parameterManager.refreshShapeList();
    } else {
      console.warn('⚠️ No interpreter available for parameter manager');
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

  // Function to update editor code when shapes change via interactive mode
  function updateCodeFromShapeChange(change) {
    try {
      console.log('🔄 Updating code from shape change:', change);
      
      const code = editor.getValue();
      
      if (change.action === 'update') {
        // Find the shape in the code and update its properties
        const lines = code.split('\n');
        let inShapeBlock = false;
        let shapeStartLine = -1;
        let shapeEndLine = -1;
        let braceCount = 0;
        
        // Find the shape definition in the code
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line.startsWith('shape ') && line.includes(change.name)) {
            inShapeBlock = true;
            shapeStartLine = i;
            if (line.includes('{')) braceCount++;
          } else if (inShapeBlock) {
            if (line.includes('{')) braceCount++;
            if (line.includes('}')) braceCount--;
            
            if (braceCount === 0) {
              shapeEndLine = i;
              break;
            }
          }
        }
        
        if (shapeStartLine >= 0 && shapeEndLine >= 0) {
          // Update position
          updateShapeProperty(lines, shapeStartLine, shapeEndLine, 'position', 
                            `[${change.shape.transform.position[0]}, ${change.shape.transform.position[1]}]`);
          
          // Update rotation - FIX: Always add rotation parameter
          if (change.shape.transform.rotation !== 0 || true) { // Always add rotation
            updateShapeProperty(lines, shapeStartLine, shapeEndLine, 'rotation', 
                              change.shape.transform.rotation);
          }
          
          // Update scale if not [1, 1]
          if (change.shape.transform.scale[0] !== 1 || change.shape.transform.scale[1] !== 1) {
            updateShapeProperty(lines, shapeStartLine, shapeEndLine, 'scale', 
                              `[${change.shape.transform.scale[0]}, ${change.shape.transform.scale[1]}]`);
          }
          
          // Update shape-specific properties
          for (const [key, value] of Object.entries(change.shape.params)) {
            if (typeof value === 'number' || typeof value === 'string') {
              let formattedValue = value;
              if (typeof value === 'string') {
                formattedValue = `"${value}"`;
              }
              updateShapeProperty(lines, shapeStartLine, shapeEndLine, key, formattedValue);
            }
          }
          
          // Update the editor without triggering change event
          const newCode = lines.join('\n');
          if (newCode !== code) {
            console.log('📝 Code updated successfully');
            editor.operation(() => {
              editor.setValue(newCode);
            });
          }
        }
      } else if (change.action === 'delete') {
        // Find and remove the shape definition from the code
        const lines = code.split('\n');
        let newLines = [];
        let skipLines = false;
        let braceCounter = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line.startsWith('shape ') && line.includes(change.name)) {
            skipLines = true;
            braceCounter = 0;
            if (line.includes('{')) braceCounter++;
          } else if (skipLines) {
            if (line.includes('{')) braceCounter++;
            if (line.includes('}')) braceCounter--;
            
            if (braceCounter === 0) {
              skipLines = false;
              continue;  // Skip the closing brace line
            }
          } else {
            newLines.push(lines[i]);
          }
        }
        
        // Update the editor without triggering change event
        editor.operation(() => {
          editor.setValue(newLines.join('\n'));
        });
        
        console.log('🗑️ Shape deleted from code');
      }
    } catch (error) {
      console.error("❌ Error updating code:", error);
    }
  }
  
  // Helper function to update a property in the shape definition
  function updateShapeProperty(lines, startLine, endLine, propName, value) {
    let propFound = false;
    
    // Look for existing property
    for (let i = startLine; i <= endLine; i++) {
      const trimmedLine = lines[i].trim();
      if (trimmedLine.startsWith(propName + ':') || trimmedLine.startsWith(propName + ' :')) {
        // Update existing property
        const colonIndex = lines[i].indexOf(':');
        const beforeColon = lines[i].substring(0, colonIndex + 1);
        const indentMatch = lines[i].match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';
        
        lines[i] = `${indent}${propName}: ${value}`;
        propFound = true;
        break;
      }
    }
    
    // If property not found, add it
    if (!propFound) {
      // Find where to insert the property (after opening brace)
      for (let i = startLine; i <= endLine; i++) {
        if (lines[i].includes('{')) {
          // Get indentation from the next line or create default
          const nextLine = lines[i + 1];
          let indent = '    '; // Default indent
          if (nextLine) {
            const indentMatch = nextLine.match(/^(\s*)/);
            if (indentMatch && indentMatch[1]) {
              indent = indentMatch[1];
            }
          }
          
          // Insert the property after the opening brace
          lines.splice(i + 1, 0, `${indent}${propName}: ${value}`);
          break;
        }
      }
    }
    
    return lines;
  }

  // MAIN FUNCTION TO RUN THE CODE
  window.runCode = function() {
    try {
      console.log('▶️ Running code...');
      
      // Always clear in interactive mode since we'll be setting shapes
      renderer.clear();
      
      const code = editor.getValue();
      console.log('📝 Code length:', code.length, 'characters');
      
      const lexer = new Lexer(code);
      const parser = new Parser(lexer);
      const ast = parser.parse();
      
      console.log('🌲 AST generated with', ast.length, 'nodes');
      astOutput.textContent = JSON.stringify(ast, null, 2);

      // Create NEW interpreter instance
      interpreter = new Interpreter();
      const result = interpreter.interpret(ast);
      
      // Update GLOBAL reference for parameter manager
      window.interpreter = interpreter;
      
      console.log('🔧 Interpreter executed, found', result.shapes.size, 'shapes');

      if (!renderer.shapes) {
        renderer.shapes = new Map();
      }
      
      // Set shapes in renderer
      renderer.setShapes(result.shapes);
      
      // Register interpreter with ShapeManager
      shapeManager.registerInterpreter(interpreter);
      
      // If parameter manager exists and the menu is visible, update it
      if (parameterManager && parameterManager.menuVisible) {
        console.log('🔄 Updating parameter manager...');
        setTimeout(() => {
          parameterManager.updateWithLatestInterpreter();
        }, 100);
      }
      
      displayErrors([]);
      console.log('✅ Code execution completed successfully');

    } catch (error) {
      console.error('❌ Code execution error:', error);
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
      const result = exportToSVG(window.interpreter, canvas, validFilename);
      
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

  console.log('🎛️ Event listeners attached');

  // Initial run
  runCode();
  
  console.log('🏁 2D initialization completed');
}

// Documentation content
const documentationMarkdown = `2D_docs: https://github.com/EmreDay1/Aqui/blob/main/Docs/2D/README.md`;

// Initialize documentation functionality
function initDocs() {
  // Get the documentation content element
  const markdownContent = document.getElementById('markdown-content');
  
  // Render documentation when requested
  renderDocumentation();
  
  function renderDocumentation() {
    if (markdownContent && !markdownContent.innerHTML) {
      markdownContent.innerHTML = marked.parse(documentationMarkdown);
    }
  }
}

// Initialize Three.js placeholder
function initThreeJs() {
  // Placeholder for 3D functionality
  console.log('3D tab selected - Three.js functionality would be initialized here');
}

// Export runCode globally for console access
window.runCode = function() {
  console.log('⚠️ Global runCode called before initialization');
};