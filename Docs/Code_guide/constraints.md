# AQUI Constraint System Documentation

## Architecture Overview

AQUI's constraint system enables **parametric design** by maintaining geometric relationships between shapes automatically. When you specify that two circles should maintain a fixed distance, or that rectangles should stay aligned, the constraint system continuously enforces these relationships even as other properties change.

**Why constraints?** In parametric design, you want to specify design intent ("these holes should stay 50mm apart") rather than absolute positions. Constraints capture this intent and maintain it automatically as the design evolves.

The system consists of five main components:
1. **Constraint Engine** (`engine.mjs`) - Core solver and shape management
2. **Constraint Classes** (`constraints.mjs`) - Mathematical constraint definitions
3. **Mathematical Solver** (`solveSystem.mjs`) - Equation solving algorithms  
4. **User Interface** (`ui.mjs`) - Interactive constraint creation and management
5. **Visual Overlay** (`constraintsOverlay.mjs`) - On-canvas constraint visualization

---

## Constraint Engine (`engine.mjs`)

### Core Engine Architecture

#### **ConstraintEngine Class**
```javascript
export class ConstraintEngine {
    constructor(renderer, shapeManager, onShapeChanged) {
        this.renderer = renderer;              // Access to shape rendering system
        this.shapeManager = shapeManager;      // Shape manipulation interface
        this.onShapeChanged = onShapeChanged;  // Callback for shape modifications

        this.anchors = new Map();              // Anchor point definitions (id -> properties)
        this.anchorCatalog = new Map();       // Shape -> available anchors
        this.constraints = [];                // Active constraint list
        this.liveEnforce = true;              // Auto-solve when shapes change
        
        this._applying = false;               // Prevents recursion during solving
        this._movedDuringApply = new Set();   // Tracks shapes moved during constraint solving
    }
}
```
**How it works:** The engine acts as the central coordinator for all constraint operations. It maintains:
- **Anchors** - Named points on shapes (center, corners, edges)  
- **Constraints** - Relationships between anchor points
- **Live enforcement** - Automatic solving when shapes are modified
- **State management** - Prevents infinite loops and tracks changes

**Why this architecture?** Separating concerns allows each component to focus on its specific responsibility. The engine orchestrates but doesn't implement mathematical details, making the system modular and testable.

### Anchor Point System

#### **Anchor Generation**
```javascript
rebuild() {
    this.anchors.clear();
    this.anchorCatalog.clear();
    if (!this.renderer || !this.renderer.shapes) return;

    for (const [name, shape] of this.renderer.shapes.entries()) {
        const anchors = [];
        const type = typeOf(shape);
        
        // Helper to define anchor points
        const add = (key, label, off) => {
            const id = sym(`${key}_${name}`);                           // Unique anchor ID
            this.anchors.set(id, { 
                shapeName: name, 
                key, 
                ox: off.x,      // Local offset from shape center 
                oy: off.y 
            });
            anchors.push({ key, label });                              // UI-friendly list
        };

        // Universal anchor - every shape has a center
        add('center', 'Center', {x:0, y:0});

        // Shape-specific anchors based on geometry
        if (['rectangle','roundedrectangle','chamferrectangle','cross'].includes(type)) {
            const w = getNum(shape, ['width','w'], 0);
            const h = getNum(shape, ['height','h'], 0);
            
            add('top',    'Top Edge',    {x:0,   y:-h/2});
            add('bottom', 'Bottom Edge', {x:0,   y: h/2});
            add('left',   'Left Edge',   {x:-w/2, y:0});
            add('right',  'Right Edge',  {x: w/2, y:0});
            
            add('topLeft',     'Top Left',     {x:-w/2, y:-h/2});
            add('topRight',    'Top Right',    {x: w/2, y:-h/2});
            add('bottomLeft',  'Bottom Left',  {x:-w/2, y: h/2});
            add('bottomRight', 'Bottom Right', {x: w/2, y: h/2});
        }

        this.anchorCatalog.set(name, anchors);                        // Store for UI
    }
}
```
**How it works:** Anchor generation analyzes each shape and creates named reference points:
1. **Introspection** - Examine shape type and properties
2. **Offset calculation** - Determine local coordinates relative to shape center
3. **ID generation** - Create unique identifiers combining anchor name and shape name
4. **Cataloging** - Store both internal (solver) and external (UI) representations

**Why local offsets?** Anchors are defined relative to the shape center, so they automatically move and rotate with the shape. A rectangle's "topLeft" corner is always at `(-width/2, -height/2)` regardless of the rectangle's position or rotation.

