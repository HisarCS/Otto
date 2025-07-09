import { Lexer } from './lexer.mjs';
import { Parser } from './parser.mjs';
import { Interpreter } from './interpreter.mjs';
import { Renderer } from './renderer.mjs';
import { ParameterManager } from './2Dparameters.mjs';
import { shapeManager } from './shapeManager.mjs';
import { exportToSVG } from './svgExport.mjs';
import { exportToDXF } from './dxfExport.mjs';
import { DragDropSystem } from './dragDropSystem.mjs';

let editor;
let canvas;
let renderer;
let interpreter;
let parameterManager;
let dragDropSystem;
let currentTab = 'editor-tab';
let currentPanel = null;
let astOutput;
let errorOutput;
let errorCount;

window.interpreter = null;

document.addEventListener('DOMContentLoaded', function() {
  initializeComponents();
  setupEventHandlers();
  setupCodeMirror();
  loadDocumentation();
  
  setTimeout(() => {
    ensureProperConnections();
    applyNewLayout();
    if (editor && editor.getValue().trim()) {
      runCode();
    }
  }, 100);
});

function initializeComponents() {
  canvas = document.getElementById('canvas');
  astOutput = document.getElementById('ast-output');
  errorOutput = document.getElementById('error-output');
  errorCount = document.getElementById('error-count');

  renderer = new Renderer(canvas);
  renderer.shapes = new Map();
  
  shapeManager.registerRenderer(renderer);
  renderer.setUpdateCodeCallback(updateCodeFromShapeChange);
  
  initializeDragDropSystem();
}

function initializeDragDropSystem() {
  try {
    dragDropSystem = new DragDropSystem(renderer, null, shapeManager);
    window.dragDropSystem = dragDropSystem;
  } catch (error) {
    const toggleBtn = document.querySelector('.palette-toggle-button');
    if (toggleBtn) toggleBtn.style.display = 'none';
  }
}

