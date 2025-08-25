import { Lexer } from './lexer.mjs';
import { Parser } from './parser.mjs';
import { Interpreter } from './interpreter.mjs';
import { Renderer } from './renderer.mjs';
import { ParameterManager } from './2Dparameters.mjs';
import { shapeManager } from './shapeManager.mjs';
import { exportToSVG } from './svgExport.mjs';
import { exportToDXF } from './dxfExport.mjs';
import { DragDropSystem } from './dragDropSystem.mjs';
import { ConstraintEngine } from './constraints/engine.mjs';
import { setupConstraintsMenu } from './constraints/ui.mjs';

const TOOLBOX_XML = `
<xml xmlns="https://developers.google.com/blockly/xml" style="display: none">

  <category name="Turtle" colour="#D65C5C">
    <block type="aqui_draw"/>
    <block type="aqui_forward">
      <value name="DISTANCE">
        <shadow type="math_number"><field name="NUM">10</field></shadow>
      </value>
    </block>
    <block type="aqui_backward">
      <value name="DISTANCE">
        <shadow type="math_number"><field name="NUM">10</field></shadow>
      </value>
    </block>
    <block type="aqui_right">
      <value name="ANGLE">
        <shadow type="math_number"><field name="NUM">90</field></shadow>
      </value>
    </block>
    <block type="aqui_left">
      <value name="ANGLE">
        <shadow type="math_number"><field name="NUM">90</field></shadow>
      </value>
    </block>
    <block type="aqui_goto">
      <value name="POSITION">
        <shadow type="lists_create_with"/>
      </value>
    </block>
    <block type="aqui_penup"/>
    <block type="aqui_pendown"/>
  </category>

  <category name="Shapes" colour="#5CA65C">
    <block type="aqui_shape_circle"/>
    <block type="aqui_shape_rectangle"/>
    <block type="aqui_shape_triangle"/>
    <block type="aqui_shape_polygon"/>
    <block type="aqui_shape_star"/>
    <block type="aqui_shape_text"/>
    <block type="aqui_shape_ellipse"/>
    <block type="aqui_shape_arc"/>
    <block type="aqui_shape_roundedrectangle"/>
    <block type="aqui_shape_arrow"/>
    <block type="aqui_shape_donut"/>
    <block type="aqui_shape_gear"/>
    <block type="aqui_shape_cross"/>
  </category>

  <category name="Parameters" colour="#CE5C81">
    <block type="aqui_param">
      <value name="NAME">
        <shadow type="text"><field name="TEXT">size</field></shadow>
      </value>
      <value name="VALUE">
        <shadow type="math_number"><field name="NUM">150</field></shadow>
      </value>
    </block>
    <block type="aqui_param_get">
      <field name="NAME">size</field>
    </block>
  </category>

  <category name="Shape Properties" colour="#CE9E36">
    <block type="aqui_prop_expr"/>
    <block type="aqui_prop_bool"/>
  </category>

  <category name="Boolean" colour="#5C81A6">
    <block type="aqui_union"/>
    <block type="aqui_intersection"/>
    <block type="aqui_difference"/>
    <block type="aqui_ref"/>
  </category>

  <category name="Math" colour="#5C68A6">
    <block type="math_number"/>
    <block type="math_arithmetic"/>
  </category>

  <category name="Text" colour="#A6745C">
    <block type="text"/>
  </category>

  <category name="Lists" colour="#D65C5C">
    <block type="lists_create_with"/>
  </category>

</xml>
`;

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
let editorMode = 'text';          
let blocklyWorkspace = null;
let syncingFromBlocks = false;
let constraintEngine;

window.interpreter = null;

