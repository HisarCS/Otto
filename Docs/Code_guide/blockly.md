# AQUI Blockly System Documentation

## Architecture Overview

AQUI implements a dual-mode editor system that allows users to program in either:
1. **Text Mode** - Traditional code editor with AQUI syntax
2. **Block Mode** - Visual programming with drag-and-drop blocks

The system maintains bidirectional synchronization between both representations, allowing users to switch modes seamlessly while preserving their program logic.

**Why dual-mode?** Different learners prefer different approaches. Text appeals to traditional programmers, while blocks help visual learners and reduce syntax errors. The bidirectional sync ensures users can use whichever mode feels more comfortable at any given time.

---

## Block System Architecture (`blocks-umd.js`)

### Core Block Categories

#### **Color-Coded Organization**
```javascript
const T_COLOR = '#D65C5C';     // Turtle/Drawing commands (red)
const S_COLOR = '#5CA65C';     // Shapes (green)
const P_COLOR = '#CE9E36';     // Properties (orange)
const B_COLOR = '#5C81A6';     // Boolean operations (blue)
const R_COLOR = '#8696D0';     // References (light blue)
```
**How it works:** Blockly uses color coding to help users understand block categories. Each color represents a different concept area. This visual organization reduces cognitive load - users can quickly find the right type of block by color.

**Why these specific colors?** The colors are chosen to be:
- **Distinguishable** - No two colors are too similar
- **Accessible** - Work for colorblind users
- **Semantic** - Green for shapes (natural/growing things), blue for logic operations

### Shape Block Definitions

#### **Dynamic Shape Block Generation**
```javascript
['circle','rectangle','triangle','polygon','star','text', 'ellipse','arc',
 'roundedrectangle','arrow','donut','gear', 'cross'].forEach(type=>{
    
    Blockly.defineBlocksWithJsonArray([{
        type   : `aqui_shape_${type}`,           // Block type identifier
        message0:`shape ${type} %1`,             // Block label with placeholder
        args0  : [{ type:'field_input', name:'NAME', text:`${type[0]}1` }], // Name input field
        message1:'%1',                           // Second line for properties
        args1  : [{ type:'input_statement', name:'PROPS' }], // Statement connector for properties
        previousStatement:null, nextStatement:null, colour:S_COLOR // Stackable block
    }]);

    Blockly.JavaScript[`aqui_shape_${type}`] = blk => {
        const nm   = blk.getFieldValue('NAME').trim();        // Get shape name
        const body = collectLinesUnique_(blk, 'PROPS');       // Get property blocks
        return `shape ${type} ${nm} {\n${body}\n}\n`;        // Generate AQUI code
    };
});
```
**How it works:** This creates a block for each shape type using a loop. Each block has:
1. **Type ID** - Unique identifier for Blockly (`aqui_shape_circle`)
2. **Visual Template** - How the block appears (`shape circle [name]`)
3. **Input Fields** - Shape name and property connector
4. **Code Generator** - Function that converts block to AQUI text

**Why dynamic generation?** Rather than manually defining 13+ similar blocks, we use a loop to generate them. This reduces code duplication and makes adding new shapes easier - just add the name to the array.

#### **Property Block System**
```javascript
Blockly.defineBlocksWithJsonArray([{
    type:'aqui_prop_expr',                    // Expression property (radius: 50)
    message0:'%1 %2',                         // [property name] [value]
    args0:[
        {type:'field_input', name:'KEY', text:'radius'},      // Property name field
        {type:'input_value', name:'VAL'}                      // Value connector
    ],
    previousStatement:null, nextStatement:null, colour:P_COLOR
}]);

Blockly.defineBlocksWithJsonArray([{
    type:'aqui_prop_bool',                    // Boolean property (fill: true)
    message0:'%1 %2',                         // [property name] [checkbox]
    args0:[
        {type:'field_input',  name:'KEY', text:'fill'},       // Property name field
        {type:'field_checkbox', name:'VAL', checked:true}     // Checkbox for true/false
    ],
    previousStatement:null, nextStatement:null, colour:P_COLOR
}]);
```
**How it works:** Properties use two different block types:
- **Expression properties** - Accept any value block (numbers, parameters, calculations)
- **Boolean properties** - Simple checkbox for true/false

The `previousStatement`/`nextStatement` connections allow properties to stack vertically inside shape blocks.

