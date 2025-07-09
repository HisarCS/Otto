
// dragDropSystem.mjs - Modular drag and drop shape palette system

export class DragDropSystem {
  constructor(renderer, editor, shapeManager) {
    this.renderer = renderer;
    this.editor = editor;
    this.shapeManager = shapeManager;
    this.canvas = renderer.canvas;
    
    this.isVisible = false;
    this.isDragging = false;
    this.draggedShape = null;
    this.dragOffset = { x: 0, y: 0 };
    this.shapeCounter = 1;
    
    this.initializePalette();
    this.setupEventListeners();
    this.addToggleButton();
  }

  initializePalette() {
    // Create the main palette container
    this.paletteContainer = document.createElement('div');
    this.paletteContainer.className = 'shape-palette-container';
    this.paletteContainer.innerHTML = `
      <div class="palette-header">
        <h3>Shape Palette</h3>
        <button class="close-palette">×</button>
      </div>
      <div class="palette-content">
        <div class="palette-grid">
          ${this.generateShapeItems()}
        </div>
      </div>
    `;
    
    document.body.appendChild(this.paletteContainer);
  }

  generateShapeItems() {
    const shapes = [
      { type: 'circle', name: 'Circle', icon: this.createCircleIcon() },
      { type: 'rectangle', name: 'Rectangle', icon: this.createRectangleIcon() },
      { type: 'triangle', name: 'Triangle', icon: this.createTriangleIcon() },
      { type: 'ellipse', name: 'Ellipse', icon: this.createEllipseIcon() },
      { type: 'polygon', name: 'Polygon', icon: this.createPolygonIcon() },
      { type: 'star', name: 'Star', icon: this.createStarIcon() },
      { type: 'arc', name: 'Arc', icon: this.createArcIcon() },
      { type: 'roundedRectangle', name: 'Rounded Rect', icon: this.createRoundedRectIcon() },
      { type: 'arrow', name: 'Arrow', icon: this.createArrowIcon() },
      { type: 'donut', name: 'Donut', icon: this.createDonutIcon() },
      { type: 'gear', name: 'Gear', icon: this.createGearIcon() },
      { type: 'cross', name: 'Cross', icon: this.createCrossIcon() }
    ];

    return shapes.map(shape => `
      <div class="palette-item" data-shape-type="${shape.type}">
        <div class="shape-icon">${shape.icon}</div>
        <div class="shape-name">${shape.name}</div>
      </div>
    `).join('');
  }

  addToggleButton() {
    // Find the visualization panel to add the button
    const visualPanel = document.querySelector('.visualization-panel');
    if (!visualPanel) return;

    // Create toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'palette-toggle-button';
    this.toggleButton.innerHTML = '⊞';
    this.toggleButton.title = 'Toggle Shape Palette';
    
    visualPanel.appendChild(this.toggleButton);
  }