document.addEventListener('DOMContentLoaded', function() {
  initializeComponents();
  setupEventHandlers();
  setupCodeMirror();
  loadDocumentation();
  initBlockly();
  
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

  constraintEngine = new ConstraintEngine(renderer, shapeManager, updateCodeFromShapeChange);
  constraintEngine.installLiveEnforcer(shapeManager);

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
      {regex: /\b(?:circle|rectangle|triangle|ellipse|polygon|star|arc|roundedRectangle|path|arrow|text|donut|spiral|cross|wave|slot|chamferRectangle|gear|dovetailPin|dovetailTail|doubleDovetailPin|doubleDovetailTail|fingerJoint|fingerJointMale|fingerJointFemale|tenon|mortise|scarfJoint|lapJoint|crossHalving|tJoint|dadoJoint|slotJoint|tabJoint|miterJoint|buttJoint)\b/, token: 'variable-2'},
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
    if (syncingFromBlocks) return;   
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      runCode();
      if (editorMode === 'blocks' && blocklyWorkspace) {
        rebuildWorkspaceFromAqui(editor.getValue(), blocklyWorkspace);
        refreshBlockly();
      }
    }, 300);
  });  
}

async function initBlockly() {
  if (!window.Blockly) {
    console.error('Blockly not found; did you include the UMD bundles?');
    return;
  }

  blocklyWorkspace = Blockly.inject('blocklyDiv', {
    toolbox: TOOLBOX_XML,
    grid:    { spacing: 20, length: 3, colour: '#ccc', snap: true },
    zoom:    { controls: true, wheel: true },
    renderer:'thrasos'
  });

  refreshBlockly();

  blocklyWorkspace.addChangeListener(event => {
    if (event.type === Blockly.Events.UI ||
        (event.type === Blockly.Events.CHANGE && event.element === 'field') ||
        syncingFromBlocks) {
      return;
    }
    try {
      const code = Blockly.JavaScript.workspaceToCode(blocklyWorkspace);
      if (editor.getValue() !== code) {
        syncingFromBlocks = true;
        editor.operation(() => {
          editor.setValue(code);
          runCode();
        });
      }
    } catch (e) {
      console.warn('Codegen error (ignored):', e);
    } finally {
      syncingFromBlocks = false;
    }
  });

  console.log('Blockly initialized successfully.');
}

let _PARAMS = new Set();   

