// shapeManager.mjs - Central coordination system for real-time slider-canvas sync

export class ShapeManager {
    constructor() {
        this.shapes = new Map();
        this.parameterManager = null;
        this.renderer = null;
        this.interpreter = null;
        this.editor = null;
        
        // Update control flags
        this.isUpdating = false; // Prevent circular updates
        this.updateSource = null; // Track where update originated
        
        // Separate timers for different update types
        this.codeUpdateTimer = null;
        this.codeUpdateDelay = 300; // Only for code updates
        
        // Event listeners for debugging
        this.enableLogging = false;
    }

    // ==================== COMPONENT REGISTRATION ====================
    
    registerParameterManager(parameterManager) {
        this.parameterManager = parameterManager;
        if (this.enableLogging) console.log('ShapeManager: Parameter manager registered');
    }

    registerRenderer(renderer) {
        this.renderer = renderer;
        if (this.enableLogging) console.log('ShapeManager: Renderer registered');
    }

    registerInterpreter(interpreter) {
        this.interpreter = interpreter;
        this.shapes = interpreter?.env?.shapes || new Map();
        if (this.enableLogging) console.log('ShapeManager: Interpreter registered with', this.shapes.size, 'shapes');
    }

    registerEditor(editor) {
        this.editor = editor;
        if (this.enableLogging) console.log('ShapeManager: Editor registered');
    }

    // ==================== CENTRAL UPDATE METHOD ====================
    
    updateShapeParameter(shapeName, paramName, value, source = 'unknown') {
        if (this.isUpdating) {
            if (this.enableLogging) console.log('ShapeManager: Blocking circular update from', source);
            return;
        }
        
        this.isUpdating = true;
        this.updateSource = source;
        
        if (this.enableLogging) {
            console.log(`ShapeManager: Updating ${shapeName}.${paramName} = ${value} from ${source}`);
        }

        try {
            // 1. Update the shape object immediately
            const updated = this.updateShapeObject(shapeName, paramName, value);
            
            if (updated) {
                // 2. Immediate visual update (always)
                this.updateVisual(shapeName, source);
                
                // 3. Update other UI components (but not the source)
                this.syncUIComponents(shapeName, paramName, value, source);
                
                // 4. Schedule delayed code update
                this.scheduleCodeUpdate(shapeName, paramName, value);
            }
        } catch (error) {
            console.error('ShapeManager: Error updating parameter:', error);
        } finally {
            this.isUpdating = false;
            this.updateSource = null;
        }
    }

    // ==================== SHAPE OBJECT UPDATES ====================
    
    updateShapeObject(shapeName, paramName, value) {
        if (!this.shapes.has(shapeName)) {
            console.warn(`ShapeManager: Shape ${shapeName} not found`);
            return false;
        }

        const shape = this.shapes.get(shapeName);
        
        try {
            // Handle different parameter types
            if (paramName.startsWith('position_')) {
                const index = paramName === 'position_x' ? 0 : 1;
                if (!shape.transform.position) {
                    shape.transform.position = [0, 0];
                }
                shape.transform.position[index] = value;
                
                // Ensure position array has exactly 2 elements
                if (shape.transform.position.length > 2) {
                    shape.transform.position.length = 2;
                }
            } else if (paramName === 'rotation') {
                shape.transform.rotation = value;
            } else if (paramName.startsWith('scale_')) {
                const index = paramName === 'scale_x' ? 0 : 1;
                if (!shape.transform.scale) {
                    shape.transform.scale = [1, 1];
                }
                shape.transform.scale[index] = value;
            } else {
                // Regular parameter
                shape.params[paramName] = value;
            }
            
            return true;
        } catch (error) {
            console.error(`ShapeManager: Error updating shape ${shapeName}:`, error);
            return false;
        }
    }

    // ==================== VISUAL UPDATES ====================
    
    updateVisual(shapeName, source) {
        if (!this.renderer) return;
        
        try {
            // Immediate visual update - no throttling
            if (this.renderer.redraw) {
                this.renderer.redraw();
            }
            
            if (this.enableLogging && source !== 'canvas') {
                console.log(`ShapeManager: Visual updated for ${shapeName} from ${source}`);
            }
        } catch (error) {
            console.error('ShapeManager: Error updating visual:', error);
        }
    }

    // ==================== UI SYNCHRONIZATION ====================
    
    syncUIComponents(shapeName, paramName, value, source) {
        try {
            // Update sliders if change came from canvas
            if (source === 'canvas' && this.parameterManager) {
                this.updateSliderValue(shapeName, paramName, value);
            }
            
            // Update canvas if change came from slider
            if (source === 'slider' && this.renderer) {
                // Visual already updated in updateVisual, no additional action needed
            }
        } catch (error) {
            console.error('ShapeManager: Error syncing UI components:', error);
        }
    }