function setupCodeMirror() {
  const textarea = document.getElementById('code-editor');
  
  CodeMirror.defineSimpleMode('aqui', {
    start: [
      {regex: /\/\/.*/, token: 'comment'},
      {regex: /\b(?:shape|param|layer|transform|add|rotate|scale|position|if|else|for|from|to|step|def|return|union|difference|intersection|draw|forward|backward|right|left|goto|penup|pendown|fill|fillColor|color|strokeColor|strokeWidth|opacity)\b/, token: 'keyword'},
      {regex: /\b(?:circle|rectangle|triangle|ellipse|polygon|star|arc|roundedRectangle|path|arrow|text|donut|spiral|cross|wave|slot|chamferRectangle|gear)\b/, token: 'variable-2'},
      {regex: /\d+\.?\d*/, token: 'number'},
      {regex: /"(?:[^\\]|\\.)*?"/, token: 'string'},
      {regex: /#[0-9a-fA-F]{3,8}/, token: 'string-2'},
      {regex: /\b(?:red|green|blue|yellow|orange|purple|pink|brown|black|white|gray|grey|cyan|magenta|lime|navy|teal|silver|gold)\b/, token: 'string-2'},
      {regex: /[+\-*\/=<>!]+/, token: 'operator'},
      {regex: /[\{\[\(]/, indent: true},
      {regex: /[\}\]\)]/, dedent: true}
    ],
    meta: {
      dontIndentStates: ['comment'],
      lineComment: '//'
    }
  });
  
  editor = CodeMirror.fromTextArea(textarea, {
    mode: 'aqui',
    theme: 'default',
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 2,
    tabSize: 2,
    lineWrapping: false,
    extraKeys: {
      'Shift-Enter': runCode,
      'Ctrl-Enter': runCode,
      'Cmd-Enter': runCode
    }
  });
  
  shapeManager.registerEditor(editor);
  
  if (dragDropSystem) {
    dragDropSystem.editor = editor;
  }
  
  let timeout;
  editor.on('change', () => {
    clearTimeout(timeout);
    timeout = setTimeout(runCode, 300);
  });
}

function setupEventHandlers() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
  
  document.getElementById('run-button').addEventListener('click', runCode);
  document.getElementById('view-ast').addEventListener('click', () => togglePanel(document.getElementById('ast-panel')));
  document.getElementById('view-errors').addEventListener('click', () => togglePanel(document.getElementById('error-panel')));
  
  setupParameterMenu();
  setupExportMenu();
  
  window.addEventListener('resize', () => {
    forceCanvasResize();
  });
  
  document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'g' && !event.ctrlKey && !event.metaKey) {
      if (renderer && document.activeElement !== editor.getWrapperElement().querySelector('textarea')) {
        event.preventDefault();
        renderer.isGridEnabled = !renderer.isGridEnabled;
        renderer.updateGridButtonState();
        renderer.redraw();
      }
    }
    
    if (event.key.toLowerCase() === 'p' && !event.ctrlKey && !event.metaKey) {
      const activeElement = document.activeElement;
      const isInEditor = activeElement && (
        activeElement.classList.contains('CodeMirror-code') ||
        activeElement.closest('.CodeMirror')
      );
      
      if (parameterManager && !isInEditor) {
        event.preventDefault();
        parameterManager.toggleMenu();
      }
    }
    
    if (event.key.toLowerCase() === 's' && event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      if (dragDropSystem) {
        dragDropSystem.togglePalette();
      }
      return;
    }
    
    if (event.ctrlKey && event.shiftKey && dragDropSystem) {
      const shapeShortcuts = {
        'c': 'circle',
        'r': 'rectangle',
        't': 'triangle',
        'e': 'ellipse',
        'o': 'polygon',
        's': 'star',
        'a': 'arc',
        'g': 'gear',
        'd': 'donut'
      };
      
      const shapeType = shapeShortcuts[event.key.toLowerCase()];
      if (shapeType) {
        event.preventDefault();
        const canvasRect = canvas.getBoundingClientRect();
        const centerX = canvasRect.width / 2;
        const centerY = canvasRect.height / 2;
        const worldPos = renderer.coordinateSystem.screenToWorld(centerX, centerY);
        dragDropSystem.createShapeAtPosition(shapeType, worldPos.x, worldPos.y);
      }
    }
  });
}

function setupParameterMenu() {
  let paramButton = document.getElementById('params-button');
  if (!paramButton) {
    paramButton = document.createElement('button');
    paramButton.id = 'params-button';
    paramButton.className = 'button';
    paramButton.textContent = 'Parameters';
    
    const exportContainer = document.querySelector('.export-container');
    if (exportContainer) {
      exportContainer.parentNode.insertBefore(paramButton, exportContainer);
    } else {
      const errorsButton = document.getElementById('view-errors');
      errorsButton.parentNode.insertBefore(paramButton, errorsButton.nextSibling);
    }
  }
  
  paramButton.addEventListener('click', () => {
    if (!parameterManager && window.interpreter) {
      parameterManager = new EnhancedParameterManager(canvas, window.interpreter, editor, runCode);
      shapeManager.registerParameterManager(parameterManager);
    } else if (parameterManager) {
      if (parameterManager.interpreter !== window.interpreter) {
        parameterManager.interpreter = window.interpreter;
        shapeManager.registerInterpreter(window.interpreter);
      }
      parameterManager.toggleMenu();
      parameterManager.refreshShapeList();
    }
  });
}

function setupExportMenu() {
  const exportButton = document.getElementById('export-button');
  const exportMenu = document.getElementById('export-menu');
  const exportSVG = document.getElementById('export-svg');
  const exportDXF = document.getElementById('export-dxf');
  
  exportButton.addEventListener('click', (event) => {
    event.stopPropagation();
    exportMenu.classList.toggle('show');
  });
  
  document.addEventListener('click', (event) => {
    if (!exportButton.contains(event.target) && !exportMenu.contains(event.target)) {
      exportMenu.classList.remove('show');
    }
  });
  
  exportSVG.addEventListener('click', () => {
    exportMenu.classList.remove('show');
    handleSVGExport();
  });
  
  exportDXF.addEventListener('click', () => {
    exportMenu.classList.remove('show');
    handleDXFExport();
  });
}

