%%{init: {'theme': 'neutral', 'themeVariables': {'fontSize': '10px'}}}%%
graph TD
    %% Core Language Infrastructure
    subgraph "Core Language Infrastructure"
        CodeEditor[Code Editor]
        Lexer[Lexer.mjs]
        Parser[Parser.mjs]
        AST[Abstract Syntax Tree]
        Interpreter[Interpreter.mjs]
        Environment[Environment.mjs]
        
        %% Language Features
        ParametricSystem[Parametric Design System]
        ControlStructures[Control Structures]
        TransformSystem[Geometric Transform System]
        
        %% Parametric Capabilities
        ParameterManagement[Parameter Management]
        ConditionEvaluation[Conditional Evaluation]
        LoopGeneration[Generative Loop System]
        
        CodeEditor -->|Source Code| Lexer
        Lexer -->|Tokenize| Parser
        Parser -->|Generate| AST
        AST -->|Interpret| Interpreter
        Interpreter -->|Manage State| Environment
        
        Environment -->|Define Parameters| ParameterManagement
        Interpreter -->|Evaluate Conditions| ConditionEvaluation
        Interpreter -->|Generate Iterations| LoopGeneration
    end
    
    %% Shape and Geometry System
    subgraph "Shape & Geometry System"
        ShapeRegistry[Shape Registry]
        GeometryGenerator[Geometry Generator]
        BooleanOperations[Boolean Operator System]
        
        ShapeRegistry -->|Define Shapes| GeometryGenerator
        GeometryGenerator -->|Create Complex Geometries| BooleanOperations
    end
    
    %% Rendering Pipelines
    subgraph "Rendering Pipelines"
        %% 2D Rendering
        subgraph "2D Rendering"
            Canvas2D[2D Canvas Renderer]
            SVGExporter[SVG Exporter]
            Renderer2D[2D Shape Renderer]
            
            Renderer2D -->|Draw| Canvas2D
            Renderer2D -->|Export| SVGExporter
        end
        
        %% 3D Rendering
        subgraph "3D Rendering"
            ThreeScene[Three.js Scene]
            ThreeRenderer[Three.js Renderer]
            GLTFExporter[GLTF Exporter]
            OrbitControls[Orbit Controls]
            
            ThreeRenderer -->|Render| ThreeScene
            ThreeScene -->|Interactive Control| OrbitControls
            ThreeScene -->|Export| GLTFExporter
        end
    end
    
    %% Interaction and Analysis
    subgraph "Interaction & Analysis"
        ASTViewer[AST Visualization]
        ErrorHandler[Error Handling System]
        PerformanceAnalytics[Performance Analytics]
        
        Interpreter -->|Generate Diagnostics| ASTViewer
        Interpreter -->|Catch Errors| ErrorHandler
        ErrorHandler -->|Report| ASTViewer
    end
    
    %% Cross-Pipeline Connections
    GeometryGenerator -->|2D Shapes| Renderer2D
    GeometryGenerator -->|3D Geometries| ThreeScene
    Environment -->|Parametric State| GeometryGenerator
    
    %% Advanced Features for SIGGRAPH
    subgraph "SIGGRAPH Advanced Features"
        ProceduralGeneration[Procedural Generation]
        ParametricAnimation[Parametric Animation]
        GeometricComputation[Advanced Geometric Computation]
        
        GeometryGenerator -->|Generate| ProceduralGeneration
        ProceduralGeneration -->|Animate| ParametricAnimation
        ParametricAnimation -->|Compute| GeometricComputation
    end
    
    %% Style and Theming
    classDef infrastructure fill:#e6f3ff,stroke:#1e88e5;
    classDef rendering fill:#f0f4c3,stroke:#8bc34a;
    classDef interaction fill:#ffebee,stroke:#e53935;
    classDef advanced fill:#e1f5fe,stroke:#03a9f4;
    
    class CodeEditor,Lexer,Parser,AST,Interpreter,Environment infrastructure;
    class Canvas2D,SVGExporter,Renderer2D,ThreeScene,ThreeRenderer,GLTFExporter rendering;
    class ASTViewer,ErrorHandler,PerformanceAnalytics interaction;
    class ProceduralGeneration,ParametricAnimation,GeometricComputation advanced;