function exprToBlock(expr, ws) {
  if (!expr) return null;
  console.log(expr.type);

  if (expr.type === 'parenthesized' || expr.type === 'group') {
    const inner = expr.expression || expr.inner;
    return exprToBlock(inner, ws);
  }

  if (expr.type === 'logical_op') {
    const opMap = { and: 'AND', or: 'OR' };
    const b     = ws.newBlock('logic_operation');
    b.setFieldValue(opMap[expr.operator], 'OP');
    
    const left  = exprToBlock(expr.left,  ws);
    const right = exprToBlock(expr.right, ws);
    if (left)  b.getInput('A').connection.connect(left.outputConnection);
    if (right) b.getInput('B').connection.connect(right.outputConnection);
    
    b.initSvg(); b.render();
    return b;
  }

  if (expr.type === 'unary_op' && expr.operator === 'minus') {
    const ws = arguments[1]; 
    if (expr.operand.type === 'number') {
      const b = ws.newBlock('math_number');
      b.setShadow(true);
      b.setFieldValue(String(-expr.operand.value), 'NUM');
      b.initSvg(); b.render();
      return b;
    }
    const sub = ws.newBlock('math_arithmetic');
    sub.setFieldValue('MINUS', 'OP');
    const zero = ws.newBlock('math_number');
    zero.setShadow(true);
    zero.setFieldValue('0', 'NUM');
    zero.initSvg(); zero.render();
    sub.getInput('A').connection.connect(zero.outputConnection);
    const child = exprToBlock(expr.operand, ws);
    if (child) sub.getInput('B').connection.connect(child.outputConnection);
    sub.initSvg(); sub.render();
    return sub;
  }

  if (expr.type === 'number') {                     
    const b = ws.newBlock('math_number');
    b.setShadow(true);
    b.setFieldValue(String(expr.value ?? 0), 'NUM');  
    b.initSvg(); b.render();
    return b;
  }

  if (expr.type === 'string') {                    
    const b = ws.newBlock('text');
    b.setShadow(true);
    b.setFieldValue(expr.value, 'TEXT');
    b.initSvg(); b.render();
    return b;
  }

  if (expr.type === 'color') {                    
    const b = ws.newBlock('text');
    b.setShadow(true);
    b.setFieldValue(expr.value, 'TEXT');
    b.initSvg(); b.render();
    return b;
  }

  if (expr.type === 'boolean') {
    const b = ws.newBlock('logic_boolean');
    b.setShadow(true);
    b.setFieldValue(expr.value ? 'TRUE' : 'FALSE', 'BOOL');
    b.initSvg(); b.render();
    return b;
  }

  if (expr.type === 'identifier') {
    if (_PARAMS.has(expr.name)) {                 
      const b = ws.newBlock('aqui_param_get');
      b.setFieldValue(expr.name, 'NAME');
      b.initSvg(); b.render();
      return b;
    }
    const b = ws.newBlock('text');                 
    b.setFieldValue(expr.name, 'TEXT');
    b.initSvg(); b.render();
    return b;
  }

  if (expr.type === 'array') {
    const b = ws.newBlock('lists_create_with');
    b.itemCount_ = expr.elements.length;
    b.updateShape_();
    expr.elements.forEach((el, i) => {
      const child = exprToBlock(el, ws);
      if (child)
        b.getInput(`ADD${i}`)
         .connection.connect(child.outputConnection);
    });
    b.initSvg(); b.render();
    return b;
  }

  if (expr.type === 'binary_op') {
    const ar  = {add:'ADD', subtract:'MINUS', multiply:'MULTIPLY', divide:'DIVIDE'};
    const cmp = {eq:'EQ',  neq:'NEQ', lt:'LT', lte:'LTE', gt:'GT', gte:'GTE'};
    const bol = {and:'AND', or:'OR'};

    if (ar[expr.operator]) {
      const b = ws.newBlock('math_arithmetic');
      b.setFieldValue(ar[expr.operator], 'OP');
      ['A','B'].forEach((socket, idx) => {
        const kid = exprToBlock(idx ? expr.right : expr.left, ws);
        if (kid) b.getInput(socket).connection.connect(kid.outputConnection);
      });
      b.initSvg(); b.render();
      return b;
    }

    if (cmp[expr.operator]) {
      const b = ws.newBlock('logic_compare');
      b.setFieldValue(cmp[expr.operator], 'OP');
      const A = exprToBlock(expr.left,  ws);
      const B = exprToBlock(expr.right, ws);
      if (A) b.getInput('A').connection.connect(A.outputConnection);
      if (B) b.getInput('B').connection.connect(B.outputConnection);
      b.initSvg(); b.render();
      return b;
    }

    if (bol[expr.operator]) {
      const b = ws.newBlock('logic_operation');
      b.setFieldValue(bol[expr.operator], 'OP');
      const A = exprToBlock(expr.left,  ws);
      const B = exprToBlock(expr.right, ws);
      if (A) b.getInput('A').connection.connect(A.outputConnection);
      if (B) b.getInput('B').connection.connect(B.outputConnection);
      b.initSvg(); b.render();
      return b;
    }
  }

  if (expr.type === 'unary_op' && expr.operator === 'not') {
    const b = ws.newBlock('logic_negate');
    const kid = exprToBlock(expr.argument, ws);
    if (kid) b.getInput('BOOL').connection.connect(kid.outputConnection);
    b.initSvg(); b.render();
    return b;
  }

  console.warn('exprToBlock – unhandled node:', expr);
  return null;
}

