// svgExport.mjs - Enhanced SVG export with comprehensive fill and styling support

// Main export function with improved error handling and features
export function exportToSVG(interpreter, canvas, filename = "aqui_drawing.svg") {
    try {
      if (!interpreter?.env?.shapes) {
        throw new Error('No shapes to export');
      }
  
      console.log(`🎨 Exporting ${interpreter.env.shapes.size} shapes to SVG...`);
      
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      
      // Enhanced SVG setup with better viewport and styling
      svg.setAttribute("xmlns", svgNS);
      svg.setAttribute("width", canvas.width);
      svg.setAttribute("height", canvas.height);
      svg.setAttribute("viewBox", `0 0 ${canvas.width} ${canvas.height}`);
      svg.setAttribute("style", "background-color: white;");
      
      // Add definitions for reusable elements
      const defs = document.createElementNS(svgNS, "defs");
      addGradientDefinitions(defs, svgNS);
      svg.appendChild(defs);
  
      // Create main group - NO coordinate transformation, use canvas coordinates directly
      const mainGroup = document.createElementNS(svgNS, "g");
      mainGroup.setAttribute("id", "aqui-shapes");
      svg.appendChild(mainGroup);
      
      // Store canvas transform parameters to match renderer exactly
      const canvasTransform = {
        offsetX: canvas.width / 2,
        offsetY: canvas.height / 2,
        scale: Math.min(canvas.width, canvas.height) / 800,
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 }
      };
      
      let exportedShapes = 0;
      let exportedLayers = 0;
  
      // Process individual shapes first
      interpreter.env.shapes.forEach((shape, shapeName) => {
        try {
          // Skip shapes that are in layers (they'll be processed with layers)
          if (!isShapeInAnyLayer(shapeName, interpreter.env.layers)) {
            const shapeElement = createSVGShape(shape, shapeName, svgNS, canvasTransform);
            if (shapeElement) {
              mainGroup.appendChild(shapeElement);
              exportedShapes++;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to export shape ${shapeName}:`, error.message);
        }
      });
  
      // Process layers with proper grouping
      if (interpreter.env.layers && interpreter.env.layers.size > 0) {
        interpreter.env.layers.forEach((layer, layerName) => {
          try {
            const layerGroup = createLayerGroup(layer, layerName, interpreter.env.shapes, svgNS, canvasTransform);
            if (layerGroup) {
              mainGroup.appendChild(layerGroup);
              exportedLayers++;
            }
          } catch (error) {
            console.warn(`⚠️ Failed to export layer ${layerName}:`, error.message);
          }
        });
      }
  
      // Create and trigger download
      const serializer = new XMLSerializer();
      const svgString = formatSVGString(serializer.serializeToString(svg));
      
      downloadSVG(svgString, filename);
      
      console.log(`✅ SVG export completed: ${exportedShapes} shapes, ${exportedLayers} layers`);
      return { success: true, shapes: exportedShapes, layers: exportedLayers };
      
    } catch (error) {
      console.error('❌ SVG Export failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Helper function to check if shape is in any layer
  function isShapeInAnyLayer(shapeName, layers) {
    if (!layers) return false;
    for (const layer of layers.values()) {
      if (layer.addedShapes && layer.addedShapes.has(shapeName)) {
        return true;
      }
    }
    return false;
  }
  
  // Create layer group with proper organization
  function createLayerGroup(layer, layerName, shapes, svgNS, canvasTransform) {
    const layerGroup = document.createElementNS(svgNS, "g");
    layerGroup.setAttribute("id", `layer-${layerName}`);
    layerGroup.setAttribute("data-layer-name", layerName);
    
    let shapeCount = 0;
    
    // Add all shapes from this layer
    if (layer.addedShapes) {
      layer.addedShapes.forEach(shapeName => {
        if (shapes.has(shapeName)) {
          const shape = shapes.get(shapeName);
          const shapeElement = createSVGShape(shape, shapeName, svgNS, canvasTransform);
          if (shapeElement) {
            layerGroup.appendChild(shapeElement);
            shapeCount++;
          }
        }
      });
    }
    
    return shapeCount > 0 ? layerGroup : null;
  }
  
  // Enhanced shape creation with better parameter support
  function createSVGShape(shape, shapeName, svgNS, canvasTransform) {
    if (!shape || !shape.type || !shape.params) {
      console.warn(`Invalid shape data for ${shapeName}`);
      return null;
    }
    
    const { type, params, transform } = shape;
    let element = null;
    
    try {
      switch (type) {
        case 'path':
          element = createSVGPath(params, svgNS);
          break;
        case 'circle':
          element = createSVGCircle(params, svgNS);
          break;
        case 'rectangle':
          element = createSVGRectangle(params, svgNS);
          break;
        case 'ellipse':
          element = createSVGEllipse(params, svgNS);
          break;
        case 'polygon':
          element = createSVGPolygon(params, svgNS);
          break;
        case 'star':
          element = createSVGStar(params, svgNS);
          break;
        case 'triangle':
          element = createSVGTriangle(params, svgNS);
          break;
        case 'text':
          element = createSVGText(params, svgNS);
          break;
        case 'arc':
          element = createSVGArc(params, svgNS);
          break;
        case 'roundedRectangle':
          element = createSVGRoundedRectangle(params, svgNS);
          break;
        case 'donut':
          element = createSVGDonut(params, svgNS);
          break;
        case 'gear':
          element = createSVGGear(params, svgNS);
          break;
        case 'arrow':
          element = createSVGArrow(params, svgNS);
          break;
        case 'spiral':
          element = createSVGSpiral(params, svgNS);
          break;
        case 'cross':
          element = createSVGCross(params, svgNS);
          break;
        case 'wave':
          element = createSVGWave(params, svgNS);
          break;
        case 'slot':
          element = createSVGSlot(params, svgNS);
          break;
        case 'chamferRectangle':
          element = createSVGChamferRectangle(params, svgNS);
          break;
        default:
          console.warn(`SVG export: Using generic export for shape type: ${type}`);
          element = createSVGGenericShape(type, params, svgNS);
      }
      
      if (element) {
        // Add shape metadata
        element.setAttribute("data-shape-name", shapeName);
        element.setAttribute("data-shape-type", type);
        
        // Apply styling with parameter support
        applyShapeStyle(element, params);
        
        // Apply canvas-matching transform
        applyCanvasTransformToSVG(element, transform, canvasTransform);
      }
      
      return element;
      
    } catch (error) {
      console.error(`Error creating SVG element for ${type}:`, error);
      return createSVGGenericShape(type, params, svgNS);
    }
  }
  
  // Enhanced styling with comprehensive parameter support
  function applyShapeStyle(element, params) {
    // Stroke styling
    const strokeColor = params.strokeColor || params.color || "#000000";
    const strokeWidth = params.strokeWidth || params.thickness || 2;
    element.setAttribute("stroke", strokeColor);
    element.setAttribute("stroke-width", strokeWidth);
    
    // Fill styling with multiple parameter options
    let fill = "none";
    
    if (params.fill === true || params.filled === true) {
      fill = params.fillColor || params.color || "rgba(0, 0, 0, 0.1)";
    } else if (params.fill === false || params.filled === false) {
      fill = "none";
    } else if (params.fillColor) {
      fill = params.fillColor;
    } else if (params.color && !params.strokeColor) {
      // If only color is specified, use it for stroke and light version for fill
      fill = addAlphaToColor(params.color, 0.1);
    }
    
    element.setAttribute("fill", fill);
    
    // Additional styling options
    if (params.opacity !== undefined) {
      element.setAttribute("opacity", params.opacity);
    }
    
    if (params.strokeDashArray) {
      element.setAttribute("stroke-dasharray", params.strokeDashArray);
    }
    
    // Stroke styling options
    if (params.strokeLinecap) {
      element.setAttribute("stroke-linecap", params.strokeLinecap);
    } else {
      element.setAttribute("stroke-linecap", "round");
    }
    
    if (params.strokeLinejoin) {
      element.setAttribute("stroke-linejoin", params.strokeLinejoin);
    } else {
      element.setAttribute("stroke-linejoin", "round");
    }
  }
  
  // Helper function to add alpha to color
  function addAlphaToColor(color, alpha) {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } else if (color.startsWith('rgb')) {
      return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    return `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  }
  
  // Enhanced path creation with better handling
  function createSVGPath(params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    let pathData = "";
  
    if (params.isTurtlePath && params.subPaths) {
      // For turtle paths, draw each subpath
      pathData = params.subPaths.map(subPath => {
        if (subPath.length < 2) return "";
        
        let subPathData = `M ${subPath[0][0]} ${subPath[0][1]}`;
        for (let i = 1; i < subPath.length; i++) {
          subPathData += ` L ${subPath[i][0]} ${subPath[i][1]}`;
        }
        return subPathData;
      }).join(" ");
      
    } else if (params.isBezier && params.points) {
      const pts = params.points;
      if (pts.length >= 4) {
        pathData = `M ${pts[0][0]} ${pts[0][1]} C ${pts[1][0]} ${pts[1][1]}, ${pts[2][0]} ${pts[2][1]}, ${pts[3][0]} ${pts[3][1]}`;
      }
      
    } else if (params.points && params.points.length >= 2) {
      const pts = params.points;
      pathData = `M ${pts[0][0]} ${pts[0][1]}`;
      
      for (let i = 1; i < pts.length; i++) {
        pathData += ` L ${pts[i][0]} ${pts[i][1]}`;
      }
      
      if (params.closed !== false && pts.length > 2) {
        pathData += " Z";
      }
    }
  
    if (pathData) {
      path.setAttribute("d", pathData);
      return path;
    }
    
    return null;
  }
  
  // Individual shape creators with enhanced parameter support
  function createSVGCircle(params, svgNS) {
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", 0);
    circle.setAttribute("cy", 0);
    circle.setAttribute("r", params.radius || 50);
    return circle;
  }
  
  function createSVGRectangle(params, svgNS) {
    const rect = document.createElementNS(svgNS, "rect");
    const width = params.width || 100;
    const height = params.height || 100;
    rect.setAttribute("x", -width/2);
    rect.setAttribute("y", -height/2);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    return rect;
  }
  
  function createSVGRoundedRectangle(params, svgNS) {
    const rect = document.createElementNS(svgNS, "rect");
    const width = params.width || 100;
    const height = params.height || 100;
    const radius = params.radius || 10;
    
    rect.setAttribute("x", -width/2);
    rect.setAttribute("y", -height/2);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("rx", radius);
    rect.setAttribute("ry", radius);
    return rect;
  }
  
  function createSVGEllipse(params, svgNS) {
    const ellipse = document.createElementNS(svgNS, "ellipse");
    ellipse.setAttribute("cx", 0);
    ellipse.setAttribute("cy", 0);
    ellipse.setAttribute("rx", params.radiusX || 50);
    ellipse.setAttribute("ry", params.radiusY || 30);
    return ellipse;
  }
  
  function createSVGPolygon(params, svgNS) {
    const polygon = document.createElementNS(svgNS, "polygon");
    const sides = params.sides || 6;
    const radius = params.radius || 50;
    let points = "";
    
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      points += `${x.toFixed(2)},${y.toFixed(2)} `;
    }
    
    polygon.setAttribute("points", points.trim());
    return polygon;
  }
  
  function createSVGStar(params, svgNS) {
    const star = document.createElementNS(svgNS, "polygon");
    const outerRadius = params.outerRadius || 50;
    const innerRadius = params.innerRadius || 20;
    const points = params.points || 5;
    let pointsStr = "";
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      pointsStr += `${x.toFixed(2)},${y.toFixed(2)} `;
    }
    
    star.setAttribute("points", pointsStr.trim());
    return star;
  }
  
  function createSVGTriangle(params, svgNS) {
    const triangle = document.createElementNS(svgNS, "polygon");
    const base = params.base || 60;
    const height = params.height || 80;
    const points = `${(-base/2).toFixed(2)},${(-height/2).toFixed(2)} ${(base/2).toFixed(2)},${(-height/2).toFixed(2)} 0,${(height/2).toFixed(2)}`;
    
    triangle.setAttribute("points", points);
    return triangle;
  }
  
  function createSVGText(params, svgNS) {
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", 0);
    text.setAttribute("y", 0);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", params.fontFamily || "Arial, sans-serif");
    text.setAttribute("font-size", params.fontSize || 16);
    
    if (params.fontWeight) {
      text.setAttribute("font-weight", params.fontWeight);
    }
    
    text.textContent = params.text || "";
    return text;
  }
  
  // New shape creators for missing types
  function createSVGArrow(params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    const length = params.length || 100;
    const headWidth = params.headWidth || 20;
    const headLength = params.headLength || 30;
    const bodyWidth = params.bodyWidth || 10;
    
    const pathData = `M 0,${-bodyWidth/2} L ${length - headLength},${-bodyWidth/2} L ${length - headLength},${-headWidth/2} L ${length},0 L ${length - headLength},${headWidth/2} L ${length - headLength},${bodyWidth/2} L 0,${bodyWidth/2} Z`;
    
    path.setAttribute("d", pathData);
    return path;
  }
  
  function createSVGSpiral(params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    const startRadius = params.startRadius || 10;
    const endRadius = params.endRadius || 50;
    const turns = params.turns || 3;
    const segments = 100;
    
    let pathData = "";
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * turns * Math.PI * 2;
      const radius = startRadius + (endRadius - startRadius) * t;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        pathData += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
      } else {
        pathData += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
    }
    
    path.setAttribute("d", pathData);
    return path;
  }
  
  function createSVGCross(params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    const width = params.width || 100;
    const thickness = params.thickness || 20;
    const w = width / 2;
    const t = thickness / 2;
    
    const pathData = `M ${-t},${-w} L ${t},${-w} L ${t},${-t} L ${w},${-t} L ${w},${t} L ${t},${t} L ${t},${w} L ${-t},${w} L ${-t},${t} L ${-w},${t} L ${-w},${-t} L ${-t},${-t} Z`;
    
    path.setAttribute("d", pathData);
    return path;
  }
  
  function createSVGWave(params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    const width = params.width || 100;
    const amplitude = params.amplitude || 20;
    const frequency = params.frequency || 2;
    const segments = 50;
    
    let pathData = "";
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width - width / 2;
      const y = Math.sin((x / width) * frequency * Math.PI * 2) * amplitude;
      
      if (i === 0) {
        pathData += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
      } else {
        pathData += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
    }
    
    path.setAttribute("d", pathData);
    return path;
  }
  
  function createSVGSlot(params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    const length = params.length || 100;
    const width = params.width || 20;
    const radius = width / 2;
    const centerDist = (length - width) / 2;
    
    const pathData = `M ${-centerDist},${-radius} A ${radius},${radius} 0 0,1 ${-centerDist},${radius} L ${centerDist},${radius} A ${radius},${radius} 0 0,1 ${centerDist},${-radius} Z`;
    
    path.setAttribute("d", pathData);
    return path;
  }
  
  function createSVGChamferRectangle(params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    const width = params.width || 100;
    const height = params.height || 100;
    const chamfer = params.chamfer || 10;
    const w = width / 2;
    const h = height / 2;
    const c = Math.min(chamfer, width / 2, height / 2);
    
    const pathData = `M ${-w + c},${-h} L ${w - c},${-h} L ${w},${-h + c} L ${w},${h - c} L ${w - c},${h} L ${-w + c},${h} L ${-w},${h - c} L ${-w},${-h + c} Z`;
    
    path.setAttribute("d", pathData);
    return path;
  }
  
  function createSVGArc(params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    const radius = params.radius || 50;
    const startAngle = (params.startAngle || 0) * Math.PI / 180;
    const endAngle = (params.endAngle || 90) * Math.PI / 180;
    
    const startX = Math.cos(startAngle) * radius;
    const startY = Math.sin(startAngle) * radius;
    const endX = Math.cos(endAngle) * radius;
    const endY = Math.sin(endAngle) * radius;
    
    const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
    const pathData = `M ${startX.toFixed(2)} ${startY.toFixed(2)} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX.toFixed(2)} ${endY.toFixed(2)}`;
    
    path.setAttribute("d", pathData);
    return path;
  }
  
  function createSVGDonut(params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    const outerRadius = params.outerRadius || 50;
    const innerRadius = params.innerRadius || 20;
    
    const pathData = `M ${outerRadius},0 A ${outerRadius},${outerRadius} 0 1,0 ${-outerRadius},0 A ${outerRadius},${outerRadius} 0 1,0 ${outerRadius},0 M ${innerRadius},0 A ${innerRadius},${innerRadius} 0 1,1 ${-innerRadius},0 A ${innerRadius},${innerRadius} 0 1,1 ${innerRadius},0`;
    
    path.setAttribute("d", pathData);
    path.setAttribute("fill-rule", "evenodd");
    return path;
  }
  
  function createSVGGear(params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    const teeth = params.teeth || 12;
    const diameter = params.diameter || 100;
    const r = diameter / 2;
    const toothHeight = r * 0.2;
    const toothWidth = (Math.PI * 2 * r) / (teeth * 3);
    
    let pathData = "";
    
    for (let i = 0; i < teeth; i++) {
      const angle1 = (i / teeth) * Math.PI * 2;
      const angle2 = ((i + 0.3) / teeth) * Math.PI * 2;
      const angle3 = ((i + 0.7) / teeth) * Math.PI * 2;
      const angle4 = ((i + 1) / teeth) * Math.PI * 2;
      
      const x1 = Math.cos(angle1) * r;
      const y1 = Math.sin(angle1) * r;
      const x2 = Math.cos(angle2) * r;
      const y2 = Math.sin(angle2) * r;
      const x3 = Math.cos(angle2) * (r + toothHeight);
      const y3 = Math.sin(angle2) * (r + toothHeight);
      const x4 = Math.cos(angle3) * (r + toothHeight);
      const y4 = Math.sin(angle3) * (r + toothHeight);
      const x5 = Math.cos(angle3) * r;
      const y5 = Math.sin(angle3) * r;
      const x6 = Math.cos(angle4) * r;
      const y6 = Math.sin(angle4) * r;
      
      if (i === 0) {
        pathData += `M ${x1.toFixed(2)},${y1.toFixed(2)}`;
      }
      
      pathData += ` L ${x2.toFixed(2)},${y2.toFixed(2)} L ${x3.toFixed(2)},${y3.toFixed(2)} L ${x4.toFixed(2)},${y4.toFixed(2)} L ${x5.toFixed(2)},${y5.toFixed(2)} L ${x6.toFixed(2)},${y6.toFixed(2)}`;
    }
    
    pathData += " Z";
    path.setAttribute("d", pathData);
    return path;
  }
  
  // Enhanced generic shape creator
  function createSVGGenericShape(type, params, svgNS) {
    const group = document.createElementNS(svgNS, "g");
    
    // Create a placeholder rectangle
    const rect = document.createElementNS(svgNS, "rect");
    const size = 60;
    rect.setAttribute("x", -size/2);
    rect.setAttribute("y", -size/2);
    rect.setAttribute("width", size);
    rect.setAttribute("height", size);
    rect.setAttribute("fill", "rgba(255, 0, 0, 0.1)");
    rect.setAttribute("stroke", "red");
    rect.setAttribute("stroke-width", "2");
    rect.setAttribute("stroke-dasharray", "5,5");
    
    group.appendChild(rect);
    
    // Add explanatory text
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", 0);
    text.setAttribute("y", 0);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", "Arial, sans-serif");
    text.setAttribute("font-size", "10");
    text.setAttribute("fill", "red");
    text.textContent = type.toUpperCase();
    
    group.appendChild(text);
    
    return group;
  }
  
  // Add gradient definitions for enhanced styling
  function addGradientDefinitions(defs, svgNS) {
    // Add a default gradient
    const gradient = document.createElementNS(svgNS, "linearGradient");
    gradient.setAttribute("id", "defaultGradient");
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "100%");
    
    const stop1 = document.createElementNS(svgNS, "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#FF5722");
    stop1.setAttribute("stop-opacity", "0.8");
    
    const stop2 = document.createElementNS(svgNS, "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "#FF9800");
    stop2.setAttribute("stop-opacity", "0.4");
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
  }
  
  // Canvas-matching transform application - matches renderer exactly
  function applyCanvasTransformToSVG(element, shapeTransform, canvasTransform) {
    if (!shapeTransform || !canvasTransform) return;
    
    // Use the same coordinate transformation as the renderer
    const worldX = shapeTransform.position?.[0] || 0;
    const worldY = shapeTransform.position?.[1] || 0;
    const rotation = shapeTransform.rotation || 0;
    const scaleX = shapeTransform.scale?.[0] || 1;
    const scaleY = shapeTransform.scale?.[1] || 1;
    
    // Transform world coordinates to screen coordinates (same as renderer)
    const screenX = worldX * canvasTransform.scale * canvasTransform.zoomLevel + 
                   canvasTransform.offsetX + canvasTransform.panOffset.x;
    const screenY = -worldY * canvasTransform.scale * canvasTransform.zoomLevel + 
                   canvasTransform.offsetY + canvasTransform.panOffset.y;
    
    // Apply canvas scaling to the shape itself
    const finalScaleX = scaleX * canvasTransform.scale * canvasTransform.zoomLevel;
    const finalScaleY = scaleY * canvasTransform.scale * canvasTransform.zoomLevel;
    
    let transformStr = '';
    
    // Translate to screen position
    transformStr += `translate(${screenX.toFixed(3)}, ${screenY.toFixed(3)}) `;
    
    // Apply rotation (negative because canvas Y is flipped)
    if (rotation !== 0) {
      transformStr += `rotate(${(-rotation).toFixed(3)}) `;
    }
    
    // Apply final scaling
    if (finalScaleX !== canvasTransform.scale * canvasTransform.zoomLevel || 
        finalScaleY !== canvasTransform.scale * canvasTransform.zoomLevel) {
      transformStr += `scale(${finalScaleX.toFixed(6)}, ${finalScaleY.toFixed(6)}) `;
    } else {
      // Apply default canvas scaling
      transformStr += `scale(${(canvasTransform.scale * canvasTransform.zoomLevel).toFixed(6)}) `;
    }
    
    if (transformStr.trim()) {
      element.setAttribute("transform", transformStr.trim());
    }
  }
  
  // Enhanced transform application
  function applyTransformToSVG(element, transform) {
    if (!transform) return;
    
    const translateX = transform.position?.[0] || 0;
    const translateY = transform.position?.[1] || 0;
    const rotate = transform.rotation || 0;
    const scaleX = transform.scale?.[0] || 1;
    const scaleY = transform.scale?.[1] || 1;
    
    let transformStr = '';
    
    // Translate first
    if (translateX !== 0 || translateY !== 0) {
      transformStr += `translate(${translateX.toFixed(2)}, ${translateY.toFixed(2)}) `;
    }
    
    // Then rotate (negative because SVG Y-axis is flipped)
    if (rotate !== 0) {
      transformStr += `rotate(${(-rotate).toFixed(2)}) `;
    }
    
    // Finally scale
    if (scaleX !== 1 || scaleY !== 1) {
      transformStr += `scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}) `;
    }
    
    if (transformStr.trim()) {
      element.setAttribute("transform", transformStr.trim());
    }
  }
  
  // Format SVG string for better readability
  function formatSVGString(svgString) {
    // Add XML declaration and improve formatting
    return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Generated by Aqui Design Tool -->\n${svgString}`;
  }
  
  // Enhanced download function
  function downloadSVG(svgString, filename) {
    try {
      const blob = new Blob([svgString], { 
        type: 'image/svg+xml;charset=utf-8' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      console.log(`📁 SVG downloaded as: ${filename}`);
      
    } catch (error) {
      console.error('❌ Download failed:', error);
      throw new Error(`Failed to download SVG: ${error.message}`);
    }
  }
  
  // Export utility functions for external use
  export { createSVGShape, applyShapeStyle, addAlphaToColor, applyCanvasTransformToSVG };
