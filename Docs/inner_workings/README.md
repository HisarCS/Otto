# Explain

Aqui Explanation docs

## Components

In the components part, I will first start by explaining CoordinatePlane.js and ThreeDView.js. Then, I will explain every page starting from the first web page.

### CoordinatePlane.js

``` javascript
import React, { useRef, useEffect } from "react";

const CoordinatePlane = ({ shapes }) => {
  const canvasRef = useRef(null);

  // Constants for canvas configuration
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 700;
  const UNIT = 16;
  const STEPS = 100; // For smooth curves

  // Shape colors
  const COLORS = {
    circle: "blue",
    rectangle: "green",
    triangle: "red",
    ellipse: "purple",
    axes: "gray"
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 3D to 2D transformation function
    const transform3DTo2D = (x, y, z) => {
      const angleX = Math.PI / 6;
      const angleZ = Math.PI / 6;

      const transformedX = x * Math.cos(angleZ) - z * Math.sin(angleZ);
      const transformedY =
        y * Math.cos(angleX) - 
        (x * Math.sin(angleZ) + z * Math.cos(angleZ)) * Math.sin(angleX);

      return {
        x: centerX + transformedX * UNIT,
        y: centerY - transformedY * UNIT,
      };
    };

    // Draw coordinate system axes
    const drawAxes = () => {
      ctx.strokeStyle = COLORS.axes;
      ctx.lineWidth = 1;

      // Draw X axis
      const xStart = transform3DTo2D(-64, 0, 0);
      const xEnd = transform3DTo2D(64, 0, 0);
      ctx.beginPath();
      ctx.moveTo(xStart.x, xStart.y);
      ctx.lineTo(xEnd.x, xEnd.y);
      ctx.stroke();

      // Draw Y axis
      const yStart = transform3DTo2D(0, -64, 0);
      const yEnd = transform3DTo2D(0, 64, 0);
      ctx.beginPath();
      ctx.moveTo(yStart.x, yStart.y);
      ctx.lineTo(yEnd.x, yEnd.y);
      ctx.stroke();

      // Draw Z axis
      const zStart = transform3DTo2D(0, 0, -64);
      const zEnd = transform3DTo2D(0, 0, 64);
      ctx.beginPath();
      ctx.moveTo(zStart.x, zStart.y);
      ctx.lineTo(zEnd.x, zEnd.y);
      ctx.stroke();
    };

    // Shape drawing functions
    const drawCircle = (shape) => {
      const { radius } = shape.parameters;
      let [x, y, z] = shape.coordinates;
      const points = [];

      for (let i = 0; i < STEPS; i++) {
        const angle = (i / STEPS) * Math.PI * 2;
        let px, py, pz;

        switch (shape.plane) {
          case "XYConstructionPlane":
            px = x + radius * Math.cos(angle);
            py = y + radius * Math.sin(angle);
            pz = z;
            break;
          case "XZConstructionPlane":
            px = x + radius * Math.cos(angle);
            py = y;
            pz = z + radius * Math.sin(angle);
            break;
          case "YZConstructionPlane":
            px = x;
            py = y + radius * Math.cos(angle);
            pz = z + radius * Math.sin(angle);
            break;
        }

        points.push(transform3DTo2D(px, py, pz));
      }

      drawPath(points, COLORS.circle);
    };

    const drawRectangle = (shape) => {
      const { width, height } = shape.parameters;
      const [x, y, z] = shape.coordinates;
      const corners = [];

      switch (shape.plane) {
        case "XYConstructionPlane":
          corners.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x + width, y, z),
            transform3DTo2D(x + width, y + height, z),
            transform3DTo2D(x, y + height, z)
          );
          break;
        case "XZConstructionPlane":
          corners.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x + width, y, z),
            transform3DTo2D(x + width, y, z + height),
            transform3DTo2D(x, y, z + height)
          );
          break;
        case "YZConstructionPlane":
          corners.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x, y + width, z),
            transform3DTo2D(x, y + width, z + height),
            transform3DTo2D(x, y, z + height)
          );
          break;
      }

      drawPath(corners, COLORS.rectangle);
    };

    const drawTriangle = (shape) => {
      const { side1, side2, side3 } = shape.parameters;
      let [x, y, z] = shape.coordinates;
      
      // Calculate angle using cosine law
      const angleA = Math.acos(
        (side2 * side2 + side3 * side3 - side1 * side1) / 
        (2 * side2 * side3)
      );

      const points = [];
      switch (shape.plane) {
        case "XYConstructionPlane":
          points.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x + side2, y, z),
            transform3DTo2D(
              x + side3 * Math.cos(angleA),
              y + side3 * Math.sin(angleA),
              z
            )
          );
          break;
        case "XZConstructionPlane":
          points.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x + side2, y, z),
            transform3DTo2D(
              x + side3 * Math.cos(angleA),
              y,
              z + side3 * Math.sin(angleA)
            )
          );
          break;
        case "YZConstructionPlane":
          points.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x, y + side2, z),
            transform3DTo2D(
              x,
              y + side3 * Math.cos(angleA),
              z + side3 * Math.sin(angleA)
            )
          );
          break;
      }

      drawPath(points, COLORS.triangle);
    };

    const drawEllipse = (shape) => {
      const { major_radius, minor_radius } = shape.parameters;
      let [x, y, z] = shape.coordinates;
      const points = [];

      for (let i = 0; i < STEPS; i++) {
        const angle = (i / STEPS) * Math.PI * 2;
        let px, py, pz;

        switch (shape.plane) {
          case "XYConstructionPlane":
            px = x + major_radius * Math.cos(angle);
            py = y + minor_radius * Math.sin(angle);
            pz = z;
            break;
          case "XZConstructionPlane":
            px = x + major_radius * Math.cos(angle);
            py = y;
            pz = z + minor_radius * Math.sin(angle);
            break;
          case "YZConstructionPlane":
            px = x;
            py = y + major_radius * Math.cos(angle);
            pz = z + minor_radius * Math.sin(angle);
            break;
        }

        points.push(transform3DTo2D(px, py, pz));
      }

      drawPath(points, COLORS.ellipse);
    };

    // Helper function to draw paths
    const drawPath = (points, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.closePath();
      ctx.stroke();
    };

    // Main drawing function
    const drawShapes = () => {
      shapes.forEach((shape) => {
        switch (shape.shape) {
          case "circle":
            drawCircle(shape);
            break;
          case "rectangle":
            drawRectangle(shape);
            break;
          case "triangle":
            drawTriangle(shape);
            break;
          case "ellipse":
            drawEllipse(shape);
            break;
        }
      });
    };

    // Clear canvas and draw everything
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    drawShapes();
  }, [shapes]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        border: "2px solid black",
        margin: "20px",
      }} 
    />
  );
};

export default CoordinatePlane;
```

This part of the explanation (every text under CoordinatePlane.js) will be about the code above. Every explanation will be made with the text talking about the code block above it.

``` javascript
import React, { useRef, useEffect } from "react";
```

This line imports required code from the react library.