  setupEventListeners() {
    // Toggle button click
    document.addEventListener('click', (e) => {
      if (e.target.matches('.palette-toggle-button')) {
        this.togglePalette();
      }
      if (e.target.matches('.close-palette')) {
        this.hidePalette();
      }
    });

    // Palette item interactions
    this.paletteContainer.addEventListener('mousedown', (e) => {
      const paletteItem = e.target.closest('.palette-item');
      if (paletteItem) {
        this.startDrag(e, paletteItem);
      }
    });

    // Global drag events
    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.handleDrag(e);
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (this.isDragging) {
        this.handleDrop(e);
      }
    });

    // Prevent default drag behavior
    this.paletteContainer.addEventListener('dragstart', (e) => e.preventDefault());
  }

  togglePalette() {
    if (this.isVisible) {
      this.hidePalette();
    } else {
      this.showPalette();
    }
  }

  showPalette() {
    this.paletteContainer.classList.add('visible');
    this.isVisible = true;
  }

  hidePalette() {
    this.paletteContainer.classList.remove('visible');
    this.isVisible = false;
  }

  startDrag(e, paletteItem) {
    e.preventDefault();
    
    const shapeType = paletteItem.dataset.shapeType;
    const rect = paletteItem.getBoundingClientRect();
    
    this.isDragging = true;
    this.draggedShape = shapeType;
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // Create drag preview
    this.createDragPreview(e, paletteItem);
    
    // Add visual feedback
    paletteItem.classList.add('dragging');
    document.body.style.cursor = 'grabbing';
  }

  createDragPreview(e, paletteItem) {
    this.dragPreview = paletteItem.cloneNode(true);
    this.dragPreview.className = 'drag-preview';
    this.dragPreview.style.left = (e.clientX - this.dragOffset.x) + 'px';
    this.dragPreview.style.top = (e.clientY - this.dragOffset.y) + 'px';
    
    document.body.appendChild(this.dragPreview);
  }

  handleDrag(e) {
    if (!this.dragPreview) return;
    
    this.dragPreview.style.left = (e.clientX - this.dragOffset.x) + 'px';
    this.dragPreview.style.top = (e.clientY - this.dragOffset.y) + 'px';
    
    // Check if over canvas
    const canvasRect = this.canvas.getBoundingClientRect();
    const isOverCanvas = (
      e.clientX >= canvasRect.left &&
      e.clientX <= canvasRect.right &&
      e.clientY >= canvasRect.top &&
      e.clientY <= canvasRect.bottom
    );
    
    this.dragPreview.classList.toggle('over-canvas', isOverCanvas);
  }

  handleDrop(e) {
    const canvasRect = this.canvas.getBoundingClientRect();
    const isOverCanvas = (
      e.clientX >= canvasRect.left &&
      e.clientX <= canvasRect.right &&
      e.clientY >= canvasRect.top &&
      e.clientY <= canvasRect.bottom
    );

    if (isOverCanvas && this.draggedShape) {
      // Convert screen coordinates to canvas coordinates
      const canvasX = e.clientX - canvasRect.left;
      const canvasY = e.clientY - canvasRect.top;
      
      // Convert to world coordinates using renderer's coordinate system
      const worldPos = this.renderer.coordinateSystem.screenToWorld(canvasX, canvasY);
      
      this.createShapeAtPosition(this.draggedShape, worldPos.x, worldPos.y);
    }

    this.cleanupDrag();
  }

  createShapeAtPosition(shapeType, x, y) {
    const shapeName = `${shapeType}${this.shapeCounter++}`;
    const shapeCode = this.generateShapeCode(shapeType, shapeName, x, y);
    
    // Insert the code into the editor
    this.insertCodeIntoEditor(shapeCode);
    
    // Run the code to create the shape
    if (window.runCode) {
      window.runCode();
    }
  }

  generateShapeCode(type, name, x, y) {
    const defaultParams = this.getDefaultParams(type);
    const position = `[${Math.round(x)}, ${Math.round(y)}]`;
    
    let params = [`position: ${position}`];
    
    // Add type-specific parameters
    Object.entries(defaultParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        params.push(`${key}: "${value}"`);
      } else {
        params.push(`${key}: ${value}`);
      }
    });
    
    return `\nshape ${type} ${name} {\n    ${params.join('\n    ')}\n    fill: false\n}\n`;
  }

  getDefaultParams(type) {
    const defaults = {
      circle: { radius: 50 },
      rectangle: { width: 80, height: 60 },
      triangle: { base: 80, height: 70 },
      ellipse: { radiusX: 60, radiusY: 40 },
      polygon: { radius: 50, sides: 6 },
      star: { outerRadius: 50, innerRadius: 25, points: 5 },
      arc: { radius: 50, startAngle: 0, endAngle: 180 },
      roundedRectangle: { width: 80, height: 60, radius: 10 },
      arrow: { length: 80, headWidth: 30, headLength: 25 },
      donut: { outerRadius: 50, innerRadius: 25 },
      gear: { diameter: 80, teeth: 12 },
      cross: { width: 80, thickness: 20 }
    };
    
    return defaults[type] || {};
  }

  insertCodeIntoEditor(code) {
    const currentCode = this.editor.getValue();
    const newCode = currentCode + code;
    this.editor.setValue(newCode);
  }

  cleanupDrag() {
    // Remove drag preview
    if (this.dragPreview) {
      this.dragPreview.remove();
      this.dragPreview = null;
    }
    
    // Remove dragging state
    document.querySelectorAll('.palette-item.dragging').forEach(item => {
      item.classList.remove('dragging');
    });
    
    // Reset state
    this.isDragging = false;
    this.draggedShape = null;
    document.body.style.cursor = '';
  }

  // SVG Icon generators for shapes
  createCircleIcon() {
    return `<svg viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }

  createRectangleIcon() {
    return `<svg viewBox="0 0 24 24" width="24" height="24">
      <rect x="4" y="6" width="16" height="12" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }

  createTriangleIcon() {
    return `<svg viewBox="0 0 24 24" width="24" height="24">
      <polygon points="12,4 20,18 4,18" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }

  createEllipseIcon() {
    return `<svg viewBox="0 0 24 24" width="24" height="24">
      <ellipse cx="12" cy="12" rx="8" ry="5" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }

  createPolygonIcon() {
    return `<svg viewBox="0 0 24 24" width="24" height="24">
      <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }

  createStarIcon() {
    return `<svg viewBox="0 0 24 24" width="24" height="24">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" 
               fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }

  createArcIcon() {
    return `<svg viewBox="0 0 24 24" width="24" height="24">
      <path d="M12 2A10 10 0 0 1 22 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  createRoundedRectIcon() {
    return `<svg viewBox="0 0 24 24" width="24" height="24">
      <rect x="4" y="6" width="16" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }

  createArrowIcon() {
    return `<svg viewBox="0 0 24 24" width="24" height="24">
      <path d="M7 12h10m-4-4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  createDonutIcon() {
    return `<svg viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }

  createGearIcon() {
    return `<svg viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M12 1v6m0 10v6m11-7h-6m-10 0H1m15.5-6.5l-4.24 4.24M7.76 7.76L3.52 3.52m12.96 12.96l4.24 4.24M7.76 16.24l-4.24 4.24" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  createCrossIcon() {
    return `<svg viewBox="0 0 24 24" width="24" height="24">
      <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }
}
