// styleManager.mjs - Shape styling, colors, and visual properties

export class ShapeStyleManager {
  constructor() {
    this.colorSystem = new ColorSystem();
  }

  createStyleContext(shape, isSelected, isHovered) {
    const { params } = shape;

    return {
      shouldFill: this.shouldShapeBeFilled(params),
      fillColor: this.getFillColor(params, isSelected, isHovered),
      fillOpacity: this.getFillOpacity(params),
      strokeColor: this.getStrokeColor(params, isSelected, isHovered),
      strokeWidth: this.getStrokeWidth(params, isSelected, isHovered)
    };
  }

  applyStyle(ctx, styleContext) {
    if (styleContext.shouldFill) {
      if (styleContext.fillOpacity < 1) {
        const rgb = this.colorSystem.hexToRgb(styleContext.fillColor);
        if (rgb) {
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${styleContext.fillOpacity})`;
        } else {
          ctx.fillStyle = styleContext.fillColor;
        }
      } else {
        ctx.fillStyle = styleContext.fillColor;
      }
    } else {
      ctx.fillStyle = 'transparent';
    }

    ctx.strokeStyle = styleContext.strokeColor;
    ctx.lineWidth = styleContext.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  shouldShapeBeFilled(params) {
    if (params.fill === true || params.filled === true) return true;
    if (params.fill === false || params.filled === false) return false;
    if (params.fillColor) return true;

    if (params.operation && ['difference', 'union', 'intersection'].includes(params.operation)) {
      return true;
    }

    if (params.hasHoles || (params.points && params.points.includes(null))) {
      return true;
    }

    return false;
  }

  getFillColor(params, isSelected, isHovered) {
    if (isSelected) {
      if (params.operation === 'difference') return '#FF572240';
      if (params.operation === 'union') return '#4CAF5040';
      if (params.operation === 'intersection') return '#2196F340';
      return '#FF572220';
    }

    if (params.fillColor) {
      return this.colorSystem.resolveColor(params.fillColor);
    }

    if (params.color && (params.fill === true || params.filled === true)) {
      return this.colorSystem.resolveColor(params.color);
    }

    if (params.operation) {
      switch (params.operation) {
        case 'difference': return '#FF572280';
        case 'union': return '#4CAF5080';
        case 'intersection': return '#2196F380';
        default: return '#808080';
      }
    }

    return '#808080';
  }

  getFillOpacity(params) {
    if (params.opacity !== undefined) {
      return Math.max(0, Math.min(1, params.opacity));
    }
    if (params.alpha !== undefined) {
      return Math.max(0, Math.min(1, params.alpha));
    }
    return 0.7;
  }

  getStrokeColor(params, isSelected, isHovered) {
    if (isSelected) return '#FF5722';
    if (isHovered) return '#FF6B35';
    if (params.strokeColor) return this.colorSystem.resolveColor(params.strokeColor);
    if (params.color && !params.fillColor) return this.colorSystem.resolveColor(params.color);
    return '#374151';
  }

  getStrokeWidth(params, isSelected, isHovered) {
    if (isSelected) return 2;
    if (isHovered) return 1.5;
    if (params.strokeWidth !== undefined) return Math.max(0.1, params.strokeWidth);
    if (params.thickness !== undefined) return Math.max(0.1, params.thickness);
    return 2;
  }
}

export class ColorSystem {
  constructor() {
    this.operationColors = {
      difference: '#FF5722',
      union: '#4CAF50',
      intersection: '#2196F3'
    };

    this.namedColors = {
      'red': '#FF0000', 'green': '#008000', 'blue': '#0000FF',
      'yellow': '#FFFF00', 'orange': '#FFA500', 'purple': '#800080',
      'pink': '#FFC0CB', 'brown': '#A52A2A', 'black': '#000000',
      'white': '#FFFFFF', 'gray': '#808080', 'grey': '#808080',
      'lightgray': '#D3D3D3', 'lightgrey': '#D3D3D3',
      'darkgray': '#A9A9A9', 'darkgrey': '#A9A9A9',
      'cyan': '#00FFFF', 'magenta': '#FF00FF', 'lime': '#00FF00',
      'navy': '#000080', 'teal': '#008080', 'silver': '#C0C0C0',
      'gold': '#FFD700', 'transparent': 'transparent'
    };
  }

  getOperationColor(operation) {
    return this.operationColors[operation] || '#000000';
  }

  resolveColor(color) {
    if (typeof color === 'string') {
      if (color.startsWith('#')) return color;
      return this.namedColors[color.toLowerCase()] || color;
    }
    return color;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  isValidColor(colorString) {
    if (!colorString || typeof colorString !== 'string') {
      return false;
    }
    
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(colorString)) {
      return true;
    }
    
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(colorString)) {
      return true;
    }
    
    if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/.test(colorString)) {
      return true;
    }
    
    return !!this.namedColors[colorString.toLowerCase()];
  }

  addAlphaToColor(color, alpha) {
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

  blendColors(color1, color2, ratio) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
    const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
    const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  getContrastColor(backgroundColor) {
    const rgb = this.hexToRgb(backgroundColor);
    if (!rgb) return '#000000';
    
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }
}