**Why separate property types?** Boolean properties are common enough to deserve a specialized, simpler interface. The checkbox is more intuitive than typing "true"/"false".

### Code Generation System

#### **Property Code Generation**
```javascript
Blockly.JavaScript['aqui_prop_expr'] = blk => {
    const k = blk.getFieldValue('KEY').trim();                    // Property name
    let   v = Blockly.JavaScript.valueToCode(blk,'VAL',0) || '""'; // Property value
    
    // Special handling for color properties
    if (/(color|colour)$/i.test(k)) {         
        v = v.replace(/^['"]|['"]$/g,'');     // Remove quotes from colors
    } 
    // Special handling for text properties  
    else if (k.toLowerCase() === 'text') {   
        if (/^'.*'$/.test(v)) {
            v = '"' + v.slice(1,-1).replace(/"/g,'\\"') + '"'; // Convert single to double quotes
        } else if (!/^".*"$/.test(v)) {
            v = `"${v.replace(/"/g,'\\"')}"`;                   // Add quotes if missing
        }
    }
    return `${k}: ${v}`;                     // Generate "key: value" syntax
};
```
**How it works:** This function converts a property block into AQUI syntax. It handles special cases:
1. **Colors** - Remove quotes so `"red"` becomes `red` (AQUI accepts both)
2. **Text** - Ensure proper quote handling for string values
3. **Default** - Pass through other values unchanged

**Why special handling?** Different property types have different syntax requirements in AQUI. Colors can be unquoted, but text must be quoted. This abstraction hides the syntax complexity from users.

#### **Statement Collection Helper**
```javascript
function collectLinesUnique_(blk, input = 'STACK') {
    const lines = [];
    let child = blk.getInputTargetBlock(input);              // Get first connected block
    
    while (child) {
        // Get code generator for this block type
        const gen = (Blockly.JavaScript.forBlock || Blockly.JavaScript)[child.type];
        const raw = typeof gen === 'function' ? gen(child).trim() : '';
        
        if (raw) lines.push('  ' + raw);                     // Add indented line
        child = child.getNextBlock();                        // Move to next block
    }
    
    return lines.join('\n');                                 // Join with newlines
}
```
**How it works:** This helper collects code from a chain of connected blocks. It:
1. **Starts** with the first block connected to the input
2. **Iterates** through the chain using `getNextBlock()`
3. **Generates** code for each block using its code generator
4. **Indents** each line and joins them with newlines

**Why a helper function?** Many block types (shapes, boolean operations, draw commands) need to collect code from connected statement blocks. This common pattern is extracted into a reusable function.

### Boolean Operations

#### **Boolean Block Generation**
```javascript
['union','intersection','difference'].forEach(kw=>{
    Blockly.defineBlocksWithJsonArray([{
        type:`aqui_${kw}`,                           // Block type: aqui_union, etc.
        message0:`${kw} %1`,                         // Label with name field
        args0:[{ type:'field_input', name:'NAME', text:`${kw}1` }], // Result name
        message1:'%1',                               // Statement connector
        args1:[{ type:'input_statement', name:'STACK' }],
        previousStatement:null, nextStatement:null, colour:B_COLOR
    }]);

    Blockly.JavaScript[`aqui_${kw}`] = blk =>
        `${kw} ${blk.getFieldValue('NAME').trim()} {\n` +
        `${collectLinesUnique_(blk,'STACK')}\n}\n`;
});
```
**How it works:** Boolean operations (union, intersection, difference) follow the same pattern as shapes but use `add`/`subtract` reference blocks inside them. The loop generates three similar blocks with different operations.

**Design pattern:** Container blocks (shapes, boolean ops, draw commands) all follow the same structure:
1. **Header** - Keyword and name
2. **Body** - Statement connector for child blocks
3. **Code generation** - Wrap child code in braces

### Parameter System

#### **Parameter Definition Block**
```javascript
Blockly.defineBlocksWithJsonArray([{
    type: 'aqui_param',
    message0: 'param %1 %2',                         // "param [name] [value]"
    args0: [
        { type:'field_input', name:'NAME',  text:'size' },    // Parameter name
        { type:'input_value', name:'VALUE' }                  // Parameter value
    ],
    previousStatement: null,
    nextStatement:     null,
    colour: 160        
}]);

