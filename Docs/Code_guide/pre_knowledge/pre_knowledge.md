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

Understanding this foundation will help you comprehend how any programming language - including AQUI - processes and executes cod
