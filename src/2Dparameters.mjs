// 2DParameters.mjs - Manage shape parameters in a dropdown menu

export class ParameterManager {
    constructor(canvas, interpreter, editor, runCode) {
      this.canvas = canvas;
      this.interpreter = interpreter;
      this.editor = editor;
      this.runCode = runCode;
      this.menuVisible = false;
      this.currentShape = null;
      this.params = [];
      this.ast = null;
      this.setupUI();
    }
    
    setAST(ast) {
      this.ast = ast;
      
      // If the menu is visible and we're getting a new AST, refresh shapes list
      if (this.menuVisible && this.ast) {
        this.refreshShapeList();
        
        // If we have a currently selected shape, refresh its parameters
        if (this.currentShape) {
          // Find the shape in the AST
          const shapeNode = this.findShapeInAST(this.currentShape);
          if (shapeNode) {
            this.populateParametersFromAST(shapeNode);
          } else {
            // Fall back to interpreter if shape not found in AST
            this.populateParameters(this.currentShape);
          }
        }
      }
    }
    
    findShapeInAST(shapeName) {
      if (!this.ast || !Array.isArray(this.ast)) {
        return null;
      }
      
      // Find shape by name in the AST
      return this.ast.find(node => node.type === 'shape' && node.name === shapeName);
    }
  
    setupUI() {
      // Create container for the parameter menu
      this.container = document.createElement('div');
      this.container.className = 'parameters-container';
      this.canvas.parentElement.appendChild(this.container);
      
      // We'll use the external button now, so no need to create a toggle button
      // Just create the menu content directly
      
      // Create menu content
      this.menuContent = document.createElement('div');
      this.menuContent.className = 'parameters-content';
      this.container.appendChild(this.menuContent);
      
      // Create shape selector
      this.shapeSelector = document.createElement('select');
      this.shapeSelector.className = 'shape-selector';
      this.shapeSelector.addEventListener('change', () => this.onShapeSelected());
      this.menuContent.appendChild(this.shapeSelector);
      
      // Parameters list
      this.paramsList = document.createElement('div');
      this.paramsList.className = 'parameters-list';
      this.menuContent.appendChild(this.paramsList);
      
      // Apply styles
      this.applyStyles();
    }
    
    applyStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .parameters-container {
          position: absolute;
          top: 60px;
          right: 20px;
          width: 250px;
          z-index: 1000;
          background-color: #f8f8e8;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          padding: 12px;
          display: none;
          max-height: 70vh;
          overflow-y: auto;
        }
        
        .parameters-content {
          width: 100%;
        }
        
        .shape-selector {
          width: 100%;
          margin-bottom: 12px;
          padding: 6px;
          font-family: monospace;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 3px;
        }
        
        .parameters-list {
          font-family: monospace;
          font-size: 14px;
        }
        
        .parameter-item {
          margin-bottom: 15px;
        }
        
        .parameter-label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .parameter-slider-container {
          display: flex;
          align-items: center;
        }
        
        .parameter-slider {
          flex-grow: 1;
          margin-right: 8px;
        }
        
        .parameter-value {
          width: 50px;
          padding: 3px;
          border: 1px solid #ccc;
          border-radius: 3px;
          text-align: center;
        }
        
