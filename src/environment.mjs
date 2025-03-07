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
        const shape = {
            type,
            id: `${type}_${name}_${Date.now()}`,
            params: { ...params },
            transform: {
                position: params.position || [0, 0],
                rotation: 0,
                scale: [1, 1]
            },
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
                rotation: 0,
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
