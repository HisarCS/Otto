import { evaluate } from './evaluate.mjs';
import { lusolve } from "./lusolve.mjs";

class Matrix {
  constructor(m){ this.m = m; this.rows = m.length; this.cols = m[0]?.length ?? 0; }
  toArray(){ return this.m.map(r=>r.slice()); }
  trans(){ return new Matrix(this.m[0].map((_,i)=> this.m.map(r=>r[i]))); }
  dot(B){ const A=this.m, C=Array.from({length:this.rows},()=>Array(B.cols).fill(0));
    for(let i=0;i<this.rows;i++) for(let k=0;k<this.cols;k++) for(let j=0;j<B.cols;j++) C[i][j]+=A[i][k]*B.m[k][j];
    return new Matrix(C);
  }
  plus(B){ const A=this.m, C=A.map((r,i)=>r.map((v,j)=>v+B.m[i][j])); return new Matrix(C);}
  static scalar(n,s){ const I=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=> i===j?s:0)); return new Matrix(I); }
}

const totalError = ([vals]) => vals.flat().reduce((acc, v)=> acc + v**2, 0) / 2;

const get_val_ders = (eqs, variables) => eqs.reduce((acc, cur) => {
  const { val, der } = evaluate(cur, variables);
  acc[0].push([val]); acc[1].push(der);
  return acc;
}, [[],[]]);

function levenbergMarquardt(eqs, variables, { ogLambda=10, lambdaUp=10, lambdaDown=10, epsilon=1e-5, fast=false } = {}) {
  let lambda=ogLambda, updateJacobian=true, converged=false;
  let residual, jacobian, transJacobian, hessianApprox, weighted, gradiant, costGradiant;
  let deltas, error, newVariables, new_val_ders, new_error, val_ders;

  val_ders = get_val_ders(eqs, variables);

  while(!converged){
    if(updateJacobian){
      [residual, jacobian] = val_ders.map(x => new Matrix(x));
      transJacobian = jacobian.trans();
      hessianApprox = transJacobian.dot(jacobian);
      updateJacobian = false;
    }
    weighted = Matrix.scalar(hessianApprox.rows, lambda);
    gradiant = hessianApprox.plus(weighted);
    costGradiant = transJacobian.dot(residual);

    deltas = lusolve(gradiant.toArray(), costGradiant.toArray().map(r=>r[0]), fast);
    error = totalError(val_ders);

    newVariables = {};
    Object.keys(variables).forEach((key,i)=> { newVariables[key] = variables[key] - deltas[i]; });

    new_val_ders = get_val_ders(eqs, newVariables);
    new_error = totalError(new_val_ders);
    const ds = new_val_ders[1].flat();

    converged = (new_error < epsilon) || ds.every(d => Math.abs(d) < epsilon) || Math.abs(error - new_error) < epsilon;

    if(new_error < error){
      lambda /= lambdaDown;
      variables = newVariables;
      val_ders = new_val_ders;
      updateJacobian = true;
    } else {
      lambda *= lambdaUp;
    }
  }
  return newVariables;
}

function splitAt (i, arr){ return [arr.slice(0,i), arr.slice(i)]; }

export function solveSystem(eqns, vars, { forwardSubs = {}, epsilon = 1e-5 } = {}){
  Object.entries(forwardSubs).forEach(([v,val]) => {
    eqns = eqns.map(eq => eq.replaceAll(v, val));
  });

  if (eqns.length < 1) return [[], vars];

  let varsPrime;
  try {
    varsPrime = levenbergMarquardt(eqns, vars, { epsilon });

    Object.entries(forwardSubs).forEach(([v,val]) => {
      varsPrime[v] = (typeof val === 'string') ? varsPrime[val] : val;
    });
  } catch (e) {
    console.log("levenbergMarquardt failed, falling back:", e);
    varsPrime = vars;
  }

  const scores = eqns.map(eq => evaluate(eq, varsPrime).val ** 2);
  const satisfied = scores.map(s => s < Math.sqrt(epsilon));

  if (satisfied.every(Boolean)) return [satisfied, varsPrime];

  const idx = satisfied.findIndex(s => !s);
  const front = eqns.slice(0, idx);
  const back  = eqns.slice(idx + 1);
  const newEqs = front.concat(back);

  const [satPrime, out] = solveSystem(newEqs, varsPrime, { forwardSubs, epsilon });
  const a = satPrime.slice(0, idx);
  const b = satPrime.slice(idx);

  return [a.concat([false]).concat(b), out];
}

