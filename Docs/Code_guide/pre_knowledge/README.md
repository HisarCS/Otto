# Pre-Knowledge: Understanding Programming Language Components

## The Problem: From Human Text to Computer Action

When you write code, you're writing instructions in a form that humans can read and understand. But computers don't naturally understand text like "create a circle with radius 50." They need these instructions converted into something they can execute.

This conversion happens through three main components that work together like a factory assembly line.

---

## The Three-Stage Pipeline

Every programming language implementation follows this basic pattern:

1. **Lexer** - Breaks text into meaningful pieces
2. **Parser** - Understands the structure and grammar
3. **Interpreter/Compiler** - Executes or translates the instructions

Let's explore each component...

---

## Stage 1: The Lexer (Tokenizer)

### What is a Lexer?

A **lexer** reads source code character by character and groups them into meaningful units called **tokens**. Think of it like breaking a sentence into individual words.

### Real-World Analogy

Imagine you're reading this sentence aloud:
> "The quick brown fox jumps over the lazy dog."

Your brain automatically groups the letters into words:
- `T-h-e` becomes the word "The"
- `q-u-i-c-k` becomes the word "quick" 
- `b-r-o-w-n` becomes the word "brown"

A lexer does the same thing with code.

### Simple Example

Take this line of code (in any language):
```
x = 42 + y
```

The lexer breaks this into tokens:
1. `x` → IDENTIFIER (variable name)
2. `=` → EQUALS (assignment operator)
3. `42` → NUMBER (numeric literal)
4. `+` → PLUS (addition operator)
5. `y` → IDENTIFIER (variable name)

### What the Lexer Ignores

- **Whitespace** - Spaces, tabs, newlines (usually)
- **Comments** - Human-readable notes in code
- **Formatting** - How the code is arranged on the page

### Why We Need a Lexer

Without a lexer, the parser would have to deal with individual characters, which would be incredibly complex. The lexer simplifies the parser's job by pre-processing the text into meaningful chunks.

---

## Stage 2: The Parser

### What is a Parser?

A **parser** takes the stream of tokens from the lexer and understands the **grammatical structure** of the code. It builds a tree that represents the relationships between different parts of the program.

### Real-World Analogy

Consider this sentence: "The cat sat on the mat."

Your brain doesn't just see individual words - it understands the grammar:
- "The cat" = subject
- "sat" = verb  
- "on the mat" = prepositional phrase describing where

A parser does this for code, understanding how tokens relate to each other.

### What the Parser Creates: Abstract Syntax Tree (AST)

The parser builds an **Abstract Syntax Tree** - a hierarchical representation of your code's structure.

For the expression `x = 42 + y`, the AST might look like:
```
Assignment
├── Variable: x
└── Addition
    ├── Number: 42
    └── Variable: y
```

### Grammar Rules

Parsers follow **grammar rules** that define what's valid in the language. For example:
- An assignment must have a variable on the left and an expression on the right
- Parentheses must be balanced
- Function calls must have the function name followed by parentheses

### Error Detection

If the tokens don't follow the grammar rules, the parser reports a **syntax error**:
- Missing semicolons
- Unmatched parentheses  
- Invalid token sequences

### Why We Need a Parser

The parser ensures the code follows the language's rules and creates a structured representation that the next stage can easily work with.

---

## Stage 3: The Interpreter

### What is an Interpreter?

An **interpreter** walks through the Abstract Syntax Tree and **executes** each instruction. It's the component that actually makes things happen.

### Real-World Analogy

Think of following a recipe:
1. The lexer identified the ingredients: "flour", "eggs", "milk"
2. The parser understood the structure: "Mix flour and eggs, then add milk"  
3. The interpreter actually does the cooking: physically mixing ingredients

### How Interpretation Works

The interpreter visits each node in the AST and performs the corresponding action:

For `x = 42 + y`:
1. **Evaluate** the right side (42 + y)
   - Look up the value of `y` (let's say it's 8)
   - Add 42 + 8 = 50