Blockly.JavaScript['aqui_param'] = blk => {
    const n = blk.getFieldValue('NAME').trim();                      // Parameter name
    const v = Blockly.JavaScript.valueToCode(blk,'VALUE',0) || '0';  // Parameter value
    return `param ${n} ${v}\n`;                                      // Generate AQUI syntax
};
```
**How it works:** Parameter blocks create parameter definitions. The name field accepts any identifier, and the value input accepts any expression block (numbers, calculations, etc.).

#### **Parameter Reference Block**
```javascript
Blockly.defineBlocksWithJsonArray([{
    type     : 'aqui_param_get',
    message0 : 'param %1',                           // "param [name]"
    args0    : [{ type:'field_input', name:'NAME', text:'size' }],
    output   : null,                                 // This block returns a value
    colour   : 160
}]);

Blockly.JavaScript['aqui_param_get'] = blk => [
    blk.getFieldValue('NAME').trim(),                // Just the parameter name
    Blockly.JavaScript.ORDER_ATOMIC                  // Highest precedence (no parentheses needed)
];
```
**How it works:** Parameter reference blocks are expression blocks that return the value of a parameter. The `output: null` makes them connectable to value inputs. The code generator returns an array: `[code, precedence]`.

**Why two parameter blocks?** AQUI distinguishes between:
- **Defining** parameters (`param size 100`) - Statement
- **Using** parameters (`radius: size`) - Expression

The blocks mirror this distinction with different shapes and connection types.

### Turtle Graphics Integration

#### **Movement Commands**
```javascript
Blockly.defineBlocksWithJsonArray([
    {type:'aqui_forward', message0:'forward %1',
     args0:[{type:'input_value',name:'D',check:'Number'}],        // Distance value
     previousStatement:null,nextStatement:null,colour:T_COLOR},
    {type:'aqui_backward',message0:'backward %1',
     args0:[{type:'input_value',name:'D',check:'Number'}],
     previousStatement:null,nextStatement:null,colour:T_COLOR},
]);

Blockly.JavaScript['aqui_forward']  = b=>`forward ${Blockly.JavaScript.valueToCode(b,'D',0)||0}`;
Blockly.JavaScript['aqui_backward'] = b=>`backward ${Blockly.JavaScript.valueToCode(b,'D',0)||0}`;
```
**How it works:** Turtle commands are statement blocks that accept number inputs. The `check:'Number'` provides type validation - only number blocks can connect. The code generators extract the value and format it as AQUI syntax.

**Why turtle graphics?** Turtle graphics provide an intuitive introduction to programming concepts:
- **Sequential execution** - Commands execute in order
- **State management** - Turtle position and heading
- **Procedural thinking** - Break complex shapes into simple steps

#### **Draw Command Container**
```javascript
Blockly.defineBlocksWithJsonArray([{
    type      : 'aqui_draw',
    message0  : 'draw %1',                           // "draw [name]"
    args0     : [{ type:'field_input', name:'NAME', text:'square' }],
    message1  : '%1',                                // Statement connector
    args1     : [{ type:'input_statement', name:'STACK' }],
    previousStatement : null,
    nextStatement     : null,
    colour            : T_COLOR
}]);

Blockly.JavaScript['aqui_draw'] = blk =>
    `draw ${blk.getFieldValue('NAME').trim()} {\n` +
    `${collectLinesUnique_(blk,'STACK')}\n}\n`;