``` javascript
const CoordinatePlane = ({ shapes }) => {
```

This line defines a functional react component.  
A functional react component is like a function but it is simpler and it returns a react element.

``` javascript
  const canvasRef = useRef(null);
```

This line creates a reference to the `canvas` DOM element, which is important for us to put shapes on the screen.

``` javascript
  // Constants for canvas configuration
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 700;
  const UNIT = 16;
  const STEPS = 100; // For smooth curves
```

This code block creates some constants that will be used to set the canvas and shapes. The first 3 lines are about the canvas's width, height, and unit. The last line contains the number of points a shape like circle will have in a 2D plane so that after each point is connected, a circle (hectogon, to be more precise) will be created as close to the desired circle as possible.

``` javascript
  // Shape colors
  const COLORS = {
    circle: "blue",
    rectangle: "green",
    triangle: "red",
    ellipse: "purple",
    axes: "gray"
  };
```

The array above is created so that when a color is needed for a specific sitation, it could be accessed directly from this array. For example, every circle would be drawn blue, so the color written next to circle is blue.

```javascript
  useEffect(() => {
```

``` javascript
  }, [shapes]);
```

The line in the first code block above is used so that the code could be automatically re-run whenever shapes is changed. This condition can be seen in the second code block above, which is the end of the `useEffect(() => {`.

``` javascript
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
```

This code block creates ctx, which lets us create shapes in the canvas.

``` javascript
    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
```

This code block sets the width and height of the canvas to the constants created earlier. This code block also creates centerX and centerY, which represents the center coordinates of the canvas.

``` javascript
    // 3D to 2D transformation function
    const transform3DTo2D = (x, y, z) => {
      const angleX = Math.PI / 6;
      const angleZ = Math.PI / 6;

      const transformedX = x * Math.cos(angleZ) - z * Math.sin(angleZ);
      const transformedY =
        y * Math.cos(angleX) - 
        (x * Math.sin(angleZ) + z * Math.cos(angleZ)) * Math.sin(angleX);

      return {
        x: centerX + transformedX * UNIT,
        y: centerY - transformedY * UNIT,
      };
    };
```

This code block contains a function that turns 3D coordinates to 2D ones. We input x, y, and z coordinates, and it returns x and y coordinates depending on the coordinates the function was inputted.

``` javascript
    // Draw coordinate system axes
    const drawAxes = () => {
      ctx.strokeStyle = COLORS.axes;
      ctx.lineWidth = 1;

      // Draw X axis
      const xStart = transform3DTo2D(-64, 0, 0);
      const xEnd = transform3DTo2D(64, 0, 0);
      ctx.beginPath();
      ctx.moveTo(xStart.x, xStart.y);
      ctx.lineTo(xEnd.x, xEnd.y);
      ctx.stroke();

      // Draw Y axis
      const yStart = transform3DTo2D(0, -64, 0);
      const yEnd = transform3DTo2D(0, 64, 0);
      ctx.beginPath();
      ctx.moveTo(yStart.x, yStart.y);
      ctx.lineTo(yEnd.x, yEnd.y);
      ctx.stroke();

      // Draw Z axis
      const zStart = transform3DTo2D(0, 0, -64);
      const zEnd = transform3DTo2D(0, 0, 64);
      ctx.beginPath();
      ctx.moveTo(zStart.x, zStart.y);
      ctx.lineTo(zEnd.x, zEnd.y);
      ctx.stroke();
    };
```

The first 2 lines of this code block sets the color of the line that will be drawn to COLORS.axes, which is gray, and it also sets the width pf the line that will be drawn to 1. The remainder of the code draws the x, y, and z axes to the canvas.

``` javascript
    // Shape drawing functions
    const drawCircle = (shape) => {
      const { radius } = shape.parameters;
      let [x, y, z] = shape.coordinates;
      const points = [];

      for (let i = 0; i < STEPS; i++) {
        const angle = (i / STEPS) * Math.PI * 2;
        let px, py, pz;

        switch (shape.plane) {
          case "XYConstructionPlane":
            px = x + radius * Math.cos(angle);
            py = y + radius * Math.sin(angle);
            pz = z;
            break;
          case "XZConstructionPlane":
            px = x + radius * Math.cos(angle);
            py = y;
            pz = z + radius * Math.sin(angle);
            break;
          case "YZConstructionPlane":
            px = x;
            py = y + radius * Math.cos(angle);
            pz = z + radius * Math.sin(angle);
            break;
        }

        points.push(transform3DTo2D(px, py, pz));
      }

      drawPath(points, COLORS.circle);
    };

    const drawRectangle = (shape) => {
      const { width, height } = shape.parameters;
      const [x, y, z] = shape.coordinates;
      const corners = [];

      switch (shape.plane) {
        case "XYConstructionPlane":
          corners.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x + width, y, z),
            transform3DTo2D(x + width, y + height, z),
            transform3DTo2D(x, y + height, z)
          );
          break;
        case "XZConstructionPlane":
          corners.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x + width, y, z),
            transform3DTo2D(x + width, y, z + height),
            transform3DTo2D(x, y, z + height)
          );
          break;
        case "YZConstructionPlane":
          corners.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x, y + width, z),
            transform3DTo2D(x, y + width, z + height),
            transform3DTo2D(x, y, z + height)
          );
          break;
      }

      drawPath(corners, COLORS.rectangle);
    };

    const drawTriangle = (shape) => {
      const { side1, side2, side3 } = shape.parameters;
      let [x, y, z] = shape.coordinates;
      
      // Calculate angle using cosine law
      const angleA = Math.acos(
        (side2 * side2 + side3 * side3 - side1 * side1) / 
        (2 * side2 * side3)
      );

      const points = [];
      switch (shape.plane) {
        case "XYConstructionPlane":
          points.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x + side2, y, z),
            transform3DTo2D(
              x + side3 * Math.cos(angleA),
              y + side3 * Math.sin(angleA),
              z
            )
          );
          break;
        case "XZConstructionPlane":
          points.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x + side2, y, z),
            transform3DTo2D(
              x + side3 * Math.cos(angleA),
              y,
              z + side3 * Math.sin(angleA)
            )
          );
          break;
        case "YZConstructionPlane":
          points.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x, y + side2, z),
            transform3DTo2D(
              x,
              y + side3 * Math.cos(angleA),
              z + side3 * Math.sin(angleA)
            )
          );
          break;
      }

      drawPath(points, COLORS.triangle);
    };

    const drawEllipse = (shape) => {
      const { major_radius, minor_radius } = shape.parameters;
      let [x, y, z] = shape.coordinates;
      const points = [];

      for (let i = 0; i < STEPS; i++) {
        const angle = (i / STEPS) * Math.PI * 2;
        let px, py, pz;

        switch (shape.plane) {
          case "XYConstructionPlane":
            px = x + major_radius * Math.cos(angle);
            py = y + minor_radius * Math.sin(angle);
            pz = z;
            break;
          case "XZConstructionPlane":
            px = x + major_radius * Math.cos(angle);
            py = y;
            pz = z + minor_radius * Math.sin(angle);
            break;
          case "YZConstructionPlane":
            px = x;
            py = y + major_radius * Math.cos(angle);
            pz = z + minor_radius * Math.sin(angle);
            break;
        }

        points.push(transform3DTo2D(px, py, pz));
      }

      drawPath(points, COLORS.ellipse);
    };

    // Helper function to draw paths
    const drawPath = (points, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.closePath();
      ctx.stroke();
    };

    // Main drawing function
    const drawShapes = () => {
      shapes.forEach((shape) => {
        switch (shape.shape) {
          case "circle":
            drawCircle(shape);
            break;
          case "rectangle":
            drawRectangle(shape);
            break;
          case "triangle":
            drawTriangle(shape);
            break;
          case "ellipse":
            drawEllipse(shape);
            break;
        }
      });
    };
```

