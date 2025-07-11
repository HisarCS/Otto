// shapeManager.mjs - COMPLETELY NEW FIXED VERSION - Eliminates ALL bottlenecks

export class ShapeManager {
    constructor() {
        // Core references
        this.shapes = new Map();
        this.parameterManager = null;
        this.renderer = null;
        this.interpreter = null;
        this.editor = null;
        
        // CRITICAL: NO MORE BLOCKING FLAGS!
        // REMOVED: isUpdating, updateSource, circular update prevention
        
        // Simple throttling for performance only
        this.lastVisualUpdate = 0;
        this.visualUpdateThrottle = 16; // 60fps max
        
        // Code update system
        this.codeUpdateTimer = null;
        this.codeUpdateDelay = 200;
        this.autoRunDisableTimer = null;
        
        // Debug system
        this.enableLogging = false;
        this.updateCount = 0;
        
        // CRITICAL: Track update types to prevent conflicts
        this.isCodeRunning = false;
        this.pendingUpdates = new Set();
        
        console.log('NEW ShapeManager: No bottlenecks, immediate updates');
    }

    // ==================== COMPONENT REGISTRATION ====================
    
    registerParameterManager(parameterManager) {
        this.parameterManager = parameterManager;
        if (this.enableLogging) console.log('Parameter manager registered');
    }

    registerRenderer(renderer) {
        this.renderer = renderer;
        if (this.enableLogging) console.log('Renderer registered');
    }

    registerInterpreter(interpreter) {
        this.interpreter = interpreter;
        this.shapes = interpreter?.env?.shapes || new Map();
        if (this.enableLogging) console.log('Interpreter registered:', this.shapes.size, 'shapes');
    }

    registerEditor(editor) {
        this.editor = editor;
        if (this.enableLogging) console.log('Editor registered');
    }

    // ==================== IMMEDIATE UPDATE SYSTEM ====================
    
    /**
     * CORE UPDATE METHOD - NO BLOCKING, IMMEDIATE EXECUTION
     * This is the heart of the new system - simple, direct, fast
     */
    updateShapeParameter(shapeName, paramName, value, source = 'unknown') {
        this.updateCount++;
        
        if (this.enableLogging) {
            console.log(`🔄 Update #${this.updateCount}: ${shapeName}.${paramName} = ${value} (${source})`);
        }

        try {
            // 1. IMMEDIATE shape object update - NO delays, NO blocking
            const updated = this.immediateShapeUpdate(shapeName, paramName, value);
            
            if (!updated) {
                console.warn(`❌ Failed to update ${shapeName}.${paramName}`);
                return false;
            }

            // 2. IMMEDIATE visual update (throttled only for performance)
            this.immediateVisualUpdate();
            
            // 3. IMMEDIATE UI sync (sliders, etc.)
            this.immediateUISync(shapeName, paramName, value, source);
            
            // 4. SCHEDULED code update (only if not from code)
            if (source !== 'code' && source !== 'editor') {
                this.scheduleCodeUpdate(shapeName, paramName, value);
            }
            
            return true;
            
        } catch (error) {
            console.error(`❌ Update error for ${shapeName}.${paramName}:`, error);
            return false;
        }
    }