#### **World Coordinate Calculation**
```javascript
getAnchorWorld(shapeName, anchorKey) {
    const id = (anchorKey + '_' + shapeName).toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const a = this.anchors.get(id);
    if (!a) return { x: 0, y: 0, ok:false };
    
    const s = this.renderer?.shapes?.get(shapeName);
    if (!s) return { x: 0, y: 0, ok:false };
    
    // Get shape transform
    const t = s.transform || {};
    const [cx, cy] = Array.isArray(t.position) ? t.position : [0,0];
    const th = (Number(t.rotation || 0) * Math.PI) / 180;        // Convert to radians
    
    // Apply rotation to local offset
    const rx = a.ox * Math.cos(th) - a.oy * Math.sin(th);       // 2D rotation matrix
    const ry = a.ox * Math.sin(th) + a.oy * Math.cos(th);       // [cos -sin] [ox]
                                                                 // [sin  cos] [oy]
    
    // Translate to world coordinates
    return { x: cx + rx, y: cy + ry, ok:true };
}
```
**How it works:** Converting anchor points to world coordinates involves:
1. **Look up anchor** - Find the local offset for the specified anchor
2. **Get shape transform** - Current position, rotation, scale
3. **Apply rotation** - Rotate the local offset by the shape's rotation
4. **Translate** - Add the shape's world position

**Transform order:** We apply rotation first, then translation. This ensures anchors rotate around the shape center, then the whole shape (with rotated anchors) translates to its world position.

### Constraint Management

#### **Adding Constraints**
```javascript
addDistance(a, b, dist) {
    this._solveConstraint('distance', a, b, {dist});            // Apply immediately
    const def = this._store({ type:'distance', a, b, dist });   // Store for future
    return def;
}

addCoincidentAnchors(a, b) {
    this._solveConstraint('coincident', a, b);
    const def = this._store({ type:'coincident', a, b });
    return def;
}

_store(entry) {
    const id = nextId();                                        // Generate unique ID
    this.constraints.push({ id, ...entry });                   // Add to constraint list
    this._notifyListChanged();                                  // Update UI
    return { id, label: this.getConstraintList().find(c => c.id===id).label };
}
```
**How it works:** Adding constraints follows a two-step process:
1. **Immediate solving** - Apply the constraint right now to current shape positions
2. **Storage** - Remember the constraint for future enforcement

**Why solve immediately?** Users expect immediate feedback. If they add a distance constraint, they want to see shapes move to satisfy it instantly. The stored constraint ensures the relationship is maintained as other changes occur.

#### **Live Enforcement System**
```javascript
installLiveEnforcer(shapeManager) {
    if (!shapeManager || this._wrappedSM) return;
    this._wrappedSM = true;

    const self = this;
    
    const callEnforce = () => {
        if (self._applying || !self.liveEnforce) return;        // Prevent recursion
        try {
            window.__enforcingConstraints = true;               // Global flag for debugging
            const fixed = self._detectChangedShape();           // Find which shape user moved
            self.rebuild();                                     // Update anchor positions
            self.applyAllConstraints(fixed);                    // Solve all constraints
        } catch (e) {
            console.warn('Constraint enforce error', e);
        } finally {
            self._takeSnapshot();                               // Remember current state
            window.__enforcingConstraints = false;  
            self._flushMovedDuringApply();                     // Notify about shape changes
        }
    };

    // Intercept shape manipulation methods
    const wrap = (fnName) => {
        const orig = shapeManager[fnName]?.bind(shapeManager);
        if (!orig) return;
        shapeManager[fnName] = function(...args){
            const out = orig(...args);                          // Call original method
            callEnforce(fnName, args);                          // Then enforce constraints
            return out;
        };
    };

    // Wrap interactive shape manipulation methods
    wrap('onCanvasPositionChange');     // User drags shape
    wrap('onCanvasRotationChange');     // User rotates shape  
    wrap('onCanvasScaleChange');        // User scales shape
}
```
**How it works:** Live enforcement intercepts user interactions:
1. **Method wrapping** - Replace shape manipulation methods with constraint-aware versions
2. **Change detection** - Identify which shape the user directly modified
3. **Constraint solving** - Apply all constraints while keeping the user-modified shape fixed
4. **Notification** - Update other systems about resulting shape changes

**Why method wrapping?** This creates automatic constraint enforcement without modifying the shape manipulation code. Any code that moves shapes triggers constraint solving, ensuring relationships are always maintained.

### Constraint Solving