function forceCanvasResize() {
  if (renderer && currentTab === 'editor-tab') {
    setTimeout(() => {
      renderer.setupCanvas();
      renderer.redraw();
      
      if (editor) {
        editor.refresh();
      }
    }, 100);
  }
}

function applyNewLayout() {
  const editorPanel = document.querySelector('.editor-panel');
  const visualPanel = document.querySelector('.visualization-panel');
  
  if (editorPanel && visualPanel) {
    editorPanel.style.width = '30%';
    visualPanel.style.width = '70%';
    
    forceCanvasResize();
  }
}

class EnhancedParameterManager extends ParameterManager {
  constructor(canvas, interpreter, editor, runCode) {
    super(canvas, interpreter, editor, runCode);
    shapeManager.registerParameterManager(this);
    this.addUpdateButton();
  }
  
  addUpdateButton() {
    const updateButton = document.createElement('button');
    updateButton.className = 'update-button';
    updateButton.textContent = 'Refresh';
    
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
    
    updateButton.addEventListener('click', () => {
      this.updateWithLatestInterpreter();
    });
    
    this.container.appendChild(updateButton);
    this.container.style.paddingBottom = '50px';
  }
  
  updateWithLatestInterpreter() {
    try {
      const updateButton = this.container.querySelector('.update-button');
      
      if (window.interpreter && window.interpreter.env && window.interpreter.env.shapes) {
        const currentSelectedShape = this.currentShape;
        this.interpreter = window.interpreter;
        shapeManager.registerInterpreter(window.interpreter);
        shapeManager.refreshShapes();
        this.refreshShapeList();
        
        if (currentSelectedShape && this.shapeSelector) {
          for (let i = 0; i < this.shapeSelector.options.length; i++) {
            if (this.shapeSelector.options[i].value === currentSelectedShape) {
              this.shapeSelector.selectedIndex = i;
              this.onShapeSelected();
              break;
            }
          }
        }
        
        if (updateButton) {
          const originalText = updateButton.textContent;
          updateButton.textContent = '✓ Updated!';
          updateButton.style.backgroundColor = '#4CAF50';
          
          setTimeout(() => {
            updateButton.textContent = originalText;
            updateButton.style.backgroundColor = '#FF5722';
          }, 1200);
        }
      } else {
        throw new Error("No shapes available in interpreter");
      }
    } catch (e) {
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

function updateCodeFromShapeChange(change) {
  try {
    const code = editor.getValue();
    
    if (change.action === 'update') {
      const lines = code.split('\n');
      let inShapeBlock = false;
      let shapeStartLine = -1;
      let shapeEndLine = -1;
      let braceCount = 0;
      
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
        updateShapeProperty(lines, shapeStartLine, shapeEndLine, 'position', 
                          `[${change.shape.transform.position[0]}, ${change.shape.transform.position[1]}]`);
        
        if (change.shape.transform.rotation !== 0) {
          updateShapeProperty(lines, shapeStartLine, shapeEndLine, 'rotation', 
                            change.shape.transform.rotation);
        }
        
        if (change.shape.transform.scale[0] !== 1 || change.shape.transform.scale[1] !== 1) {
          updateShapeProperty(lines, shapeStartLine, shapeEndLine, 'scale', 
                            `[${change.shape.transform.scale[0]}, ${change.shape.transform.scale[1]}]`);
        }
        
        for (const [key, value] of Object.entries(change.shape.params)) {
          if (typeof value === 'number' || typeof value === 'string') {
            let formattedValue = value;
            if (typeof value === 'string') {
              formattedValue = `"${value}"`;
            }
            updateShapeProperty(lines, shapeStartLine, shapeEndLine, key, formattedValue);
          }
        }
        
        const newCode = lines.join('\n');
        if (newCode !== code) {
          editor.operation(() => {
            editor.setValue(newCode);
          });
        }
      }
    } else if (change.action === 'delete') {
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
            continue;
          }
        } else {
          newLines.push(lines[i]);
        }
      }
      
      editor.operation(() => {
        editor.setValue(newLines.join('\n'));
      });
    }
  } catch (error) {
  }
}

