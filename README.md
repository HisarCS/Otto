<h2 align="center">Otto: Teaching Parametric Design in Digital Fabrication Education</h2>
<p align="center">
  <picture>
<img width="550" height="406" alt="Screenshot 2025-10-22 at 08 27 11" src="https://github.com/user-attachments/assets/3e74c99f-4148-467d-b288-0fc239c42a01" />
  </picture>
</p>
<p align="center">
  <b>A graphical programming language for parametric design education</b>
</p>
<p align="center">
  <a href="https://github.com/HisarCS/Aqui/tree/main/Docs">Documentation</a> •
  <a href="https://github.com/HisarCS/Aqui/blob/main/LICENSE">License</a> 
</p>


---
Graphical programming language mainly created for teaching Parametric designing in digital fabrication education while promoting computational thinking skills as well. It is completely **OPEN SOURCE!** contact EmreDay1 if you want to contribute send an email to emre.dayangac@hisarschool.k12.tr, emreday01@gmail.com, sedat.yalcin@hisarschool.k12.tr and if you want to contact the organization you may email hisarcs@hisarschool.k12.tr


The AQUI language for Otto was mainly built to create a more engaging environment for the Parametrix project. The language's main goal is to provide a more in-depth editing capability for users, trying to learn Parametric designing with Parametrix, the language was completely written in JavaScript, and is a graphical language to create Parametrix designs. AQUI is an interpreted language. If you want to learn how to use it, it's inner workings here is the documentation link: https://github.com/HisarCS/Aqui/tree/main/Docs