#### **Individual Constraint Solving**
```javascript
_solveConstraint(type, a, b, extra = {}, fixedShapeName = null) {
    this.rebuild();                                             // Ensure anchors are current

    // Generate variable names for anchor coordinates
    const idA = sym(`${a.anchor}_${a.shape}`);
    const idB = sym(`${b.anchor}_${b.shape}`);
    const ax = `x${idA}`, ay = `y${idA}`, bx = `x${idB}`, by = `y${idB}`;

    // Create constraint object and get equations
    let c, eqs;
    if (type === 'coincident') {
        c = new Coincident({id:idA},{id:idB});
        eqs = c.getEqs(ax,ay,bx,by);                           // ["xA - xB", "yA - yB"]
    } else if (type === 'distance') {
        c = new Distance({id:idA},{id:idB}, extra.dist);
        eqs = c.getEqs(ax,ay,bx,by);                           // ["((xB-xA)^2 + (yB-yA)^2) - (d^2)"]
    }
    // ... other constraint types

    // Get current variable values
    const vars = this._varsFor([idA, idB]);

    // Handle fixed shapes (user interactions)
    let forwardSubs = {};
    let idsToMove = [idA, idB];                                // Both anchors can move by default
    
    if (fixedShapeName === a.shape) {
        forwardSubs = { [ax]: `(${cstr(vars[ax])})`, [ay]: `(${cstr(vars[ay])})` };
        idsToMove = [idB];                                     // Only B can move
    } else if (fixedShapeName === b.shape) {
        forwardSubs = { [bx]: `(${cstr(vars[bx])})`, [by]: `(${cstr(vars[by])})` };
        idsToMove = [idA];                                     // Only A can move
    }

    // Solve the constraint equations
    const [, solved] = solveSystem(eqs, vars, { forwardSubs });
    this._applySolved(idsToMove, solved, fixedShapeName);      // Apply solutions to shapes
}
```
**How it works:** Constraint solving transforms geometric relationships into mathematical equations:
1. **Variable generation** - Create variable names for anchor coordinates
2. **Equation generation** - Convert constraint into mathematical expressions
3. **Fixed point handling** - Lock down user-manipulated shapes
4. **Mathematical solving** - Use symbolic math to find solutions
5. **Application** - Move shapes to satisfy the constraint

**Why symbolic variables?** The solver works with symbolic expressions like `"x1 - x2"` rather than numeric values. This allows the mathematical solver to find exact solutions and handle complex constraint systems.

#### **Solution Application**
```javascript
_applySolved(anchorIds, solved, fixedShapeName) {
    const EPS = 1e-6;                                          // Floating point tolerance
    const toCo = id => this.anchors.get(id);
    const movedShapes = new Set();

    anchorIds.forEach(aid => {
        const a = toCo(aid);
        if (!a) return;

        const shape = this.renderer?.shapes?.get(a.shapeName);
        if (!shape) return;

        // Get solved anchor position  
        const nx = Number(solved[`x${aid}`] ?? 0);
        const ny = Number(solved[`y${aid}`] ?? 0);
        
        // Calculate current anchor position
        const curr = this.getAnchorWorld(a.shapeName, a.key);
        if (!curr.ok) return;

        // Calculate how far the shape needs to move
        const [cx, cy] = Array.isArray(shape.transform.position) ? 
                         shape.transform.position : [0,0];
        const th = (Number(shape.transform.rotation || 0) * Math.PI) / 180;
        const rx = a.ox * Math.cos(th) - a.oy * Math.sin(th);
        const ry = a.ox * Math.sin(th) + a.oy * Math.cos(th);

        const dx = nx - (cx + rx);                             // Required X movement
        const dy = ny - (cy + ry);                             // Required Y movement

        // Apply movement if significant
        if (Math.abs(dx) > EPS || Math.abs(dy) > EPS) {
            shape.transform.position = [
                +(cx + dx).toFixed(6),                         // Update shape position
                +(cy + dy).toFixed(6)
            ];
            
            // Track shape changes for notification
            if (this._applying) {
                if (this._movedDuringApply) this._movedDuringApply.add(a.shapeName);
            } else if (typeof this.onShapeChanged === 'function') {
                this.onShapeChanged({ action:'update', name:a.shapeName, shape });
            }
        }      
    });

    if (this.renderer) this.renderer.redraw();                 // Update visual display
}
```
**How it works:** Solution application translates mathematical solutions back to shape positions:
1. **Extract solutions** - Get solved coordinates for each anchor
2. **Calculate movement** - Determine how far each shape must move
3. **Transform math** - Convert anchor movement to shape center movement  
4. **Apply changes** - Update shape positions in the renderer
5. **Notify systems** - Inform other components about shape changes