    updateSliderValue(shapeName, paramName, value) {
        if (!this.parameterManager || !this.parameterManager.paramsList) return;
        
        try {
            // Find the slider for this parameter
            const sliders = this.parameterManager.paramsList.querySelectorAll(
                `[data-shape-name="${shapeName}"][data-param-name="${paramName}"]`
            );
            
            sliders.forEach(slider => {
                if (slider.type === 'range') {
                    // Update slider value without triggering events
                    const oldValue = slider.value;
                    slider.value = value;
                    slider.dataset.currentValue = value;
                    slider.dataset.originalValue = value;
                    
                    // Update corresponding input field
                    const input = slider.parentElement.querySelector('.parameter-value');
                    if (input) {
                        input.value = value;
                        input.dataset.currentValue = value;
                        input.dataset.originalValue = value;
                    }
                    
                    if (this.enableLogging) {
                        console.log(`ShapeManager: Updated slider ${shapeName}.${paramName}: ${oldValue} → ${value}`);
                    }
                } else if (slider.type === 'number') {
                    slider.value = value;
                    slider.dataset.currentValue = value;
                    slider.dataset.originalValue = value;
                }
            });
        } catch (error) {
            console.error('ShapeManager: Error updating slider value:', error);
        }
    }

    // ==================== CODE UPDATES ====================
    
    scheduleCodeUpdate(shapeName, paramName, value) {
        // Clear existing timer
        if (this.codeUpdateTimer) {
            clearTimeout(this.codeUpdateTimer);
        }
        
        // Schedule delayed code update
        this.codeUpdateTimer = setTimeout(() => {
            this.updateCodeInEditor(shapeName, paramName, value);
        }, this.codeUpdateDelay);
    }

    updateCodeInEditor(shapeName, paramName, value) {
        if (!this.editor || !this.parameterManager) return;
        
        try {
            // Use the existing code update logic from parameter manager
            if (this.parameterManager.updateCodeInEditor) {
                this.parameterManager.updateCodeInEditor(shapeName, paramName, value);
            }
            
            if (this.enableLogging) {
                console.log(`ShapeManager: Code updated for ${shapeName}.${paramName} = ${value}`);
            }
        } catch (error) {
            console.error('ShapeManager: Error updating code:', error);
        }
    }

    // ==================== CANVAS INTERACTION HANDLERS ====================
    
    onCanvasShapeChange(shapeName, paramName, value) {
        this.updateShapeParameter(shapeName, paramName, value, 'canvas');
    }

    onCanvasPositionChange(shapeName, position) {
        // Handle position as two separate parameters
        this.updateShapeParameter(shapeName, 'position_x', position[0], 'canvas');
        this.updateShapeParameter(shapeName, 'position_y', position[1], 'canvas');
    }

    onCanvasRotationChange(shapeName, rotation) {
        this.updateShapeParameter(shapeName, 'rotation', rotation, 'canvas');
    }

    onCanvasScaleChange(shapeName, scale) {
        if (Array.isArray(scale)) {
            this.updateShapeParameter(shapeName, 'scale_x', scale[0], 'canvas');
            this.updateShapeParameter(shapeName, 'scale_y', scale[1], 'canvas');
        } else {
            // Uniform scale
            this.updateShapeParameter(shapeName, 'scale_x', scale, 'canvas');
            this.updateShapeParameter(shapeName, 'scale_y', scale, 'canvas');
        }
    }

    // ==================== SLIDER INTERACTION HANDLERS ====================
    
    onSliderChange(shapeName, paramName, value, isIntermediate = false) {
        if (isIntermediate) {
            // Immediate visual feedback during slider drag
            this.updateShapeParameter(shapeName, paramName, value, 'slider');
        } else {
            // Final value when slider is released
            this.updateShapeParameter(shapeName, paramName, value, 'slider');
        }
    }

    // ==================== UTILITY METHODS ====================
    
    getShape(shapeName) {
        return this.shapes.get(shapeName);
    }

    getAllShapes() {
        return this.shapes;
    }

    refreshShapes() {
        if (this.interpreter?.env?.shapes) {
            this.shapes = this.interpreter.env.shapes;
            if (this.enableLogging) {
                console.log('ShapeManager: Refreshed shapes, now have', this.shapes.size, 'shapes');
            }
        }
    }

    // Find shape name by shape object reference
    findShapeName(shapeObject) {
        for (const [name, shape] of this.shapes.entries()) {
            if (shape === shapeObject) {
                return name;
            }
        }
        return null;
    }

    // ==================== DEBUG METHODS ====================
    
    enableDebugLogging(enable = true) {
        this.enableLogging = enable;
        console.log('ShapeManager: Debug logging', enable ? 'enabled' : 'disabled');
    }

    getDebugInfo() {
        return {
            shapesCount: this.shapes.size,
            hasParameterManager: !!this.parameterManager,
            hasRenderer: !!this.renderer,
            hasInterpreter: !!this.interpreter,
            hasEditor: !!this.editor,
            isUpdating: this.isUpdating,
            updateSource: this.updateSource
        };
    }

    // ==================== CLEANUP ====================
    
    destroy() {
        if (this.codeUpdateTimer) {
            clearTimeout(this.codeUpdateTimer);
        }
        
        this.shapes.clear();
        this.parameterManager = null;
        this.renderer = null;
        this.interpreter = null;
        this.editor = null;
        
        console.log('ShapeManager: Destroyed');
    }
}

// Export singleton instance
export const shapeManager = new ShapeManager();
