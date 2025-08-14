
class Coincident {
  constructor(p1, p2) {
    this.points = [p1, p2];
    this.name = "coincident";
    this.targets = [p1, p2];

    // Do NOT mutate IDs — just store reference
    p2.coincident = true; 
  }

  getEqs() {
    let p1x = `x${this.points[0].id}`;
    let p1y = `y${this.points[0].id}`;
    let p2x = `x${this.points[1].id}`;
    let p2y = `y${this.points[1].id}`;

    // Two equations to enforce coincidence
    return [
      `${p1x} - ${p2x}`,
      `${p1y} - ${p2y}`
    ];
  }
}

export { Coincident };