**Why epsilon tolerance?** Floating-point math isn't exact. Without tolerance, shapes would constantly make tiny movements due to rounding errors, causing infinite update loops and poor performance.

---

## Constraint Classes (`constraints.mjs`)

### Mathematical Constraint Definitions

#### **Coincident Constraint**
```javascript
class Coincident {
    constructor(pA, pB) {
        this.points = [pA, pB];                                // The two points to coincide
        this.name = "coincident";
        this.targets = [pA, pB];                               // Points that can be moved
    }
    
    getEqs(xA, yA, xB, yB) {
        return [
            `${xA} - ${xB}`,                                   // X coordinates must be equal
            `${yA} - ${yB}`                                    // Y coordinates must be equal  
        ];
    }
}
```
**How it works:** Coincident constraints force two points to occupy the same location. Mathematically, this means their X and Y coordinates must be identical, giving us two equations.

**Why two equations?** In 2D space, a point has two degrees of freedom (X and Y). To fully constrain two points to coincide, we need to eliminate both degrees of freedom, requiring two equations.

#### **Distance Constraint**  
```javascript
class Distance {
    constructor(pA, pB, d) {
        this.points = [pA, pB];
        this.dist = d;                                         // Required distance
        this.name = "distance";
        this.targets = [pA, pB];
    }
    
    getEqs(xA, yA, xB, yB) {
        const d2 = `${this.dist}*${this.dist}`;               // Square of distance (avoids sqrt)
        return [
            `((${xB}-${xA})**2 + (${yB}-${yA})**2) - (${d2})` // Pythagorean theorem
        ];
    }
}
```
**How it works:** Distance constraints maintain a fixed distance between two points using the Pythagorean theorem: `distance² = (x₂-x₁)² + (y₂-y₁)²`

**Why square the distance?** Working with distance² avoids square roots in the equations. Square roots create numerical instability and make the solver more complex. Since we only care about maintaining the distance relationship, squaring both sides works perfectly.

#### **Horizontal Alignment**
```javascript
class Horizontal {
    constructor(pA, pB) {
        this.points = [pA, pB];
        this.name = "horizontal";
        this.targets = [pA, pB];
    }
    
    getEqs(xA, yA, xB, yB) {
        return [ `${yB} - ${yA}` ];                           // Y coordinates must be equal
    }
}
```
**How it works:** Horizontal alignment forces two points to have the same Y coordinate, creating a horizontal line between them.

**Why only Y constraint?** Horizontal alignment allows points to move freely in X (they can be any distance apart horizontally) but locks their Y coordinates. This creates a horizontal relationship while preserving flexibility.

#### **Vertical Alignment**
```javascript
class Vertical {
    constructor(pA, pB) {
        this.points = [pA, pB];
        this.name = "vertical";
        this.targets = [pA, pB];
    }
    
    getEqs(xA, yA, xB, yB) {
        return [ `${xB} - ${xA}` ];                           // X coordinates must be equal
    }
}
```
**How it works:** Vertical alignment forces two points to have the same X coordinate, creating a vertical line between them.

### Adding New Constraint Types

#### **Creating Custom Constraints**
```javascript
class Perpendicular {
    constructor(pA, pB, pC, pD) {
        this.points = [pA, pB, pC, pD];                       // Two line segments
        this.name = "perpendicular";
        this.targets = [pA, pB, pC, pD];
    }
    
    getEqs(xA, yA, xB, yB, xC, yC, xD, yD) {
        // Two lines are perpendicular if their dot product is zero
        // Vector AB = (xB-xA, yB-yA)
        // Vector CD = (xD-xC, yD-yC)  
        // Dot product = (xB-xA)(xD-xC) + (yB-yA)(yD-yC) = 0
        return [
            `((${xB}-${xA})*(${xD}-${xC})) + ((${yB}-${yA})*(${yD}-${yC}))`
        ];
    }
}
```
**How it works:** Custom constraints follow the same pattern:
1. **Constructor** - Define the points involved and constraint parameters
2. **getEqs()** - Return mathematical equations that must equal zero
3. **Equation derivation** - Use geometric relationships to create constraints

**Mathematical principle:** All geometric constraints can be expressed as equations that equal zero when satisfied. The solver finds variable values that make all equations equal zero simultaneously.

---

## User Interface System (`ui.mjs`)

### Constraint Creation Interface

