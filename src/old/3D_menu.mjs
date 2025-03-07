// 3D_menu.mjs - Menu system for 3D shape visualization
import * as THREE from 'three';
import {
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

export class Shape3DMenu {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.currentShape = null;
    
    // List of available shapes with their default parameters
    this.shapeOptions = [
      { id: 'rectangle', name: 'Rectangle', class: Rectangle3D, params: { width: 50, height: 30 } },
      { id: 'circle', name: 'Circle', class: Circle3D, params: { radius: 30 } },
      { id: 'triangle', name: 'Triangle', class: Triangle3D, params: { base: 60, height: 40 } },
      { id: 'ellipse', name: 'Ellipse', class: Ellipse3D, params: { radiusX: 40, radiusY: 20 } },
      { id: 'polygon', name: 'Regular Polygon', class: RegularPolygon3D, params: { radius: 30, sides: 6 } },
      { id: 'star', name: 'Star', class: Star3D, params: { outerRadius: 30, innerRadius: 15, points: 5 } },
      { id: 'arc', name: 'Arc', class: Arc3D, params: { radius: 30, startAngle: 0, endAngle: 270 } },
      { id: 'rounded-rectangle', name: 'Rounded Rectangle', class: RoundedRectangle3D, params: { width: 50, height: 30, radius: 10 } },
      { id: 'arrow', name: 'Arrow', class: Arrow3D, params: { length: 60, headWidth: 20, headLength: 15 } },
      { id: 'donut', name: 'Donut', class: Donut3D, params: { outerRadius: 30, innerRadius: 15 } },
      { id: 'spiral', name: 'Spiral', class: Spiral3D, params: { startRadius: 5, endRadius: 30, turns: 3 } },
      { id: 'cross', name: 'Cross', class: Cross3D, params: { width: 40, thickness: 10 } },
      { id: 'gear', name: 'Gear', class: Gear3D, params: { diameter: 60, teeth: 12 } },
      { id: 'wave', name: 'Wave', class: Wave3D, params: { width: 80, amplitude: 15, frequency: 3 } },
      { id: 'slot', name: 'Slot', class: Slot3D, params: { length: 60, width: 15 } },
      { id: 'chamfer-rectangle', name: 'Chamfer Rectangle', class: ChamferRectangle3D, params: { width: 50, height: 30, chamfer: 10 } }
    ];
  }

  init() {
    this.setupScene();
    this.setupMenu();
    this.animate();
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Create and show the first shape by default
    this.showShape('rectangle');
  }

  setupScene() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, 
      this.canvas.clientWidth / this.canvas.clientHeight, 
      0.1, 
      1000
    );
    this.camera.position.z = 150;
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1).normalize();
    this.scene.add(directionalLight);
  }

  setupMenu() {
    // Create menu container
    const menuContainer = document.createElement('div');
    menuContainer.id = 'shape-menu';
    menuContainer.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      width: 220px;
      background-color: rgba(255, 255, 255, 0.9);
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      font-family: Arial, sans-serif;
    `;
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = '3D Shapes';
    title.style.cssText = `
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 16px;
      color: #333;
    `;
    menuContainer.appendChild(title);
    
    // Create shape selection dropdown
    const selectGroup = document.createElement('div');
    selectGroup.style.marginBottom = '15px';
    
    const selectLabel = document.createElement('label');
    selectLabel.textContent = 'Select Shape:';
    selectLabel.style.cssText = `
      display: block;
      margin-bottom: 5px;
      font-size: 14px;
    `;
    selectGroup.appendChild(selectLabel);
    
    const select = document.createElement('select');
    select.id = 'shape-select';
    select.style.cssText = `
      width: 100%;
      padding: 5px;
      border: 1px solid #ccc;
      border-radius: 3px;
      font-size: 14px;
    `;
    
    // Add shape options
    this.shapeOptions.forEach(shape => {
      const option = document.createElement('option');
      option.value = shape.id;
      option.textContent = shape.name;
      select.appendChild(option);
    });
    
    // Handle shape selection change
    select.addEventListener('change', (e) => {
      this.showShape(e.target.value);
    });
    
    selectGroup.appendChild(select);
    menuContainer.appendChild(selectGroup);
    
    // Create extrusion depth slider
    const depthGroup = document.createElement('div');
    depthGroup.style.marginBottom = '15px';
    
    const depthLabel = document.createElement('label');
    depthLabel.textContent = 'Extrusion Depth:';
    depthLabel.style.cssText = `
      display: block;
      margin-bottom: 5px;
      font-size: 14px;
    `;
    depthGroup.appendChild(depthLabel);
    
    const depthSlider = document.createElement('input');
    depthSlider.type = 'range';
    depthSlider.id = 'depth-slider';
    depthSlider.min = '1';
    depthSlider.max = '50';
    depthSlider.value = '10';
    depthSlider.style.width = '100%';
    depthGroup.appendChild(depthSlider);
    
    const depthValue = document.createElement('span');
    depthValue.id = 'depth-value';
    depthValue.textContent = depthSlider.value;
    depthValue.style.fontSize = '12px';
    depthValue.style.marginLeft = '5px';
    depthGroup.appendChild(depthValue);
    
    // Update depth value and regenerate shape
    depthSlider.addEventListener('input', (e) => {
      depthValue.textContent = e.target.value;
      this.updateCurrentShape();
    });
    
    menuContainer.appendChild(depthGroup);
    
    // Create property controls container
    const propertiesContainer = document.createElement('div');
    propertiesContainer.id = 'shape-properties';
    menuContainer.appendChild(propertiesContainer);
    
    // Add the menu to the 3D tab
    const parentElement = this.canvas.parentElement;
    parentElement.appendChild(menuContainer);
  }

  showShape(shapeId) {
    // Find the shape configuration
    const shapeConfig = this.shapeOptions.find(shape => shape.id === shapeId);
    if (!shapeConfig) return;
    
    // Clear current shape
    if (this.currentShape) {
      this.scene.remove(this.currentShape);
      if (this.currentShape.geometry) this.currentShape.geometry.dispose();
      if (this.currentShape.material) this.currentShape.material.dispose();
    }
    
    // Create property controls for the selected shape
    this.createPropertyControls(shapeConfig);
    
    // Create new shape
    this.updateCurrentShape();
  }

  createPropertyControls(shapeConfig) {
    // Get properties container
    const propertiesContainer = document.getElementById('shape-properties');
    propertiesContainer.innerHTML = '';
    
    // Create title
    const title = document.createElement('h4');
    title.textContent = 'Properties';
    title.style.cssText = `
      margin: 10px 0;
      font-size: 14px;
      color: #333;
    `;
    propertiesContainer.appendChild(title);
    
    // Create controls for each parameter
    Object.entries(shapeConfig.params).forEach(([key, value]) => {
      const controlGroup = document.createElement('div');
      controlGroup.style.marginBottom = '10px';
      
      const label = document.createElement('label');
      label.textContent = this.formatLabel(key) + ':';
      label.style.cssText = `
        display: block;
        margin-bottom: 3px;
        font-size: 12px;
      `;
      controlGroup.appendChild(label);
      
      const input = document.createElement('input');
      input.type = 'range';
      input.dataset.param = key;
      
      // Set min, max, and value based on parameter type
      if (key.includes('radius') || key.includes('diameter')) {
        input.min = '5';
        input.max = '100';
      } else if (key.includes('sides') || key.includes('points') || key.includes('teeth')) {
        input.min = '3';
        input.max = '20';
        input.step = '1';
      } else if (key.includes('angle')) {
        input.min = '0';
        input.max = '360';
      } else if (key.includes('frequency') || key.includes('turns')) {
        input.min = '1';
        input.max = '10';
        input.step = '0.5';
      } else {
        input.min = '5';
        input.max = '100';
      }
      
      input.value = value;
      input.style.width = '100%';
      controlGroup.appendChild(input);
      
      const valueDisplay = document.createElement('span');
      valueDisplay.textContent = value;
      valueDisplay.style.fontSize = '12px';
      valueDisplay.style.marginLeft = '5px';
      controlGroup.appendChild(valueDisplay);
      
      // Update value display and regenerate shape when changed
      input.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value;
        this.updateCurrentShape();
      });
      
      propertiesContainer.appendChild(controlGroup);
    });
  }

  updateCurrentShape() {
    // Get selected shape type
    const shapeId = document.getElementById('shape-select').value;
    const shapeConfig = this.shapeOptions.find(shape => shape.id === shapeId);
    if (!shapeConfig) return;
    
    // Get current parameter values
    const params = {};
    const paramInputs = document.querySelectorAll('#shape-properties input[data-param]');
    paramInputs.forEach(input => {
      params[input.dataset.param] = parseFloat(input.value);
    });
    
    // Get extrusion depth
    const depth = parseFloat(document.getElementById('depth-slider').value);
    
    // Create shape instance
    const ShapeClass = shapeConfig.class;
    const shape = new ShapeClass(...Object.values(params));
    
    // Create mesh
    this.currentShape = shape.createMesh(depth);
    
    // Add to scene
    this.scene.add(this.currentShape);
  }

  formatLabel(str) {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase());
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  }
}

// Function to initialize the 3D menu
export function init3DMenu(canvas) {
  const menu = new Shape3DMenu(canvas);
  menu.init();
  return menu;
}
