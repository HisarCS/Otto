document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    const examples = {
      'finger-joint-box': {
        image: '/Images/finger-joint-box.png',
        file: '/src/examples/Glossary/finger_joint_box.aqui',  // Add /src/
        info: `<h3>What it is</h3>
               <p>A box with interlocking "fingers" on all edges, allowing snap-together assembly without glue.</p>
               <h3>Where to use it</h3>
               <p>Laser-cut plywood or acrylic panels for storage containers, enclosures, or packaging prototypes.</p>`
      },
      'puzzle-tiles-grid': {
        image: '/Images/puzzle-tiles-grid.png',
        file: '/src/examples/Glossary/puzzle_tiles_grid.aqui',  // Add /src/
        info: `<h3>What it is</h3>
               <p>A modular grid of square puzzle tiles with notches and pegs for interlocking connections.</p>
               <h3>Where to use it</h3>
               <p>Laser-cut puzzle games or tactile educational tools.</p>`
      },
      'mini-desk-organizer': {
        image: '/Images/mini-desk-organizer.png',
        file: '/src/examples/Glossary/mini_desk_organizer.aqui',  // Add /src/
        info: `<h3>What it is</h3>
               <p>An open-top container with dividers for pens and small items, with rounded corners and label area.</p>
               <h3>Where to use it</h3>
               <p>Laser-cut plywood or acrylic for desk organization.</p>`
      },
      'ruler': {
        image: '/Images/ruler.png',
        file: '/src/examples/Glossary/ruler.aqui',  // Add /src/
        info: `<h3>What it is</h3>
               <p>A small ruler with tick marks every 10mm for quick measurements.</p>
               <h3>Where to use it</h3>
               <p>Keychain-sized tool or embedded in other laser-cut projects.</p>`
      },
      'cnc-safety-checklist': {
        image: '/Images/cnc-safety-checklist.png',
        file: '/src/examples/Glossary/cnc_safety.txt',  // Add /src/
        info: `<h3>What it is</h3>
               <p>A poster-style checklist displaying critical safety steps before operating a CNC machine.</p>
               <h3>Where to use it</h3>
               <p>Mounted near CNC machines in fabrication labs or maker spaces.</p>`
      },
      'shelf-system': {
        image: '/Images/shelf-system.png',
        file: '/src/examples/Glossary/shelf_system.aqui',  // Add /src/
        info: `<h3>What it is</h3>
               <p>A modular shelf system organizing filament spools and finished prints with vertical posts and shelves.</p>
               <h3>Where to use it</h3>
               <p>Fab labs and 3D printer stations for material management.</p>`
      }
    };

    const cards       = document.querySelectorAll('.example-card');
    const menu        = document.querySelector('.examples-menu');
    const detail      = document.querySelector('.example-detail');
    const detailImage = detail.querySelector('.detail-image');
    const detailCode  = detail.querySelector('.detail-code');
    const detailInfo  = detail.querySelector('.detail-info');
    const backBtn     = detail.querySelector('.detail-back');

    cards.forEach(card => {
      card.addEventListener('click', async () => {
        const key = card.dataset.example;
        const ex  = examples[key];
        
        // show image
        detailImage.src = ex.image;
        
        // load .aqui file with better error handling
        try {
          const response = await fetch(ex.file);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const text = await response.text();
          
          // Check if we got HTML (404 page) instead of .aqui content
          if (text.includes('<!DOCTYPE html>')) {
            throw new Error('File not found - received HTML instead');
          }
          
          detailCode.textContent = text;
        } catch (error) {
          detailCode.textContent = `// Error loading .aqui file: ${error.message}\n// File path: ${ex.file}`;
          console.error('Fetch error:', error);
        }
        
        // show description
        detailInfo.innerHTML = ex.info;
        
        // toggle views
        menu.style.display = 'none';
        detail.classList.add('visible');
      });
    });

    backBtn.addEventListener('click', () => {
      detail.classList.remove('visible');
      menu.style.display = '';
    });
  })();
});