#### **Dynamic UI Generation**
```javascript
export function setupConstraintsMenu({ renderer, constraintEngine, displayErrors }) {
    // Create or find the constraints button
    let btn = document.getElementById('constraints-button');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'constraints-button';
        btn.className = 'button';
        btn.textContent = 'Constraints';
        const exportContainer = document.querySelector('.export-container');
        const anchor = exportContainer || document.getElementById('view-errors');
        anchor.parentNode.insertBefore(btn, anchor);
    }

    // UI helper functions
    const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); };
    const label = (t, mt='10px') => { 
        const d=document.createElement('div'); 
        d.textContent=t; 
        d.style.fontWeight='bold'; 
        d.style.marginTop=mt; 
        return d; 
    };
    const sel = () => { 
        const s=document.createElement('select'); 
        s.style.width='100%'; 
        s.style.margin='6px 0 8px'; 
        return s; 
    };
```
**How it works:** The UI system generates constraint creation interfaces dynamically:
1. **Button injection** - Add constraints button to the main toolbar
2. **Helper functions** - Create common UI elements (dropdowns, buttons, labels)
3. **Dynamic population** - Fill dropdowns with available shapes and anchors
4. **Event binding** - Connect UI actions to constraint engine operations

**Why dynamic generation?** The UI must adapt to the current set of shapes. As users add/remove shapes, the constraint interface updates automatically to show current options.

#### **Shape and Anchor Population**
```javascript
function fillShapes(sel) {
    clear(sel);
    if (!renderer?.shapes) return;
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = '-- Select Shape --';
    sel.appendChild(opt0);
    
    for (const [name] of renderer.shapes.entries()) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
    }
}

function fillAnchors(sel, shapeName) {
    clear(sel);
    if (!shapeName) return;
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = '-- Select Anchor --';
    sel.appendChild(opt0);
    
    const anchors = constraintEngine.getAnchorsForShape(shapeName);
    for (const {key, label} of anchors) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = label;
        sel.appendChild(opt);
    }
}
```
**How it works:** Dropdown population queries the current system state:
1. **Shape enumeration** - List all available shapes in the renderer
2. **Anchor lookup** - Get valid anchor points for the selected shape
3. **Dynamic updates** - Refresh anchor options when shape selection changes
4. **User-friendly labels** - Show descriptive names instead of internal IDs

### Constraint Type Interfaces

#### **Coincident Constraint UI**
```javascript
// Create coincident constraint interface
const B_t = label('Coincident');
const B_sa = sel(), B_sb = sel();                             // Shape selectors
const B_aa = sel(), B_ab = sel();                             // Anchor selectors

B_sa.addEventListener('change', () => fillAnchors(B_aa, B_sa.value));
B_sb.addEventListener('change', () => fillAnchors(B_ab, B_sb.value));

const B_btn = btnFull('Make Coincident');
B_btn.addEventListener('click', () => {
    try {
        if (!B_sa.value || !B_sb.value || !B_aa.value || !B_ab.value) {
            alert('Please select both shapes and anchors.');
            return;
        }
        
        // Add constraint to engine
        constraintEngine.addCoincidentAnchors(
            { shape: B_sa.value, anchor: B_aa.value },
            { shape: B_sb.value, anchor: B_ab.value }
        );
        
        // Store for code generation
        window.__pendingConstraints = window.__pendingConstraints || [];
        window.__pendingConstraints.push({
            type: 'coincident',
            a: { shape: B_sa.value, anchor: B_aa.value },
            b: { shape: B_sb.value, anchor: B_ab.value }
        });
        
        // Update text editor with constraint code
        if (typeof window.updateCodeFromConstraints === 'function') {
            window.updateCodeFromConstraints();
        }
        
        // Refresh constraint list UI
        if (typeof window.updateConstraintsMenu === 'function') {
            window.updateConstraintsMenu(constraintEngine.getConstraintList());
        }
    } catch (e) { 
        displayErrors ? displayErrors([e]) : alert(e.message); 
    }
});
```
**How it works:** Each constraint type has a specialized interface:
1. **Input validation** - Ensure all required fields are selected
2. **Engine integration** - Apply constraint immediately for visual feedback
3. **Code generation** - Store constraint for text editor synchronization
4. **UI updates** - Refresh constraint lists and related interfaces

**Why pending constraints?** The UI can create constraints faster than the text editor can update. The pending system batches constraint changes and applies them efficiently to the code.

