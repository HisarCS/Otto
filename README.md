<h2 align="center">Otto: Teaching Parametric Design in Digital Fabrication Education</h2>
<p align="center">
  <picture>

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
    subgraph UI["User Interface Layer"]
        BlockUI[Blockly Visual Editor]
        TextUI[Text Code Editor]
        ParamUI[Parameter Controls]
    end

    subgraph Input["Input Processing"]
        BlockGen[Block-to-Code Generator<br/>blocks-umd.js]
        TextInput[Direct Text Input]
    end

    subgraph Pipeline["Language Processing Pipeline"]
        Lexer[Lexer<br/>Tokenization]
        Parser[Recursive Descent Parser<br/>parser.mjs]
        AST[Abstract Syntax Tree]
    end

    subgraph Core["Core Evaluation Engine"]
        Topo[Topological Ordering]
        Interp[Interpreter<br/>interpreter.mjs]
        ParamSys[Parameter System<br/>app.js]
    end

    subgraph Modules["Functional Modules"]
        ShapeLib[Shape Library 35+<br/>shapes.js]
        TurtleSys[Turtle Graphics<br/>turtle.js]
        BoolOps[Boolean Operations<br/>boolean.js<br/>Vatti Algorithm]
        ConstraintSys[Constraint Solver<br/>Levenberg-Marquardt]
        StyleSys[Style System<br/>Fill/Stroke]
    end

    subgraph Geometry["Geometry Engine"]
        Primitives[Primitives<br/>Circle, Polygon, Rectangle]
        Joints[2D Joints<br/>Finger, Cross-lap, Dovetail]
        Composed[Composed Shapes<br/>Union, Difference, Intersection]
    end

    subgraph Export["Export Layer"]
        SVG[SVG Export]
        DXF[DXF Export]
        CAM[CAM Software Integration]
    end

    subgraph External["External Libraries"]
        Blockly[Google Blockly]
        VattiLib[Vatti Clipping Library]
        LMSolver[LM Solver Library]
    end

    %% UI to Input
    BlockUI -->|Visual Blocks| BlockGen
    TextUI -->|Code Text| TextInput
    ParamUI -->|User Parameters| ParamSys

    %% Input to Pipeline
    BlockGen -->|Generated Code| Lexer
    TextInput -->|Raw Code| Lexer

    %% Pipeline Flow
    Lexer -->|Tokens| Parser
    Parser -->|AST Nodes| AST
    AST -->|Dependency Graph| Topo

    %% Core Processing
    Topo -->|Ordered Operations| Interp
    ParamSys -->|Parameter Values| Interp

    %% Interpreter to Modules
    Interp -->|Shape Commands| ShapeLib
    Interp -->|Turtle Commands| TurtleSys
    Interp -->|Boolean Ops| BoolOps
    Interp -->|Constraints| ConstraintSys
    Interp -->|Style Props| StyleSys

    %% Modules to Geometry
    ShapeLib --> Primitives
    ShapeLib --> Joints
    TurtleSys --> Primitives
    BoolOps --> Composed
    ConstraintSys -.->|Maintains| Primitives
    ConstraintSys -.->|Maintains| Joints
    ConstraintSys -.->|Maintains| Composed

    %% Geometry to Export
    Primitives --> SVG
    Joints --> SVG
    Composed --> SVG
    Primitives --> DXF
    Joints --> DXF
    Composed --> DXF

    %% Export to External
    SVG --> CAM
    DXF --> CAM

    %% External Dependencies
    Blockly -.->|Powers| BlockUI
    VattiLib -.->|Used by| BoolOps
    LMSolver -.->|Used by| ConstraintSys

    %% Styling
    classDef uiLayer fill:#e1f5ff,stroke:#0288d1,stroke-width:2px,color:#000
    classDef processLayer fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000
    classDef coreLayer fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#000
    classDef moduleLayer fill:#e8f5e9,stroke:#388e3c,stroke-width:2px,color:#000
    classDef geometryLayer fill:#fff9c4,stroke:#f9a825,stroke-width:2px,color:#000
    classDef exportLayer fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:#000

    class BlockUI,TextUI,ParamUI uiLayer
    class BlockGen,TextInput,Lexer,Parser,AST processLayer
    class Topo,Interp,ParamSys coreLayer
    class ShapeLib,TurtleSys,BoolOps,ConstraintSys,StyleSys moduleLayer
    class Primitives,Joints,Composed geometryLayer
    class SVG,DXF,CAM exportLayer
```