# Otto System Architecture
```mermaid
graph TB
    subgraph External["External Libraries"]
        direction LR
        Blockly[Google Blockly<br/>Visual Programming]
        VattiLib[Vatti Clipping<br/>Boolean Ops]
        LMSolver[Levenberg-Marquardt<br/>Constraint Solver]
    end
    subgraph UI["User Interface"]
        direction LR
        BlockUI[Blockly Editor<br/>Visual Blocks]
        TextUI[Text Editor<br/>Code Input]
        Canvas[Interactive Canvas<br/>Real-time Preview<br/>Pan/Zoom/Select]
    end
    subgraph Controls["Controls"]
        direction LR
        ParamUI[Parameter Manager<br/>Dynamic Controls<br/>Real-time Updates]
    end
    subgraph Process["Processing Pipeline"]
        direction LR
        BlockGen[Block-to-Code Generator<br/>blocks-umd.js<br/>Blockly.JavaScript]
        TextInput[Direct Text Input<br/>Code Editor]
        Lexer[Lexer<br/>Tokenization<br/>Token Stream]
        Parser[Recursive Descent Parser<br/>parser.mjs<br/>AST Generation]
        AST[Abstract Syntax Tree<br/>JSON Structure]
    end
    subgraph Engine["Evaluation Engine"]
        direction LR
        Topo[Topological Ordering<br/>Dependency Resolution<br/>Execution Order]
        Interp[Interpreter<br/>interpreter.mjs<br/>AST Evaluation]
        ParamSys[Parameter System<br/>app.js<br/>Param Storage]
        CodeRunner[Code Runner<br/>codeRunner.js<br/>Execution Control]
    end
    subgraph Modules["Functional Modules"]
        direction LR
        ShapeLib[Shape Library 35+<br/>shapes.js<br/>Primitives & Joints]
        TurtleSys[Turtle Graphics<br/>turtle.js<br/>Logo-style Drawing]
        BoolOps[Boolean Operations<br/>boolean.js<br/>Union/Diff/Intersect<br/>Vatti Algorithm]
        ConstraintSys[Constraint System<br/>constraints/engine.mjs<br/>Distance/Coincident<br/>Horizontal/Vertical]
        StyleSys[Style System<br/>Fill/Stroke/Color<br/>Visual Properties]
    end
    subgraph Geo["Geometry Engine"]
        direction LR
        Primitives[Primitives<br/>Circle/Rectangle<br/>Polygon/Ellipse<br/>Star/Arc/Text]
        Joints[2D Joints<br/>Finger Joint<br/>Cross-lap<br/>Dovetail<br/>Box Joint]
        Composed[Boolean Results<br/>Combined Shapes<br/>CSG Operations]
    end
    subgraph Render["Rendering & Interaction"]
        direction LR
        Renderer[Canvas Renderer<br/>renderer.mjs<br/>SVG/Canvas Drawing<br/>Shape Management]
        Interaction[User Interactions<br/>dragDropSystem.mjs<br/>Mouse Events<br/>Selection]
        Feedback[Visual Feedback<br/>constraintsOverlay.mjs<br/>Anchors Display<br/>Constraint Lines]
        ShapeMgr[Shape Manager<br/>shapeManager.mjs<br/>Shape Registry]
    end
    subgraph Export["Export & Fabrication"]
        direction LR
        SVG[SVG Export<br/>svgExport.mjs<br/>Vector Graphics]
        DXF[DXF Export<br/>dxfExport.mjs<br/>CAD Format]
        CAM[CAM Software<br/>Laser Cutters<br/>CNC Machines]
    end
    Blockly -.->|Powers| BlockUI
    VattiLib -.->|Algorithm| BoolOps
    LMSolver -.->|Solver| ConstraintSys
    BlockUI -->|Visual Blocks| BlockGen
    TextUI -->|Code Text| TextInput
    BlockGen -->|Generated Code| Lexer
    TextInput -->|Raw Code| Lexer
    Lexer -->|Token Stream| Parser
    Parser -->|AST Nodes| AST
    AST -->|Program Tree| Topo
    Topo -->|Ordered Ops| Interp
    ParamUI -->|Param Values| ParamSys
    ParamSys -->|Parameters| Interp
    CodeRunner -->|Executes| Interp
    CodeRunner -->|Controls| Renderer
    Interp -->|Shape Cmds| ShapeLib
    Interp -->|Turtle Cmds| TurtleSys
    Interp -->|Boolean Ops| BoolOps
    Interp -->|Constraints| ConstraintSys
    Interp -->|Style Props| StyleSys
    ShapeLib -->|Creates| Primitives
    ShapeLib -->|Creates| Joints
    TurtleSys -->|Draws| Primitives
    BoolOps -->|Produces| Composed
    ConstraintSys -.->|Maintains| Primitives
    ConstraintSys -.->|Maintains| Joints
    ConstraintSys -.->|Maintains| Composed
    Primitives -->|Geometry| Renderer
    Joints -->|Geometry| Renderer
    Composed -->|Geometry| Renderer
    StyleSys -->|Styling| Renderer
    ConstraintSys -->|Visual Info| Feedback
    ShapeMgr -->|Shape Registry| Renderer
    Renderer -->|Draws| Canvas
    Feedback -->|Overlays| Canvas
    Interaction -->|Events| Canvas
    Canvas -.->|User Edits| Interaction
    Canvas -.->|Updates| ParamUI
    Canvas -.->|Triggers| CodeRunner
    ParamUI -.->|Changes| CodeRunner
    Primitives -->|Vector Data| SVG
    Joints -->|Vector Data| SVG
    Composed -->|Vector Data| SVG
    Primitives -->|CAD Data| DXF
    Joints -->|CAD Data| DXF
    Composed -->|CAD Data| DXF
    SVG -->|File| CAM
    DXF -->|File| CAM
    classDef uiStyle fill:#e1f5ff,stroke:#0288d1,stroke-width:2px,color:#000
    classDef controlStyle fill:#e1f5ff,stroke:#0288d1,stroke-width:2px,color:#000
    classDef processStyle fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000
    classDef engineStyle fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#000
    classDef moduleStyle fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#000
    classDef geoStyle fill:#fff9c4,stroke:#f9a825,stroke-width:2px,color:#000
    classDef renderStyle fill:#ffe0b2,stroke:#ef6c00,stroke-width:2px,color:#000
    classDef exportStyle fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:#000
    classDef externalStyle fill:#e0e0e0,stroke:#616161,stroke-width:2px,color:#000
    class BlockUI,TextUI,Canvas uiStyle
    class ParamUI controlStyle
    class BlockGen,TextInput,Lexer,Parser,AST processStyle
    class Topo,Interp,ParamSys,CodeRunner engineStyle
    class ShapeLib,TurtleSys,BoolOps,ConstraintSys,StyleSys moduleStyle
    class Primitives,Joints,Composed geoStyle
    class Renderer,Interaction,Feedback,ShapeMgr renderStyle
    class SVG,DXF,CAM exportStyle
    class Blockly,VattiLib,LMSolver externalStyle
```