#### **Distance Constraint UI**  
```javascript
const C_d = inputNum(); 
C_d.placeholder = 'Distance (e.g., 100)';

const C_btn = btnFull('Apply Distance');
C_btn.addEventListener('click', () => {
    try {
        if (!C_sa.value || !C_sb.value || !C_aa.value || !C_ab.value) return;
        
        const d = Number(C_d.value);
        if (!Number.isFinite(d) || d < 0) { 
            alert('Enter a non-negative distance.'); 
            return; 
        }
        
        constraintEngine.addDistance(
            { shape: C_sa.value, anchor: C_aa.value },
            { shape: C_sb.value, anchor: C_ab.value },
            d
        );
        
        // ... same integration code as coincident
    } catch (e) { err(e); }
});
```
**How it works:** Distance constraints require additional numeric input:
1. **Number validation** - Ensure distance is a valid, non-negative number
2. **User feedback** - Clear error messages for invalid input
3. **Parameter passing** - Include distance value in constraint creation

---

## Visual Overlay System (`constraintsOverlay.mjs`)

### Constraint Visualization

#### **Overlay Architecture**
```javascript
export class ConstraintOverlay {
    constructor(renderer, engine) {
        this.renderer = renderer;                              // Access to rendering system
        this.engine = engine;                                  // Access to constraint engine
        this._markers = new Map();                             // Visual markers for constraints
        this._hoverId = null;                                  // Currently hovered constraint
        this._selectedId = null;                               // Currently selected constraint

        // Bind event handlers  
        this._draw = this._draw.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);

        // Integrate with renderer
        this.renderer.addOverlayDrawer(this._draw);

        // Setup interaction
        const canvas = this.renderer.canvas || document.getElementById('canvas');
        this.canvas = canvas;
        canvas.addEventListener('mousemove', this._onMouseMove);
        canvas.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('keydown', this._onKeyDown);

        this.refresh();
    }
}
```
**How it works:** The overlay system provides visual feedback for constraints:
1. **Integration** - Hooks into the renderer's overlay system
2. **Event handling** - Responds to mouse interactions for selection/deletion
3. **Visual markers** - Shows constraint locations and types
4. **Interaction feedback** - Highlights on hover, selection, etc.

#### **Constraint Marker Rendering**
```javascript
_draw(ctx, cs) {
    this._recompute();                                         // Update marker positions

    if (!this._markers.size) return;

    ctx.save();
    ctx.font = '12px ui-monospace, Menlo, Consolas, monospace';
    ctx.textBaseline = 'middle';

    for (const m of this._markers.values()) {
        // Convert constraint midpoint to screen coordinates
        const P = toScreen(this.renderer.coordinateSystem, m.mid.x, m.mid.y);
        if (!Number.isFinite(P.x) || !Number.isFinite(P.y)) continue;
        m.scr = P;

        // Create constraint label
        const label = glyphLabel(m.type, m.info);
        const metrics = ctx.measureText(label);
        const w = Math.max(18, metrics.width + PAD*2);
        const h = 18;
        const x = P.x - w/2;
        const y = P.y - h/2;
        m.bbox = { x, y, w, h };                               // Store for hit testing

        // Draw background
        ctx.fillStyle = GLYPH_BG;
        roundRect(ctx, x, y, w, h, 6);
        ctx.fill();

        // Draw border (highlight if selected/hovered)
        ctx.lineWidth = (this._selectedId === m.id) ? 2.5 : 1;
        ctx.strokeStyle = (this._selectedId === m.id) ? GLYPH_SELECTED : 
                         (this._hoverId === m.id ? GLYPH_HOVER : GLYPH_BORDER);
        ctx.stroke();

        // Draw constraint type label
        ctx.fillStyle = GLYPH_TEXT;
        ctx.fillText(label, P.x, P.y);
    }

    ctx.restore();
}
```
**How it works:** Visual markers provide on-canvas constraint feedback:
1. **Position calculation** - Find midpoint between constrained anchors
2. **Screen conversion** - Transform world coordinates to pixel coordinates
3. **Label generation** - Create human-readable constraint descriptions
4. **Visual rendering** - Draw styled markers with interaction feedback
5. **Hit testing** - Store bounding boxes for mouse interaction

**Why midpoint markers?** Constraints relate two points, so the visual marker appears halfway between them. This provides clear visual indication of the relationship without cluttering individual anchor points.