function updateShapeProperty(lines, startLine, endLine, propName, value) {
  let propFound = false;
  
  for (let i = startLine; i <= endLine; i++) {
    const trimmedLine = lines[i].trim();
    if (trimmedLine.startsWith(propName + ':') || trimmedLine.startsWith(propName + ' :')) {
      const colonIndex = lines[i].indexOf(':');
      const indentMatch = lines[i].match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';
      
      lines[i] = `${indent}${propName}: ${value}`;
      propFound = true;
      break;
    }
  }
  
  if (!propFound) {
    for (let i = startLine; i <= endLine; i++) {
      if (lines[i].includes('{')) {
        const nextLine = lines[i + 1];
        let indent = '    ';
        if (nextLine) {
          const indentMatch = nextLine.match(/^(\s*)/);
          if (indentMatch && indentMatch[1]) {
            indent = indentMatch[1];
          }
        }
        
        lines.splice(i + 1, 0, `${indent}${propName}: ${value}`);
        break;
      }
    }
  }
  
  return lines;
}

function runCode() {
  try {
    renderer.clear();
    
    const code = editor.getValue();
    const lexer = new Lexer(code);
    const parser = new Parser(lexer);
    const ast = parser.parse();
    
    astOutput.textContent = JSON.stringify(ast, null, 2);

    interpreter = new Interpreter();
    const result = interpreter.interpret(ast);
    
    window.interpreter = interpreter;
    
    if (!renderer.shapes) {
      renderer.shapes = new Map();
    }
    
    renderer.setShapes(result.shapes);
    shapeManager.registerInterpreter(interpreter);
    
    if (parameterManager && parameterManager.menuVisible) {
      setTimeout(() => {
        parameterManager.updateWithLatestInterpreter();
      }, 100);
    }
    
    displayErrors([]);
    hideErrorPanel();

  } catch (error) {
    displayErrors([error]);
  }
}

function handleSVGExport() {
  try {
    if (!window.interpreter) {
      alert('No shapes to export. Please run some code first.');
      return;
    }
    
    const result = exportToSVG(window.interpreter, canvas);
    
    if (!result.success && result.error) {
      displayErrors([{ message: `SVG Export failed: ${result.error}` }]);
    }
  } catch (error) {
    displayErrors([{ message: `SVG Export failed: ${error.message}` }]);
  }
}

function handleDXFExport() {
  try {
    if (!window.interpreter) {
      alert('No shapes to export. Please run some code first.');
      return;
    }
    
    const result = exportToDXF(window.interpreter, canvas);
    
    if (!result.success && result.error) {
      displayErrors([{ message: `DXF Export failed: ${result.error}` }]);
    }
  } catch (error) {
    displayErrors([{ message: `DXF Export failed: ${error.message}` }]);
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabId).classList.add('active');
  
  currentTab = tabId;
  
  if (tabId === 'editor-tab' && editor) {
    setTimeout(() => {
      editor.refresh();
      if (renderer) {
        renderer.setupCanvas();
        runCode();
      }
    }, 100);
  }
}

function ensureProperConnections() {
  if (renderer && !shapeManager.renderer) {
    shapeManager.registerRenderer(renderer);
  }
  
  if (parameterManager && !shapeManager.parameterManager) {
    shapeManager.registerParameterManager(parameterManager);
  }
  
  if (editor && !shapeManager.editor) {
    shapeManager.registerEditor(editor);
  }
  
  if (dragDropSystem) {
    if (!dragDropSystem.editor && editor) {
      dragDropSystem.editor = editor;
    }
    if (!dragDropSystem.shapeManager) {
      dragDropSystem.shapeManager = shapeManager;
    }
  }
  
  if (parameterManager) {
    parameterManager.editor = editor;
    parameterManager.runCode = runCode;
    
    if (window.interpreter) {
      parameterManager.interpreter = window.interpreter;
      shapeManager.registerInterpreter(window.interpreter);
    }
  }
}

