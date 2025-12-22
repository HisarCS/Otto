<<<<<<< HEAD
export class Environment {
    constructor() {
        this.parameters = new Map();
        this.shapes = new Map();
        this.layers = new Map();
        this.functions = new Map();
        this.currentLayerName = null;  
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
=======
// environment.mjs - Enhanced with scope frames and stack
class ScopeFrame {
  constructor(parent = null) {
    this.parent = parent;
    this.parameters = new Map();
    this.shapes = new Map();
    this.layers = new Map();
    this.functions = new Map();
  }

  // Parameter operations
  getParameter(name) {
    if (this.parameters.has(name)) {
      return this.parameters.get(name);
    }
    if (this.parent) {
      return this.parent.getParameter(name);
    }
    throw new Error(`Parameter not found: ${name}`);
  }

  setParameter(name, value) {
    this.parameters.set(name, value);
  }

  hasParameter(name) {
    if (this.parameters.has(name)) {
      return true;
    }
    if (this.parent) {
      return this.parent.hasParameter(name);
    }
    return false;
  }

  // Shape operations
  getShape(name) {
    if (this.shapes.has(name)) {
      return this.shapes.get(name);
    }
    if (this.parent) {
      return this.parent.getShape(name);
    }
    throw new Error(`Shape not found: ${name}`);
  }

  setShape(name, shape) {
    this.shapes.set(name, shape);
  }

  hasShape(name) {
    if (this.shapes.has(name)) {
      return true;
    }
    if (this.parent) {
      return this.parent.hasShape(name);
    }
    return false;
  }

  // Layer operations
  getLayer(name) {
    if (this.layers.has(name)) {
      return this.layers.get(name);
    }
    if (this.parent) {
      return this.parent.getLayer(name);
    }
    throw new Error(`Layer not found: ${name}`);
  }

  setLayer(name, layer) {
    this.layers.set(name, layer);
  }

  hasLayer(name) {
    if (this.layers.has(name)) {
      return true;
    }
    if (this.parent) {
      return this.parent.hasLayer(name);
    }
    return false;
  }

  // Function operations
  getFunction(name) {
    if (this.functions.has(name)) {
      return this.functions.get(name);
    }
    if (this.parent) {
      return this.parent.getFunction(name);
    }
    throw new Error(`Function not found: ${name}`);
  }

  setFunction(name, func) {
    this.functions.set(name, func);
  }

  hasFunction(name) {
    if (this.functions.has(name)) {
      return true;
    }
    if (this.parent) {
      return this.parent.hasFunction(name);
    }
    return false;
  }

  // Get all shapes in this scope and parent scopes
  getAllShapes() {
    const shapes = new Map();
    
    // Collect from parent scopes first (so current scope overrides)
    if (this.parent) {
      const parentShapes = this.parent.getAllShapes();
      for (const [name, shape] of parentShapes) {
        shapes.set(name, shape);
      }
    }
    
    // Add/override with current scope
    for (const [name, shape] of this.shapes) {
      shapes.set(name, shape);
    }
    
    return shapes;
  }

  // Get all parameters in this scope and parent scopes
  getAllParameters() {
    const params = new Map();
    
    if (this.parent) {
      const parentParams = this.parent.getAllParameters();
      for (const [name, value] of parentParams) {
        params.set(name, value);
      }
    }
    
    for (const [name, value] of this.parameters) {
      params.set(name, value);
    }
    
    return params;
  }
}

export class Environment {
  constructor() {
    // Global scope is the root frame
    this.globalScope = new ScopeFrame();
    this.currentFrame = this.globalScope;
    this.scopeStack = [this.globalScope];
    this.currentLayerName = null;
  }

  // Scope management
  pushScope() {
    const newFrame = new ScopeFrame(this.currentFrame);
    this.scopeStack.push(newFrame);
    this.currentFrame = newFrame;
    return newFrame;
  }

  popScope() {
    if (this.scopeStack.length <= 1) {
      throw new Error('Cannot pop global scope');
    }
    this.scopeStack.pop();
    this.currentFrame = this.scopeStack[this.scopeStack.length - 1];
  }

  getCurrentScope() {
    return this.currentFrame;
  }

  // Parameter operations (delegate to current frame)
  getParameter(name) {
    return this.currentFrame.getParameter(name);
  }

  setParameter(name, value) {
    this.currentFrame.setParameter(name, value);
  }

  // Backward compatibility: direct access to global parameters map
  get parameters() {
    return this.globalScope.getAllParameters();
  }

  // Shape operations
  getShape(name) {
    return this.currentFrame.getShape(name);
  }

  addShape(name, shape) {
    // Handle loop counter suffix if needed
    if (this.currentLoopCounter !== undefined) {
      name = `${name}_${this.currentLoopCounter}`;
    }
    this.currentFrame.setShape(name, shape);
    return shape;
  }

  createShape(type, name, params) {
>>>>>>> aa3ca84 (+[------->++<]>--.-------.++++++++++.)
    const shape = {
      type,
      id: `${type}_${name}_${Date.now()}`,
      params: { ...params },
      transform: {
        position: params.position || [0, 0],
        rotation: params.rotation || 0,
        scale: params.scale || [1, 1]
      },
<<<<<<< HEAD
      layerName: null  
    };
    this.shapes.set(name, shape);
    return shape;
  }
  
    // New method to create a shape with a specific name
    createShapeWithName(type, name, params) {
        const shape = {
            type,
            id: `${type}_${name}_${Date.now()}`,
            params: { ...params },
            transform: {
                position: params.position || [0, 0],
                rotation: params.rotation || 0,
                scale: [1, 1]
            },
            layerName: null  
        };
        this.shapes.set(name, shape);
        return shape;
    }
  
    getShape(name) {
        if (!this.shapes.has(name)) {
            throw new Error(`Shape not found: ${name}`);
        }
        return this.shapes.get(name);
    }
  
    createLayer(name) {
        const self = this; // Store reference to environment for use in getter
        const layer = {
            name,
            addedShapes: new Set(),  
            operations: [],
            transform: {
                position: [0, 0],
                rotation: 0,
                scale: [1, 1]
            },
            // Add a getter for shapes to make layers work with renderer
            get shapes() {
                const shapeArray = [];
                this.addedShapes.forEach(shapeName => {
                    const shape = self.shapes.get(shapeName);
                    if (shape) {
                        shapeArray.push(shape);
                    }
                });
                return shapeArray;
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
  
        // Simply store the transform - layers will be handled at render time
        shape.transform = { ...transform };
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
=======
      layerName: null
    };
    this.currentFrame.setShape(name, shape);
    return shape;
  }

  createShapeWithName(type, name, params) {
    const shape = {
      type,
      id: `${type}_${name}_${Date.now()}`,
      params: { ...params },
      transform: {
        position: params.position || [0, 0],
        rotation: params.rotation || 0,
        scale: [1, 1]
      },
      layerName: null
    };
    this.currentFrame.setShape(name, shape);
    return shape;
  }

  // Backward compatibility: direct access to all shapes
  get shapes() {
    return this.globalScope.getAllShapes();
  }

  // Layer operations
  createLayer(name) {
    const self = this;
    const layer = {
      name,
      addedShapes: new Set(),
      operations: [],
      transform: {
        position: [0, 0],
        rotation: 0,
        scale: [1, 1]
      },
      get shapes() {
        const shapeArray = [];
        this.addedShapes.forEach(shapeName => {
          try {
            const shape = self.getShape(shapeName);
            if (shape) {
              shapeArray.push(shape);
            }
          } catch (e) {
            // Shape not found, skip
          }
        });
        return shapeArray;
      }
    };
    this.currentFrame.setLayer(name, layer);
    this.currentLayerName = name;
    return layer;
  }

  addShapeToLayer(layerName, shapeName) {
    const layer = this.currentFrame.getLayer(layerName);
    if (!layer) {
      throw new Error(`Layer not found: ${layerName}`);
    }
    layer.addedShapes.add(shapeName);
    try {
      const shape = this.getShape(shapeName);
      if (shape) {
        shape.layerName = layerName;
      }
    } catch (e) {
      // Shape not found yet, that's okay
    }
  }

  isShapeInLayer(shapeName, layerName) {
    try {
      const layer = this.currentFrame.getLayer(layerName);
      return layer && layer.addedShapes.has(shapeName);
    } catch (e) {
      return false;
    }
  }

  transformShape(name, transform) {
    try {
      const shape = this.getShape(name);
      if (!shape) return;
      shape.transform = { ...transform };
    } catch (e) {
      // Shape not found
    }
  }

  // Backward compatibility: direct access to global layers map
  get layers() {
    return this.globalScope.layers;
  }

  // Function operations
  addFunction(name, parameters, body) {
    this.currentFrame.setFunction(name, { parameters, body });
  }

  getFunction(name) {
    return this.currentFrame.getFunction(name);
  }

  // Backward compatibility: direct access to global functions map
  get functions() {
    return this.globalScope.functions;
  }
}
>>>>>>> aa3ca84 (+[------->++<]>--.-------.++++++++++.)