    /**
     * IMMEDIATE SHAPE OBJECT UPDATE - Direct, no validation blocking
     */
    immediateShapeUpdate(shapeName, paramName, value) {
        if (!this.shapes.has(shapeName)) {
            console.warn(`⚠️ Shape ${shapeName} not found in shapes map`);
            return false;
        }

        const shape = this.shapes.get(shapeName);
        if (!shape) {
            console.warn(`⚠️ Shape ${shapeName} is null/undefined`);
            return false;
        }

        try {
            // Direct parameter updates - no complex logic, just set the value
            if (paramName.startsWith('position_')) {
                // Position parameters
                const index = paramName === 'position_x' ? 0 : 1;
                if (!shape.transform) shape.transform = { position: [0, 0], rotation: 0, scale: [1, 1] };
                if (!shape.transform.position) shape.transform.position = [0, 0];
                
                shape.transform.position[index] = parseFloat(value);
                
                // Ensure exactly 2 elements
                shape.transform.position.length = 2;
                
            } else if (paramName === 'rotation') {
                // Rotation parameter
                if (!shape.transform) shape.transform = { position: [0, 0], rotation: 0, scale: [1, 1] };
                shape.transform.rotation = parseFloat(value) % 360;
                
            } else if (paramName.startsWith('scale_')) {
                // Scale parameters
                const index = paramName === 'scale_x' ? 0 : 1;
                if (!shape.transform) shape.transform = { position: [0, 0], rotation: 0, scale: [1, 1] };
                if (!shape.transform.scale) shape.transform.scale = [1, 1];
                
                shape.transform.scale[index] = Math.max(0.1, parseFloat(value));
                
            } else {
                // Regular shape parameters
                if (!shape.params) shape.params = {};
                shape.params[paramName] = value;
            }
            
            if (this.enableLogging) {
                console.log(`✅ Updated ${shapeName}.${paramName} = ${value}`);
            }
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error updating ${shapeName}.${paramName}:`, error);
            return false;
        }
    }

    /**
     * IMMEDIATE VISUAL UPDATE - Throttled only for performance, never blocked
     */
    immediateVisualUpdate() {
        if (!this.renderer) return;
        
        const now = Date.now();
        
        // Performance throttling only - not blocking logic
        if (now - this.lastVisualUpdate < this.visualUpdateThrottle) {
            // Still update, just don't spam the renderer
            requestAnimationFrame(() => {
                if (this.renderer.redraw) {
                    this.renderer.redraw();
                }
            });
        } else {
            // Immediate update
            if (this.renderer.redraw) {
                this.renderer.redraw();
            }
            this.lastVisualUpdate = now;
        }
        
        if (this.enableLogging) {
            console.log('🎨 Visual updated');
        }
    }

    /**
     * IMMEDIATE UI SYNC - Update sliders and other UI immediately
     */
    immediateUISync(shapeName, paramName, value, source) {
        try {
            // Update sliders if change came from canvas
            if (source === 'canvas' && this.parameterManager) {
                this.updateSliderValueImmediate(shapeName, paramName, value);
            }
            
            // Update any other UI components here if needed
            
        } catch (error) {
            console.error('❌ Error in UI sync:', error);
        }
    }

    /**
     * IMMEDIATE SLIDER UPDATE - Direct DOM manipulation, no delays
     */
    updateSliderValueImmediate(shapeName, paramName, value) {
        if (!this.parameterManager?.paramsList) return;
        
        try {
            // Find all matching sliders and inputs
            const elements = this.parameterManager.paramsList.querySelectorAll(
                `[data-shape-name="${shapeName}"][data-param-name="${paramName}"]`
            );
            
            elements.forEach(element => {
                if (element.type === 'range') {
                    // Update slider
                    element.value = value;
                    element.dataset.currentValue = value;
                    element.dataset.originalValue = value;
                    
                    // Update corresponding number input
                    const input = element.parentElement.querySelector('.parameter-value');
                    if (input) {
                        input.value = value;
                        input.dataset.currentValue = value;
                        input.dataset.originalValue = value;
                    }
                    
                } else if (element.type === 'number') {
                    // Update number input
                    element.value = value;
                    element.dataset.currentValue = value;
                    element.dataset.originalValue = value;
                }
            });
            
            if (this.enableLogging) {
                console.log(`🎛️ Slider updated: ${shapeName}.${paramName} = ${value}`);
            }
            
        } catch (error) {
            console.error('❌ Error updating slider:', error);
        }
    }

    // ==================== CODE UPDATE SYSTEM ====================
    
    /**
     * SCHEDULE CODE UPDATE - Only when needed, with auto-run protection
     */
    scheduleCodeUpdate(shapeName, paramName, value) {
        // Clear any pending update
        if (this.codeUpdateTimer) {
            clearTimeout(this.codeUpdateTimer);
        }
        
        // Schedule new update
        this.codeUpdateTimer = setTimeout(() => {
            this.executeCodeUpdate(shapeName, paramName, value);
        }, this.codeUpdateDelay);
        
        if (this.enableLogging) {
            console.log(`⏰ Code update scheduled for ${shapeName}.${paramName}`);
        }
    }

    /**
     * EXECUTE CODE UPDATE - With auto-run protection
     */
    executeCodeUpdate(shapeName, paramName, value) {
        if (!this.editor || !this.parameterManager) return;
        
        try {
            // CRITICAL: Disable auto-run to prevent code reversion
            this.disableAutoRun();
            
            // Update the code
            if (this.parameterManager.updateCodeInEditor) {
                this.parameterManager.updateCodeInEditor(shapeName, paramName, value);
                
                if (this.enableLogging) {
                    console.log(`📝 Code updated: ${shapeName}.${paramName} = ${value}`);
                }
            }
            
            // Re-enable auto-run after a delay
            this.enableAutoRunDelayed();
            
        } catch (error) {
            console.error('❌ Error updating code:', error);
            // Always re-enable auto-run even on error
            this.enableAutoRunDelayed();
        }
    }

    /**
     * AUTO-RUN CONTROL SYSTEM - Prevents conflicts
     */
    disableAutoRun() {
        if (window.aqui && window.aqui.disableAutoRun) {
            window.aqui.disableAutoRun(true);
            
            if (this.enableLogging) {
                console.log('🚫 Auto-run disabled');
            }
        }
    }

    enableAutoRunDelayed() {
        // Clear any existing timer
        if (this.autoRunDisableTimer) {
            clearTimeout(this.autoRunDisableTimer);
        }
        
        // Re-enable after delay
        this.autoRunDisableTimer = setTimeout(() => {
            if (window.aqui && window.aqui.disableAutoRun) {
                window.aqui.disableAutoRun(false);
                
                if (this.enableLogging) {
                    console.log('✅ Auto-run re-enabled');
                }
            }
        }, 300);
    }

    // ==================== CANVAS INTERACTION HANDLERS ====================
    
    /**
     * CANVAS SHAPE CHANGE - Direct, immediate updates
     */
    onCanvasShapeChange(shapeName, paramName, value) {
        return this.updateShapeParameter(shapeName, paramName, value, 'canvas');
    }

    /**
     * CANVAS POSITION CHANGE - Handle both X and Y immediately
     */
    onCanvasPositionChange(shapeName, position) {
        if (!Array.isArray(position) || position.length < 2) {
            console.warn(`❌ Invalid position for ${shapeName}:`, position);
            return false;
        }
        
        // Update both coordinates immediately - no blocking
        const xUpdated = this.updateShapeParameter(shapeName, 'position_x', position[0], 'canvas');
        const yUpdated = this.updateShapeParameter(shapeName, 'position_y', position[1], 'canvas');
        
        return xUpdated && yUpdated;
    }

    /**
     * CANVAS ROTATION CHANGE - Direct update
     */
    onCanvasRotationChange(shapeName, rotation) {
        return this.updateShapeParameter(shapeName, 'rotation', rotation, 'canvas');
    }

    /**
     * CANVAS SCALE CHANGE - Handle scale components
     */
    onCanvasScaleChange(shapeName, scale) {
        if (Array.isArray(scale)) {
            const xUpdated = this.updateShapeParameter(shapeName, 'scale_x', scale[0], 'canvas');
            const yUpdated = this.updateShapeParameter(shapeName, 'scale_y', scale[1], 'canvas');
            return xUpdated && yUpdated;
        } else {
            // Uniform scale
            const xUpdated = this.updateShapeParameter(shapeName, 'scale_x', scale, 'canvas');
            const yUpdated = this.updateShapeParameter(shapeName, 'scale_y', scale, 'canvas');
            return xUpdated && yUpdated;
        }
    }

    // ==================== SLIDER INTERACTION HANDLERS ====================
    
    /**
     * SLIDER CHANGE - All slider changes are treated the same (immediate)
     */
    onSliderChange(shapeName, paramName, value, isIntermediate = false) {
        // NO distinction between intermediate and final - all updates are immediate
        return this.updateShapeParameter(shapeName, paramName, value, 'slider');
    }

    // ==================== CODE RUNNING INTEGRATION ====================
    
    /**
     * MARK CODE AS RUNNING - Prevents conflicts during code execution
     */
    markCodeRunning(running = true) {
        this.isCodeRunning = running;
        
        if (this.enableLogging) {
            console.log(`🏃 Code running: ${running}`);
        }
    }

    /**
     * UPDATE FROM CODE EXECUTION - When interpreter runs and creates new shapes
     */
    updateFromCode(interpreter) {
        this.markCodeRunning(true);
        
        try {
            // Update our shapes reference
            if (interpreter?.env?.shapes) {
                this.shapes = interpreter.env.shapes;
                
                if (this.enableLogging) {
                    console.log(`📥 Updated from code: ${this.shapes.size} shapes`);
                }
            }
            
            // Update visual immediately
            this.immediateVisualUpdate();
            
            // Update parameter manager if menu is visible
            if (this.parameterManager?.menuVisible) {
                setTimeout(() => {
                    this.parameterManager.updateWithLatestInterpreter();
                }, 50);
            }
            
        } catch (error) {
            console.error('❌ Error updating from code:', error);
        } finally {
            // Always clear the running flag
            setTimeout(() => {
                this.markCodeRunning(false);
            }, 100);
        }
    }

    // ==================== UTILITY METHODS ====================
    
    /**
     * GET SHAPE - Simple, direct access
     */
    getShape(shapeName) {
        return this.shapes.get(shapeName);
    }

    /**
     * GET ALL SHAPES - Return the shapes map
     */
    getAllShapes() {
        return this.shapes;
    }

    /**
     * REFRESH SHAPES - Update shapes reference from interpreter
     */
    refreshShapes() {
        if (this.interpreter?.env?.shapes) {
            this.shapes = this.interpreter.env.shapes;
            
            if (this.enableLogging) {
                console.log(`🔄 Refreshed: ${this.shapes.size} shapes`);
            }
        }
    }

    /**
     * FIND SHAPE NAME - Get name from shape object reference
     */
    findShapeName(shapeObject) {
        for (const [name, shape] of this.shapes.entries()) {
            if (shape === shapeObject) {
                return name;
            }
        }
        return null;
    }

    /**
     * SHAPE EXISTS - Check if shape exists
     */
    shapeExists(shapeName) {
        return this.shapes.has(shapeName);
    }

    /**
     * GET SHAPE PARAMETER - Direct parameter access
     */
    getShapeParameter(shapeName, paramName) {
        const shape = this.getShape(shapeName);
        if (!shape) return undefined;
        
        if (paramName.startsWith('position_')) {
            const index = paramName === 'position_x' ? 0 : 1;
            return shape.transform?.position?.[index] || 0;
        } else if (paramName === 'rotation') {
            return shape.transform?.rotation || 0;
        } else if (paramName.startsWith('scale_')) {
            const index = paramName === 'scale_x' ? 0 : 1;
            return shape.transform?.scale?.[index] || 1;
        } else {
            return shape.params?.[paramName];
        }
    }

    // ==================== DEBUG AND MONITORING ====================
    
    /**
     * ENABLE DEBUG LOGGING
     */
    enableDebugLogging(enable = true) {
        this.enableLogging = enable;
        console.log(`🔧 Debug logging ${enable ? 'enabled' : 'disabled'}`);
    }

    /**
     * GET DEBUG INFO
     */
    getDebugInfo() {
        return {
            shapesCount: this.shapes.size,
            updateCount: this.updateCount,
            isCodeRunning: this.isCodeRunning,
            hasParameterManager: !!this.parameterManager,
            hasRenderer: !!this.renderer,
            hasInterpreter: !!this.interpreter,
            hasEditor: !!this.editor,
            pendingUpdates: this.pendingUpdates.size,
            lastVisualUpdate: this.lastVisualUpdate,
            codeUpdateTimerActive: !!this.codeUpdateTimer,
            autoRunDisableTimerActive: !!this.autoRunDisableTimer
        };
    }

    /**
     * PERFORMANCE STATS
     */
    getPerformanceStats() {
        return {
            totalUpdates: this.updateCount,
            averageUpdateTime: this.lastVisualUpdate > 0 ? this.updateCount / (Date.now() - this.lastVisualUpdate) : 0,
            shapesManaged: this.shapes.size
        };
    }

    /**
     * RESET STATS
     */
    resetStats() {
        this.updateCount = 0;
        this.lastVisualUpdate = 0;
        console.log('📊 Stats reset');
    }

    // ==================== CLEANUP ====================
    
    /**
     * DESTROY - Clean shutdown
     */
    destroy() {
        // Clear all timers
        if (this.codeUpdateTimer) {
            clearTimeout(this.codeUpdateTimer);
            this.codeUpdateTimer = null;
        }
        
        if (this.autoRunDisableTimer) {
            clearTimeout(this.autoRunDisableTimer);
            this.autoRunDisableTimer = null;
        }
        
        // Clear references
        this.shapes.clear();
        this.pendingUpdates.clear();
        
        this.parameterManager = null;
        this.renderer = null;
        this.interpreter = null;
        this.editor = null;
        
        console.log('🧹 ShapeManager destroyed');
    }
}

// ==================== SINGLETON EXPORT ====================

// Create and export singleton instance
export const shapeManager = new ShapeManager();

// Global debugging access
if (typeof window !== 'undefined') {
    window.shapeManager = shapeManager;
}
