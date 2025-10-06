// examples.js
document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    const examples = {
      'finger-joint-box': {
        image: './Images/finger-joint-box.png',
        file: 'https://raw.githubusercontent.com/HisarCS/Otto/main/src/examples/Glossary/finger-joint-box.txt'
      },
      'puzzle-tiles-grid': {
        image: './Images/puzzle-tiles-grid.png',
        file: 'https://raw.githubusercontent.com/HisarCS/Otto/main/src/examples/Glossary/puzzle_tiles_grid.txt'
      },
      'mini-desk-organizer': {
        image: './Images/mini-desk-organizer.png',
        file: 'https://raw.githubusercontent.com/HisarCS/Otto/main/src/examples/Glossary/mini_desk_organizer.txt'
      },
      'ruler': {
        image: './Images/ruler.png',
        file: 'https://raw.githubusercontent.com/HisarCS/Otto/main/src/examples/Glossary/ruler.txt'
      },
      'cnc-safety-checklist': {
        image: './Images/cnc-safety-checklist.png',
        file: 'https://raw.githubusercontent.com/HisarCS/Otto/main/src/examples/Glossary/cnc_safety.txt'
      },
      'shelf-system': {
        image: './Images/shelf-system.png',
        file: 'https://raw.githubusercontent.com/HisarCS/Otto/main/src/examples/Glossary/shelf_system.txt'
      },
      'chair': {
        image: './Images/chair.png',
        file: 'https://raw.githubusercontent.com/HisarCS/Otto/main/src/examples/Glossary/chair.txt'
      },
      'parametric-construction-kit': {
        image: './Images/parametric-construction-kit.png',
        file: 'https://raw.githubusercontent.com/HisarCS/Otto/main/src/examples/Glossary/parametric_construction_kit.txt'
      },
      'fish': {
        image: './Images/fish.png',
        file: 'https://raw.githubusercontent.com/HisarCS/Otto/main/src/examples/Glossary/fish.txt'
      }
    };

    const cards       = document.querySelectorAll('.example-card');
    const menu        = document.querySelector('.examples-menu');
    const detail      = document.querySelector('.example-detail');
    const detailImage = detail.querySelector('.detail-image');
    const detailCode  = detail.querySelector('.detail-code');
    const detailInfo  = detail.querySelector('.detail-info'); 
    const backBtn     = detail.querySelector('.detail-back');

    let currentWorkspace = null;

    function disposeCurrentWorkspace() {
      try {
        if (currentWorkspace && typeof currentWorkspace.dispose === 'function') {
          currentWorkspace.dispose();
        }
      } catch (e) {
        console.warn('Failed to dispose workspace:', e);
      } finally {
        currentWorkspace = null;
      }
    }

    function createReadOnlyBlockly(container) {
      const ws = Blockly.inject(container, {
        readOnly: true,
        toolbox: null,
        trashcan: false,
        zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 3, minScale: 0.2 },
        move: { scrollbars: true, drag: true, wheel: true },
        grid: { spacing: 20, length: 3, colour: '#eee', snap: false },
        renderer: 'thrasos',
        disableContextMenu: true
      });
      container.__workspace = ws;
      return ws;
    }

    function renderAquiToWorkspace(aquiText, ws) {
      if (typeof window.rebuildWorkspaceFromAqui !== 'function') {
        console.error('rebuildWorkspaceFromAqui is not available on window. Add `window.rebuildWorkspaceFromAqui = rebuildWorkspaceFromAqui;` in app.js');
        return;
      }
      try {
        window.rebuildWorkspaceFromAqui(aquiText, ws);
        if (typeof ws.zoomToFit === 'function') ws.zoomToFit();
        Blockly.svgResize(ws);
      } catch (e) {
        console.error('AQUI → Blocks render failed:', e);
      }
    }

    async function loadAquiText(url) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const text = await response.text();
      if (text.includes('<!DOCTYPE html>')) {
        throw new Error('File not found - received HTML instead');
      }
      return text;
    }

    cards.forEach(card => {
      card.addEventListener('click', async () => {
        const key = card.dataset.example;
        const ex  = examples[key];

        detailImage.src = ex.image;

        let aquiText = '';
        try {
          aquiText = await loadAquiText(ex.file);
          detailCode.textContent = aquiText; 
        } catch (error) {
          const msg = `// Error loading .aqui file: ${error.message}\n// File path: ${ex.file}`;
          detailCode.textContent = msg;
          console.error('Fetch error:', error);
        }

        disposeCurrentWorkspace();
        detailInfo.innerHTML = `
          <div class="example-blockly-viewer" style="
            width:100%;
            height:460px;
            border:1px solid #e5e7eb;
            border-radius:8px;
            background:#fafafa;
            overflow:hidden;
          "></div>
        `;
        const container = detailInfo.querySelector('.example-blockly-viewer');

        currentWorkspace = createReadOnlyBlockly(container);
        if (aquiText) {
          renderAquiToWorkspace(aquiText, currentWorkspace);
        } else {
          const hint = document.createElement('div');
          hint.style.padding = '12px';
          hint.style.fontFamily = 'monospace';
          hint.style.fontSize = '12px';
          hint.textContent = 'Unable to load blocks.';
          container.appendChild(hint);
        }

        menu.style.display = 'none';
        detail.classList.add('visible');
      });
    });

    backBtn.addEventListener('click', () => {
      detail.classList.remove('visible');
      menu.style.display = '';
      disposeCurrentWorkspace();
      detailInfo.innerHTML = ''; 
    });

    window.addEventListener('resize', () => {
      const ws = currentWorkspace;
      if (ws) Blockly.svgResize(ws);
    });
  })();
});

