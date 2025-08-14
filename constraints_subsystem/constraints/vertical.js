class Vertical {
  constructor(p1, p2) {
    this.points = [p1, p2]
    this.name = "vertical";
    this.targets = [p1, p2];
  }

  getEqs() {
    let p1x = `x${this.points[0].id}`;
    let p2x = `x${this.points[1].id}`;

    return [`${p2x}-${p1x}`];
  }
}

export { Vertical };
