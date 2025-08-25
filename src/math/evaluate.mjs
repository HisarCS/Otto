import { valder, sin, cos, tan, asin, acos, atan, mul, div, neg, plus, minus, exp, sqrt, log, power } from './autodiff.mjs';
import { parse } from './parser.mjs';

const walk = (node, vars) => {
  if (node.type === "number") return parseFloat(node.value);
  if (node.type === "binary") {
    const l = walk(node.left, vars);
    const r = walk(node.right, vars);
    switch (node.operator) {
      case "+": return plus(l, r);
      case "*": return mul(l, r);
      case "/": return div(l, r);
      case "-": return minus(l, r);
      case "^":
      case "**": return power(l, r);
    }
  } else if (node.type === "symbol") {
    if (!(node.value in vars)) {
      throw new Error(`Unknown variable "${node.value}" for constraints`);
    }
    return vars[node.value];
  } else if (node.type === "call") {
    const args = node.args.map(a => walk(a, vars));
    switch (node.value) {
      case "sin": return sin(...args);
      case "cos": return cos(...args);
      case "tan": return tan(...args);
      case "asin": return asin(...args);
      case "acos": return acos(...args);
      case "atan": return atan(...args);
      case "exp": return exp(...args);
      case "sqrt": return sqrt(...args);
      case "log": return log(...args);
      case "neg": return neg(...args);
    }
  }
};

export function evaluate(eq, variables) {
  const keys = Object.keys(variables);
  const L = keys.length;
  const vd = {};
  keys.forEach((k, i) => {
    const der = Array.from({length:L}, (_,j)=> (i===j?1:0));
    vd[k] = valder(variables[k], der);
  });
  return walk(parse(eq), vd);
}
