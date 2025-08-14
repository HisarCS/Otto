class Horizontal {
  constructor(p1, p2) {
    this.points = [p1, p2]
    this.name = "horizontal";
    this.targets = [p1, p2];
  }

  getEqs() {
    let p1y = `y${this.points[0].id}`;
    let p2y = `y${this.points[1].id}`;

    return [`${p2y}-${p1y}`];
  }
}

export { Horizontal };