function stmtToBlock(stmt, ws) {
  console.log(stmt.type);

  if (stmt.type === 'param') {
    const blk = ws.newBlock('aqui_param');
    blk.setFieldValue(stmt.name, 'NAME');
    const v = exprToBlock(stmt.value, ws);
    if (v) blk.getInput('VALUE').connection.connect(v.outputConnection);
    blk.initSvg(); blk.render();
    return blk;
  }

  if (stmt.type === 'expression_statement' || stmt.type === 'expr_statement') {
    const expr = stmt.expression || stmt.expr;
    const blk  = exprToBlock(expr, ws);
    if (blk) {
      blk.initSvg(); blk.render();
      return blk;
    }
  }

  if (stmt.type === 'shape') {
    const type = stmt.shapeType.toLowerCase();
    const blk  = ws.newBlock(`aqui_shape_${type}`);
    blk.setFieldValue(stmt.name, 'NAME');

    let prev = null;
    Object.entries(stmt.params || {}).forEach(([key, valExpr]) => {
      const leafType = valExpr.type === 'boolean'
                     ? 'aqui_prop_bool'
                     : 'aqui_prop_expr';
      const leaf = ws.newBlock(leafType);
      leaf.setFieldValue(key, 'KEY');
      if (valExpr.type === 'boolean') {
        leaf.setFieldValue(valExpr.value ? 'TRUE' : 'FALSE', 'VAL');
      } else {
        const child = exprToBlock(valExpr, ws);
        if (child) leaf.getInput('VAL').connection.connect(child.outputConnection);
      }
      leaf.initSvg(); leaf.render();

      if (prev) prev.nextConnection.connect(leaf.previousConnection);
      else      blk.getInput('PROPS').connection.connect(leaf.previousConnection);
      prev = leaf;
    });

    blk.initSvg(); blk.render();
    return blk;
  }

  if (stmt.type === 'boolean_operation') {
    const blk = ws.newBlock(`aqui_${stmt.operation}`);
    blk.setFieldValue(stmt.name, 'NAME');

    let prev = null;
    (stmt.shapes || []).forEach((s, i) => {
      const leaf = ws.newBlock('aqui_ref');
      const op   = stmt.operation === 'difference' && i ? 'subtract' : 'add';
      leaf.setFieldValue(op, 'OP');
      leaf.setFieldValue(s, 'TARGET');
      leaf.initSvg(); leaf.render();

      if (prev) prev.nextConnection.connect(leaf.previousConnection);
      else      blk.getInput('STACK').connection.connect(leaf.previousConnection);
      prev = leaf;
    });

    blk.initSvg(); blk.render();
    return blk;
  }

  if (stmt.type === 'draw') {
    const blk       = ws.newBlock('aqui_draw');
    blk.setFieldValue(stmt.name, 'NAME');
    const bodyInput = blk.getInput('STACK') || blk.getInput('COMMANDS');

    let prev = null;
    (stmt.commands || []).forEach(cmd => {
      const leaf = ws.newBlock(`aqui_${cmd.command}`);
      const sock = { forward:'D', backward:'D', right:'A', left:'A' }[cmd.command];
      if (sock) {
        const child = exprToBlock(cmd.value, ws);
        if (child) leaf.getInput(sock).connection.connect(child.outputConnection);
      }
      leaf.initSvg(); leaf.render();

      if (prev) prev.nextConnection.connect(leaf.previousConnection);
      else      bodyInput.connection.connect(leaf.previousConnection);
      prev = leaf;
    });

    blk.initSvg(); blk.render();
    return blk;
  }

  if (stmt.type === 'draw_command') {
    const leaf = ws.newBlock(`aqui_${stmt.command}`);
    const sock = { forward:'D', backward:'D', right:'A', left:'A',
                   penup:null, pendown:null }[stmt.command];
    if (sock) {
      const child = exprToBlock(stmt.value, ws);
      if (child) leaf.getInput(sock).connection.connect(child.outputConnection);
    }
    leaf.initSvg(); leaf.render();
    return leaf;
  }

  console.warn('stmtToBlock – unhandled top-level:', stmt.type);
  return null;
}


function rebuildWorkspaceFromAqui(code, workspace) {
  let ast;
  try {
    ast = new Parser(new Lexer(code)).parse();
  } catch (e) {
    console.warn('AQUI parse failed – workspace left unchanged:', e);
    return;
  }

  _PARAMS.clear();
  const stmts = Array.isArray(ast) ? ast : (ast.body || ast.statements || []);
  stmts.forEach(s => { if (s.type === 'param') _PARAMS.add(s.name); });

  Blockly.Events.disable();
  try {
    workspace.clear();

    let cursorY = 10;
    stmts.forEach(stmt => {
      const blk = stmtToBlock(stmt, workspace);
      if (blk) {
        blk.moveBy(10, cursorY);
        cursorY += blk.getHeightWidth().height + 25;
      }
    });
  } finally {
    Blockly.Events.enable();
  }

  Blockly.svgResize(workspace);
  workspace.render();
}