#### **Constraint Interaction**
```javascript
_onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found = null;
    for (const m of this._markers.values()) {
        if (m.bbox && mx >= m.bbox.x && mx <= m.bbox.x + m.bbox.w &&
            my >= m.bbox.y && my <= m.bbox.y + m.bbox.h) {
            found = m.id;
            break;
        }
    }

    if (found !== this._hoverId) {
        this._hoverId = found;
        this.canvas.style.cursor = found ? 'pointer' : 'default';  // Visual feedback
        this.renderer.redraw();                                    // Update highlighting
    }
}

_onMouseDown(e) {
    if (this._hoverId) {
        e.stopPropagation();                                       // Prevent other handlers
        this._selectedId = this._selectedId === this._hoverId ? null : this._hoverId;
        this.renderer.redraw();
    }
}

_onKeyDown(e) {
    if (e.key === 'Delete' && this._selectedId) {
        this.engine.removeConstraint(this._selectedId);            // Delete selected constraint
        this._selectedId = null;
        this.refresh();                                            // Update display
    }
}
```
**How it works:** Interactive constraint management:
1. **Hit testing** - Detect mouse over constraint markers
2. **Visual feedback** - Change cursor and highlighting on hover
3. **Selection** - Click to select/deselect constraints  
4. **Deletion** - Delete key removes selected constraints
5. **Event handling** - Prevent conflicts with other canvas interactions

### Constraint Label Generation

#### **Smart Label Creation**
```javascript
function glyphLabel(type, info) {
    switch (type) {
        case 'coincident':
            return '⚬';                                            // Coincident symbol
        case 'distance':
            const d = info.dist;
            if (typeof d === 'number' && Number.isFinite(d)) {
                return d < 1000 ? `${Math.round(d)}` : `${(d/1000).toFixed(1)}k`;
            }
            return 'D';                                            // Distance fallback
        case 'horizontal':
            return '⟷';                                            // Horizontal arrow
        case 'vertical':
            return '↕';                                            // Vertical arrow
        default:
            return type.charAt(0).toUpperCase();                   // First letter fallback
    }
}
```
**How it works:** Labels provide quick constraint identification:
1. **Symbolic representation** - Use Unicode symbols for visual clarity
2. **Contextual information** - Show distance values for distance constraints  
3. **Fallback handling** - Provide readable alternatives for unknown types
4. **Compact display** - Keep labels short to avoid visual clutter

---

## Mathematical Solver Integration

### Equation System Solving

#### **Symbolic Math Processing**
```javascript
const [, solved] = solveSystem(eqs, vars, { forwardSubs });
```
**How it works:** The constraint system interfaces with a symbolic mathematics solver:
1. **Equation generation** - Constraints produce symbolic equations
2. **Variable substitution** - Fixed shapes become constant values
3. **System solving** - Mathematical solver finds variable values
4. **Solution extraction** - Extract new positions for moveable shapes

**Why symbolic solving?** Geometric constraints often involve non-linear equations (distances, angles). Symbolic solvers can handle these more robustly than purely numerical methods, finding exact solutions when they exist.

#### **Solver Integration Points**
```javascript
// Variable name generation
const ax = `x${idA}`, ay = `y${idA}`;

// Current values for variables  
const vars = this._varsFor([idA, idB]);

// Fixed point substitution
let forwardSubs = {};
if (fixedShapeName === a.shape) {
    forwardSubs = { 
        [ax]: `(${cstr(vars[ax])})`,                           // Lock X coordinate
        [ay]: `(${cstr(vars[ay])})`                            // Lock Y coordinate
    };
}
```
**How it works:** Solver integration requires careful variable management:
1. **Naming convention** - Generate unique, predictable variable names
2. **Current state** - Provide current positions as starting values
3. **Fixed constraints** - Substitute constants for user-manipulated shapes  
4. **Equation formatting** - Format equations in solver's expected syntax

---

## Integration with AQUI Language

### Constraint Block Parsing

#### **Language Syntax**
```aqui
constraints {
    coincident circle1.center rect1.center
    distance circle1.center circle2.center 100
    horizontal rect1.top rect2.top
    vertical line1.start line2.start
}
```
**How it works:** Constraints integrate with AQUI's language system:
1. **Block syntax** - `constraints { ... }` defines constraint sections
2. **Anchor references** - `shape.anchor` syntax references specific points
3. **Parameter integration** - Distances can use parameters: `distance a b param.spacing`
4. **Type system** - Different constraint types with appropriate syntax