The code block above contains the code for drawing shapes. This will be further explained below.

``` javascript
    // Main drawing function
    const drawShapes = () => {
      shapes.forEach((shape) => {
        switch (shape.shape) {
          case "circle":
            drawCircle(shape);
            break;
          case "rectangle":
            drawRectangle(shape);
            break;
          case "triangle":
            drawTriangle(shape);
            break;
          case "ellipse":
            drawEllipse(shape);
            break;
        }
      });
    };
```

I will first start by explaining this function, which is the main drawing function. This function calls the appropriate function for each shape that's in shapes.

``` javascript
    const drawCircle = (shape) => {
      const { radius } = shape.parameters;
      let [x, y, z] = shape.coordinates;
      const points = [];

      for (let i = 0; i < STEPS; i++) {
        const angle = (i / STEPS) * Math.PI * 2;
        let px, py, pz;

        switch (shape.plane) {
          case "XYConstructionPlane":
            px = x + radius * Math.cos(angle);
            py = y + radius * Math.sin(angle);
            pz = z;
            break;
          case "XZConstructionPlane":
            px = x + radius * Math.cos(angle);
            py = y;
            pz = z + radius * Math.sin(angle);
            break;
          case "YZConstructionPlane":
            px = x;
            py = y + radius * Math.cos(angle);
            pz = z + radius * Math.sin(angle);
            break;
        }

        points.push(transform3DTo2D(px, py, pz));
      }

      drawPath(points, COLORS.circle);
    };
```

