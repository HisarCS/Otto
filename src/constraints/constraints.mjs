class Coincident {
  constructor(pA, pB) {
    this.points = [pA, pB];
    this.name = "coincident";
    this.targets = [pA, pB];
  }
  getEqs(xA, yA, xB, yB) {
    return [
      `${xA} - ${xB}`,
      `${yA} - ${yB}`
    ];
  }
}

class Distance {
  constructor(pA, pB, d) {
    this.points = [pA, pB];
    this.dist = d;
    this.name = "distance";
    this.targets = [pA, pB];
  }
  getEqs(xA, yA, xB, yB) {
    const d2 = `${this.dist}*${this.dist}`;
    return [
      `((${xB}-${xA})**2 + (${yB}-${yA})**2) - (${d2})`
    ];
  }
}

class Horizontal {
  constructor(pA, pB) {
    this.points = [pA, pB];
    this.name = "horizontal";
    this.targets = [pA, pB];
  }
  getEqs(xA, yA, xB, yB) {
    return [ `${yB} - ${yA}` ];
  }
}

class Vertical {
  constructor(pA, pB) {
    this.points = [pA, pB];
    this.name = "vertical";
    this.targets = [pA, pB];
  }
  getEqs(xA, yA, xB, yB) {
    return [ `${xB} - ${xA}` ];
  }
}

export { Coincident, Distance, Horizontal, Vertical };
