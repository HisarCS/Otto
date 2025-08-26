export function setupConstraintsMenu({ renderer, constraintEngine, displayErrors }) {
  let btn = document.getElementById('constraints-button');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'constraints-button';
    btn.className = 'button';
    btn.textContent = 'Constraints';
    const exportContainer = document.querySelector('.export-container');
    const anchor = exportContainer || document.getElementById('view-errors');
    anchor.parentNode.insertBefore(btn, anchor);
  }

  const pop = document.createElement('div');
  Object.assign(pop.style, {
    position:'fixed', right:'12px', bottom:'64px',
    background:'#fff', border:'1px solid #ccc', borderRadius:'6px',
    padding:'12px', boxShadow:'0 10px 24px rgba(0,0,0,.15)', display:'none',
    fontFamily:'monospace', zIndex:9999, minWidth:'400px', maxWidth:'460px'
  });

  const clear = el => { while(el.firstChild) el.removeChild(el.firstChild); };
  const label = (t,mt='10px') => { const d=document.createElement('div'); d.textContent=t; d.style.fontWeight='bold'; d.style.marginTop=mt; return d; };
  const hr = ()=>{ const h=document.createElement('hr'); h.style.margin='10px 0'; return h; };
  const row2=(a,b)=>{const w=document.createElement('div'); w.style.display='grid'; w.style.gridTemplateColumns='1fr 1fr'; w.style.gap='8px'; w.appendChild(a); w.appendChild(b); return w;};
  const btnFull = t => { const b=document.createElement('button'); b.className='button'; b.textContent=t; b.style.width='100%'; b.style.marginTop='6px'; return b; };
  const inputNum = ()=>{ const i=document.createElement('input'); i.type='number'; i.step='any'; i.style.width='100%'; i.style.margin='6px 0 8px'; return i; };
  const sel = ()=>{const s=document.createElement('select'); s.style.width='100%'; s.style.margin='6px 0 8px'; return s; };
  const err = e => (displayErrors ? displayErrors([{message:`Constraint error: ${e.message}`}]) : console.warn(e));

  function fillShapes(select){
    clear(select);
    if (!renderer || !renderer.shapes) return;
    for (const [name] of renderer.shapes.entries()) {
      const o=document.createElement('option'); o.value=name; o.textContent=name; select.appendChild(o);
    }
  }
  function fillAnchors(select, shapeName){
    clear(select);
    const anchors = constraintEngine.getAnchorsForShape(shapeName);
    anchors.forEach(a => {
      const o=document.createElement('option'); o.value=a.key; o.textContent=a.label; select.appendChild(o);
    });
  }

  const B_t = label('Coincident');
  const B_sa = sel(), B_sb = sel();
  const B_aa = sel(), B_ab = sel();
  B_sa.addEventListener('change', ()=> fillAnchors(B_aa, B_sa.value));
  B_sb.addEventListener('change', ()=> fillAnchors(B_ab, B_sb.value));
  const B_btn = btnFull('Make Anchors Coincident');
  B_btn.addEventListener('click', () => {
    try {
      if (!B_sa.value || !B_sb.value) return;
      if (B_sa.value===B_sb.value && B_aa.value===B_ab.value) return alert('Pick different anchors.');
      const def = constraintEngine.addCoincidentAnchors(
        {shape:B_sa.value, anchor:B_aa.value},
        {shape:B_sb.value, anchor:B_ab.value}
      );
    } catch (e) { err(e); }
  });

  const C_t = label('Distance');
  const C_sa = sel(), C_sb = sel();
  const C_aa = sel(), C_ab = sel();
  const C_d = inputNum(); C_d.placeholder='Distance (e.g., 100)';
  C_sa.addEventListener('change', ()=> fillAnchors(C_aa, C_sa.value));
  C_sb.addEventListener('change', ()=> fillAnchors(C_ab, C_sb.value));
  const C_btn = btnFull('Apply Distance');
  C_btn.addEventListener('click', () => {
    try {
      if (!C_sa.value || !C_sb.value) return;
      const d = Number(C_d.value);
      if (!Number.isFinite(d) || d < 0) return alert('Enter a non-negative distance.');
      const def = constraintEngine.addDistance(
        {shape:C_sa.value, anchor:C_aa.value},
        {shape:C_sb.value, anchor:C_ab.value},
        d
      );
    } catch (e) { err(e); }
  });

  const D_t = label('Horizontal / Vertical');
  const D_sa = sel(), D_sb = sel();
  const D_aa = sel(), D_ab = sel();
  D_sa.addEventListener('change', ()=> fillAnchors(D_aa, D_sa.value));
  D_sb.addEventListener('change', ()=> fillAnchors(D_ab, D_sb.value));
  const D_row = row2(btnFull('Make Horizontal'), btnFull('Make Vertical'));
  D_row.children[0].addEventListener('click', ()=> {
    try { 
      const def = constraintEngine.addHorizontal(
        {shape:D_sa.value, anchor:D_aa.value},
        {shape:D_sb.value, anchor:D_ab.value}
      ); 
    } catch(e){ err(e); }
  });
  D_row.children[1].addEventListener('click', ()=> {
    try { 
      const def = constraintEngine.addVertical(
        {shape:D_sa.value, anchor:D_aa.value},
        {shape:D_sb.value, anchor:D_ab.value}
      ); 
    } catch(e){ err(e); }
  });

  const L_t = label('Active Constraints');
  const list = document.createElement('div');
  list.id = 'constraints-list';
  list.style.maxHeight = '160px';
  list.style.overflowY = 'auto';
  list.style.border = '1px solid #ddd';
  list.style.padding = '6px';
  list.style.fontSize = '12px';

  function addConstraintToList(def){
    if (!def) return;
    const item = document.createElement('div');
    item.style.display = 'flex'; item.style.justifyContent='space-between';
    item.style.alignItems='center'; item.style.margin='2px 0';

    const text = document.createElement('span');
    text.textContent = def.label;
    const rm = document.createElement('button');
    rm.textContent = '✕';
    rm.style.border='none'; rm.style.background='none'; rm.style.cursor='pointer';
    rm.style.color='#c00'; rm.style.fontWeight='bold';
    rm.addEventListener('click', ()=>{
      constraintEngine.removeConstraint(def.id);
      list.removeChild(item);
    });
    item.appendChild(text); item.appendChild(rm);
    list.appendChild(item);
  }

  pop.appendChild(B_t);  pop.appendChild(row2(B_sa, B_sb));  pop.appendChild(row2(B_aa, B_ab)); pop.appendChild(B_btn);
  pop.appendChild(hr());
  pop.appendChild(C_t);  pop.appendChild(row2(C_sa, C_sb));  pop.appendChild(row2(C_aa, C_ab)); pop.appendChild(C_d); pop.appendChild(C_btn);
  pop.appendChild(hr());
  pop.appendChild(D_t);  pop.appendChild(row2(D_sa, D_sb));  pop.appendChild(row2(D_aa, D_ab)); pop.appendChild(D_row);
  pop.appendChild(hr());
  pop.appendChild(L_t); pop.appendChild(list);

  constraintEngine.onListChanged((constraintList) => {
    list.innerHTML = '';
    constraintList.forEach(def => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.margin = '2px 0';

      const text = document.createElement('span');
      text.textContent = def.label;
      const rm = document.createElement('button');
      rm.textContent = '✕';
      rm.style.border = 'none';
      rm.style.background = 'none';
      rm.style.cursor = 'pointer';
      rm.style.color = '#c00';
      rm.style.fontWeight = 'bold';
      rm.addEventListener('click', () => {
        constraintEngine.removeConstraint(def.id);
      });

      item.appendChild(text);
      item.appendChild(rm);
      list.appendChild(item);
    });
  });

  document.body.appendChild(pop);

  function refreshAll(){
    [B_sa, B_sb, C_sa, C_sb, D_sa, D_sb].forEach(fillShapes);
    if (B_sa.value) fillAnchors(B_aa, B_sa.value); if (B_sb.value) fillAnchors(B_ab, B_sb.value);
    if (C_sa.value) fillAnchors(C_aa, C_sa.value); if (C_sb.value) fillAnchors(C_ab, C_sb.value);
    if (D_sa.value) fillAnchors(D_aa, D_sa.value); if (D_sb.value) fillAnchors(D_ab, D_sb.value);
  }

  btn.addEventListener('click', () => {
    if (pop.style.display === 'none') {
      try { constraintEngine.rebuild(); } catch(e) {}
      refreshAll();
      pop.style.display = 'block';
    } else {
      pop.style.display = 'none';
    }
  });
}