This code block creates a function to create 2D circle based on the inputted information about the shape. The first few lines set the radius of the shape to a constant named radius; they also set x, y, and z variables depending on the coordinates of the shape and create an empty points array, which will be used to contain the corner points of the shape (circles don't have corners, so the shape will be a polygon with 100 corners, which will look similar to the circle we desire).  
The for loop iterates as much as STEPS, which has a value of 100. Every value of i from the for loop is used to calculate which angle of the circle the current point (the point that is being determined at the current iteration) is at. For example, if the for loop is at the 2nd iteration, the angle of the point is (1/100) * 2 * pi, which is 1% of a maximum value of 2pi. The for loop also determines the variables of px, py, and pz, which are the coordinates of the current point. These points are determined depending on the current angle, radius, and the plane (the plane can be XY, XZ, or YZ plane). After the coordinate of the point is determined, the coordinate is added to the points array after being transformed to 2D coordinates. Basically, the for loop is used to determine 100 points on the given circle.  
After this, the points array and the COLORS.circle color (blue) is inputted into the drawPath function. I will be explaining the drawPath function after explaining the functions of the shapes.

``` javascript
    const drawRectangle = (shape) => {
      const { width, height } = shape.parameters;
      const [x, y, z] = shape.coordinates;
      const corners = [];

      switch (shape.plane) {
        case "XYConstructionPlane":
          corners.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x + width, y, z),
            transform3DTo2D(x + width, y + height, z),
            transform3DTo2D(x, y + height, z)
          );
          break;
        case "XZConstructionPlane":
          corners.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x + width, y, z),
            transform3DTo2D(x + width, y, z + height),
            transform3DTo2D(x, y, z + height)
          );
          break;
        case "YZConstructionPlane":
          corners.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x, y + width, z),
            transform3DTo2D(x, y + width, z + height),
            transform3DTo2D(x, y, z + height)
          );
          break;
      }

      drawPath(corners, COLORS.rectangle);
    };
```

The code block above is used to create a function that's used to create a 2D rectangle. The function first determines the height and width of the rectangle, and then it finds the rectangle's coordinates and creates a corners array (this array is similar to the points array in the drawCircle function). After this, the program determines 4 points (1 for each corner) depending on the width, height, and the plane of the rectangle, which it turns from 3D to 2D before adding it to the corners array. At the end, the drawPath function is called by inputting the corners array and the COLORS.rectangle color.

``` javascript
    const drawTriangle = (shape) => {
      const { side1, side2, side3 } = shape.parameters;
      let [x, y, z] = shape.coordinates;
      
      // Calculate angle using cosine law
      const angleA = Math.acos(
        (side2 * side2 + side3 * side3 - side1 * side1) / 
        (2 * side2 * side3)
      );

      const points = [];
      switch (shape.plane) {
        case "XYConstructionPlane":
          points.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x + side2, y, z),
            transform3DTo2D(
              x + side3 * Math.cos(angleA),
              y + side3 * Math.sin(angleA),
              z
            )
          );
          break;
        case "XZConstructionPlane":
          points.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x + side2, y, z),
            transform3DTo2D(
              x + side3 * Math.cos(angleA),
              y,
              z + side3 * Math.sin(angleA)
            )
          );
          break;
        case "YZConstructionPlane":
          points.push(
            transform3DTo2D(x, y, z),
            transform3DTo2D(x, y + side2, z),
            transform3DTo2D(
              x,
              y + side3 * Math.cos(angleA),
              z + side3 * Math.sin(angleA)
            )
          );
          break;
      }

      drawPath(points, COLORS.triangle);
    };
```

The code block above is used to create a function which's purpose is to draw a 2D triangle. The code first destructures the side lengths and the coordinate of the triangle. Then, it calculates the angle by using the lengths it took. After this, the code creates a points array, which will be used to contain the coordinates of the corner points of the triangle. Finally, the coordinates of the corner points are calculated based on the plane, side lengths, and the angle determined before, which are then added to the points array (the coordinates are turned to 2D before being added, of course). Like the other shape drawing functions, the drawPath function is called to draw the triangle based on the points array and the COLORS.triangle color.

``` javascript
    const drawEllipse = (shape) => {
      const { major_radius, minor_radius } = shape.parameters;
      let [x, y, z] = shape.coordinates;
      const points = [];

      for (let i = 0; i < STEPS; i++) {
        const angle = (i / STEPS) * Math.PI * 2;
        let px, py, pz;

        switch (shape.plane) {
          case "XYConstructionPlane":
            px = x + major_radius * Math.cos(angle);
            py = y + minor_radius * Math.sin(angle);
            pz = z;
            break;
          case "XZConstructionPlane":
            px = x + major_radius * Math.cos(angle);
            py = y;
            pz = z + minor_radius * Math.sin(angle);
            break;
          case "YZConstructionPlane":
            px = x;
            py = y + major_radius * Math.cos(angle);
            pz = z + minor_radius * Math.sin(angle);
            break;
        }

        points.push(transform3DTo2D(px, py, pz));
      }

      drawPath(points, COLORS.ellipse);
    };
```

The code block above contains a function that is used to draw a 2D ellipse. First, the code takes the major radius, minor radius, and the coordinates from the ellipse. It then creates a points array, which will contain 100 coordinates of points placed in the shape of the desired 2D ellipse. After this, a for loop that iterates as much as STEPS, which has the value of 100, is created.  
This for loop first determines an angle based on the current value of i. It then calculates the x, y, and z coordinates of the current point (the point that is in the process of being determined in the current iteration) based on the plane, angle, and the minor and major radius of the ellipse. It then adds this coordinate to the points array after turning it into 2D. The for loop repeats this a 100 times, while only changing the current angle at each iteration (as I said before).  
After the for loop ends, the drawPath function is called to draw the ellipse based on the points array and the COLORS.ellipse color.

``` javascript
    // Helper function to draw paths
    const drawPath = (points, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.closePath();
      ctx.stroke();
    };
```

I will now explain this function, which draws the shapes. This function first gets the color and points as an input. The color is inputted based on the shape that is being drawn (it's blue if it's a circle, for example). The points is the array of coordinates that was created before this function was called.  
This function first sets the color of the line that will be drawn to the color inputted and the line width to 2. Then, it creates a for each loop that creates lines to connect the points in the points array.

``` javascript
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    drawShapes();
```

We are now at the end of the explanation of CoordinatePlane.js. The code block above clears the current canvas and calls the methods named drawAxes and drawShapes, which draw the x, y, and z axes and the current shapes.  
I also want to say that this code returns the canvas it created with the canvas having a black border with 2px thickness.

### ThreeDView.js

### MainPage.js

``` javascript
import React from "react";
import { useNavigate } from "react-router-dom";

const MainPage = () => {
  const navigate = useNavigate();

  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "black",
        color: "white",
        fontFamily: "'Press Start 2P'",
        textAlign: "center",
      },
    },
    // Title
    React.createElement(
      "h1",
      {
        style: {
          fontSize: "4rem",
          textTransform: "uppercase",
          marginBottom: "40px",
          letterSpacing: "2px",
        },
      },
      React.createElement("span", { style: { color: "#FFA500" } }, "PARAMETRI"),
      "X"
    ),
    // Start Button
    React.createElement(
      "button",
      {
        style: {
          fontSize: "1rem",
          textTransform: "uppercase",
          fontFamily: "'Press Start 2P'",
          backgroundColor: "black",
          color: "white",
          border: "2px solid white",
          padding: "10px 20px",
          cursor: "pointer",
          transition: "transform 0.2s, background-color 0.2s",
        },
        onClick: () => navigate("/split"), // Navigate to SplitSelection
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = "#FFA500";
          e.target.style.color = "black";
          e.target.style.transform = "scale(1.1)";
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = "black";
          e.target.style.color = "white";
          e.target.style.transform = "scale(1)";
        },
      },
      "Start"
    ),
    // Blinking Text
    React.createElement(
      "p",
      {
        style: {
          marginTop: "30px",
          fontSize: "0.7rem",
          color: "#bbb",
          textTransform: "uppercase",
          fontFamily: "'Press Start 2P'",
          animation: "blink 2s infinite",
        },
      },
      "Press Enter to Start"
    )
  );
};

export default MainPage;
```

The text under MainPage.js will be about the code above.

``` javascript
import React from "react";
import { useNavigate } from "react-router-dom";
```

This code block imports the react library and useNavigate from reacter-router-dom.

``` javascript
const MainPage = () => {
```

This line creates a react functional component called MainPage.

``` javascript
  const navigate = useNavigate();
```

This line gives us the ability to navigate to different pages. For example, `navigate("/split")` makes the user navigate to SplitSelection, which is a different page.

``` javascript
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "black",
        color: "white",
        fontFamily: "'Press Start 2P'",
        textAlign: "center",
      },
    },
    // Title
    React.createElement(
      "h1",
      {
        style: {
          fontSize: "4rem",
          textTransform: "uppercase",
          marginBottom: "40px",
          letterSpacing: "2px",
        },
      },
      React.createElement("span", { style: { color: "#FFA500" } }, "PARAMETRI"),
      "X"
    ),
    // Start Button
    React.createElement(
      "button",
      {
        style: {
          fontSize: "1rem",
          textTransform: "uppercase",
          fontFamily: "'Press Start 2P'",
          backgroundColor: "black",
          color: "white",
          border: "2px solid white",
          padding: "10px 20px",
          cursor: "pointer",
          transition: "transform 0.2s, background-color 0.2s",
        },
        onClick: () => navigate("/split"), // Navigate to SplitSelection
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = "#FFA500";
          e.target.style.color = "black";
          e.target.style.transform = "scale(1.1)";
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = "black";
          e.target.style.color = "white";
          e.target.style.transform = "scale(1)";
        },
      },
      "Start"
    ),
    // Blinking Text
    React.createElement(
      "p",
      {
        style: {
          marginTop: "30px",
          fontSize: "0.7rem",
          color: "#bbb",
          textTransform: "uppercase",
          fontFamily: "'Press Start 2P'",
          animation: "blink 2s infinite",
        },
      },
      "Press Enter to Start"
    )
  );
```

This part contains the react elements that will be returned by this functional react component. I will explain this code block in pieces.

``` javascript
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "black",
        color: "white",
        fontFamily: "'Press Start 2P'",
        textAlign: "center",
      },
    },
```

This code block creates a full page with  
  - a black background
  - centered white content
  - a retro font.

``` javasctipt
    // Title
    React.createElement(
      "h1",
      {
        style: {
          fontSize: "4rem",
          textTransform: "uppercase",
          marginBottom: "40px",
          letterSpacing: "2px",
        },
      },
      React.createElement("span", { style: { color: "#FFA500" } }, "PARAMETRI"),
      "X"
    ),
```

This part creates a title which  
  - is as big as 4 rem units
  - is uppercase
  - has "PARAMETRIX" written.
    - The "X" in "PARAMETRIX" is white, while "PARAMETRI" is orange.

``` javascript
    // Start Button
    React.createElement(
      "button",
      {
        style: {
          fontSize: "1rem",
          textTransform: "uppercase",
          fontFamily: "'Press Start 2P'",
          backgroundColor: "black",
          color: "white",
          border: "2px solid white",
          padding: "10px 20px",
          cursor: "pointer",
          transition: "transform 0.2s, background-color 0.2s",
        },
        onClick: () => navigate("/split"), // Navigate to SplitSelection
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = "#FFA500";
          e.target.style.color = "black";
          e.target.style.transform = "scale(1.1)";
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = "black";
          e.target.style.color = "white";
          e.target.style.transform = "scale(1)";
        },
      },
      "Start"
    ),
```

This code block creates a button. I will be explaining what the code of the button does in parts.

``` javascript
React.createElement(
      "button",
      {
        style: {
          fontSize: "1rem",
          textTransform: "uppercase",
          fontFamily: "'Press Start 2P'",
          backgroundColor: "black",
          color: "white",
          border: "2px solid white",
          padding: "10px 20px",
          cursor: "pointer",
          transition: "transform 0.2s, background-color 0.2s",
        },
```

This part sets a style to the button. According to this part of the code, the button  
  - has text as big as 1 rem unit
  - is uppercase
  - has a retro style font
  - has a black background
  - has a white text color
  - has a white border as thick as 2px
  - changes the cursor to a pointer when it's on the button
  - has a transition speed of 0.2 seconds. This means that the button will change into another color, for example, in 0.2 seconds instead of instantly.

Every line in this list represents a line in the code block above. The first line in the list represents the `fontSize: "1rem",` line in the code block etc.

``` javascript
        onClick: () => navigate("/split"), // Navigate to SplitSelection
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = "#FFA500";
          e.target.style.color = "black";
          e.target.style.transform = "scale(1.1)";
        },
```

This part gives the button the ability to be clicked and a hover effect.  
The first line in this code block is responsible for the clicking effect. The first line starts with `onClick`, which means its purpose is about clicking the button. The rest of the line has `navigate("/split")`, which means that when the button is clicked, it will change the URL to `/split`. `/split` is the part about SplitSelection.js.  
The rest of the code is about the cursor hovering on the button. When the curson hovers on the button, the button will  
  - have an orange background color, instead of black
  - have a black text color, instead of white
  - will be 10% bigger than before

``` javascript
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = "black";
          e.target.style.color = "white";
          e.target.style.transform = "scale(1)";
        },
```

This part of the code is about what will happen when the cursor stops hovering on the button. When the mouse stops hovering, the button will  
  - change to a black background color, like it was before
  - change to a white text color, like it was before
  - get to 100% size, instead of 110%

Basically, the button will revert to how it was before the cursor started hovering on it.

``` javascript
      "Start"
```

This line means that the text inside the button will write `Start`.

``` javascript
    // Blinking Text
    React.createElement(
      "p",
      {
        style: {
          marginTop: "30px",
          fontSize: "0.7rem",
          color: "#bbb",
          textTransform: "uppercase",
          fontFamily: "'Press Start 2P'",
          animation: "blink 2s infinite",
        },
      },
      "Press Enter to Start"
    )
  );
```

This code block is the last part of MainPage.js. This code block creates a paragraph type text. The text  
  - is as big as 0.7 rem units
  - is light gray
  - is uppercase
  - has a retro font
  - blinks every 2 seconds.
  - has `Press Enter to Start` written

### SplitSelection.js

``` javascript
import React from "react";
import { useNavigate } from "react-router-dom";

const SplitSelection = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'Press Start 2P'",
      }}
    >
      {/* Left Side: Parametrix */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f4e2cc", // Beige background
          borderRight: "2px solid black",
        }}
      >
        <button
          style={{
            fontSize: "2rem",
            fontFamily: "'Press Start 2P'",
            color: "#996633", // Brown text color
            backgroundColor: "#f4e2cc", // Match the background color
            border: "3px solid #996633",
            padding: "20px 40px",
            cursor: "pointer",
            transition: "transform 0.3s, background-color 0.3s, color 0.3s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#996633";
            e.target.style.color = "#f4e2cc";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#f4e2cc";
            e.target.style.color = "#996633";
            e.target.style.transform = "scale(1)";
          }}
          onClick={() => navigate("/parametrix")}  // Navigate to Parametrix view
        >
          Parametrix
        </button>
      </div>

      {/* Right Side: Tutorials */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "black",
          position: "relative", // Enables absolute positioning for the Back button
        }}
      >
        <button
          style={{
            fontSize: "2rem",
            fontFamily: "'Press Start 2P'",
            color: "white",
            backgroundColor: "black",
            border: "3px solid white",
            padding: "20px 40px",
            cursor: "pointer",
            transition: "transform 0.3s, background-color 0.3s, color 0.3s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "white";
            e.target.style.color = "black";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "black";
            e.target.style.color = "white";
            e.target.style.transform = "scale(1)";
          }}
          onClick={() => navigate("/levelselection")}
        >
          Tutorials
        </button>

        {/* Back Button */}
        <button
          style={{
            position: "absolute", // Absolute positioning
            bottom: "20px", // Positioned at the bottom
            right: "20px", // Positioned at the right
            fontSize: "1rem",
            fontFamily: "'Press Start 2P'",
            color: "black",
            backgroundColor: "white",
            border: "3px solid white",
            padding: "10px 20px",
            cursor: "pointer",
            transition: "transform 0.3s, background-color 0.3s, color 0.3s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "cyan";
            e.target.style.color = "black";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "white";
            e.target.style.color = "black";
            e.target.style.transform = "scale(1)";
          }}
          onClick={() => navigate("/")} // Navigate back to the start page
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default SplitSelection;
```

The text under SplitSelection.js will be about the code above.

``` javascript
import React from "react";
import { useNavigate } from "react-router-dom";
```

This code block imports the react library and useNavigate from reacter-router-dom.

``` javascript
const SplitSelection = () => {
```

This code block creates a react functional component named SplitSelection, which is the main part of SplitSelection.js.

``` javascript
  const navigate = useNavigate();
```

This part creates a constant, navigate, that refers to a function named useNavigate. This function lets us navigate to different pages.

``` javascript
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'Press Start 2P'",
      }}
    >
      {/* Left Side: Parametrix */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f4e2cc", // Beige background
          borderRight: "2px solid black",
        }}
      >
        <button
          style={{
            fontSize: "2rem",
            fontFamily: "'Press Start 2P'",
            color: "#996633", // Brown text color
            backgroundColor: "#f4e2cc", // Match the background color
            border: "3px solid #996633",
            padding: "20px 40px",
            cursor: "pointer",
            transition: "transform 0.3s, background-color 0.3s, color 0.3s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#996633";
            e.target.style.color = "#f4e2cc";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#f4e2cc";
            e.target.style.color = "#996633";
            e.target.style.transform = "scale(1)";
          }}
          onClick={() => navigate("/parametrix")}  // Navigate to Parametrix view
        >
          Parametrix
        </button>
      </div>

      {/* Right Side: Tutorials */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "black",
          position: "relative", // Enables absolute positioning for the Back button
        }}
      >
        <button
          style={{
            fontSize: "2rem",
            fontFamily: "'Press Start 2P'",
            color: "white",
            backgroundColor: "black",
            border: "3px solid white",
            padding: "20px 40px",
            cursor: "pointer",
            transition: "transform 0.3s, background-color 0.3s, color 0.3s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "white";
            e.target.style.color = "black";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "black";
            e.target.style.color = "white";
            e.target.style.transform = "scale(1)";
          }}
          onClick={() => navigate("/levelselection")}
        >
          Tutorials
        </button>

        {/* Back Button */}
        <button
          style={{
            position: "absolute", // Absolute positioning
            bottom: "20px", // Positioned at the bottom
            right: "20px", // Positioned at the right
            fontSize: "1rem",
            fontFamily: "'Press Start 2P'",
            color: "black",
            backgroundColor: "white",
            border: "3px solid white",
            padding: "10px 20px",
            cursor: "pointer",
            transition: "transform 0.3s, background-color 0.3s, color 0.3s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "cyan";
            e.target.style.color = "black";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "white";
            e.target.style.color = "black";
            e.target.style.transform = "scale(1)";
          }}
          onClick={() => navigate("/")} // Navigate back to the start page
        >
          Back
        </button>
      </div>
    </div>
  );
};
```

The remainder of the text under SplitSelection.js will be under the code block above. The `return (` at the first line means that the code will return everything between the parentheses, which is basically the remainder of the code.

``` javascript
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'Press Start 2P'",
      }}
    >
```

This code block sets a frame for its child elements.  
Its child elements are the part in between the `<div>` and its corresponding `</div>`.

``` javascript
      {/* Left Side: Parametrix */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f4e2cc", // Beige background
          borderRight: "2px solid black",
        }}
      >
```

This `<div>` is in the `<div>` shown in the previous code block.  
This code block creates a background that is centered, has a beige background color, and has a black border as thick as 2px on its right side. This part is on the left side of the screen.

``` javascript
        <button
          style={{
            fontSize: "2rem",
            fontFamily: "'Press Start 2P'",
            color: "#996633", // Brown text color
            backgroundColor: "#f4e2cc", // Match the background color
            border: "3px solid #996633",
            padding: "20px 40px",
            cursor: "pointer",
            transition: "transform 0.3s, background-color 0.3s, color 0.3s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#996633";
            e.target.style.color = "#f4e2cc";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#f4e2cc";
            e.target.style.color = "#996633";
            e.target.style.transform = "scale(1)";
          }}
          onClick={() => navigate("/parametrix")}  // Navigate to Parametrix view
        >
          Parametrix
        </button>
      </div>
```

This code block creates a button. This button  
  - has a 2 rem text size
  - has a retro font
  - has a brown text color
  - has a beige background color
  - has a brown border as thick as 3px
  - changes the cursor into a pointer when it's hovering on it
  - has a transition time of 0.3 seconds

When a mouse hovers on it, this button  
  - changes its background color to brown
  - changes its text color to beige
  - increases its size by 10%

When a mouse leaves this button, the button changes how it was before. 
This button also navigates to a page that is made by ParametrixView.js.  
This button has Parametrix written on it. Also, as we can see, the `<button>` and the previous `<div>` is closed.

``` javascript
      {/* Right Side: Tutorials */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "black",
          position: "relative", // Enables absolute positioning for the Back button
        }}
      >
```

This code block creates a `<div>` that makes a background that is centered and that has a black background color. This part is on the right side of the screen.

``` javascript
        <button
          style={{
            fontSize: "2rem",
            fontFamily: "'Press Start 2P'",
            color: "white",
            backgroundColor: "black",
            border: "3px solid white",
            padding: "20px 40px",
            cursor: "pointer",
            transition: "transform 0.3s, background-color 0.3s, color 0.3s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "white";
            e.target.style.color = "black";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "black";
            e.target.style.color = "white";
            e.target.style.transform = "scale(1)";
          }}
          onClick={() => navigate("/levelselection")}
        >
          Tutorials
        </button>
```

This code block creates a button. This button  
  - has text as big as 2 rem size
  - has a retro font
  - has a white text
  - has a black background
  - has a border as thick as 3px
  - changes the cursor to a pointer when it's hovering on it
  - has a transition time of 0.3 seconds

When a cursor starts hovering on it, this button  
  - changes its background color to white
  - changes its text color to black
  - increases in size by 10%

When a cursor leaves this button, this button turns back to how it was before.  
When clicked, this button navigates to a page that is made by Select.js.  
This button has Tutorials written on it. Also, this `<button>` is closed in this code block.

``` javascript
        {/* Back Button */}
        <button
          style={{
            position: "absolute", // Absolute positioning
            bottom: "20px", // Positioned at the bottom
            right: "20px", // Positioned at the right
            fontSize: "1rem",
            fontFamily: "'Press Start 2P'",
            color: "black",
            backgroundColor: "white",
            border: "3px solid white",
            padding: "10px 20px",
            cursor: "pointer",
            transition: "transform 0.3s, background-color 0.3s, color 0.3s",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "cyan";
            e.target.style.color = "black";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "white";
            e.target.style.color = "black";
            e.target.style.transform = "scale(1)";
          }}
          onClick={() => navigate("/")} // Navigate back to the start page
        >
          Back
        </button>
      </div>
    </div>
  );
};
```

This code block creates a button. The button has the following properties.  
  - This button has absolute positioning. This makes the button's position relative to an ancestor with `positin: relative`, which is the previous `<div>`. This means that the position of the button will be determined depending on the position of the previous `<div>`.
  - This button is 20px above its normally designated position.
  - This button is 20px away from the right side of its designated position.
  - These last three lines mean that the button will be positioned on the bottom right corner, except the button will be 20px towards left and 20px towards up.
  - This button has a text size of 1 rem.
  - This button has a retro font.
  - This button has black text color.
  - This button has white background.
  - This button has a white border as thick as 3px.
  - This button changes the cursor to a pointer when it's hovering on it.
  - This button has a transition time of 0.3 seconds.

This button changes when a cursor is hovering on it. The button  
  - changes its background color to cyan
  - changes its text color to black
  - increases in size by 10%

The button changes back to how it was after the mouse leaves it.  
The button goes back to the start page when it is clicked.  
The button has Back written on it.  
This is where the whole code under SplitSelection.js ends.

### ParametrixView.js

I will first start by talking about the parametrix view page instead of the level selection page.

### Select.js

``` javascript
import React from "react";
import { useNavigate } from "react-router-dom";

const Select = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "black",
        color: "white",
        fontFamily: "'Press Start 2P', cursive",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "200px" }}>Select a Level</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          width: "60%",
          maxWidth: "600px",
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
          <button
            key={level}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              padding: "20px 0",
              backgroundColor: "black",
              color: "white",
              border: "2px solid white",
              fontSize: "2rem",
              cursor: "pointer",
              fontFamily: "'Press Start 2P', cursive",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onClick={() => navigate(`/lvl${level}`)}
            onMouseOver={(e) => {
              e.target.style.boxShadow = "0 0 10px white";
              e.target.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.target.style.boxShadow = "none";
              e.target.style.transform = "scale(1)";
            }}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate("/split")}
        style={{
          marginTop: "40px",
          padding: "10px 20px",
          fontSize: "1.2rem",
          color: "white",
          backgroundColor: "transparent",
          border: "2px solid white",
          cursor: "pointer",
          textTransform: "uppercase",
          fontFamily: "'Press Start 2P', cursive",
          transition: "transform 0.2s, box-shadow 0.2s",
          marginBottom: "200px",
        }}
        onMouseOver={(e) => {
          e.target.style.boxShadow = "0 0 10px white";
          e.target.style.transform = "scale(1.1)";
        }}
        onMouseOut={(e) => {
          e.target.style.boxShadow = "none";
          e.target.style.transform = "scale(1)";
        }}
      >
        Back
      </button>

      {/* Wildcard Button */}
      <button
        style={{
          marginTop: "0px", // Further below
          padding: "5px 10px",
          fontSize: "1.5rem",
          color: "white",
          backgroundColor: "#af8636",
          border: "2px solid white",
          cursor: "pointer",
          textTransform: "uppercase",
          fontFamily: "'Press Start 2P', cursive",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseOver={(e) => {
          e.target.style.boxShadow = "0 0 10px white";
          e.target.style.transform = "scale(1.1)";
        }}
        onMouseOut={(e) => {
          e.target.style.boxShadow = "none";
          e.target.style.transform = "scale(1)";
        }}
        onClick={() => navigate("/w")}
      >
        Wildcard
      </button>
    </div>
  );
};

export default Select;
```

The text under Select.js will be about the code block above. This code represents the level selection page of Parametrix.

``` javascript
import React from "react";
import { useNavigate } from "react-router-dom";
```

This code block imports the react library and useNavigate from "react-router-dom".

``` javascript
const Select = () => {
```

This code block creates a functional react component named Select.

``` javascript
  const navigate = useNavigate();
```

This code block creates a navigate constant that will be used to navigate to different pages.

``` javascript
  return (
```

This `return (` shows us that the remainder of the code will be the part returned from the functional react component.

``` javascript
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "black",
        color: "white",
        fontFamily: "'Press Start 2P', cursive",
        textAlign: "center",
      }}
    >
```

This part of the code creates a background that  
  - takes up the whole screen
  - is black
  - has a white text color
  - has a retro style font
    - the `cursive` at the font setting part means that when the font `Press Start 2P` doesn't load, the font will be selected from the cursive font family.
  - has a centered text

``` javascript
      <h1 style={{ fontSize: "2.5rem", marginBottom: "200px" }}>Select a Level</h1>
```

This code block shows us the title that will be written on the background. The text  
  - is as big as 2.5 rem
  - is above the bottom by 200px
  - has a text that writes Select a Level

``` javascript
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          width: "60%",
          maxWidth: "600px",
        }}
      >
```

This part creates a grid. The grid  
  - has 3 columns
  - makes each element in it have 1 fr size
  - has a 20px wide gap between each element in it
  - has a width that takes up 60% of the screen
  - has a width limit of 600px
    - this limit is for screens that have a width larger than 1000px

``` javascript
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
          <button
            key={level}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              padding: "20px 0",
              backgroundColor: "black",
              color: "white",
              border: "2px solid white",
              fontSize: "2rem",
              cursor: "pointer",
              fontFamily: "'Press Start 2P', cursive",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onClick={() => navigate(`/lvl${level}`)}
            onMouseOver={(e) => {
              e.target.style.boxShadow = "0 0 10px white";
              e.target.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.target.style.boxShadow = "none";
              e.target.style.transform = "scale(1)";
            }}
          >
            {level}
          </button>
        ))}
      </div>
```

This code block creates buttons that will be placed on the grid previously made. The number of buttons are equal to the number of levels. Basically, 9 buttons with similar properties are made. The only difference in their code is that each instance of `{level}` in this code block is replaced by the number of the button. For example, the 5th button would have 5 at every instance of `{level}` instead of `{level}` itself. Now I will start to explain the lines.  
The level buttons  
  - have black background
  - have white text
  - have white borders as wide as 2px
  - change the cursor to a pointer when they hover on it
  - have a retro font, which changes to a font from cursive if it does not load
  - have a transition time of 0.2 seconds

The level buttons navigate to the corresponding level page when clicked.

When the cursor is hovering on the level buttons, the buttons  
  - get a shadow effect
  - get bigger by 10%

When the cursor stops hovering on the level buttons, the buttons turn back to how they were before. Also, the level buttons have the corresponding number written on them.

``` javascript
      {/* Back Button */}
      <button
        onClick={() => navigate("/split")}
        style={{
          marginTop: "40px",
          padding: "10px 20px",
          fontSize: "1.2rem",
          color: "white",
          backgroundColor: "transparent",
          border: "2px solid white",
          cursor: "pointer",
          textTransform: "uppercase",
          fontFamily: "'Press Start 2P', cursive",
          transition: "transform 0.2s, box-shadow 0.2s",
          marginBottom: "200px",
        }}
        onMouseOver={(e) => {
          e.target.style.boxShadow = "0 0 10px white";
          e.target.style.transform = "scale(1.1)";
        }}
        onMouseOut={(e) => {
          e.target.style.boxShadow = "none";
          e.target.style.transform = "scale(1)";
        }}
      >
        Back
      </button>
```

This code block creates a back button. The button navigates back to the SplitSelection.js page when clicked.  
This button  
  - is 40px under the element above it
  - has a text size of 1.2 rem
  - has a white text color
  - has a transparent background
  - has a white border with 2px thickness
  - changes the cursor to a pointer when it hovers on it
  - has a retro font that changes to a font from the cursive font family when it can't load
  - has a transition time of 0.2 seconds
  - is 200px above the element under it

When the cursor hovers on it, the button  
  - gets a shadow effect
  - increases in size by 10%

When the cursor stops hovering over the button, the button goes back to how it was before. Also, the button has Back written on it.

``` javascript
      {/* Wildcard Button */}
      <button
        style={{
          marginTop: "0px", // Further below
          padding: "5px 10px",
          fontSize: "1.5rem",
          color: "white",
          backgroundColor: "#af8636",
          border: "2px solid white",
          cursor: "pointer",
          textTransform: "uppercase",
          fontFamily: "'Press Start 2P', cursive",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseOver={(e) => {
          e.target.style.boxShadow = "0 0 10px white";
          e.target.style.transform = "scale(1.1)";
        }}
        onMouseOut={(e) => {
          e.target.style.boxShadow = "none";
          e.target.style.transform = "scale(1)";
        }}
        onClick={() => navigate("/w")}
      >
        Wildcard
      </button>
    </div>
  );
};
```

This code block creates a button. This button  
  - is right under the element above it
  - has a text size of 1.5 rem
  - has a white text color
  - has an ember background color
  - has a white border as thick as 2px
  - changes the cursor to a pointer when it hovers on it
  - has an uppercase text
  - has a retro font that changes to a font from cursive font family when it doesn't load
  - has a transition time of 0.2 seconds

When the cursor hovers on the button, the button  
  - gets a shadow effect
  - increases in size by 10%

When the mouse leaves the button, the button changes back to how it was before.  
When the button is clicked, it navigates to the page that's made by Wildcard.js. Also, the button has Wildcard written on it.

### Wildcard.js

Now, I will be explaining the Wildcard page.

```javascript
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Wildcard = () => {
  const navigate = useNavigate();
  const [circles, setCircles] = useState([]);

  useEffect(() => {
    // Generate random positions for circles at the start
    const newCircles = [
      { id: 1, text: "Laser Cutter" }
    ].map((circle) => ({
      ...circle,
      top: `${Math.random() * 70 + 10}%`, // Random position between 10% and 80% height
      left: `${Math.random() * 70 + 10}%`, // Random position between 10% and 80% width
    }));

    setCircles(newCircles);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#F5F5F5", // Mild white background
        fontFamily: "'Press Start 2P', cursive",
        color: "silver",
        overflow: "hidden",
      }}
    >
      <h1
        style={{
          position: "absolute",
          top: "5%",
          textAlign: "center",
          width: "100%",
          fontSize: "2.5rem",
        }}
      >
        Wildcard Selection
      </h1>

      {/* Render scattered circles */}
      {circles.map((circle) => (
        <div
          key={circle.id}
          style={{
            position: "absolute",
            top: circle.top,
            left: circle.left,
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            backgroundColor: "#AF8636",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            textAlign: "center",
            cursor: "pointer",
            border: "3px solid silver",
            transition: "transform 0.3s, box-shadow 0.3s",
          }}
          onMouseOver={(e) => {
            e.target.style.boxShadow = "0 0 15px silver";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseOut={(e) => {
            e.target.style.boxShadow = "none";
            e.target.style.transform = "scale(1)";
          }}
          onClick={() => navigate(`/wildcard/${circle.text.toLowerCase().replace(" ", "-")}`)}
        >
          {circle.text}
        </div>
      ))}

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: "absolute",
          bottom: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "15px 30px",
          fontSize: "1.2rem",
          color: "silver",
          backgroundColor: "transparent",
          border: "2px solid silver",
          cursor: "pointer",
          textTransform: "uppercase",
          fontFamily: "'Press Start 2P', cursive",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseOver={(e) => {
          e.target.style.boxShadow = "0 0 10px silver";
          e.target.style.transform = "scale(1.1)";
        }}
        onMouseOut={(e) => {
          e.target.style.boxShadow = "none";
          e.target.style.transform = "scale(1)";
        }}
      >
        Back
      </button>
    </div>
  );
};

export default Wildcard;
```
The text under Wildcard.js will be about the code above.

``` javascript
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
```

This code block imports useEffect and useState from the react library and useNavigate from "react-router-dom".

``` javascript
const Wildcard = () => {
```

This code block creates a functional react element named Wildcard.

``` javascript
  const navigate = useNavigate();
  const [circles, setCircles] = useState([]);
```

This code block creates a constant named navigate that is used to navigate to different pages. This code block also creates an array named circles and an update function named setCircles.

``` javascript
  useEffect(() => {
    // Generate random positions for circles at the start
    const newCircles = [
      { id: 1, text: "Laser Cutter" }
    ].map((circle) => ({
      ...circle,
      top: `${Math.random() * 70 + 10}%`, // Random position between 10% and 80% height
      left: `${Math.random() * 70 + 10}%`, // Random position between 10% and 80% width
    }));

    setCircles(newCircles);
  }, []);
```

This code block creates information for a circle that will be set in a random position. To be more precise, it creates the information of where that random position will be and what will be written on the circle. It also sets this information to the circles array.

``` javascript
  return (
```

This code block shows us that the remainder of this code will be the part being returned.

``` javascript
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#F5F5F5", // Mild white background
        fontFamily: "'Press Start 2P', cursive",
        color: "silver",
        overflow: "hidden",
      }}
    >
```

This code block creates a background. This background  
  - covers the whole screen
  - has a mild white background color
  - has a retro font
  - has a silver text color
  - makes anything that goes over its borders invisible

``` javascript
      <h1
        style={{
          position: "absolute",
          top: "5%",
          textAlign: "center",
          width: "100%",
          fontSize: "2.5rem",
        }}
      >
```

The code block above creates a title. This title  
  - is 5% under the top of the screen
  - is centered
  - has a text size of 2.5 rem

This title also has the text properties defined in the background part (silver text, retro font). The text reads Wildcard Selection.

``` javascript
      {/* Render scattered circles */}
      {circles.map((circle) => (
        <div
          key={circle.id}
          style={{
            position: "absolute",
            top: circle.top,
            left: circle.left,
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            backgroundColor: "#AF8636",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            textAlign: "center",
            cursor: "pointer",
            border: "3px solid silver",
            transition: "transform 0.3s, box-shadow 0.3s",
          }}
          onMouseOver={(e) => {
            e.target.style.boxShadow = "0 0 15px silver";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseOut={(e) => {
            e.target.style.boxShadow = "none";
            e.target.style.transform = "scale(1)";
          }}
          onClick={() => navigate(`/wildcard/${circle.text.toLowerCase().replace(" ", "-")}`)}
        >
          {circle.text}
        </div>
      ))}
```

This code block puts the previously created random circle into the screen. The circle  
  - is at the random position previously decided
  - has a width of 150px
  - has a height of 150px
  - has a border radius that is 50%
  - has a brownish background color
  - has a text size of 1 rem
  - has a centered text
  - changes the cursor to a pointer when it hovers on it
  - has a 3px silver border
  - has a transition speed of 0.3 seconds

When the mouse hovers over the circle, the circle  
  - gets a shadow effect
  - increases in size by 10%

When the mouse stops hovering on the circle, the circle returns to its previous form  
When clicked, the circle navigates to a different page. The page URL ends with `/wildcard/laser-cutter` for this circle. The `laser-cutter` part is actually from the text of the circle, "Laser Cutter", except it was turned to lowercase and the " " in the middle was replaced with "-".  
Also, the text "Laser Cutter" is written on the circle.

``` javascript
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: "absolute",
          bottom: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "15px 30px",
          fontSize: "1.2rem",
          color: "silver",
          backgroundColor: "transparent",
          border: "2px solid silver",
          cursor: "pointer",
          textTransform: "uppercase",
          fontFamily: "'Press Start 2P', cursive",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseOver={(e) => {
          e.target.style.boxShadow = "0 0 10px silver";
          e.target.style.transform = "scale(1.1)";
        }}
        onMouseOut={(e) => {
          e.target.style.boxShadow = "none";
          e.target.style.transform = "scale(1)";
        }}
      >
        Back
      </button>
    </div>
  );
};
```

The code block above creates a back button. The button returns to the previous page when clicked. Also, the button  
  - is 5% above the bottom of the screen
  - is centered
    - the line `left: "50%",` moves the left side of the button to the middle
    - the line `transform: "translateX(-50%)",` moves the button to the left by half of its own width
    - this means that the button is centered
  - has a text size of 1.2 rem
  - has a text color of silver
  - has a transparent background
  - has a silver border as thick as 2px
  - turns the cursor to a pointer when it hovers on it
  - has an uppercase text
  - has a retro font
  - has a transition time of 0.2 seconds

When the cursor hovers over the button, the button  
  - gets a shadow effect
  - increases in size by 10%

When the cursor stops hovering, the button turns back to normal.  
The text Back is written on the button.