```
**How it works:** The draw block is a container for turtle commands. It follows the same pattern as shape and boolean blocks - a header with name, and a body for child commands.

---

## Dual-Mode Editor System (`app.js`)

### Editor Mode Management

#### **Mode Switching Logic**
```javascript
document.getElementById('toggle-editor-mode').addEventListener('click', () => {
    const textContainer   = document.getElementById('text-editor-container');
    const blocklyContainer= document.getElementById('blockly-editor-container');
    const toggleBtn       = document.getElementById('toggle-editor-mode');

    if (editorMode === 'text') {
        // Switch to blocks mode
        editorMode = 'blocks';
        toggleBtn.textContent = 'Text';                     // Button shows what clicking does
        textContainer.style.display    = 'none';           // Hide text editor
        blocklyContainer.style.display = 'block';          // Show Blockly editor
        updateBlocksFromText();                             // Convert current code to blocks
        refreshBlockly();                                   // Resize Blockly workspace
    } else {
        // Switch to text mode  
        editorMode = 'text';
        toggleBtn.textContent = 'Blocks';                   // Button shows what clicking does
        blocklyContainer.style.display = 'none';           // Hide Blockly editor
        textContainer.style.display    = 'flex';           // Show text editor
        editor.refresh();                                   // Refresh CodeMirror
        runCode();                                          // Execute current code
    }
});
```
**How it works:** Mode switching involves:
1. **Track current mode** - Global `editorMode` variable
2. **Update UI** - Show/hide appropriate editor containers
3. **Update button label** - Button text shows what it will do when clicked
4. **Sync content** - Convert between text and blocks
5. **Refresh displays** - Ensure editors render properly

**Why this UI pattern?** The button label tells users what will happen when they click it. "Blocks" means "switch to blocks mode", "Text" means "switch to text mode". This is clearer than a toggle that just says "Toggle Mode".

### Bidirectional Synchronization

#### **Text-to-Blocks Conversion**
```javascript
function updateBlocksFromText() {
    if (!blocklyWorkspace) return;                          // Guard against missing workspace

    runCode();                                              // Parse and execute text to get AST
    
    try {
        rebuildWorkspaceFromAqui(editor.getValue(), blocklyWorkspace);
    } catch (e) {
        console.warn('AQUI → blocks rebuild failed:', e);   // Log but don't crash
    }
}

