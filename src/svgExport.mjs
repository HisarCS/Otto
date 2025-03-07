// svgExport.mjs - Create this as a new file

// Main export function
export function exportToSVG(interpreter, canvas, filename = "aqui_drawing.svg") {
    try {
      if (!interpreter?.env?.shapes) {
        throw new Error('No shapes to export');
      }
  
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      
      svg.setAttribute("xmlns", svgNS);
      svg.setAttribute("width", canvas.width);
      svg.setAttribute("height", canvas.height);
      svg.setAttribute("viewBox", `0 0 ${canvas.width} ${canvas.height}`);
  
      // Create an SVG group for coordinate system transformation
      const mainGroup = document.createElementNS(svgNS, "g");
      // Transform to match canvas coordinate system (origin at center, y-axis inverted)
      mainGroup.setAttribute("transform", `translate(${canvas.width/2} ${canvas.height/2}) scale(1, -1)`);
      
      svg.appendChild(mainGroup);
  
      // Process shapes
      interpreter.env.shapes.forEach((shape) => {
        const shapeElement = createSVGShape(shape, svgNS);
        if (shapeElement) {
          // Apply transformations
          applyTransformToSVG(shapeElement, shape.transform);
          mainGroup.appendChild(shapeElement);
        }
      });
  
      // Add layer groups - each layer gets its own group with transformations
      interpreter.env.layers.forEach((layer) => {
        const layerGroup = document.createElementNS(svgNS, "g");
        // Apply layer transformations
        applyTransformToSVG(layerGroup, layer.transform);
        
        // Add all shapes from this layer
        layer.addedShapes.forEach(shapeName => {
          if (interpreter.env.shapes.has(shapeName)) {
            const shape = interpreter.env.shapes.get(shapeName);
            const shapeElement = createSVGShape(shape, svgNS);
            if (shapeElement) {
              // Apply shape-specific transformations
              applyTransformToSVG(shapeElement, shape.transform);
              layerGroup.appendChild(shapeElement);
            }
          }
        });
        
        mainGroup.appendChild(layerGroup);
      });
  
      // Create and trigger download
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  
      return true;
    } catch (error) {
      console.error('SVG Export error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  function createSVGShape(shape, svgNS) {
    const { type, params } = shape;
    
    switch (type) {
      case 'path':
        return createSVGPath(params, svgNS);
      
      case 'circle':
        return createSVGCircle(params, svgNS);
        
      case 'rectangle':
        return createSVGRectangle(params, svgNS);
        
      case 'ellipse':
        return createSVGEllipse(params, svgNS);
        
      case 'polygon':
        return createSVGPolygon(params, svgNS);
        
      case 'star':
        return createSVGStar(params, svgNS);
        
      case 'triangle':
        return createSVGTriangle(params, svgNS);
        
      case 'text':
        return createSVGText(params, svgNS);
        
      case 'arc':
        return createSVGArc(params, svgNS);
        
      case 'roundedRectangle':
        return createSVGRoundedRectangle(params, svgNS);
        
      case 'donut':
        return createSVGDonut(params, svgNS);
        
      case 'gear':
        return createSVGGear(params, svgNS);
      
      default:
        console.warn(`SVG export: Using generic export for shape type: ${type}`);
        return createSVGGenericShape(type, params, svgNS);
    }
  }
  
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
      
      path.setAttribute("fill", "none");
    } else if (params.isBezier) {
      const pts = params.points;
      pathData = `M ${pts[0][0]} ${pts[0][1]} C ${pts[1][0]} ${pts[1][1]}, ${pts[2][0]} ${pts[2][1]}, ${pts[3][0]} ${pts[3][1]}`;
      path.setAttribute("fill", "none");
    } else if (params.points) {
      const pts = params.points;
      if (pts.length < 2) return null;
      
      pathData = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        pathData += ` L ${pts[i][0]} ${pts[i][1]}`;
      }
      pathData += " Z";
      path.setAttribute("fill", params.isHole ? "white" : "rgba(0, 0, 0, 0.1)");
    }
  
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", "#000000");
    path.setAttribute("stroke-width", "2");
    
    return path;
  }
  
  function createSVGCircle(params, svgNS) {
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", 0);
    circle.setAttribute("cy", 0);
    circle.setAttribute("r", params.radius);
    circle.setAttribute("stroke", "#000000");
    circle.setAttribute("stroke-width", "2");
    circle.setAttribute("fill", "rgba(0, 0, 0, 0.1)");
    return circle;
  }
  
  function createSVGRectangle(params, svgNS) {
    const rect = document.createElementNS(svgNS, "rect");
    const width = params.width;
    const height = params.height;
    rect.setAttribute("x", -width/2);
    rect.setAttribute("y", -height/2);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("stroke", "#000000");
    rect.setAttribute("stroke-width", "2");
    rect.setAttribute("fill", "rgba(0, 0, 0, 0.1)");
    return rect;
  }
  
  function createSVGRoundedRectangle(params, svgNS) {
    const rect = document.createElementNS(svgNS, "rect");
    const width = params.width;
    const height = params.height;
    const radius = params.radius || 10;
    
    rect.setAttribute("x", -width/2);
    rect.setAttribute("y", -height/2);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("rx", radius);
    rect.setAttribute("ry", radius);
    rect.setAttribute("stroke", "#000000");
    rect.setAttribute("stroke-width", "2");
    rect.setAttribute("fill", "rgba(0, 0, 0, 0.1)");
    return rect;
  }
  
  function createSVGEllipse(params, svgNS) {
    const ellipse = document.createElementNS(svgNS, "ellipse");
    ellipse.setAttribute("cx", 0);
    ellipse.setAttribute("cy", 0);
    ellipse.setAttribute("rx", params.radiusX);
    ellipse.setAttribute("ry", params.radiusY);
    ellipse.setAttribute("stroke", "#000000");
    ellipse.setAttribute("stroke-width", "2");
    ellipse.setAttribute("fill", "rgba(0, 0, 0, 0.1)");
    return ellipse;
  }
  
  function createSVGPolygon(params, svgNS) {
    // Create a regular polygon with N sides
    const polygon = document.createElementNS(svgNS, "polygon");
    const sides = params.sides || 6;
    const radius = params.radius || 50;
    let points = "";
    
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      points += `${x},${y} `;
    }
    
    polygon.setAttribute("points", points.trim());
    polygon.setAttribute("stroke", "#000000");
    polygon.setAttribute("stroke-width", "2");
    polygon.setAttribute("fill", "rgba(0, 0, 0, 0.1)");
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
      pointsStr += `${x},${y} `;
    }
    
    star.setAttribute("points", pointsStr.trim());
    star.setAttribute("stroke", "#000000");
    star.setAttribute("stroke-width", "2");
    star.setAttribute("fill", "rgba(0, 0, 0, 0.1)");
    return star;
  }
  
  function createSVGTriangle(params, svgNS) {
    const triangle = document.createElementNS(svgNS, "polygon");
    const base = params.base || 60;
    const height = params.height || 80;
    const points = `${-base/2},${-height/2} ${base/2},${-height/2} 0,${height/2}`;
    
    triangle.setAttribute("points", points);
    triangle.setAttribute("stroke", "#000000");
    triangle.setAttribute("stroke-width", "2");
    triangle.setAttribute("fill", "rgba(0, 0, 0, 0.1)");
    return triangle;
  }
  
  function createSVGText(params, svgNS) {
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", 0);
    text.setAttribute("y", 0);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", params.fontFamily || "Arial");
    text.setAttribute("font-size", params.fontSize || 12);
    text.setAttribute("stroke", "#000000");
    text.setAttribute("stroke-width", "1");
    text.setAttribute("fill", "none");
    text.textContent = params.text || "";
    return text;
  }
  
  function createSVGArc(params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    const radius = params.radius || 50;
    const startAngle = (params.startAngle || 0) * Math.PI / 180;
    const endAngle = (params.endAngle || 360) * Math.PI / 180;
    
    const startX = Math.cos(startAngle) * radius;
    const startY = Math.sin(startAngle) * radius;
    
    // For a full circle
    const isFullCircle = Math.abs(endAngle - startAngle) >= 2 * Math.PI - 0.001;
    
    let pathData;
    if (isFullCircle) {
      pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${startX - 0.001} ${startY} A ${radius} ${radius} 0 1 1 ${startX} ${startY}`;
    } else {
      // For an arc
      const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
      const sweepFlag = 1; // Always drawing in one direction
      
      const endX = Math.cos(endAngle) * radius;
      const endY = Math.sin(endAngle) * radius;
      
      pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
    }
    
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", "#000000");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    
    return path;
  }
  
  function createSVGDonut(params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    const outerRadius = params.outerRadius || 50;
    const innerRadius = params.innerRadius || 20;
    
    // Create outer circle
    let pathData = `M ${outerRadius} 0 A ${outerRadius} ${outerRadius} 0 1 0 ${-outerRadius} 0 A ${outerRadius} ${outerRadius} 0 1 0 ${outerRadius} 0 `;
    
    // Create inner circle (counter-clockwise to create hole)
    pathData += `M ${innerRadius} 0 A ${innerRadius} ${innerRadius} 0 1 1 ${-innerRadius} 0 A ${innerRadius} ${innerRadius} 0 1 1 ${innerRadius} 0`;
    
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", "#000000");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "rgba(0, 0, 0, 0.1)");
    path.setAttribute("fill-rule", "evenodd");
    
    return path;
  }
  
  function createSVGGear(params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    const N = params.teeth || 12;
    const diameter = params.diameter || 100;
    const r = diameter / 2;
    
    // Simplified gear SVG for export
    let pathData = "";
    
    for (let i = 0; i < N; i++) {
      const angle1 = (i / N) * Math.PI * 2;
      const angle2 = ((i + 0.4) / N) * Math.PI * 2;
      const angle3 = ((i + 0.5) / N) * Math.PI * 2;
      const angle4 = ((i + 0.6) / N) * Math.PI * 2;
      const angle5 = ((i + 1) / N) * Math.PI * 2;
      
      const x1 = Math.cos(angle1) * r;
      const y1 = Math.sin(angle1) * r;
      const x2 = Math.cos(angle2) * r;
      const y2 = Math.sin(angle2) * r;
      const x3 = Math.cos(angle3) * (r * 1.2);
      const y3 = Math.sin(angle3) * (r * 1.2);
      const x4 = Math.cos(angle4) * (r * 1.2);
      const y4 = Math.sin(angle4) * (r * 1.2);
      const x5 = Math.cos(angle5) * r;
      const y5 = Math.sin(angle5) * r;
      
      if (i === 0) {
        pathData += `M ${x1} ${y1} `;
      }
      
      pathData += `L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} L ${x5} ${y5} `;
    }
    
    pathData += "Z";
    
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", "#000000");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "rgba(0, 0, 0, 0.1)");
    
    // Add shaft if specified
    if (params.shaft) {
      const shaftGroup = document.createElementNS(svgNS, "g");
      shaftGroup.appendChild(path);
      
      const shaftElement = document.createElementNS(svgNS, 
        params.shaft.toLowerCase() === "circle" ? "circle" : "rect");
      
      const shaftSize = params.shaftSize || diameter * 0.2;
      
      if (params.shaft.toLowerCase() === "circle") {
        shaftElement.setAttribute("cx", 0);
        shaftElement.setAttribute("cy", 0);
        shaftElement.setAttribute("r", shaftSize / 2);
      } else {
        const halfSize = shaftSize / 2;
        shaftElement.setAttribute("x", -halfSize);
        shaftElement.setAttribute("y", -halfSize);
        shaftElement.setAttribute("width", shaftSize);
        shaftElement.setAttribute("height", shaftSize);
      }
      
      shaftElement.setAttribute("stroke", "#000000");
      shaftElement.setAttribute("stroke-width", "2");
      shaftElement.setAttribute("fill", "rgba(0, 0, 0, 0.2)");
      
      shaftGroup.appendChild(shaftElement);
      return shaftGroup;
    }
    
    return path;
  }
  
  // Generic shape creator for unsupported shapes by approximating with a path
  function createSVGGenericShape(type, params, svgNS) {
    const path = document.createElementNS(svgNS, "path");
    let pathData = "";
    
    // Default fallback - create a rectangle with the shape type text
    const size = 30;
    pathData = `M ${-size} ${-size} L ${size} ${-size} L ${size} ${size} L ${-size} ${size} Z`;
    path.setAttribute("fill", "rgba(0, 0, 0, 0.1)");
    
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", "#000000");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("data-original-type", type);
    
    // Add a text label with the shape type
    const group = document.createElementNS(svgNS, "g");
    group.appendChild(path);
    
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", 0);
    text.setAttribute("y", 0);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-family", "Arial");
    text.setAttribute("font-size", 12);
    text.setAttribute("fill", "#000000");
    text.textContent = type;
    
    group.appendChild(text);
    return group;
  }
  
  function applyTransformToSVG(element, transform) {
    if (!transform) return;
    
    const translateX = transform.position[0] || 0;
    const translateY = transform.position[1] || 0;
    const rotate = transform.rotation || 0;
    const scaleX = transform.scale[0] || 1;
    const scaleY = transform.scale[1] || 1;
    
    // SVG transforms are applied in the opposite order of their listing
    let transformStr = '';
    
    // Scale first
    if (scaleX !== 1 || scaleY !== 1) {
      transformStr += `scale(${scaleX}, ${scaleY}) `;
    }
    
    // Then rotate
    if (rotate !== 0) {
      transformStr += `rotate(${-rotate}) `; // Negative because SVG rotation direction
    }
    
    // Then translate
    if (translateX !== 0 || translateY !== 0) {
      transformStr += `translate(${translateX}, ${translateY}) `;
    }
    
    if (transformStr) {
      element.setAttribute("transform", transformStr.trim());
    }
  }
