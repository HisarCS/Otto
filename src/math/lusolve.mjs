function LU(A, fast) {
    fast = fast || false;
    var abs = Math.abs, i, j, k, absAjk, Akk, Ak, Pk, Ai, max;
    var n = A.length, n1 = n-1;
    var P = new Array(n);
    if(!fast) A = [...A];
    for (k = 0; k < n; ++k) {
      Pk = k; Ak = A[k]; max = abs(Ak[k]);
      for (j = k + 1; j < n; ++j) {
        absAjk = abs(A[j][k]);
        if (max < absAjk) { max = absAjk; Pk = j; }
      }
      P[k] = Pk;
      if (Pk != k) { A[k] = A[Pk]; A[Pk] = Ak; Ak = A[k]; }
      Akk = Ak[k];
      for (i = k + 1; i < n; ++i) A[i][k] /= Akk;
      for (i = k + 1; i < n; ++i) {
        Ai = A[i];
        for (j = k + 1; j < n1; ++j) { Ai[j] -= Ai[k]*Ak[j]; ++j; Ai[j] -= Ai[k]*Ak[j]; }
        if(j===n1) Ai[j] -= Ai[k]*Ak[j];
      }
    }
    return { LU: A, P };
  }
  function LUsolve(LUP, b) {
    var LU = LUP.LU, n = LU.length, x = [...b], P = LUP.P, i, j, LUi, tmp;
    for (i = n-1; i !== -1; --i) x[i] = b[i];
    for (i = 0; i < n; ++i) {
      if (P[i] !== i) { tmp = x[i]; x[i] = x[P[i]]; x[P[i]] = tmp; }
      LUi = LU[i];
      for (j = 0; j < i; ++j) x[i] -= x[j]*LUi[j];
    }
    for (i = n - 1; i >= 0; --i) {
      LUi = LU[i];
      for (j = i + 1; j < n; ++j) x[i] -= x[j]*LUi[j];
      x[i] /= LUi[i];
    }
    return x;
  }
  export function lusolve(A,b,fast){ return LUsolve(LU(A,fast), b); }
  