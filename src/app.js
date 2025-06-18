// app.js - Complete Aqui application with SVG and DXF export

import { Lexer } from './lexer.mjs';
import { Parser } from './parser.mjs';
import { Interpreter } from './interpreter.mjs';
import { Renderer } from './renderer.mjs';
import { ParameterManager } from './2Dparameters.mjs';
import { CodeRunner } from './codeRunner.js';
import { exportToSVG } from './svgExport.mjs';
import { exportToDXF } from './dxfExport.mjs';

// Global variables
let editor;
let canvas;
let renderer;
let codeRunner;
let parameterManager;
let currentTab = 'editor-tab';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeComponents();
  setupEventHandlers();
  setupCodeMirror();
  loadDocumentation();
  
  // Run initial code if present
  if (editor.getValue().trim()) {
    codeRunner.runCode();
  }
});

function initializeComponents() {
  // Get DOM elements
  canvas = document.getElementById('canvas');
  const astOutput = document.getElementById('ast-output');
  const errorOutput = document.getElementById('error-output');
  
  // Initialize renderer
  renderer = new Renderer(canvas);
  
  // Initialize parameter manager (will be properly connected after editor is ready)
  parameterManager = new ParameterManager(canvas, null, null, runCode);
  
  // Initialize code runner with all dependencies
  codeRunner = new CodeRunner(
    Lexer,
    Parser, 
    Interpreter,
    renderer,
    null, // Editor will be set after CodeMirror initialization
    displayErrors,
    astOutput,
    parameterManager
  );
  
  // Set up shape update callback
  renderer.setUpdateCodeCallback((changeInfo) => {
    // Handle shape changes from canvas interactions
    console.log('Shape changed:', changeInfo);
  });
  
  console.log('Components initialized');
}

