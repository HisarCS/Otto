class Distance {
  constructor(p1, p2, dist) {
    this.points = [p1, p2];
    this.dist = dist;
    this.name = "distance";
    this.targets = [p1, p2];
  }

  getEqs() {
    let p1x = `x${this.points[0].id}`;
    let p1y = `y${this.points[0].id}`;
    let p2x = `x${this.points[1].id}`;
    let p2y = `y${this.points[1].id}`;
    let dist = this.dist;
    return [`${dist} - sqrt((${p2x}-${p1x})**2+(${p2y}-${p1y})**2)`];
  }
}

export { Distance };