2. **Assign** the result to variable `x`
   - Store 50 in the memory location for `x`

### Environment and State

The interpreter maintains an **environment** - a record of:
- **Variables** and their current values
- **Functions** and their definitions  
- **Program state** - what's currently happening

### Runtime vs. Compile Time

- **Parser errors** happen before execution (syntax errors)
- **Interpreter errors** happen during execution (runtime errors)
  - Division by zero
  - Undefined variables
  - Type mismatches

---

## Alternative: The Compiler

### Interpreter vs. Compiler

Instead of an **interpreter** that executes code directly, some languages use a **compiler** that translates code into another language (usually machine code).

**Interpreter approach:**
```
Source Code → Lexer → Parser → Interpreter → Results
```

**Compiler approach:**
```
Source Code → Lexer → Parser → Compiler → Machine Code
                                         ↓
                                    Execution → Results
```

### When to Use Each

- **Interpreters** are better for:
  - Interactive development
  - Quick testing and debugging
  - Educational tools
  
- **Compilers** are better for:
  - Performance-critical applications
  - Distribution (no need for runtime)
  - Early error detection

---

## Working Together: The Complete Pipeline

### Step-by-Step Example

Let's trace through a complete example with `result = (10 + 5) * 2`:

**Step 1: Lexer**
```
Input:  result = (10 + 5) * 2
Output: [IDENTIFIER:"result", EQUALS, LPAREN, NUMBER:10, PLUS, 
         NUMBER:5, RPAREN, MULTIPLY, NUMBER:2]
```

**Step 2: Parser**
```
Assignment
├── Variable: "result"
└── Multiplication
    ├── Addition
    │   ├── Number: 10
    │   └── Number: 5
    └── Number: 2
```

**Step 3: Interpreter**
```
1. Evaluate Addition: 10 + 5 = 15
2. Evaluate Multiplication: 15 * 2 = 30  
3. Assign to variable: result = 30
```

### Error Handling at Each Stage

**Lexer errors:**
```
x = $invalid$character
    ↑ Unknown character '$'
```

**Parser errors:**
```
x = 10 + + 5
       ↑ Unexpected '+' token
```

**Interpreter errors:**  
```
x = y + 5
    ↑ Undefined variable 'y'
```

---

## Why This Architecture?

### Separation of Concerns

Each component has a single, clear responsibility:
- **Lexer**: Character → Token conversion
- **Parser**: Token → Structure understanding
- **Interpreter**: Structure → Execution

### Modularity

You can swap out components independently:
- Different lexers for different syntax styles
- Different parsers for different grammar rules
- Different backends (interpreter vs. compiler)

### Error Localization

Problems are caught at the appropriate stage:
- Character-level issues → Lexer
- Grammar issues → Parser  
- Logic issues → Interpreter

### Extensibility

Adding new language features typically involves:
1. Adding new token types (lexer)
2. Adding new grammar rules (parser)  
3. Adding new execution logic (interpreter)

---

## Key Takeaways

Before diving into any programming language implementation, remember:

1. **Lexers** convert text into tokens (meaningful chunks)
2. **Parsers** understand grammar and build structure trees
3. **Interpreters** execute the structured instructions
4. Each stage handles different types of errors
5. This pipeline is fundamental to how all programming languages work

Understanding this foundation will help you comprehend how any programming language - including AQUI - processes and executes code.

---

## Constraint Systems and Mathematical Solving

### What is a Constraint System?

In addition to basic programming language concepts, AQUI includes a **constraint system** for parametric design. This is a more advanced concept that maintains relationships between objects automatically.

Think of constraint systems like rules you set for your design:
- "These two circles must always be exactly 50mm apart"
- "These rectangles must stay horizontally aligned"
- "This line must always be perpendicular to that line"

Once you set these rules, the computer automatically moves objects to satisfy them whenever something changes.

### Real-World Analogy: The Desk Setup

Imagine you have a desk with several items and you want to maintain specific relationships:

- Your monitor must stay **50cm** from the wall
- Your keyboard must be **centered** in front of the monitor  
- Your coffee cup must stay **10cm** to the right of the keyboard

