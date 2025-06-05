// 2DParameters.mjs - Real-time bidirectional slider-canvas sync

import { shapeManager } from './shapeManager.mjs';

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
      
      // Remove old throttling - now handled by ShapeManager
      this.setupUI();
      
      // Register with ShapeManager
      shapeManager.registerParameterManager(this);
      shapeManager.registerEditor(editor);
    }
    
    setAST(ast) {
      this.ast = ast;
      
      if (this.menuVisible && this.ast) {
        this.refreshShapeList();
        
        if (this.currentShape) {
          const shapeNode = this.findShapeInAST(this.currentShape);
          if (shapeNode) {
            this.populateParametersFromAST(shapeNode);
          } else {
            this.populateParameters(this.currentShape);
          }
        }
      }
    }
    
    findShapeInAST(shapeName) {
      if (!this.ast || !Array.isArray(this.ast)) {
        return null;
      }
      return this.ast.find(node => node.type === 'shape' && node.name === shapeName);
    }
  
    setupUI() {
      this.container = document.createElement('div');
      this.container.className = 'parameters-container';
      this.canvas.parentElement.appendChild(this.container);
      
      this.menuContent = document.createElement('div');
      this.menuContent.className = 'parameters-content';
      this.container.appendChild(this.menuContent);
      
      this.shapeSelector = document.createElement('select');
      this.shapeSelector.className = 'shape-selector';
      this.shapeSelector.addEventListener('change', () => this.onShapeSelected());
      this.menuContent.appendChild(this.shapeSelector);
      
      this.paramsList = document.createElement('div');
      this.paramsList.className = 'parameters-list';
      this.menuContent.appendChild(this.paramsList);
      
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
          cursor: pointer;
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
        
        /* Smooth slider styling */
        .parameter-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #1289d8;
          border-radius: 50%;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        
        .parameter-slider::-webkit-slider-thumb:hover {
          background: #0d6efd;
        }
        
        .parameter-slider::-webkit-slider-track {
          height: 4px;
          background: #ddd;
          border-radius: 2px;
        }
        
        .parameter-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #1289d8;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
        
        .parameter-slider::-moz-range-track {
          height: 4px;
          background: #ddd;
          border-radius: 2px;
          border: none;
        }
      `;
      document.head.appendChild(style);
    }
    
    toggleMenu() {
      this.menuVisible = !this.menuVisible;
      this.container.style.display = this.menuVisible ? 'block' : 'none';
      
      if (this.menuVisible) {
        this.refreshShapeList();
      }
    }
    
    refreshShapeList() {
      this.shapeSelector.innerHTML = '';
      
      if (!this.interpreter || !this.interpreter.env || !this.interpreter.env.shapes) {
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
      
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Select a shape --';
      this.shapeSelector.appendChild(defaultOption);
      
      shapes.forEach(([name, shape]) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = `${name} (${shape.type})`;
        this.shapeSelector.appendChild(option);
      });
      
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
      return this.ast.filter(node => node.type === 'shape');
    }
    
    populateShapesFromAST(shapeNodes) {
      if (!shapeNodes || shapeNodes.length === 0) {
        this.showNoShapesMessage();
        return;
      }
      
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Select a shape --';
      this.shapeSelector.appendChild(defaultOption);
      
      shapeNodes.forEach(node => {
        const option = document.createElement('option');
        option.value = node.name;
        option.textContent = `${node.name} (${node.shapeType})`;
        option.dataset.astNode = JSON.stringify(node);
        this.shapeSelector.appendChild(option);
      });
      
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
      
      this.populateParameters(selectedShape);
    }
    
    populateParametersFromAST(shapeNode) {
      this.paramsList.innerHTML = '';
      this.params = [];
      
      if (!shapeNode || !shapeNode.params) {
        return;
      }
      
      for (const [key, value] of Object.entries(shapeNode.params)) {
        if (value.type === 'number' || value.type === 'string' || value.type === 'boolean') {
          this.createParameterControl(shapeNode.name, key, value.value);
        } else if (value.type === 'array' && Array.isArray(value.elements) && key === 'position') {
          const arrayValues = value.elements.map(el => 
            el.type === 'number' ? el.value : 0
          );
          if (arrayValues.length >= 2) {
            this.createParameterControl(shapeNode.name, 'position_x', arrayValues[0], -500, 500);
            this.createParameterControl(shapeNode.name, 'position_y', arrayValues[1], -500, 500);
          }
        }
      }
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
      
      // Store the current shape reference
      this.currentShapeData = shape;
      
      for (const [key, value] of Object.entries(shape.params)) {
        if (typeof value === 'object' && !Array.isArray(value)) continue;
        this.createParameterControl(shapeName, key, value);
      }
      
      if (shape.transform && shape.transform.position) {
        this.createParameterControl(shapeName, 'position_x', shape.transform.position[0], -500, 500);
        this.createParameterControl(shapeName, 'position_y', shape.transform.position[1], -500, 500);
      }
      
      // Add rotation if it exists
      if (shape.transform && typeof shape.transform.rotation !== 'undefined') {
        this.createParameterControl(shapeName, 'rotation', shape.transform.rotation, 0, 360, 1);
      }
      
      // Add scale if it exists and is not default [1,1]
      if (shape.transform && shape.transform.scale && 
          (shape.transform.scale[0] !== 1 || shape.transform.scale[1] !== 1)) {
        this.createParameterControl(shapeName, 'scale_x', shape.transform.scale[0], 0.1, 5, 0.1);
        this.createParameterControl(shapeName, 'scale_y', shape.transform.scale[1], 0.1, 5, 0.1);
      }
    }
    
    createParameterControl(shapeName, paramName, value, min, max, step) {
      const container = document.createElement('div');
      container.className = 'parameter-item';
      
      const label = document.createElement('label');
      label.className = 'parameter-label';
      label.textContent = paramName;
      container.appendChild(label);
      
      const sliderContainer = document.createElement('div');
      sliderContainer.className = 'parameter-slider-container';
      
      if (typeof value === 'number') {
        // Use completely static ranges
        const paramLower = paramName.toLowerCase();
        
        // Position parameters
        if (paramLower.includes('position') || paramLower.includes('x') || paramLower.includes('y') || paramLower.includes('translate')) {
          min = -1000;
          max = 1000;
          step = 1;
        }
        // Rotation parameters
        else if (paramLower.includes('rotation') || paramLower.includes('angle')) {
          min = 0;
          max = 360;
          step = 1;
        }
        // Scale parameters
        else if (paramLower.includes('scale')) {
          min = 0.1;
          max = 10;
          step = 0.1;
        }
        // Size parameters
        else if (paramLower.includes('radius') || paramLower.includes('width') || paramLower.includes('height') || 
                 paramLower.includes('diameter') || paramLower.includes('size') || paramLower.includes('length')) {
          min = 1;
          max = 500;
          step = 1;
        }
        // Count parameters
        else if (paramLower.includes('teeth') || paramLower.includes('sides') || paramLower.includes('points') || paramLower.includes('segments')) {
          min = 3;
          max = 100;
          step = 1;
        }
        // Thickness parameters
        else if (paramLower.includes('thickness') || paramLower.includes('stroke') || paramLower.includes('border')) {
          min = 0.5;
          max = 50;
          step = 0.5;
        }
        // Font parameters
        else if (paramLower.includes('font') || paramLower.includes('text')) {
          min = 8;
          max = 200;
          step = 1;
        }
        // Amplitude/frequency parameters
        else if (paramLower.includes('amplitude') || paramLower.includes('frequency')) {
          min = 0;
          max = 100;
          step = 1;
        }
        // Turns/steps parameters
        else if (paramLower.includes('turns') || paramLower.includes('steps')) {
          min = 1;
          max = 20;
          step = 0.1;
        }
        // Default range for unknown parameters
        else {
          min = 0;
          max = 200;
          step = 1;
        }
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'parameter-slider';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'parameter-value';
        input.value = value;
        input.min = min;
        input.max = max;
        input.step = step;
        
        // Store data for ShapeManager
        slider.dataset.originalValue = value;
        input.dataset.originalValue = value;
        slider.dataset.shapeName = shapeName;
        slider.dataset.paramName = paramName;
        input.dataset.shapeName = shapeName;
        input.dataset.paramName = paramName;
        
        // NEW: Immediate real-time slider events via ShapeManager
        slider.addEventListener('input', (e) => {
          const newValue = parseFloat(e.target.value);
          input.value = newValue;
          slider.dataset.currentValue = newValue;
          input.dataset.currentValue = newValue;
          
          // IMMEDIATE update through ShapeManager - no delay!
          shapeManager.onSliderChange(shapeName, paramName, newValue, true);
        });

        // Final update when slider is released
        slider.addEventListener('change', (e) => {
          const newValue = parseFloat(e.target.value);
          slider.dataset.originalValue = newValue;
          input.dataset.originalValue = newValue;
          
          // Final update through ShapeManager
          shapeManager.onSliderChange(shapeName, paramName, newValue, false);
        });

        // Real-time updates for number input
        input.addEventListener('input', (e) => {
          const newValue = parseFloat(e.target.value);
          if (!isNaN(newValue) && newValue >= min && newValue <= max) {
            slider.value = newValue;
            slider.dataset.currentValue = newValue;
            input.dataset.currentValue = newValue;
            
            // IMMEDIATE update through ShapeManager
            shapeManager.onSliderChange(shapeName, paramName, newValue, true);
          }
        });

        // Final update when number input loses focus
        input.addEventListener('change', (e) => {
          const newValue = parseFloat(e.target.value);
          if (!isNaN(newValue)) {
            const clampedValue = Math.max(min, Math.min(max, newValue));
            slider.value = clampedValue;
            input.value = clampedValue;
            slider.dataset.originalValue = clampedValue;
            input.dataset.originalValue = clampedValue;
            
            // Final update through ShapeManager
            shapeManager.onSliderChange(shapeName, paramName, clampedValue, false);
          }
        });

        // Focus events to maintain current values
        slider.addEventListener('focus', (e) => {
          const currentValue = e.target.dataset.currentValue || e.target.dataset.originalValue || value;
          e.target.value = currentValue;
        });

        input.addEventListener('focus', (e) => {
          const currentValue = e.target.dataset.currentValue || e.target.dataset.originalValue || value;
          e.target.value = currentValue;
        });
          
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(input);
      } 
      else if (Array.isArray(value)) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'parameter-value';
        input.value = JSON.stringify(value);
        input.disabled = true;
        input.style.width = '100%';
        sliderContainer.appendChild(input);
      }
      else if (typeof value === 'boolean') {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = value;
        checkbox.addEventListener('change', () => {
          shapeManager.onSliderChange(shapeName, paramName, checkbox.checked, false);
        });
        sliderContainer.appendChild(checkbox);
      }
      else if (typeof value === 'string') {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'parameter-value';
        input.value = value;
        input.style.width = '100%';
        
        input.addEventListener('change', () => {
          shapeManager.onSliderChange(shapeName, paramName, input.value, false);
        });
        sliderContainer.appendChild(input);
      }
      
      container.appendChild(sliderContainer);
      this.paramsList.appendChild(container);
      
      this.params.push({
        shapeName,
        paramName,
        type: typeof value,
        isArray: Array.isArray(value),
        isTransform: paramName.startsWith('position_') || paramName.startsWith('scale_') || paramName === 'rotation'
      });
    }
    
    // Method for ShapeManager to update slider values from canvas changes
    updateSliderValue(shapeName, paramName, value) {
      shapeManager.updateSliderValue(shapeName, paramName, value);
    }

    // Legacy method for existing code update functionality
    updateCodeInEditor(shapeName, paramName, value) {
      const code = this.editor.getValue();
      const lines = code.split('\n');
      
      let inShapeBlock = false;
      let openBraces = 0;
      let shapeStartLine = -1;
      let shapeEndLine = -1;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('shape ') && line.includes(shapeName)) {
          inShapeBlock = true;
          shapeStartLine = i;
          openBraces = 0;
        }
        
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
      
      if (shapeStartLine >= 0 && shapeEndLine >= 0) {
        if (paramName.startsWith('position_')) {
          this.updatePositionParameter(lines, shapeStartLine, shapeEndLine, paramName, value);
        } else {
          this.updateRegularParameter(lines, shapeStartLine, shapeEndLine, paramName, value);
        }
        
        // Update the editor content in one operation
        this.editor.setValue(lines.join('\n'));
      }
    }
    
    updateRegularParameter(lines, startLine, endLine, paramName, value) {
      let formattedValue;
      if (typeof value === 'string') {
        formattedValue = `"${value}"`;
      } else if (Array.isArray(value)) {
        formattedValue = `[${value.join(', ')}]`;
      } else {
        formattedValue = value;
      }
      
      let paramFound = false;
      for (let i = startLine; i <= endLine; i++) {
        const line = lines[i].trim();
        if (line.startsWith(`${paramName}:`)) {
          lines[i] = lines[i].replace(/:.*?(?:,\s*)?$/, `: ${formattedValue}`);
          paramFound = true;
          break;
        }
      }
      
      if (!paramFound) {
        for (let i = startLine; i <= endLine; i++) {
          if (lines[i].includes('{')) {
            const indent = lines[i + 1] ? lines[i + 1].match(/^\s*/)[0] : '    ';
            let newLine = `${indent}${paramName}: ${formattedValue}`;
            lines.splice(i + 1, 0, newLine);
            break;
          }
        }
      }
    }
    
    updatePositionParameter(lines, startLine, endLine, paramName, value) {
      const index = paramName === 'position_x' ? 0 : 1;
      let positionFound = false;
      
      for (let i = startLine; i <= endLine; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('position:')) {
          const posMatch = line.match(/position:\s*\[(.*?)\]/);
          if (posMatch) {
            const posArray = posMatch[1].split(',').map(p => p.trim());
            posArray[index] = value;
            lines[i] = lines[i].replace(/position:\s*\[.*?\]/, `position: [${posArray.join(', ')}]`);
            positionFound = true;
            break;
          }
        }
      }
      
      if (!positionFound) {
        for (let i = startLine; i <= endLine; i++) {
          if (lines[i].includes('{')) {
            const indent = lines[i + 1] ? lines[i + 1].match(/^\s*/)[0] : '    ';
            const pos = paramName === 'position_x' ? [value, 0] : [0, value];
            let newLine = `${indent}position: [${pos.join(', ')}]`;
            lines.splice(i + 1, 0, newLine);
            break;
          }
        }
      }
    }

    // Method called by ShapeManager to update shapes reference
    updateWithLatestInterpreter() {
      try {
        // Access the current interpreter from the global scope or ShapeManager
        if (typeof interpreter !== 'undefined' && interpreter) {
          // Update the reference to the interpreter
          this.interpreter = interpreter;
          
          // Update ShapeManager with latest interpreter
          shapeManager.registerInterpreter(interpreter);
          shapeManager.refreshShapes();
          
          // Remember the current selection
          const currentSelectedShape = this.currentShape;
          
          // Refresh the shapes list
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
        }
      } catch (e) {
        console.error("Error updating shapes:", e);
      }
    }
}