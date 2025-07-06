// booleanRenderer.mjs - Boolean operation result rendering

export class BooleanOperationRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.debugMode = false;
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  renderBooleanResult(shape, styleContext, isSelected, isHovered) {
    const { params } = shape;
    
    if (shape.type === 'path' && params.points) {
      return this.renderBooleanPath(params, styleContext, isSelected, isHovered);
    }

    return false;
  }

  renderBooleanPath(params, styleContext, isSelected, isHovered) {
    const { points } = params;
    if (!points || points.length < 2) return false;

    const nullIndex = points.findIndex(p => p === null);
    const hasHoles = nullIndex !== -1 || params.hasHoles;

    if (hasHoles && nullIndex !== -1) {
      return this.renderPathWithHoles(points, nullIndex, params, styleContext, isSelected, isHovered);
    } else {
      return this.renderSimplePath(points, params, styleContext, isSelected, isHovered);
    }
  }

  renderPathWithHoles(points, nullIndex, params, styleContext, isSelected, isHovered) {
    const outerPath = points.slice(0, nullIndex);
    const innerPath = points.slice(nullIndex + 1);

    if (outerPath.length < 3) {
      return false;
    }

    this.ctx.beginPath();

    if (outerPath.length >= 3) {
      this.ctx.moveTo(outerPath[0][0], outerPath[0][1]);
      for (let i = 1; i < outerPath.length; i++) {
        this.ctx.lineTo(outerPath[i][0], outerPath[i][1]);
      }
      this.ctx.closePath();
    }

    if (innerPath.length >= 3) {
      this.ctx.moveTo(innerPath[0][0], innerPath[0][1]);
      for (let i = 1; i < innerPath.length; i++) {
        this.ctx.lineTo(innerPath[i][0], innerPath[i][1]);
      }
      this.ctx.closePath();
    }

    if (styleContext.shouldFill) {
      this.ctx.fill('evenodd');
    }

    this.ctx.stroke();
    return true;
  }

  renderSimplePath(points, params, styleContext, isSelected, isHovered) {
    this.ctx.beginPath();
    this.ctx.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i][0], points[i][1]);
    }

    if (params.closed !== false) {
      this.ctx.closePath();

      if (styleContext.shouldFill) {
        this.ctx.fill();
      }
    }

    this.ctx.stroke();
    return true;
  }

  renderMultiPartBoolean(params, styleContext, isSelected, isHovered) {
    if (!params.parts || params.parts.length === 0) return false;

    let rendered = false;

    for (const part of params.parts) {
      if (part.points && part.points.length >= 3) {
        this.ctx.beginPath();
        this.ctx.moveTo(part.points[0][0], part.points[0][1]);

        for (let i = 1; i < part.points.length; i++) {
          this.ctx.lineTo(part.points[i][0], part.points[i][1]);
        }

        this.ctx.closePath();

        if (styleContext.shouldFill) {
          this.ctx.fill();
        }

        this.ctx.stroke();
        rendered = true;
      }
    }

    return rendered;
  }

  renderComplexBooleanPath(points, params, styleContext, isSelected, isHovered) {
    if (!points || points.length === 0) return false;

    this.ctx.beginPath();

    let currentPath = [];
    let pathStarted = false;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      if (point === null) {
        if (currentPath.length >= 3) {
          this.drawPathSegment(currentPath, pathStarted);
          pathStarted = true;
        }
        currentPath = [];
      } else {
        currentPath.push(point);
      }
    }

    if (currentPath.length >= 3) {
      this.drawPathSegment(currentPath, pathStarted);
    }

    if (styleContext.shouldFill) {
      this.ctx.fill('evenodd');
    }

    this.ctx.stroke();
    return true;
  }

  drawPathSegment(pathPoints, continueFromPrevious) {
    if (pathPoints.length === 0) return;

    if (!continueFromPrevious) {
      this.ctx.moveTo(pathPoints[0][0], pathPoints[0][1]);
    } else {
      this.ctx.moveTo(pathPoints[0][0], pathPoints[0][1]);
    }

    for (let i = 1; i < pathPoints.length; i++) {
      this.ctx.lineTo(pathPoints[i][0], pathPoints[i][1]);
    }

    this.ctx.closePath();
  }

  renderBooleanWithStyle(shape, styleContext, isSelected, isHovered) {
    const { params } = shape;

    this.ctx.save();

    if (params.operation) {
      this.applyOperationSpecificStyle(params.operation, styleContext, isSelected);
    }

    const result = this.renderBooleanResult(shape, styleContext, isSelected, isHovered);

    this.ctx.restore();

    return result;
  }

  applyOperationSpecificStyle(operation, styleContext, isSelected) {
    if (isSelected) {
      this.ctx.shadowColor = this.getOperationColor(operation) + '40';
      this.ctx.shadowBlur = 8;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
    }

    this.ctx.globalAlpha = operation === 'difference' ? 0.9 : 0.8;
  }

  getOperationColor(operation) {
    const colors = {
      'difference': '#FF5722',
      'union': '#4CAF50',
      'intersection': '#2196F3',
      'xor': '#9C27B0'
    };
    return colors[operation] || '#808080';
  }

  validateBooleanPath(points) {
    if (!Array.isArray(points) || points.length < 3) {
      return { valid: false, reason: 'Insufficient points' };
    }

    let nullCount = 0;
    let segmentLengths = [];
    let currentSegment = 0;

    for (const point of points) {
      if (point === null) {
        nullCount++;
        if (currentSegment > 0) {
          segmentLengths.push(currentSegment);
        }
        currentSegment = 0;
      } else {
        currentSegment++;
      }
    }

    if (currentSegment > 0) {
      segmentLengths.push(currentSegment);
    }

    const hasValidSegments = segmentLengths.every(length => length >= 3);
    
    return {
      valid: hasValidSegments,
      hasHoles: nullCount > 0,
      segmentCount: segmentLengths.length,
      segmentLengths: segmentLengths,
      reason: hasValidSegments ? 'Valid' : 'Invalid segment lengths'
    };
  }

  optimizeBooleanPath(points, tolerance = 1) {
    if (!points || points.length === 0) return points;

    const optimized = [];
    let currentSegment = [];

    for (const point of points) {
      if (point === null) {
        if (currentSegment.length > 0) {
          optimized.push(...this.simplifySegment(currentSegment, tolerance));
          optimized.push(null);
          currentSegment = [];
        }
      } else {
        currentSegment.push(point);
      }
    }

    if (currentSegment.length > 0) {
      optimized.push(...this.simplifySegment(currentSegment, tolerance));
    }

    return optimized;
  }

  simplifySegment(segment, tolerance) {
    if (segment.length <= 3) return segment;

    const simplified = [segment[0]];

    for (let i = 1; i < segment.length - 1; i++) {
      const prev = segment[i - 1];
      const current = segment[i];
      const next = segment[i + 1];

      const distance = this.distanceToLine(current, prev, next);

      if (distance > tolerance) {
        simplified.push(current);
      }
    }

    simplified.push(segment[segment.length - 1]);
    return simplified;
  }

  distanceToLine(point, lineStart, lineEnd) {
    const dx = lineEnd[0] - lineStart[0];
    const dy = lineEnd[1] - lineStart[1];
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      const pdx = point[0] - lineStart[0];
      const pdy = point[1] - lineStart[1];
      return Math.sqrt(pdx * pdx + pdy * pdy);
    }

    const t = Math.max(0, Math.min(1, ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (length * length)));

    const projectedX = lineStart[0] + t * dx;
    const projectedY = lineStart[1] + t * dy;

    const pdx = point[0] - projectedX;
    const pdy = point[1] - projectedY;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }

  getBooleanPathBounds(points) {
    if (!points || points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const point of points) {
      if (point === null) continue;

      const x = point[0];
      const y = point[1];

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  renderBooleanDebugInfo(shape, bounds) {
    if (!this.debugMode || !shape.params.operation) return;

    const { params } = shape;
    const operation = params.operation;

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(bounds.x, bounds.y - 30, 120, 25);

    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${operation.toUpperCase()}`, bounds.x + 5, bounds.y - 10);

    if (params.hasHoles) {
      this.ctx.fillText('HOLES: YES', bounds.x + 5, bounds.y - 45);
    }

    this.ctx.restore();
  }
}
