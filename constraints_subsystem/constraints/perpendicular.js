class Perpendicular { 
  constructor(line1, line2) {
    this.points = [line1.pointList[0], line1.pointList[1], line2.pointList[0], line2.pointList[1]];
    this.name = "perpendicular";
    this.targets = [line1, line2];
  }

  getEqs() {
    let l1p1x = `x${this.points[0].id}`;
    let l1p1y = `y${this.points[0].id}`;

    let l1p2x = `x${this.points[1].id}`;
    let l1p2y = `y${this.points[1].id}`;

    let l2p1x = `x${this.points[2].id}`;
    let l2p1y = `y${this.points[2].id}`;

    let l2p2x = `x${this.points[3].id}`;
    let l2p2y = `y${this.points[3].id}`;

    return [`(${l1p2x}-${l1p1x}) * (${l2p2x}-${l2p1x}) + (${l1p2y}-${l1p1y}) * (${l2p2y}-${l2p1y})`];
  }

}


export { Perpendicular };