function rebuildWorkspaceFromAqui(code, workspace) {
    let ast;
    try {
        ast = new Parser(new Lexer(code)).parse();          // Parse AQUI code to AST
    } catch (e) {
        console.warn('AQUI parse failed — workspace left unchanged:', e);
        return;
    }

    _PARAMS.clear();                                        // Clear parameter tracking
    const stmts = Array.isArray(ast) ? ast : (ast.body || ast.statements || []);
    
    // Track parameters for block generation
    stmts.forEach(s => { if (s.type === 'param') _PARAMS.add(s.name); });

    Blockly.Events.disable();                               // Prevent events during rebuild
    try {
        workspace.clear();                                  // Remove all blocks

        let cursorY = 10;                                   // Vertical position for blocks
        stmts.forEach(stmt => {
            const blk = stmtToBlock(stmt, workspace);       // Convert AST node to block
            if (blk) {
                blk.moveBy(10, cursorY);                    // Position block
                cursorY += blk.getHeightWidth().height + 25; // Move cursor down
            }
        });
    } finally {
        Blockly.Events.enable();                            // Re-enable events
    }

    Blockly.svgResize(workspace);                           // Refresh workspace size
    workspace.render();                                     // Redraw all blocks
}
```
**How it works:** Converting text to blocks involves several steps:
1. **Parse** - Convert AQUI text to AST using the same parser
2. **Clear workspace** - Remove existing blocks
3. **Convert each statement** - Transform AST nodes to Blockly blocks
4. **Position blocks** - Stack them vertically with spacing
5. **Refresh display** - Update workspace rendering

**Why disable events?** During rebuild, we're creating many blocks quickly. Each block creation would normally trigger change events, causing performance issues and potential infinite loops. We disable events during bulk operations.

#### **Blocks-to-Text Conversion**
```javascript
blocklyWorkspace.addChangeListener(event => {
    // Ignore UI events and field changes during sync
    if (event.type === Blockly.Events.UI ||
        (event.type === Blockly.Events.CHANGE && event.element === 'field') ||
        syncingFromBlocks) {
        return;
    }
    
    try {
        const code = Blockly.JavaScript.workspaceToCode(blocklyWorkspace);  // Generate AQUI code
        
        if (editor.getValue() !== code) {                   // Only update if different
            syncingFromBlocks = true;                       // Prevent sync loops
            editor.operation(() => {
                editor.setValue(code);                      // Update text editor
                runCode();                                  // Execute new code
            });
        }
    } catch (e) {
        console.warn('Codegen error (ignored):', e);       // Log but continue
    } finally {
        syncingFromBlocks = false;                          // Re-enable sync
    }
});
```
**How it works:** Blocks-to-text conversion happens automatically:
1. **Listen for changes** - Any block modification triggers conversion
2. **Filter events** - Ignore UI-only changes and sync operations
3. **Generate code** - Use Blockly's built-in code generation
4. **Update text editor** - Replace text content with generated code
5. **Execute** - Run the new code immediately

**Sync loop prevention:** The `syncingFromBlocks` flag prevents infinite loops. Without it:
1. User drags block → triggers blocks-to-text sync → updates text editor
2. Text editor change → triggers text-to-blocks sync → updates blocks
3. Block change → triggers blocks-to-text sync → infinite loop

### AST-to-Blocks Conversion

#### **Statement Conversion**
```javascript
function stmtToBlock(stmt, ws) {
    if (stmt.type === 'shape') {
        const blk = ws.newBlock(`aqui_shape_${stmt.shapeType}`);    // Create shape block
        blk.setFieldValue(stmt.name, 'NAME');                      // Set shape name

        let prev = null;
        stmt.properties.forEach((prop, i) => {
            // Determine property block type
            const leafType = prop.value.type === 'boolean' 
                           ? 'aqui_prop_bool'                       // Checkbox for boolean
                           : 'aqui_prop_expr';                      // Value input for others
            
            const leaf = ws.newBlock(leafType);
            leaf.setFieldValue(prop.key, 'KEY');                   // Property name
            
            if (prop.value.type === 'boolean') {
                leaf.setFieldValue(prop.value.value ? 'TRUE' : 'FALSE', 'VAL');
            } else {
                const child = exprToBlock(prop.value, ws);          // Convert value expression
                if (child) leaf.getInput('VAL').connection.connect(child.outputConnection);
            }
            
            leaf.initSvg(); leaf.render();

            // Connect to previous property or shape block
            if (prev) prev.nextConnection.connect(leaf.previousConnection);
            else      blk.getInput('PROPS').connection.connect(leaf.previousConnection);
            prev = leaf;
        });

        blk.initSvg(); blk.render();
        return blk;
    }
    
    // ... other statement types
}
```
**How it works:** AST-to-blocks conversion mirrors the parsing structure:
1. **Identify node type** - Each AST node type maps to specific block types
2. **Create block** - Instantiate the appropriate Blockly block
3. **Set fields** - Copy data from AST to block fields
4. **Convert children** - Recursively convert child expressions
5. **Connect blocks** - Establish parent-child relationships

**Property chain building:** Properties must connect in sequence. We track the `prev` block and connect each new property to it, forming a vertical chain inside the shape block.

#### **Expression Conversion**
```javascript
function exprToBlock(expr, ws) {
    if (!expr) return null;

    if (expr.type === 'number') {                     
        const b = ws.newBlock('math_number');
        b.setShadow(true);                            // Shadow blocks are placeholders
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

    if (expr.type === 'binary_op') {
        const b = ws.newBlock('math_arithmetic');
        const opMap = { 'plus':'ADD', 'minus':'MINUS', 'multiply':'MULTIPLY', 'divide':'DIVIDE' };
        b.setFieldValue(opMap[expr.operator], 'OP');

        const left = exprToBlock(expr.left, ws);      // Convert left operand
        const right = exprToBlock(expr.right, ws);    // Convert right operand
        
        if (left) b.getInput('A').connection.connect(left.outputConnection);
        if (right) b.getInput('B').connection.connect(right.outputConnection);
        
        b.initSvg(); b.render();
        return b;
    }

    // ... other expression types

    console.warn('exprToBlock — unhandled:', expr.type);
    return null;
}
```
**How it works:** Expression conversion handles the mathematical and data expressions:
1. **Literals** - Numbers and strings become their respective blocks
2. **Binary operations** - Math blocks with left/right operands
3. **Parameter references** - Parameter getter blocks
4. **Arrays** - List construction blocks

**Shadow blocks:** Simple literals are marked as shadows. Shadow blocks are special Blockly blocks that:
- Provide default values
- Disappear when replaced by user blocks
- Show placeholder values in a lighter color

### Workspace Management

#### **Blockly Initialization**
```javascript
async function initBlockly() {
    if (!window.Blockly) {
        console.error('Blockly not found; did you include the UMD bundles?');
        return;
    }

    blocklyWorkspace = Blockly.inject('blocklyDiv', {
        toolbox: TOOLBOX_XML,                         // Block palette definition
        grid:    { spacing: 20, length: 3, colour: '#ccc', snap: true },    // Grid settings
        zoom:    { controls: true, wheel: true },     // Zoom controls
        renderer:'thrasos'                            // Modern block renderer
    });

    refreshBlockly();                                 // Initial sizing

    // Set up change listener for blocks-to-text sync
    blocklyWorkspace.addChangeListener(event => {
        // ... sync logic as shown above
    });

    console.log('Blockly initialized successfully.');
}
```
**How it works:** Blockly initialization creates the visual workspace:
1. **Check availability** - Ensure Blockly library loaded
2. **Inject workspace** - Create Blockly instance in specified div
3. **Configure appearance** - Grid, zoom, renderer options
4. **Setup listeners** - Change events for synchronization
5. **Initial refresh** - Ensure proper sizing

**Why 'thrasos' renderer?** This is Blockly's modern renderer with improved visual styling, better performance, and smoother animations compared to the classic renderer.

#### **Toolbox Configuration**
```javascript
const TOOLBOX_XML = `
<xml xmlns="https://developers.google.com/blockly/xml" style="display: none">

  <category name="Shapes" colour="#5CA65C">
    <block type="aqui_shape_circle"/>
    <block type="aqui_shape_rectangle"/>
    <block type="aqui_shape_triangle"/>
    <!-- ... more shapes -->
  </category>

  <category name="Parameters" colour="#CE5C81">
    <block type="aqui_param">
      <value name="VALUE">
        <shadow type="math_number"><field name="NUM">150</field></shadow>
      </value>
    </block>
    <block type="aqui_param_get">
      <field name="NAME">size</field>
    </block>
  </category>

  <!-- ... more categories -->

</xml>
`;
```
**How it works:** The toolbox defines the block palette:
1. **Categories** - Organize blocks into logical groups
2. **Color coordination** - Match block colors for consistency
3. **Default configurations** - Pre-configure common settings
4. **Shadow blocks** - Provide default values for inputs

**Why XML format?** Blockly's toolbox uses XML to define the palette structure. This format allows complex configurations including nested categories, block groupings, and default values.

---

## Advanced Features

### Custom Block Creation

#### **Adding a New Shape Block**
```javascript
// 1. Add shape name to generation loop
['circle','rectangle','triangle','polygon','star','text', 'ellipse','arc',
 'roundedrectangle','arrow','donut','gear', 'cross', 'mynewshape'].forEach(type=>{
    // Block definition and code generation happen automatically
});

// 2. Add to toolbox XML
const TOOLBOX_XML = `
<xml>
  <category name="Shapes" colour="#5CA65C">
    <!-- existing blocks -->
    <block type="aqui_shape_mynewshape"/>
  </category>
</xml>
`;

// 3. Implement shape class in Shapes.mjs
class MyNewShape extends Shape {
    // Shape implementation
}
```
**How it works:** Adding new shape blocks requires three steps:
1. **Block generation** - Add to the forEach loop
2. **Toolbox entry** - Make block available in palette
3. **Shape implementation** - Create the actual shape class

**Why this approach?** The automatic generation system means new shapes get consistent block behavior. You only need to implement the shape geometry, not the visual programming interface.

#### **Creating Custom Property Blocks**
```javascript
Blockly.defineBlocksWithJsonArray([{
    type: 'aqui_prop_custom',
    message0: '%1 %2',
    args0: [
        {type: 'field_dropdown', name: 'KEY',           // Dropdown for property name
         options: [['width', 'width'], ['height', 'height'], ['depth', 'depth']]},
        {type: 'input_value', name: 'VAL'}             // Value input
    ],
    previousStatement: null, nextStatement: null, colour: P_COLOR
}]);

Blockly.JavaScript['aqui_prop_custom'] = blk => {
    const k = blk.getFieldValue('KEY');
    const v = Blockly.JavaScript.valueToCode(blk, 'VAL', 0) || '0';
    return `${k}: ${v}`;
};
```
**How it works:** Custom property blocks can use dropdowns instead of text inputs for property names. This prevents typos and provides better user experience for properties with known sets of valid values.

**When to use custom blocks?** Create specialized blocks when:
- Limited set of valid values (dropdown better than text input)
- Complex validation requirements
- Special visual representation needed
- Integration with external systems

### Logic and Control Flow

#### **Conditional Logic Integration**
```javascript
Blockly.JavaScript['logic_operation'] = function(b) {
    const opMap = { 'AND':'and', 'OR':'or' };               // Map Blockly ops to AQUI syntax
    const order = (b.getFieldValue('OP') === 'AND')
                    ? Blockly.JavaScript.ORDER_LOGICAL_AND
                    : Blockly.JavaScript.ORDER_LOGICAL_OR;
    const A = Blockly.JavaScript.valueToCode(b, 'A', order) || 'false';
    const B = Blockly.JavaScript.valueToCode(b, 'B', order) || 'false';
    return [ `${A} ${opMap[b.getFieldValue('OP')]} ${B}`, order ];
};

Blockly.JavaScript['logic_compare'] = function (b) {
    const opMap = { 'EQ':'==', 'NEQ':'!=', 'LT':'<', 'LTE':'<=', 'GT':'>', 'GTE':'>=' };
    const order = Blockly.JavaScript.ORDER_RELATIONAL;
    const A = Blockly.JavaScript.valueToCode(b, 'A', order) || '0';
    const B = Blockly.JavaScript.valueToCode(b, 'B', order) || '0';
    return [ `${A} ${opMap[b.getFieldValue('OP')]} ${B}`, order ];
};
```
**How it works:** Standard Blockly logic blocks are adapted to generate AQUI syntax. The operator mapping translates Blockly's internal representations to AQUI's text format.

**Precedence handling:** The `order` parameter ensures proper parenthesization. Higher precedence operations don't need parentheses when used inside lower precedence operations.

### Performance Optimizations

#### **Sync Debouncing**
```javascript
editor.on('change', () => {
    if (syncingFromBlocks || _writingEditorFromShape || _writingEditorFromConstraints) return;
    
    clearTimeout(timeout);                              // Cancel previous timer
    timeout = setTimeout(() => {                        // Start new timer
        runCode();
        if (editorMode === 'blocks' && blocklyWorkspace) {
            rebuildWorkspaceFromAqui(editor.getValue(), blocklyWorkspace);
            refreshBlockly();
        }
    }, 300);                                           // 300ms delay
});  
```
**How it works:** Text editor changes trigger sync after a 300ms delay. Each keystroke cancels the previous timer and starts a new one. This prevents expensive sync operations on every character typed.

**Why debouncing?** Converting between text and blocks is computationally expensive. Without debouncing:
- Every keystroke triggers full text→AST→blocks conversion
- Typing "circle" would trigger 6 conversions as user types c-i-r-c-l-e
- UI becomes sluggish and battery drains quickly

#### **Event Filtering**
```javascript
blocklyWorkspace.addChangeListener(event => {
    // Filter out events that don't require sync
    if (event.type === Blockly.Events.UI ||                     // Mouse movements, selection
        (event.type === Blockly.Events.CHANGE && event.element === 'field') || // Field edits
        syncingFromBlocks) {                                     // Sync operations
        return;
    }
    
    // Only meaningful changes trigger sync
    // ... sync logic
});
```
**How it works:** Not all Blockly events require synchronization:
- **UI events** - Mouse movements, selections (visual only)
- **Field changes** - Typing in text fields (too frequent)
- **Sync events** - Our own updates (would cause loops)

Only structural changes (block creation, connection, deletion) trigger sync.

**Performance impact:** Without filtering, the sync system would run continuously as users interact with blocks, making the interface unusable.

---

## Integration with AQUI Interpreter

### Code Execution Pipeline

#### **Unified Execution**
```javascript
function runCode() {
    try {
        renderer.clear();
        
        const code = editor.getValue();                 // Get current code (from either editor)
        const lexer = new Lexer(code);                  // Same lexer as text mode
        const parser = new Parser(lexer);               // Same parser as text mode  
        const ast = parser.parse();                     // Same AST structure
        
        // ... rest of execution pipeline identical to text mode
        
    } catch (error) {
        console.error(error);
        displayErrors(error);
    }
}
```
**How it works:** Both editor modes produce identical AQUI text code, which feeds into the same execution pipeline. The interpreter doesn't know whether code came from text editing or block manipulation.

**Why unified execution?** This ensures perfect consistency between modes. There's no risk of blocks behaving differently from text - they generate identical code that runs through identical systems.

### Constraint System Integration

#### **Constraint Block Support**
```javascript
// When constraints change, update both editors
function updateCodeFromConstraints() {
    const snapshot = renderer.constraintEngine.getConstraintSnapshot();
    
    // Generate constraint block text
    const constraintCode = generateConstraintBlock(snapshot);
    
    // Update text editor
    const newCode = insertConstraintBlock(editor.getValue(), constraintCode);
    editor.setValue(newCode);
    
    // Update block editor if active
    if (editorMode === 'blocks' && blocklyWorkspace) {
        rebuildWorkspaceFromAqui(newCode, blocklyWorkspace);
        refreshBlockly();
    }
}
```
**How it works:** The constraint system integrates with both editor modes:
1. **Generate text** - Convert constraints to AQUI syntax
2. **Update text editor** - Insert/replace constraint blocks
3. **Update block editor** - Rebuild blocks from new text

This ensures constraints appear correctly in whichever editor mode is active.

---

## Testing and Debugging

### Block System Testing

#### **Block Definition Testing**
```javascript
// Test block creation
const testWorkspace = new Blockly.Workspace();
const block = testWorkspace.newBlock('aqui_shape_circle');
block.setFieldValue('testCircle', 'NAME');

// Test code generation
const generatedCode = Blockly.JavaScript.blockToCode(block);
console.assert(generatedCode.includes('shape circle testCircle'), 'Code generation failed');

// Test roundtrip (code → blocks → code)
const originalCode = 'shape circle myCircle { radius: 50 }';
rebuildWorkspaceFromAqui(originalCode, testWorkspace);
const regeneratedCode = Blockly.JavaScript.workspaceToCode(testWorkspace);
console.assert(originalCode === regeneratedCode.trim(), 'Roundtrip failed');
```
**How it works:** Block testing covers:
1. **Block creation** - Can blocks be instantiated correctly?
2. **Code generation** - Do blocks produce correct AQUI syntax?
3. **Roundtrip fidelity** - Text→Blocks→Text preserves meaning?

#### **Synchronization Testing**
```javascript
// Test editor sync
editorMode = 'text';
editor.setValue('shape rectangle myRect { width: 100 }');
updateBlocksFromText();

// Verify blocks were created
const blocks = blocklyWorkspace.getAllBlocks();
console.assert(blocks.some(b => b.type === 'aqui_shape_rectangle'), 'Block creation failed');

// Test reverse sync
const rectBlock = blocks.find(b => b.type === 'aqui_shape_rectangle');
rectBlock.setFieldValue('newName', 'NAME');

// Verify text was updated
setTimeout(() => {
    console.assert(editor.getValue().includes('newName'), 'Text sync failed');
}, 100);
```
**How it works:** Sync testing verifies:
1. **Text-to-blocks** - Code changes create appropriate blocks
2. **Blocks-to-text** - Block changes update code correctly
3. **Timing** - Async operations complete properly

### Common Issues and Solutions

#### **Sync Loop Prevention**
```javascript
// Problem: Infinite sync loops
// Solution: Sync flags and event filtering

let syncingFromBlocks = false;

// Blocks → Text
blocklyWorkspace.addChangeListener(() => {
    if (syncingFromBlocks) return;      // Prevent loop
    syncingFromBlocks = true;
    updateTextFromBlocks();
    syncingFromBlocks = false;
});

// Text → Blocks  
editor.on('change', () => {
    if (syncingFromBlocks) return;      // Prevent loop
    updateBlocksFromText();
});
```
**How it works:** Sync loops occur when:
1. User changes blocks → triggers text update → triggers block update → infinite loop
2. Solution uses flags to detect when we're already syncing

#### **Performance Issues**
```javascript
// Problem: Sync on every keystroke
// Solution: Debouncing

let syncTimeout;
editor.on('change', () => {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(updateBlocksFromText, 300);    // Wait for pause in typing
});

// Problem: Expensive AST parsing
// Solution: Error handling and caching

let cachedAST = null;
function parseWithCache(code) {
    if (cachedAST && cachedAST.code === code) {
        return cachedAST.ast;
    }
    
    try {
        const ast = new Parser(new Lexer(code)).parse();
        cachedAST = { code, ast };
        return ast;
    } catch (error) {
        console.warn('Parse error:', error);
        return null;                    // Graceful degradation
    }
}
```
**How it works:** Performance optimizations include:
1. **Debouncing** - Delay expensive operations until user pauses
2. **Caching** - Avoid re-parsing identical code
3. **Graceful degradation** - Continue working even with errors

This comprehensive Blockly integration provides a seamless dual-mode programming environment that supports learners at all levels, from visual programming beginners to text-based coding experts.