function setupCodeMirror() {
  const textarea = document.getElementById('code-editor');
  
  // Define Aqui language mode for syntax highlighting
  CodeMirror.defineSimpleMode('aqui', {
    start: [
      // Comments
      {regex: /\/\/.*/, token: 'comment'},
      
      // Keywords
      {regex: /\b(?:shape|param|layer|transform|add|rotate|scale|position|if|else|for|from|to|step|def|return|union|difference|intersection|draw|forward|backward|right|left|goto|penup|pendown|fill|fillColor|color|strokeColor|strokeWidth|opacity)\b/, token: 'keyword'},
      
      // Shape types
      {regex: /\b(?:circle|rectangle|triangle|ellipse|polygon|star|arc|roundedRectangle|path|arrow|text|donut|spiral|cross|wave|slot|chamferRectangle|gear)\b/, token: 'variable-2'},
      
      // Numbers
      {regex: /\d+\.?\d*/, token: 'number'},
      
      // Strings
      {regex: /"(?:[^\\]|\\.)*?"/, token: 'string'},
      
      // Colors
      {regex: /#[0-9a-fA-F]{3,8}/, token: 'string-2'},
      {regex: /\b(?:red|green|blue|yellow|orange|purple|pink|brown|black|white|gray|grey|cyan|magenta|lime|navy|teal|silver|gold)\b/, token: 'string-2'},
      
      // Operators
      {regex: /[+\-*\/=<>!]+/, token: 'operator'},
      
      // Brackets
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
  
  // Update code runner with editor reference
  codeRunner.editor = editor;
  
  // Now properly connect parameter manager with editor and run function
  parameterManager.editor = editor;
  parameterManager.runCode = runCode;
  
  // Auto-run on changes (debounced)
  let timeout;
  editor.on('change', () => {
    clearTimeout(timeout);
    timeout = setTimeout(runCode, 500);
  });
}

function setupEventHandlers() {
  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
  
  // Footer buttons
  document.getElementById('run-button').addEventListener('click', runCode);
  document.getElementById('view-ast').addEventListener('click', toggleASTPanel);
  document.getElementById('view-errors').addEventListener('click', toggleErrorPanel);
  
  // Parameter menu functionality
  setupParameterMenu();
  
  // Export menu functionality
  setupExportMenu();
  
  // Canvas resize handler
  window.addEventListener('resize', () => {
    if (renderer) {
      renderer.setupCanvas();
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    // Toggle grid with 'G' key
    if (event.key.toLowerCase() === 'g' && !event.ctrlKey && !event.metaKey) {
      if (renderer && document.activeElement !== editor.getWrapperElement().querySelector('textarea')) {
        event.preventDefault();
        renderer.isGridEnabled = !renderer.isGridEnabled;
        renderer.updateGridButtonState();
        renderer.redraw();
      }
    }
    
    // Toggle parameter panel with 'P' key
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
  });
}

function setupParameterMenu() {
  // Create parameter menu toggle button if it doesn't exist
  let paramButton = document.getElementById('params-button');
  if (!paramButton) {
    paramButton = document.createElement('button');
    paramButton.id = 'params-button';
    paramButton.className = 'button';
    paramButton.textContent = 'Parameters';
    
    // Insert after the errors button
    const errorsButton = document.getElementById('view-errors');
    errorsButton.parentNode.insertBefore(paramButton, errorsButton.nextSibling);
  }
  
  paramButton.addEventListener('click', () => {
    if (parameterManager) {
      parameterManager.toggleMenu();
    }
  });
}

function setupExportMenu() {
  const exportButton = document.getElementById('export-button');
  const exportMenu = document.getElementById('export-menu');
  const exportSVG = document.getElementById('export-svg');
  const exportDXF = document.getElementById('export-dxf');
  
  // Toggle export menu
  exportButton.addEventListener('click', (event) => {
    event.stopPropagation();
    exportMenu.classList.toggle('show');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (event) => {
    if (!exportButton.contains(event.target) && !exportMenu.contains(event.target)) {
      exportMenu.classList.remove('show');
    }
  });
  
  // SVG Export
  exportSVG.addEventListener('click', () => {
    exportMenu.classList.remove('show');
    handleSVGExport();
  });
  
  // DXF Export
  exportDXF.addEventListener('click', () => {
    exportMenu.classList.remove('show');
    handleDXFExport();
  });
}

function handleSVGExport() {
  try {
    const interpreter = codeRunner.getInterpreter();
    if (!interpreter) {
      alert('No shapes to export. Please run some code first.');
      return;
    }
    
    console.log('Starting SVG export...');
    const result = exportToSVG(interpreter, canvas);
    
    if (result.success) {
      console.log(`SVG export successful: ${result.shapes} shapes, ${result.layers} layers`);
    } else {
      console.error('SVG export failed:', result.error);
      alert('SVG export failed: ' + result.error);
    }
  } catch (error) {
    console.error('SVG export error:', error);
    alert('SVG export failed: ' + error.message);
  }
}

function handleDXFExport() {
  try {
    const interpreter = codeRunner.getInterpreter();
    if (!interpreter) {
      alert('No shapes to export. Please run some code first.');
      return;
    }
    
    console.log('Starting DXF export...');
    const result = exportToDXF(interpreter, canvas);
    
    if (result.success) {
      console.log(`DXF export successful: ${result.shapes} shapes, ${result.layers} layers`);
    } else {
      console.error('DXF export failed:', result.error);
      alert('DXF export failed: ' + result.error);
    }
  } catch (error) {
    console.error('DXF export error:', error);
    alert('DXF export failed: ' + error.message);
  }
}

function switchTab(tabId) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(tabId).classList.add('active');
  
  currentTab = tabId;
  
  // Refresh editor if switching back to editor tab
  if (tabId === 'editor-tab' && editor) {
    setTimeout(() => {
      editor.refresh();
      if (renderer) {
        renderer.setupCanvas();
      }
    }, 100);
  }
}

function runCode() {
  try {
    codeRunner.runCode();
    
    // Update parameter manager with latest interpreter
    if (parameterManager && codeRunner.getInterpreter()) {
      parameterManager.interpreter = codeRunner.getInterpreter();
      parameterManager.updateWithLatestInterpreter();
    }
    
    hideErrorPanel();
  } catch (error) {
    console.error('Error running code:', error);
    displayErrors([error]);
  }
}

function displayErrors(errors) {
  const errorOutput = document.getElementById('error-output');
  const errorCount = document.getElementById('error-count');
  const errorButton = document.getElementById('view-errors');
  
  if (!Array.isArray(errors)) {
    errors = [errors];
  }
  
  if (errors.length === 0) {
    errorOutput.textContent = 'No errors';
    errorCount.textContent = '0';
    errorCount.classList.remove('visible');
    errorButton.classList.remove('error');
    return;
  }
  
  // Display errors
  errorOutput.innerHTML = '';
  errors.forEach((error, index) => {
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
    
    // Add location info if available
    if (error.line || error.column) {
      const locationDiv = document.createElement('div');
      locationDiv.className = 'error-location';
      locationDiv.textContent = `Line ${error.line || '?'}, Column ${error.column || '?'}`;
      errorOutput.appendChild(locationDiv);
    }
  });
  
  // Update error count
  errorCount.textContent = errors.length.toString();
  errorCount.classList.add('visible');
  errorButton.classList.add('error');
  
  // Auto-show error panel if there are errors
  showErrorPanel();
}

function toggleASTPanel() {
  const panel = document.getElementById('ast-panel');
  panel.classList.toggle('visible');
}

function toggleErrorPanel() {
  const panel = document.getElementById('error-panel');
  panel.classList.toggle('visible');
}

function showErrorPanel() {
  const panel = document.getElementById('error-panel');
  panel.classList.add('visible');
}

function hideErrorPanel() {
  const panel = document.getElementById('error-panel');
  panel.classList.remove('visible');
}

async function loadDocumentation() {
  try {
    // Since we don't have a docs file, create basic documentation
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

### Keyboard Shortcuts
- **Shift+Enter**: Run code
- **G**: Toggle grid
- **P**: Toggle parameter panel
- **Delete**: Remove selected shape
- **Arrow keys**: Move selected shape
- **R**: Rotate selected shape
    `;
    
    const markdownContent = document.getElementById('markdown-content');
    if (typeof marked !== 'undefined') {
      markdownContent.innerHTML = marked.parse(basicDocs);
    } else {
      markdownContent.innerHTML = `<pre>${basicDocs}</pre>`;
    }
  } catch (error) {
    console.error('Error loading documentation:', error);
  }
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Global access for debugging
window.aqui = {
  editor,
  renderer,
  codeRunner,
  parameterManager,
  runCode,
  exportSVG: handleSVGExport,
  exportDXF: handleDXFExport
};

console.log('Aqui application initialized');