function updateBlocksFromText() {
  if (!blocklyWorkspace) return;

  runCode();

  try {
    rebuildWorkspaceFromAqui(editor.getValue(), blocklyWorkspace);
  } catch (e) {
    console.warn('AQUI → blocks rebuild failed:', e);
  }
}

function setupEventHandlers() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  document.getElementById('toggle-editor-mode').addEventListener('click', () => {
    const textContainer   = document.getElementById('text-editor-container');
    const blocklyContainer= document.getElementById('blockly-editor-container');
    const toggleBtn       = document.getElementById('toggle-editor-mode');

    if (editorMode === 'text') {
      editorMode = 'blocks';
      toggleBtn.textContent = 'Text';
      textContainer.style.display    = 'none';
      blocklyContainer.style.display = 'block';
      updateBlocksFromText();
      refreshBlockly();
    } else {
      editorMode = 'text';
      toggleBtn.textContent = 'Blocks';
      blocklyContainer.style.display = 'none';
      textContainer.style.display    = 'flex';
      editor.refresh();
      runCode();
    }
  });
  
  document.getElementById('run-button').addEventListener('click', runCode);
  document.getElementById('view-ast').addEventListener('click', () => togglePanel(document.getElementById('ast-panel')));
  document.getElementById('view-errors').addEventListener('click', () => togglePanel(document.getElementById('error-panel')));
  
  setupParameterMenu();
  setupExportMenu();

  setupConstraintsMenu({ renderer, constraintEngine, displayErrors });
  
  window.addEventListener('resize', () => {
    forceCanvasResize();
  });
  
  document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'g' && !event.ctrlKey && !event.metaKey) {
      if (renderer && document.activeElement !== editor.getWrapperElement().querySelector('textarea')) {
        event.preventDefault();
        renderer.coordinateSystem.isGridEnabled = !renderer.coordinateSystem.isGridEnabled;
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
        'd': 'donut',
        'f': 'fingerJoint',
        'v': 'dovetailPin',
        'n': 'tenon',
        'm': 'mortise'
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
      renderer.coordinateSystem.setupCanvas();
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
    const oldCode = editor.getValue();
    let newCode = oldCode.split('\n');

    if (change.action === 'update') {
      // locate the shape block in the text
      let inShapeBlock = false;
      let start = -1, end = -1, depth = 0;
      for (let i = 0; i < newCode.length; i++) {
        const line = newCode[i];
        if (!inShapeBlock && line.trim().startsWith('shape ') && line.includes(change.name)) {
          inShapeBlock = true;
          start = i;
        }
        if (inShapeBlock) {
          if (line.includes('{')) depth++;
          if (line.includes('}')) depth--;
          if (depth === 0) { end = i; break; }
        }
      }

      if (start >= 0 && end >= 0) {
        function injectProp(prop, val) {
          let found = false;
          for (let j = start; j <= end; j++) {
            if (newCode[j].trim().startsWith(prop + ':')) {
              const indent = newCode[j].match(/^\s*/)[0];
              newCode[j] = `${indent}${prop}: ${val}`;
              found = true;
              break;
            }
          }
          if (!found) {
            for (let j = start; j <= end; j++) {
              if (newCode[j].includes('{')) {
                const indent = (newCode[j+1].match(/^\s*/)[0] || '    ');
                newCode.splice(j+1, 0, `${indent}${prop}: ${val}`);
                break;
              }
            }
          }
        }

        injectProp(
          'position',
          `[${change.shape.transform.position[0]}, ${change.shape.transform.position[1]}]`
        );
        if (change.shape.transform.rotation !== 0) {
          injectProp('rotation', change.shape.transform.rotation);
        }
        if (
          change.shape.transform.scale[0] !== 1 ||
          change.shape.transform.scale[1] !== 1
        ) {
          injectProp(
            'scale',
            `[${change.shape.transform.scale[0]}, ${change.shape.transform.scale[1]}]`
          );
        }
        Object.entries(change.shape.params).forEach(([k, v]) => {
          if (typeof v === 'number' || typeof v === 'string') {
            injectProp(k, v);
          }
        });
      }

      newCode = newCode.join('\n');
    }
    else if (change.action === 'delete') {
      let inShape = false, depth = 0;
      newCode = newCode.filter(line => {
        if (!inShape && line.trim().startsWith('shape ') && line.includes(change.name)) {
          inShape = true;
          if (line.includes('{')) depth++;
          return false;
        }
        if (inShape) {
          if (line.includes('{')) depth++;
          if (line.includes('}')) depth--;
          if (depth === 0) { inShape = false; }
          return false;
        }
        return true;
      }).join('\n');
    }

    if (newCode !== oldCode) {
      editor.operation(() => {
        editor.setValue(newCode);
      });
    }

    if (blocklyWorkspace) {
      rebuildWorkspaceFromAqui(editor.getValue(), blocklyWorkspace);
      refreshBlockly();
    }

  } catch (err) {
    console.error('Error updating code from shape change:', err);
  }

  if (editorMode === 'blocks' && blocklyWorkspace) {
    rebuildWorkspaceFromAqui(editor.getValue(), blocklyWorkspace);
    refreshBlockly();
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

    if (constraintEngine) constraintEngine.rebuild();
    
    if (parameterManager && parameterManager.menuVisible) {
      setTimeout(() => {
        parameterManager.updateWithLatestInterpreter();
      }, 100);
    }
    
    displayErrors([]);
    hideErrorPanel();

  } catch (error) {
    console.error('Error in runCode:', error);
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
        renderer.coordinateSystem.setupCanvas();
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

function refreshBlockly() {
  if (blocklyWorkspace) {
    Blockly.svgResize(blocklyWorkspace);   
    blocklyWorkspace.resize();             
  }
}

async function loadDocumentation() {
  try {
    const basicDocs = `
# Aqui Design Language

Aqui is a declarative language for creating 2D shapes and designs with built-in boolean operations, interactive editing capabilities, and comprehensive joint support for digital fabrication.

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

### Joint Types for Digital Fabrication
- \`dovetailPin\` / \`dovetailTail\` - width, length, angle
- \`fingerJoint\` / \`fingerJointMale\` / \`fingerJointFemale\` - totalWidth, fingerWidth, fingerCount
- \`tenon\` / \`mortise\` - width, length, thickness/depth
- \`scarfJoint\` - length, angle
- \`lapJoint\` - width, length, lapLength
- \`crossHalving\` - width, length, crossWidth
- \`tJoint\` - stemWidth, stemLength, crossWidth
- \`slotJoint\` / \`tabJoint\` - for sliding connections
- \`miterJoint\` / \`buttJoint\` - basic geometry

### Joint Parameters
\`\`\`aqui
shape dovetailPin myPin {
    width: 20
    length: 15
    angle: 12
    materialThickness: 6
    tolerance: 0.1
    position: [0, 0]
}
\`\`\`

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
param thickness 6

shape circle myCircle {
    radius: size
    fillColor: color
}
\`\`\`

### Interactive Features
- **Canvas**: Click and drag shapes/joints to move them
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
- **Ctrl+Shift+F**: Create finger joint at center
- **Ctrl+Shift+V**: Create dovetail pin at center
- **Ctrl+Shift+N**: Create tenon at center
- **Ctrl+Shift+M**: Create mortise at center

### Digital Fabrication Features
- **Material Thickness**: Automatic adjustment for sheet materials
- **Tolerance Management**: Precise male/female joint fitting
- **Kerf Compensation**: Laser cutting offset support
- **Joint Visualization**: Technical overlays for manufacturing
- **Assembly Direction**: Visual guides for joint assembly
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

window.runCode = runCode;

window.constraints = constraintEngine;

window.aqui = {
  editor,
  renderer,
  interpreter,
  parameterManager,
  shapeManager,
  dragDropSystem,
  constraints: constraintEngine,
  runCode,
  exportSVG: handleSVGExport,
  exportDXF: handleDXFExport
};