function displayErrors(errors) {
  if (!Array.isArray(errors)) {
    errors = [errors];
  }
  
  if (errors.length === 0) {
    errorOutput.textContent = 'No errors';
    errorCount.textContent = '0';
    errorCount.classList.remove('visible');
    document.getElementById('view-errors').classList.remove('error');
    return;
  }
  
  errorOutput.innerHTML = '';
  errors.forEach((error) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    
    if (error.message) {
      errorDiv.textContent = error.message;
    } else if (typeof error === 'string') {
      errorDiv.textContent = error;
    } else {
      errorDiv.textContent = error.toString();
    }
    
    errorOutput.appendChild(errorDiv);
    
    if (error.line || error.column) {
      const locationDiv = document.createElement('div');
      locationDiv.className = 'error-location';
      locationDiv.textContent = `Line ${error.line || '?'}, Column ${error.column || '?'}`;
      errorOutput.appendChild(locationDiv);
    }
  });
  
  errorCount.textContent = errors.length.toString();
  errorCount.classList.add('visible');
  document.getElementById('view-errors').classList.add('error');
  
  showErrorPanel();
}

function togglePanel(panel) {
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

function showErrorPanel() {
  const panel = document.getElementById('error-panel');
  panel.classList.add('visible');
  currentPanel = panel;
}

function hideErrorPanel() {
  const panel = document.getElementById('error-panel');
  panel.classList.remove('visible');
  if (currentPanel === panel) {
    currentPanel = null;
  }
}

async function loadDocumentation() {
  try {
    const basicDocs = `
# Aqui Design Language

Aqui is a declarative language for creating 2D shapes and designs with built-in boolean operations and interactive editing capabilities.

## Basic Syntax

### Shapes
\`\`\`aqui
shape circle myCircle {
    radius: 50
    position: [100, 100]
    fill: true
    fillColor: blue
}
\`\`\`

### Available Shape Types
- \`circle\` - radius
- \`rectangle\` - width, height
- \`triangle\` - base, height
- \`ellipse\` - radiusX, radiusY
- \`polygon\` - radius, sides
- \`star\` - outerRadius, innerRadius, points
- \`arc\` - radius, startAngle, endAngle

### Boolean Operations
\`\`\`aqui
difference result {
    add shape1
    add shape2
}
\`\`\`

Available operations: \`union\`, \`difference\`, \`intersection\`

### Parameters
\`\`\`aqui
param size 100
param color red

shape circle myCircle {
    radius: size
    fillColor: color
}
\`\`\`

### Interactive Features
- **Canvas**: Click and drag shapes to move them
- **Sliders**: Adjust parameters in real-time
- **Export**: SVG and DXF formats supported
- **Grid**: Toggle with 'G' key
- **Parameter Panel**: Toggle with 'P' key
- **Shape Palette**: Toggle with Ctrl+S or click ⊞ button

### Keyboard Shortcuts
- **Shift+Enter**: Run code
- **G**: Toggle grid
- **P**: Toggle parameter panel
- **Ctrl+S**: Toggle shape palette
- **Delete**: Remove selected shape
- **Arrow keys**: Move selected shape
- **R**: Rotate selected shape
- **Ctrl+Shift+C**: Create circle at center
- **Ctrl+Shift+R**: Create rectangle at center
- **Ctrl+Shift+T**: Create triangle at center
    `;
    
    const markdownContent = document.getElementById('markdown-content');
    if (typeof marked !== 'undefined') {
      markdownContent.innerHTML = marked.parse(basicDocs);
    } else {
      markdownContent.innerHTML = `<pre>${basicDocs}</pre>`;
    }
  } catch (error) {
  }
}

window.runCode = runCode;

window.aqui = {
  editor,
  renderer,
  interpreter,
  parameterManager,
  shapeManager,
  dragDropSystem,
  runCode,
  exportSVG: handleSVGExport,
  exportDXF: handleDXFExport
};

