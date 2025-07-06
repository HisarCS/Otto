// pathRenderer.mjs - Path and curve rendering

export class PathRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  renderPath(params, styleContext, isSelected, isHovered) {
    if (params.isTurtlePath) {
      return this.renderTurtlePath(params, styleContext, isSelected, isHovered);
    } else if (params.isBezier) {
      return this.renderBezierPath(params, styleContext, isSelected, isHovered);
    } else {
      return this.renderRegularPath(params, styleContext, isSelected, isHovered);
    }
  }

  renderTurtlePath(params, styleContext, isSelected, isHovered) {
    if (!params.subPaths || params.subPaths.length === 0) return false;

    for (const path of params.subPaths) {
      if (path.length >= 2) {
        this.ctx.beginPath();
        this.ctx.moveTo(path[0][0], path[0][1]);

        for (let i = 1; i < path.length; i++) {
          this.ctx.lineTo(path[i][0], path[i][1]);
        }

        this.ctx.stroke();
      }
    }
    return true;
  }

  renderBezierPath(params, styleContext, isSelected, isHovered) {
    if (!params.points || params.points.length < 4) return false;
    
    const points = params.points;
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0][0], points[0][1]);
    
    if (points.length === 4) {
      this.ctx.bezierCurveTo(
        points[1][0], points[1][1],
        points[2][0], points[2][1],
        points[3][0], points[3][1]
      );
    } else {
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i][0], points[i][1]);
      }
    }
    
    this.ctx.stroke();
    
    if (isSelected && params.showControlPoints !== false) {
      this.renderBezierControlPoints(points);
    }
    
    return true;
  }

  renderRegularPath(params, styleContext, isSelected, isHovered) {
    const { points } = params;
    if (!points || points.length < 2) return false;

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

  renderBezierControlPoints(points) {
    this.ctx.save();
    this.ctx.setLineDash([3, 3]);
    this.ctx.strokeStyle = '#999999';
    this.ctx.lineWidth = 1;
    
    if (points.length >= 4) {
      this.ctx.beginPath();
      this.ctx.moveTo(points[0][0], points[0][1]);
      this.ctx.lineTo(points[1][0], points[1][1]);
      this.ctx.moveTo(points[2][0], points[2][1]);
      this.ctx.lineTo(points[3][0], points[3][1]);
      this.ctx.stroke();
      
      for (let i = 0; i < Math.min(4, points.length); i++) {
        this.ctx.beginPath();
        this.ctx.arc(points[i][0], points[i][1], 3, 0, Math.PI * 2);
        this.ctx.fillStyle = i === 0 || i === 3 ? '#FF5722' : '#2196F3';
        this.ctx.fill();
      }
    }
    
    this.ctx.restore();
  }

  renderPathWithMarkers(params, styleContext, isSelected, isHovered) {
    const renderResult = this.renderPath(params, styleContext, isSelected, isHovered);
    
    if (renderResult && (params.startMarker || params.endMarker)) {
      this.renderPathMarkers(params, styleContext);
    }
    
    return renderResult;
  }

  renderPathMarkers(params, styleContext) {
    const { points } = params;
    if (!points || points.length < 2) return;
    
    if (params.startMarker) {
      this.renderMarker(points[0], points[1], params.startMarker, styleContext);
    }
    
    if (params.endMarker) {
      const lastIndex = points.length - 1;
      this.renderMarker(points[lastIndex], points[lastIndex - 1], params.endMarker, styleContext);
    }
  }

  renderMarker(point, direction, markerType, styleContext) {
    if (!point || !direction) return;
    
    const dx = direction[0] - point[0];
    const dy = direction[1] - point[1];
    const angle = Math.atan2(dy, dx);
    
    this.ctx.save();
    this.ctx.translate(point[0], point[1]);
    this.ctx.rotate(angle);
    
    switch (markerType) {
      case 'arrow':
        this.renderArrowMarker(styleContext);
        break;
      case 'circle':
        this.renderCircleMarker(styleContext);
        break;
      case 'square':
        this.renderSquareMarker(styleContext);
        break;
      default:
        this.renderArrowMarker(styleContext);
    }
    
    this.ctx.restore();
  }

  renderArrowMarker(styleContext) {
    const size = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(-size, -size/2);
    this.ctx.lineTo(-size, size/2);
    this.ctx.closePath();
    
    if (styleContext.shouldFill) {
      this.ctx.fill();
    }
    this.ctx.stroke();
  }

  renderCircleMarker(styleContext) {
    const radius = 4;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    
    if (styleContext.shouldFill) {
      this.ctx.fill();
    }
    this.ctx.stroke();
  }

  renderSquareMarker(styleContext) {
    const size = 6;
    this.ctx.beginPath();
    this.ctx.rect(-size/2, -size/2, size, size);
    
    if (styleContext.shouldFill) {
      this.ctx.fill();
    }
    this.ctx.stroke();
  }

  renderSmoothPath(params, styleContext, isSelected, isHovered) {
    const { points } = params;
    if (!points || points.length < 3) {
      return this.renderRegularPath(params, styleContext, isSelected, isHovered);
    }
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0][0], points[0][1]);
    
    for (let i = 1; i < points.length - 1; i++) {
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      
      const controlX = (currentPoint[0] + nextPoint[0]) / 2;
      const controlY = (currentPoint[1] + nextPoint[1]) / 2;
      
      this.ctx.quadraticCurveTo(currentPoint[0], currentPoint[1], controlX, controlY);
    }
    
    this.ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);
    
    if (params.closed !== false && points.length > 2) {
      this.ctx.closePath();
      if (styleContext.shouldFill) {
        this.ctx.fill();
      }
    }
    
    this.ctx.stroke();
    return true;
  }

  renderDashedPath(params, styleContext, isSelected, isHovered) {
    const dashPattern = params.dashPattern || [5, 5];
    
    this.ctx.save();
    this.ctx.setLineDash(dashPattern);
    
    const result = this.renderPath(params, styleContext, isSelected, isHovered);
    
    this.ctx.restore();
    return result;
  }

  renderAnimatedPath(params, styleContext, isSelected, isHovered, animationProgress = 0) {
    const { points } = params;
    if (!points || points.length < 2) return false;
    
    const totalLength = this.calculatePathLength(points);
    const currentLength = totalLength * animationProgress;
    
    let accumulatedLength = 0;
    let visiblePoints = [points[0]];
    
    for (let i = 1; i < points.length; i++) {
      const segmentLength = this.calculateDistance(points[i-1], points[i]);
      
      if (accumulatedLength + segmentLength <= currentLength) {
        visiblePoints.push(points[i]);
        accumulatedLength += segmentLength;
      } else {
        const remainingLength = currentLength - accumulatedLength;
        const ratio = remainingLength / segmentLength;
        
        const interpolatedPoint = [
          points[i-1][0] + (points[i][0] - points[i-1][0]) * ratio,
          points[i-1][1] + (points[i][1] - points[i-1][1]) * ratio
        ];
        
        visiblePoints.push(interpolatedPoint);
        break;
      }
    }
    
    if (visiblePoints.length >= 2) {
      const animatedParams = { ...params, points: visiblePoints, closed: false };
      return this.renderRegularPath(animatedParams, styleContext, isSelected, isHovered);
    }
    
    return false;
  }

  calculatePathLength(points) {
    let totalLength = 0;
    
    for (let i = 1; i < points.length; i++) {
      totalLength += this.calculateDistance(points[i-1], points[i]);
    }
    
    return totalLength;
  }

  calculateDistance(point1, point2) {
    const dx = point2[0] - point1[0];
    const dy = point2[1] - point1[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  getPathBounds(points) {
    if (!points || points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (const point of points) {
      if (point === null) continue;
      
      const x = Array.isArray(point) ? point[0] : point.x;
      const y = Array.isArray(point) ? point[1] : point.y;
      
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

  simplifyPath(points, tolerance = 1) {
    if (!points || points.length <= 2) return points;
    
    const simplified = [points[0]];
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];
      
      const distance = this.distanceToLine(current, prev, next);
      
      if (distance > tolerance) {
        simplified.push(current);
      }
    }
    
    simplified.push(points[points.length - 1]);
    return simplified;
  }

  distanceToLine(point, lineStart, lineEnd) {
    const dx = lineEnd[0] - lineStart[0];
    const dy = lineEnd[1] - lineStart[1];
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return this.calculateDistance(point, lineStart);
    
    const t = Math.max(0, Math.min(1, ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (length * length)));
    
    const projectedX = lineStart[0] + t * dx;
    const projectedY = lineStart[1] + t * dy;
    
    return this.calculateDistance(point, [projectedX, projectedY]);
  }
}
