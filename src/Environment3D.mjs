// Environment3D.mjs - State management for the 3D Aqui language
export class Environment3D {
    constructor() {
      this.parameters = new Map();
      this.shapes = new Map();
      this.layers = new Map();
      this.functions = new Map();
      this.currentLayerName = null;
      this.currentLoopCounter = undefined;
    }
  
    getParameter(name) {
      if (!this.parameters.has(name)) {
        throw new Error(`Parameter not found: ${name}`);
      }
      return this.parameters.get(name);
    }
  
    setParameter(name, value) {
      this.parameters.set(name, value);
    }
  
    addShape(name, shape) {
      if (this.currentLoopCounter !== undefined) {
        name = `${name}_${this.currentLoopCounter}`;
      }
      this.shapes.set(name, shape);
      return shape;
    }
  
    createShape(type, name, params) {
      // Generate a unique ID for the shape
      const id = `${type}_${name}_${Date.now()}`;
      
      // Create the shape object with default values
      const shape = {
        type,
        id,
        name,
        params: { ...params },
        transform: {
          position: params.position || [0, 0, 0],
          rotation: params.rotation || [0, 0, 0],
          scale: params.scale || [1, 1, 1]
        },
        layerName: null
      };
      
      this.shapes.set(name, shape);
      return shape;
    }
  
    // Create a shape with a specific name (for when name is provided in the code)
    createShapeWithName(type, name, params) {
      return this.createShape(type, name, params);
    }
  
    getShape(name) {
      if (!this.shapes.has(name)) {
        throw new Error(`Shape not found: ${name}`);
      }
      return this.shapes.get(name);
    }
  
    createLayer(name) {
      const layer = {
        name,
        addedShapes: new Set(),
        operations: [],
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        }
      };
      this.layers.set(name, layer);
      this.currentLayerName = name;
      return layer;
    }
  
    addShapeToLayer(layerName, shapeName) {
      const layer = this.layers.get(layerName);
      if (!layer) {
        throw new Error(`Layer not found: ${layerName}`);
      }
      layer.addedShapes.add(shapeName);
      const shape = this.shapes.get(shapeName);
      if (shape) {
        shape.layerName = layerName;
      }
    }
  
    isShapeInLayer(shapeName, layerName) {
      const layer = this.layers.get(layerName);
      return layer && layer.addedShapes.has(shapeName);
    }
  
    transformShape(name, transform) {
      const shape = this.getShape(name);
      if (!shape) return;
  
      if (shape.layerName && this.isShapeInLayer(name, shape.layerName)) {
        const layer = this.layers.get(shape.layerName);
        
        // Combine layer and shape transformations
        shape.transform = {
          rotation: [
            transform.rotation[0] + layer.transform.rotation[0],
            transform.rotation[1] + layer.transform.rotation[1],
            transform.rotation[2] + layer.transform.rotation[2]
          ],
          scale: [
            transform.scale[0] * layer.transform.scale[0],
            transform.scale[1] * layer.transform.scale[1],
            transform.scale[2] * layer.transform.scale[2]
          ],
          position: [
            transform.position[0] + layer.transform.position[0],
            transform.position[1] + layer.transform.position[1],
            transform.position[2] + layer.transform.position[2]
          ]
        };
      } else {
        shape.transform = transform;
      }
    }
  
    // Add a 3D-specific parameter to a shape
    addParameterToShape(shapeName, paramName, value) {
      const shape = this.getShape(shapeName);
      if (shape) {
        shape.params[paramName] = value;
      }
    }
    
    // Apply extrusion settings to a shape
    applyExtrusion(shapeName, extrudeSettings) {
      const shape = this.getShape(shapeName);
      if (shape) {
        shape.params.extrudeSettings = {
          ...shape.params.extrudeSettings,
          ...extrudeSettings
        };
      }
    }
  
    // Function handling
    addFunction(name, parameters, body) {
      this.functions.set(name, { parameters, body });
    }
  
    getFunction(name) {
      if (!this.functions.has(name)) {
        throw new Error(`Function not found: ${name}`);
      }
      return this.functions.get(name);
    }
  }