        .no-shapes-message {
          font-style: italic;
          color: #666;
        }
      `;
      document.head.appendChild(style);
    }
    
    toggleMenu() {
      this.menuVisible = !this.menuVisible;
      
      // Toggle the visibility of the entire container
      this.container.style.display = this.menuVisible ? 'block' : 'none';
      
      // If opening the menu, refresh content with latest AST
      if (this.menuVisible) {
        this.refreshShapeList();
      }
    }
    
    refreshShapeList() {
      // Clear previous options
      this.shapeSelector.innerHTML = '';
      
      if (!this.interpreter || !this.interpreter.env || !this.interpreter.env.shapes) {
        // Try getting shapes from AST if interpreter isn't available
        if (this.ast) {
          const shapeNodes = this.getShapesFromAST();
          if (shapeNodes && shapeNodes.length > 0) {
            this.populateShapesFromAST(shapeNodes);
            return;
          }
        }
        this.showNoShapesMessage();
        return;
      }
      
      const shapes = Array.from(this.interpreter.env.shapes.entries());
      
      if (shapes.length === 0) {
        // Try getting shapes from AST if interpreter has no shapes
        if (this.ast) {
          const shapeNodes = this.getShapesFromAST();
          if (shapeNodes && shapeNodes.length > 0) {
            this.populateShapesFromAST(shapeNodes);
            return;
          }
        }
        this.showNoShapesMessage();
        return;
      }
      
      // Create default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Select a shape --';
      this.shapeSelector.appendChild(defaultOption);
      
      // Add shape options
      shapes.forEach(([name, shape]) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = `${name} (${shape.type})`;
        this.shapeSelector.appendChild(option);
      });
      
      // Select first option by default or the previously selected if still available
      if (this.currentShape && this.interpreter.env.shapes.has(this.currentShape)) {
        this.shapeSelector.value = this.currentShape;
        this.populateParameters(this.currentShape);
      } else {
        this.shapeSelector.selectedIndex = 0;
        this.paramsList.innerHTML = '';
      }
    }
    
    showNoShapesMessage() {
      this.shapeSelector.innerHTML = '';
      this.paramsList.innerHTML = '<p class="no-shapes-message">No shapes found. Create shapes in the editor first.</p>';
    }
    
    getShapesFromAST() {
      if (!this.ast || !Array.isArray(this.ast)) {
        return [];
      }
      
      // Find all shape nodes in the AST
      return this.ast.filter(node => node.type === 'shape');
    }
    
    populateShapesFromAST(shapeNodes) {
      if (!shapeNodes || shapeNodes.length === 0) {
        this.showNoShapesMessage();
        return;
      }
      
      // Create default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Select a shape --';
      this.shapeSelector.appendChild(defaultOption);
      
      // Add shape options from AST
      shapeNodes.forEach(node => {
        const option = document.createElement('option');
        option.value = node.name;
        option.textContent = `${node.name} (${node.shapeType})`;
        option.dataset.astNode = JSON.stringify(node);
        this.shapeSelector.appendChild(option);
      });
      
      // Select first option by default
      this.shapeSelector.selectedIndex = 0;
      this.paramsList.innerHTML = '';
    }
    
    onShapeSelected() {
      const selectedShape = this.shapeSelector.value;
      
      if (!selectedShape) {
        this.paramsList.innerHTML = '';
        this.currentShape = null;
        return;
      }
      
      this.currentShape = selectedShape;
      
      // Check if we have AST data attached to the option
      const selectedOption = this.shapeSelector.options[this.shapeSelector.selectedIndex];
      if (selectedOption.dataset.astNode) {
        try {
          const nodeData = JSON.parse(selectedOption.dataset.astNode);
          this.populateParametersFromAST(nodeData);
          return;
        } catch (e) {
          console.error("Error parsing AST node data:", e);
        }
      }
      
      // Fall back to the interpreter if we couldn't get AST data
      this.populateParameters(selectedShape);
    }
    
    populateParametersFromAST(shapeNode) {
      this.paramsList.innerHTML = '';
      this.params = [];
      
      if (!shapeNode || !shapeNode.params) {
        return;
      }
      
      // Get all parameters from the AST node
      for (const [key, value] of Object.entries(shapeNode.params)) {
        // Skip complex expressions for now, just use simple values
        if (value.type === 'number' || value.type === 'string' || value.type === 'boolean') {
          this.createParameterControl(shapeNode.name, key, value.value);
        } else if (value.type === 'array' && Array.isArray(value.elements) && key === 'position') {
          // Only handle position array
          const arrayValues = value.elements.map(el => 
            el.type === 'number' ? el.value : 0
          );
          if (arrayValues.length >= 2) {
            this.createParameterControl(shapeNode.name, 'position_x', arrayValues[0], -500, 500);
            this.createParameterControl(shapeNode.name, 'position_y', arrayValues[1], -500, 500);
          }
        }
      }
      
      // Removed scale and rotation parameters
    }
    
    populateParameters(shapeName) {
      this.paramsList.innerHTML = '';
      this.params = [];
      
      if (!this.interpreter.env.shapes.has(shapeName)) {
        return;
      }
      
      const shape = this.interpreter.env.shapes.get(shapeName);
      
      if (!shape || !shape.params) {
        return;
      }
      
      // Get all parameters for the shape
      for (const [key, value] of Object.entries(shape.params)) {
        // Skip complex parameters and arrays
        if (typeof value === 'object' && !Array.isArray(value)) continue;
        
        this.createParameterControl(shapeName, key, value);
      }
      
      // Also add position (flatten position array for UI)
      if (shape.transform && shape.transform.position) {
        this.createParameterControl(shapeName, 'position_x', shape.transform.position[0], -500, 500);
        this.createParameterControl(shapeName, 'position_y', shape.transform.position[1], -500, 500);
      }
      
      // Removed scale and rotation parameters
    }
    
    createParameterControl(shapeName, paramName, value, min, max, step) {
      const container = document.createElement('div');
      container.className = 'parameter-item';
      
      // Add label
      const label = document.createElement('label');
      label.className = 'parameter-label';
      label.textContent = paramName;
      container.appendChild(label);
      
      // Slider container
      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'parameter-slider-container';
      
      // For numerical values, create a slider and text input
      if (typeof value === 'number') {
        // Set reasonable defaults if not provided
        if (min === undefined) min = 0;
        if (max === undefined) max = Math.max(value * 2, 100);
        if (step === undefined) step = (max - min) / 100;
        
        // Create slider
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'parameter-slider';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        
        // Create text input
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'parameter-value';
        input.value = value;
        input.min = min;
        input.max = max;
        input.step = step;
        
        // Link slider and input
        slider.addEventListener('input', () => {
          input.value = slider.value;
          this.updateShapeParameter(shapeName, paramName, parseFloat(slider.value));
        });
        
        input.addEventListener('change', () => {
          slider.value = input.value;
          this.updateShapeParameter(shapeName, paramName, parseFloat(input.value));
        });
        
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(input);
      } 
      // For arrays, display the array as text
      else if (Array.isArray(value)) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'parameter-value';
        input.value = JSON.stringify(value);
        input.disabled = true; // Just display, don't edit array values directly
        input.style.width = '100%';
        
        sliderContainer.appendChild(input);
      }
      // For boolean values, create a checkbox
      else if (typeof value === 'boolean') {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = value;
        checkbox.addEventListener('change', () => {
          this.updateShapeParameter(shapeName, paramName, checkbox.checked);
        });
        
        sliderContainer.appendChild(checkbox);
      }
      // For string values, create a text input
      else if (typeof value === 'string') {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'parameter-value';
        input.value = value;
        input.style.width = '100%';
        
        input.addEventListener('change', () => {
          this.updateShapeParameter(shapeName, paramName, input.value);
        });
        
        sliderContainer.appendChild(input);
      }
      
      container.appendChild(sliderContainer);
      this.paramsList.appendChild(container);
      
      // Store parameter info for updating
      this.params.push({
        shapeName,
        paramName,
        type: typeof value,
        isArray: Array.isArray(value),
        isTransform: paramName.startsWith('position_') || paramName.startsWith('scale_') || paramName === 'rotation'
      });
    }
    
    updateShapeParameter(shapeName, paramName, value) {
      if (!this.interpreter.env.shapes.has(shapeName)) {
        return;
      }
      
      const shape = this.interpreter.env.shapes.get(shapeName);
      
      // Handle parameter updates
      if (paramName.startsWith('position_')) {
        const index = paramName === 'position_x' ? 0 : 1;
        shape.transform.position[index] = value;
      } else {
        // Regular param
        shape.params[paramName] = value;
      }
      
      // Update the code in the editor
      this.updateCodeInEditor(shapeName, paramName, value);
      
      // Re-run the code to see the changes
      this.runCode();
    }
    
    updateCodeInEditor(shapeName, paramName, value) {
      const code = this.editor.getValue();
      const lines = code.split('\n');
      
      // Find the shape in the code
      let inShapeBlock = false;
      let openBraces = 0;
      let shapeStartLine = -1;
      let shapeEndLine = -1;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if this is our shape definition
        if (line.startsWith('shape ') && line.includes(shapeName)) {
          inShapeBlock = true;
          shapeStartLine = i;
          openBraces = 0;
        }
        
        // Count braces to track block boundaries
        if (inShapeBlock) {
          for (let j = 0; j < line.length; j++) {
            if (line[j] === '{') openBraces++;
            if (line[j] === '}') {
              openBraces--;
              if (openBraces === 0) {
                shapeEndLine = i;
                inShapeBlock = false;
                break;
              }
            }
          }
        }
      }
      
      // If we found the shape block, update the parameter
      if (shapeStartLine >= 0 && shapeEndLine >= 0) {
        // Handle parameters
        if (paramName.startsWith('position_')) {
          // For position, we handle the array format
          this.updatePositionParameter(lines, shapeStartLine, shapeEndLine, paramName, value);
        } else {
          // Regular parameter
          this.updateRegularParameter(lines, shapeStartLine, shapeEndLine, paramName, value);
        }
        
        // Update the editor content
        this.editor.setValue(lines.join('\n'));
      }
    }
    
    updateRegularParameter(lines, startLine, endLine, paramName, value) {
      // Format the value based on its type
      let formattedValue;
      if (typeof value === 'string') {
        formattedValue = `"${value}"`;
      } else if (Array.isArray(value)) {
        formattedValue = `[${value.join(', ')}]`;
      } else {
        formattedValue = value;
      }
      
      // Look for the parameter in the shape block
      let paramFound = false;
      for (let i = startLine; i <= endLine; i++) {
        const line = lines[i].trim();
        if (line.startsWith(`${paramName}:`)) {
          // Update the existing parameter
          lines[i] = lines[i].replace(/:(.*?)($|,)/, `: ${formattedValue}$2`);
          paramFound = true;
          break;
        }
      }
      
      // If parameter wasn't found, add it
      if (!paramFound) {
        // Find where to insert the new parameter
        for (let i = startLine; i <= endLine; i++) {
          if (lines[i].includes('{')) {
            // Insert after opening brace
            const indent = lines[i + 1] ? lines[i + 1].match(/^\s*/)[0] : '    ';
            lines.splice(i + 1, 0, `${indent}${paramName}: ${formattedValue}`);
            break;
          }
        }
      }
    }
    
    updatePositionParameter(lines, startLine, endLine, paramName, value) {
      // Handle position parameter by updating the position array in the shape definition
      const index = paramName === 'position_x' ? 0 : 1;
      let positionFound = false;
      
      for (let i = startLine; i <= endLine; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('position:')) {
          // Update position array
          const posMatch = line.match(/position:\s*\[(.*?)\]/);
          if (posMatch) {
            const posArray = posMatch[1].split(',').map(p => p.trim());
            posArray[index] = value;
            lines[i] = lines[i].replace(/position:\s*\[(.*?)\]/, `position: [${posArray.join(', ')}]`);
            positionFound = true;
            break;
          }
        }
      }
      
      // If position wasn't found, add it
      if (!positionFound) {
        // Find where to insert the new property
        for (let i = startLine; i <= endLine; i++) {
          if (lines[i].includes('{')) {
            // Insert after opening brace
            const indent = lines[i + 1] ? lines[i + 1].match(/^\s*/)[0] : '    ';
            const pos = paramName === 'position_x' ? [value, 0] : [0, value];
            const newLine = `${indent}position: [${pos.join(', ')}]`;
            
            lines.splice(i + 1, 0, newLine);
            break;
          }
        }
      }
    }
  }