If someone moves your monitor closer to the wall (45cm), what happens?
- The constraint system would automatically move the keyboard to stay centered with the monitor's new position
- The coffee cup would automatically follow the keyboard to maintain its 10cm distance

This is exactly what constraint systems do with geometric shapes - they maintain relationships automatically.

---

## Mathematical Problem: Solving Equation Systems

### The Challenge

When you have multiple constraints, they create a system of mathematical equations that must all be satisfied simultaneously. For example:

- Circle A at position (x₁, y₁)
- Circle B at position (x₂, y₂)  
- Constraint: They must be exactly 100 units apart

This creates the equation: `√((x₂-x₁)² + (y₂-y₁)²) = 100`

But what if you have 5 circles with 10 different distance constraints between them? You get a system of 10 equations with 10 unknowns that must all be satisfied at once.

### Linear vs Non-Linear Equations

**Linear equations** are simple - they look like straight lines:
```
2x + 3y = 10
x - y = 2
```

**Non-linear equations** involve curves, squares, square roots:
```
x² + y² = 25        (circle equation)
x² - 2xy + y² = 16  (more complex curve)
```

Geometric constraints usually create **non-linear** equation systems because:
- Distance constraints involve square roots: `√((x₂-x₁)² + (y₂-y₁)²) = d`
- Rotation constraints involve trigonometry: `sin(θ)` and `cos(θ)`
- Circle intersections involve quadratic equations

### Why This Is Hard

Non-linear equation systems can't be solved with simple algebra like linear systems. They require sophisticated mathematical techniques.

---

## The Levenberg-Marquardt Algorithm

### What Is It?

The **Levenberg-Marquardt (LM) algorithm** is a mathematical method for solving non-linear equation systems. It's specifically designed for **least-squares problems** - finding solutions that minimize the total error across all equations.

### Real-World Analogy: The Compromise Solution

Imagine you're planning a group dinner and everyone has preferences:
- Alice wants to meet at 6 PM
- Bob wants to meet at 7 PM  
- Carol wants to meet at 8 PM
- The restaurant closes at 7:30 PM

There's no perfect solution that satisfies everyone completely. LM algorithm finds the "best compromise" - perhaps meeting at 7:15 PM, which:
- Is reasonably close to everyone's preference
- Respects the restaurant constraint
- Minimizes the total "unhappiness"

### How LM Works (Simplified)

1. **Start with a guess** - Initial positions for all objects
2. **Calculate errors** - How much each constraint is violated  
3. **Determine direction** - Which way to move objects to reduce errors
4. **Take a step** - Move objects in that direction
5. **Check improvement** - Did the total error decrease?
6. **Adjust step size** - If improvement, take bigger steps; if worse, take smaller steps
7. **Repeat** - Continue until errors are acceptably small

### Why LM Specifically?

LM combines two approaches:
- **Gradient descent** - Good for getting close to solutions quickly
- **Gauss-Newton** - Good for fine-tuning once you're close

It automatically switches between these approaches based on how close you are to a solution.

### The "Damping Parameter"

LM uses a "damping parameter" (often called λ - lambda) that controls the step size:
- **High λ** - Take small, safe steps (like gradient descent)
- **Low λ** - Take larger, faster steps (like Gauss-Newton)
- **Adaptive λ** - Algorithm adjusts this automatically based on progress

---

## Coordinate Systems and Transformations

### Local vs World Coordinates

**Local coordinates** describe positions relative to an object's center:
- A rectangle's corner might be at (-50, -30) relative to its center
- This stays the same regardless of where the rectangle is placed

**World coordinates** describe positions in the global space:
- The same corner might be at (150, 200) in the overall design
- This changes when you move or rotate the rectangle

### Transformation Mathematics

Converting from local to world coordinates involves:

1. **Scaling** - Make the object bigger/smaller
2. **Rotation** - Spin the object around its center
3. **Translation** - Move the object to its final position