#### **Interpreter Integration**
```javascript
evaluateConstraintsBlock(node) {
    // Normalize and store; numbers are evaluated so params/expressions work
    for (const item of node.items) {
        if (item.kind === 'distance') {
            const dist = this.evaluateExpression(item.dist);      // Handle parameters
            this.constraints.push({
                type: 'distance',
                a: item.a,                                        // {shape: 'circle1', anchor: 'center'}
                b: item.b,                                        // {shape: 'circle2', anchor: 'center'}  
                dist
            });
        } else if (item.kind === 'coincident') {
            this.constraints.push({ type:'coincident', a:item.a, b:item.b });
        }
        // ... other constraint types
    }
    return null;
}
```
**How it works:** The interpreter processes constraint blocks:
1. **AST processing** - Parse constraint syntax into structured data
2. **Expression evaluation** - Handle parameters and calculations in distances
3. **Storage** - Add constraints to interpreter's constraint collection
4. **Engine application** - Pass constraints to the constraint engine

### Bidirectional Synchronization

#### **Code Generation from Constraints**
```javascript
function updateCodeFromConstraints() {
    const snapshot = renderer.constraintEngine.getConstraintSnapshot();
    
    // Generate constraint block text
    const ref = (p) => `${p.shape}.${p.anchor}`;
    const lines = ['constraints {'];
    
    for (const c of snapshot) {
        if (c.type === 'distance') {
            const d = Number.isFinite(+c.dist) ? +c.dist : c.dist;
            lines.push(`  distance ${ref(c.a)} ${ref(c.b)} ${d}`);
        } else if (c.type === 'coincident') {
            lines.push(`  coincident ${ref(c.a)} ${ref(c.b)}`);
        } else if (c.type === 'horizontal') {
            lines.push(`  horizontal ${ref(c.a)} ${ref(c.b)}`);
        } else if (c.type === 'vertical') {
            lines.push(`  vertical ${ref(c.a)} ${ref(c.b)}`);
        }
    }
    lines.push('}');
    
    const blockText = lines.join('\n');
    
    // Insert/replace constraint block in code
    const newCode = insertConstraintBlock(editor.getValue(), blockText);
    editor.setValue(newCode);
}
```
**How it works:** Interactive constraints sync back to code:
1. **Snapshot extraction** - Get current constraints from engine
2. **Code generation** - Convert constraint objects to AQUI syntax
3. **Block formatting** - Create properly formatted constraint block
4. **Code integration** - Insert or replace constraint block in source code

This ensures that constraints created through the UI appear in the text editor, maintaining the bidirectional relationship between visual and textual programming.

---

## Performance Considerations

### Solver Optimization

#### **Constraint Batching**
```javascript
applyAllConstraints(fixedShapeName = null) {
    if (this._applying || !this.liveEnforce || this.constraints.length === 0) return;
    this._applying = true;                                     // Prevent recursion
    try {
        for (const c of this.constraints) {
            if (c.type === 'distance') {
                this._solveConstraint('distance', c.a, c.b, { dist: c.dist }, fixedShapeName);
            } else {
                this._solveConstraint(c.type, c.a, c.b, {}, fixedShapeName);
            }
        }
    } finally {
        this._applying = false;
    }
}
```
**How it works:** Constraint solving optimizations:
1. **Recursion prevention** - `_applying` flag prevents infinite loops
2. **Batch processing** - Apply all constraints in a single operation
3. **Fixed point consistency** - Use the same fixed shape for all constraints
4. **Early termination** - Skip solving if no constraints exist

#### **Change Detection**
```javascript
_takeSnapshot() {
    this._snapshot = new Map();
    if (!this.renderer?.shapes) return;
    for (const [name, shape] of this.renderer.shapes.entries()) {
        const t = shape.transform || {};
        const pos = Array.isArray(t.position) ? t.position : [0,0];
        this._snapshot.set(name, { x: pos[0], y: pos[1] });
    }
}

_detectChangedShape() {
    if (!this._snapshot) return null;
    for (const [name, shape] of this.renderer.shapes.entries()) {
        const t = shape.transform || {};
        const pos = Array.isArray(t.position) ? t.position : [0,0];
        const old = this._snapshot.get(name);
        if (!old) continue;
        
        const dx = Math.abs(pos[0] - old.x);
        const dy = Math.abs(pos[1] - old.y);
        if (dx > 1e-6 || dy > 1e-6) {
            return name;                                       // This shape moved
        }
    }
    return null;
}
```
**How it works:** Change detection optimizes constraint solving:
1. **State snapshots** - Remember shape positions before user interactions
2. **Change comparison** - Identify which shape the user directly modified
3. **Fixed point optimization** - Keep user-modified shapes stationary during solving
4. **Tolerance handling** - Use epsilon comparison for floating-point positions

This system provides a complete constraint-based parametric design environment, enabling users to specify design intent through geometric relationships that are maintained automatically as the design evolves.
