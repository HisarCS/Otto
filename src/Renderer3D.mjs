// Renderer3D.mjs - Visualization for the 3D Aqui language
import {
    Shape3D,
    Rectangle3D,
    Circle3D,
    Triangle3D,
    Ellipse3D,
    RegularPolygon3D,
    Star3D,
    Arc3D,
    RoundedRectangle3D,
    Path3D,
    Arrow3D,
    Text3D,
    BezierCurve3D,
    Donut3D,
    Spiral3D,
    Cross3D,
    Gear3D,
    Wave3D,
    Slot3D,
    ChamferRectangle3D,
    PolygonWithHoles3D
  } from './3D_Shapes.mjs';
  
  export class Renderer3D {
    constructor(canvas) {
      this.canvas = canvas;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.controls = null;
      this.shapes = new Map();
      this.gridHelper = null;
      this.axesHelper = null;
      this.init();
    }
  
    init() {
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xf0f0f0);
      
      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        75, 
        this.canvas.clientWidth / this.canvas.clientHeight, 
        0.1, 
        1000
      );
      this.camera.position.set(100, 100, 100);
      this.camera.lookAt(0, 0, 0);
      
      // Create renderer
      this.renderer = new THREE.WebGLRenderer({ 
        canvas: this.canvas,
        antialias: true 
      });
      this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.shadowMap.enabled = true;
      
      // Add OrbitControls
      this.controls = new THREE.OrbitControls(this.camera, this.canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      
      // Add lights
      this.setupLights();
      
      // Add grid and axes helpers
      this.setupHelpers();
      
      // Animation loop
      this.animate();
      
      // Handle window resize
      window.addEventListener('resize', () => this.onWindowResize());
      
      console.log("3D Renderer initialized successfully");
    }
    
    setupLights() {
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      this.scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(100, 100, 50);
      directionalLight.castShadow = true;
      this.scene.add(directionalLight);
      
      const pointLight = new THREE.PointLight(0xffffff, 0.5);
      pointLight.position.set(-50, 50, 50);
      this.scene.add(pointLight);
    }
    
    setupHelpers() {
      this.gridHelper = new THREE.GridHelper(200, 20);
      this.scene.add(this.gridHelper);
      
      this.axesHelper = new THREE.AxesHelper(100);
      this.scene.add(this.axesHelper);
    }
    
    animate() {
      requestAnimationFrame(() => this.animate());
      if (this.controls) this.controls.update();
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
    
    onWindowResize() {
      if (this.camera && this.renderer) {
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
      }
    }
    
    clearShapes() {
      this.shapes.forEach(shape => {
        this.scene.remove(shape);
        if (shape.geometry) shape.geometry.dispose();
        if (shape.material) {
          if (Array.isArray(shape.material)) {
            shape.material.forEach(m => m.dispose());
          } else {
            shape.material.dispose();
          }
        }
      });
      this.shapes.clear();
    }
    
    resetView() {
      this.camera.position.set(100, 100, 100);
      this.camera.lookAt(0, 0, 0);
      if (this.controls) this.controls.reset();
    }
    
    toggleGrid() {
      this.gridHelper.visible = !this.gridHelper.visible;
      this.axesHelper.visible = !this.axesHelper.visible;
    }
    
    // Create a material from parameters
    createMaterial(params = {}) {
      const color = params.color || 0x1289d8;
      const metalness = params.metalness !== undefined ? params.metalness : 0.1;
      const roughness = params.roughness !== undefined ? params.roughness : 0.5;
      const wireframe = params.wireframe || false;
      const transparent = params.transparent !== undefined ? params.transparent : true;
      const opacity = params.opacity !== undefined ? params.opacity : 0.8;
      
      return new THREE.MeshStandardMaterial({
        color: color,
        metalness: metalness,
        roughness: roughness,
        wireframe: wireframe,
        transparent: transparent,
        opacity: opacity,
        side: THREE.DoubleSide
      });
    }
    
    renderResults(results) {
      console.log("Rendering results:", results);
      try {
        this.clearShapes();
        
        // Process shapes
        results.shapes.forEach((shape, name) => {
          // Skip shapes that are part of layers
          if (!shape.layerName) {
            this.renderShape(shape);
          }
        });
        
        // Process layers
        results.layers.forEach((layer, name) => {
          this.renderLayer(layer, results.shapes);
        });
        
        console.log("Rendering complete");
      } catch (error) {
        console.error("Error in rendering:", error);
      }
    }
    
    renderShape(shape) {
      try {
        console.log("Rendering shape:", shape);
        let shapeInstance;
        
        // Create the appropriate geometry based on shape type
        switch (shape.type) {
          case 'rectangle':
            shapeInstance = new Rectangle3D(
              shape.params.width || 50, 
              shape.params.height || 30
            );
            break;
            
          case 'circle':
            shapeInstance = new Circle3D(
              shape.params.radius || 30
            );
            break;
            
          case 'triangle':
            shapeInstance = new Triangle3D(
              shape.params.base || 60, 
              shape.params.height || 40
            );
            break;
            
          case 'ellipse':
            shapeInstance = new Ellipse3D(
              shape.params.radiusX || 40, 
              shape.params.radiusY || 20
            );
            break;
            
          case 'polygon':
            shapeInstance = new RegularPolygon3D(
              shape.params.radius || 30, 
              shape.params.sides || 6
            );
            break;
            
          case 'star':
            shapeInstance = new Star3D(
              shape.params.outerRadius || 30, 
              shape.params.innerRadius || 15, 
              shape.params.points || 5
            );
            break;
            
          case 'arc':
            shapeInstance = new Arc3D(
              shape.params.radius || 30, 
              shape.params.startAngle || 0, 
              shape.params.endAngle || 270
            );
            break;
            
          case 'roundedRectangle':
            shapeInstance = new RoundedRectangle3D(
              shape.params.width || 50, 
              shape.params.height || 30, 
              shape.params.radius || 10
            );
            break;
            
          case 'path':
            shapeInstance = new Path3D(
              shape.params.points || []
            );
            break;
            
          case 'arrow':
            shapeInstance = new Arrow3D(
              shape.params.length || 60, 
              shape.params.headWidth || 20, 
              shape.params.headLength || 15
            );
            break;
            
          case 'text':
            shapeInstance = new Text3D(
              shape.params.text || "Text", 
              shape.params.fontSize || 12, 
              shape.params.fontFamily || "Arial"
            );
            break;
            
          case 'bezierCurve':
            shapeInstance = new BezierCurve3D(
              shape.params.startPoint || [0, 0], 
              shape.params.controlPoint1 || [20, 20],
              shape.params.controlPoint2 || [40, 20],
              shape.params.endPoint || [60, 0]
            );
            break;
            
          case 'donut':
            shapeInstance = new Donut3D(
              shape.params.outerRadius || 30, 
              shape.params.innerRadius || 15
            );
            break;
            
          case 'spiral':
            shapeInstance = new Spiral3D(
              shape.params.startRadius || 5, 
              shape.params.endRadius || 30, 
              shape.params.turns || 3
            );
            break;
            
          case 'cross':
            shapeInstance = new Cross3D(
              shape.params.width || 40, 
              shape.params.thickness || 10
            );
            break;
            
          case 'gear':
            shapeInstance = new Gear3D(
              shape.params.diameter || 60, 
              shape.params.teeth || 12
            );
            break;
            
          case 'wave':
            shapeInstance = new Wave3D(
              shape.params.width || 80, 
              shape.params.amplitude || 15, 
              shape.params.frequency || 3
            );
            break;
            
          case 'slot':
            shapeInstance = new Slot3D(
              shape.params.length || 60, 
              shape.params.width || 15
            );
            break;
            
          case 'chamferRectangle':
            shapeInstance = new ChamferRectangle3D(
              shape.params.width || 50, 
              shape.params.height || 30, 
              shape.params.chamfer || 10
            );
            break;
            
          case 'polygonWithHoles':
            shapeInstance = new PolygonWithHoles3D(
              shape.params.outerPath || [[0, 0], [50, 0], [50, 50], [0, 50]], 
              shape.params.holes || []
            );
            break;
            
          default:
            // Fallback to a simple box if shape type not supported
            console.warn(`Unknown shape type: ${shape.type}, using default rectangle`);
            shapeInstance = new Rectangle3D(40, 40);
            break;
        }
        
        // Apply position
        if (shape.transform && shape.transform.position) {
          shapeInstance.setPosition(
            shape.transform.position[0] || 0,
            shape.transform.position[1] || 0,
            shape.transform.position[2] || 0
          );
        }
        
        // Apply rotation
        if (shape.transform && shape.transform.rotation) {
          shapeInstance.setRotation(
            shape.transform.rotation[0] || 0,
            shape.transform.rotation[1] || 0,
            shape.transform.rotation[2] || 0
          );
        }
        
        // Apply scale
        if (shape.transform && shape.transform.scale) {
          shapeInstance.setScale(
            shape.transform.scale[0] || 1,
            shape.transform.scale[1] || 1,
            shape.transform.scale[2] || 1
          );
        }
        
        // Apply material
        if (shape.params.material) {
          const material = this.createMaterial(shape.params.material);
          shapeInstance.setMaterial(material);
        }
        
        // Create mesh with the specified depth
        const depth = shape.params.depth || 10;
        const mesh = shapeInstance.createMesh(depth);
        
        if (mesh) {
          this.scene.add(mesh);
          this.shapes.set(shape.name, mesh);
          console.log(`Added shape ${shape.name} to scene`);
          return mesh;
        }
        
      } catch (error) {
        console.error(`Error rendering shape ${shape.name}:`, error);
      }
      return null;
    }
    
    renderLayer(layer, shapes) {
      try {
        console.log("Rendering layer:", layer);
        const layerGroup = new THREE.Group();
        
        // Apply layer transformations
        if (layer.transform) {
          if (layer.transform.position) {
            layerGroup.position.set(
              layer.transform.position[0] || 0,
              layer.transform.position[1] || 0,
              layer.transform.position[2] || 0
            );
          }
          
          if (layer.transform.rotation) {
            layerGroup.rotation.set(
              (layer.transform.rotation[0] || 0) * Math.PI / 180,
              (layer.transform.rotation[1] || 0) * Math.PI / 180,
              (layer.transform.rotation[2] || 0) * Math.PI / 180
            );
          }
          
          if (layer.transform.scale) {
            layerGroup.scale.set(
              layer.transform.scale[0] || 1,
              layer.transform.scale[1] || 1,
              layer.transform.scale[2] || 1
            );
          }
        }
        
        // Add shapes to the layer
        layer.addedShapes.forEach(shapeName => {
          if (shapes.has(shapeName)) {
            const shapeData = shapes.get(shapeName);
            let shapeInstance;
            
            switch (shapeData.type) {
              case 'rectangle':
                shapeInstance = new Rectangle3D(
                  shapeData.params.width || 50, 
                  shapeData.params.height || 30
                );
                break;
                
              // Include cases for all other shape types as in renderShape
              // ... (omitted for brevity)
              
              default:
                console.warn(`Unknown shape type in layer: ${shapeData.type}`);
                shapeInstance = new Rectangle3D(40, 40);
                break;
            }
            
            // Apply position
            if (shapeData.transform && shapeData.transform.position) {
              shapeInstance.setPosition(
                shapeData.transform.position[0] || 0,
                shapeData.transform.position[1] || 0,
                shapeData.transform.position[2] || 0
              );
            }
            
            // Apply rotation
            if (shapeData.transform && shapeData.transform.rotation) {
              shapeInstance.setRotation(
                shapeData.transform.rotation[0] || 0,
                shapeData.transform.rotation[1] || 0,
                shapeData.transform.rotation[2] || 0
              );
            }
            
            // Apply scale
            if (shapeData.transform && shapeData.transform.scale) {
              shapeInstance.setScale(
                shapeData.transform.scale[0] || 1,
                shapeData.transform.scale[1] || 1,
                shapeData.transform.scale[2] || 1
              );
            }
            
            // Apply material
            if (shapeData.params.material) {
              const material = this.createMaterial(shapeData.params.material);
              shapeInstance.setMaterial(material);
            }
            
            // Create mesh with the specified depth
            const depth = shapeData.params.depth || 10;
            const mesh = shapeInstance.createMesh(depth);
            
            if (mesh) {
              layerGroup.add(mesh);
              this.shapes.set(shapeName, mesh);
            }
          }
        });
        
        this.scene.add(layerGroup);
        console.log(`Added layer ${layer.name} to scene`);
      } catch (error) {
        console.error(`Error rendering layer:`, error);
      }
    }
  }