The mathematical formula uses **rotation matrices**:
```
x_world = x_local * cos(angle) - y_local * sin(angle) + center_x
y_world = x_local * sin(angle) + y_local * cos(angle) + center_y
```

### Why This Matters for Constraints

Constraint systems work with **anchor points** - specific locations on objects like:
- Rectangle corners
- Circle edge points  
- Line endpoints

These anchor points must be converted to world coordinates before constraints can be calculated and solved.

---

## Symbolic vs Numeric Mathematics

### Symbolic Math

**Symbolic mathematics** works with expressions as symbols:
- Input: `x + 2*y = 10`
- Processing: Algebraic manipulation of symbols
- Output: `x = 10 - 2*y`

### Numeric Math  

**Numeric mathematics** works with actual numbers:
- Input: `x = 3.5, y = 2.8`
- Processing: Arithmetic calculations
- Output: `10.6`

### Why Constraints Use Symbolic Math

Constraint systems generate equations symbolically because:

1. **Flexibility** - Can handle parameters and expressions: `distance = param.spacing * 2`
2. **Exact solutions** - No rounding errors from premature number conversion
3. **Equation manipulation** - Can rearrange and simplify before solving
4. **Variable substitution** - Can lock some variables (fixed shapes) while solving for others

Example:
```
Symbolic: "x1 - x2 = 0, y1 - y2 = 0" (coincident constraint)
Numeric: After substitution with actual coordinates
```

---

## Optimization and Convergence

### What Is Convergence?

**Convergence** means the algorithm is getting closer and closer to a solution. Like approaching a target:
- Step 1: Error = 100 units
- Step 2: Error = 50 units  
- Step 3: Error = 25 units
- Step 4: Error = 12 units
- ...continues until error is acceptably small

### Convergence Problems

Sometimes the algorithm doesn't converge:

1. **No solution exists** - Contradictory constraints (circle must be both 10 and 20 units from a point)
2. **Multiple solutions** - Algorithm can't decide which one to choose
3. **Poor starting point** - Initial guess is too far from any solution
4. **Numerical issues** - Rounding errors accumulate

### How Systems Handle Non-Convergence

- **Maximum iterations** - Stop trying after a reasonable number of attempts
- **Tolerance levels** - Accept "good enough" solutions  
- **Graceful degradation** - Continue working even if some constraints can't be satisfied
- **User feedback** - Report which constraints are causing problems

---

## Performance Considerations

### Why Constraint Solving Is Expensive

Each constraint solving cycle involves:
1. **Equation generation** - Create mathematical expressions
2. **Matrix operations** - Linear algebra calculations
3. **Iterative solving** - Multiple attempts to find solutions
4. **Coordinate transformations** - Convert between local/world coordinates

For complex systems with many constraints, this can involve thousands of calculations.

### Optimization Strategies

1. **Change detection** - Only solve when something actually changes
2. **Incremental solving** - Solve one constraint at a time when possible  
3. **Caching** - Remember solutions for unchanged constraint sets
4. **Early termination** - Stop solving when "close enough"
5. **Constraint prioritization** - Solve most important constraints first

### Live vs Batch Solving

- **Live solving** - Apply constraints immediately as user interacts (responsive but expensive)
- **Batch solving** - Wait for user to finish, then solve all at once (efficient but less responsive)

Most systems use hybrid approaches - live solving for simple cases, batch solving for complex ones.

---

## Key Takeaways for Constraint Systems

Before working with constraint-based parametric design systems, understand:

1. **Constraints create equation systems** that must be solved mathematically
2. **Non-linear equations** require sophisticated algorithms like Levenberg-Marquardt
3. **Coordinate transformations** convert between local object space and global world space  
4. **Symbolic mathematics** provides flexibility for handling parameters and expressions
5. **Convergence and performance** are ongoing challenges requiring careful optimization
6. **User experience** depends on balancing mathematical accuracy with interactive responsiveness

This mathematical foundation enables powerful parametric design tools where users can specify design intent through relationships that are maintained automatically as designs evolve.
