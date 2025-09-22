document.addEventListener('DOMContentLoaded', () => {
  const tabs     = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      contents.forEach(c => c.classList.toggle('active', c.id === target));
    });
  });

  const tutorials = [
    {
      title: 'Write Code, Run and Create Circle',
      video: './tutorials/create_circle.mp4',
      description: 'Type a simple <code>shape circle myCircle { radius: 50 }</code> script, then click Run (Shift+Enter). Your circle appears immediately on the canvas.'
    },
    {
      title: 'Write Code, Run and Create a Rectangle',
      video: './tutorials/rectangle.mp4',
      description: 'Type a simple rectangle script, then click Run (Shift+Enter). Adjust parameters like width, height and fillColor right in the code.'
    },
    {
      title: 'Show Errors Panel',
      video: './tutorials/error.mp4',
      description: 'When an error occurs, click Errors in the footer to reveal detailed messages. Jump right to the code line and fix mistakes without leaving your workspace.'
    },
    {
      title: 'View AST Panel',
      video: './tutorials/view_ast.mp4',
      description: 'Click View AST to see your script’s Abstract Syntax Tree in JSON form. Understand exactly how AQUI parses your code under the hood.'
    },
    {
      title: 'Remove Shape from Canvas',
      video: './tutorials/delete_shape.mp4',
      description: 'Remove shapes by deleting their code and re-running, or clear the canvas completely. Always start from a clean slate when iterating.'
    },
    {
      title: 'Open Shape Palette',
      video: './tutorials/shape_palette1.mp4',
      description: 'Click ⊞ (or press Ctrl+S) to open the shape snippets palette. Drag circles, stars, joints and more directly into your editor.'
    },
    {
      title: 'Add Shape from Palette',
      video: './tutorials/shape_palette2.mp4',
      description: 'Drag a shape snippet (e.g. circle) from the palette into your code. Snippets include parameter placeholders so you can run immediately.'
    },
    {
      title: 'Move Shape in Canvas',
      video: './tutorials/move_canvas.mp4',
      description: 'Click and drag a shape on the canvas to reposition it. The underlying translate(dx,dy) in your code updates automatically.'
    },
    {
      title: 'Resize Shape in Canvas',
      video: './tutorials/resize_canvas.mp4',
      description: 'Use corner handles to stretch or shrink shapes. AQUI syncs the setScale(sx,sy) values back into your script in real time.'
    },
    {
      title: 'Rotate Shape in Canvas',
      video: './tutorials/rotate_canvas.mp4',
      description: 'Grab the rotation handle to spin shapes on the canvas. AQUI writes the rotate(angle) value into your code to match.'
    },
    {
      title: 'Toggle Grid Overlay',
      video: './tutorials/toggle_grid.mp4',
      description: 'Press G to show or hide the grid. Grid snaps help you align precisely; toggle off for a cleaner view.'
    },
    {
      title: 'Open Parameters Panel',
      video: './tutorials/parameters.mp4',
      description: 'Press P (or click “Parameters”) to slide in the parameter controls. See every numeric and color setting in one panel.'
    },
    {
      title: 'Adjust Parameters with Sliders',
      video: './tutorials/sliders.mp4',
      description: 'Drag sliders for position, rotation, and scale to update shapes live. The code in your editor syncs automatically as you tweak.'
    },
    {
      title: 'Adjust Fill and Fill Color',
      video: './tutorials/fill_shape.mp4',
      description: 'Toggle fill and pick a color with the slider. AQUI writes the fillColor parameter back into your code so changes persist.'
    },
    {
      title: 'Show Boolean Union',
      video: './tutorials/union.mp4',
      description: 'Wrap shapes in a <code>union { add … }</code> block to merge them into one geometry. Perfect for combining primitives.'
    },
    {
      title: 'Show Export SVG and DXF',
      video: './tutorials/export.mp4',
      description: 'Click Export ▼ and choose SVG or DXF to download your model for fabrication. Files come ready for laser cutting or CNC machining.'
    },
    {
      title: 'Navigate to Docs Panel',
      video: './tutorials/docs.mp4',
      description: 'Click Docs to view the built-in language reference, examples, and shortcuts. Everything you need is one click away.'
    },
    {
      title: 'Navigate to Examples Tab',
      video: './tutorials/examples.mp4',
      description: 'Click Examples to browse prebuilt designs. Load any example into your editor for instant inspiration and learning.'
    }
  ];

  const grid = document.querySelector('.tutorials-grid');
  tutorials.forEach(({title, video, description}) => {
    const card = document.createElement('div');
    card.className = 'tutorial-card';
    card.innerHTML = `
      <h3>${title}</h3>
      <video class="tutorial-video" src="${video}" muted autoplay loop playsinline></video>
      <p>${description}</p>
    `;
    grid.appendChild(card);
  });
});
