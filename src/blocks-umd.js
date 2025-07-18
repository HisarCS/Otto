const T_COLOR = '#D65C5C';     
const S_COLOR = '#5CA65C';     
const P_COLOR = '#CE9E36';     
const B_COLOR = '#5C81A6';     
const R_COLOR = '#8696D0';    

function collectLinesUnique_(blk, input = 'STACK') {
  const lines = [];
  let child = blk.getInputTargetBlock(input);

  while (child) {
    const gen = (Blockly.JavaScript.forBlock || Blockly.JavaScript)[child.type];
    const raw = typeof gen === 'function' ? gen(child).trim() : '';
    if (raw) lines.push('  ' + raw);           
    child = child.getNextBlock();             
  }
  return lines.join('\n');
}

Blockly.defineBlocksWithJsonArray([{
  type:'aqui_prop_expr',
  message0:'%1 %2',
  args0:[
    {type:'field_input', name:'KEY', text:'radius'},
    {type:'input_value', name:'VAL'}
  ],
  previousStatement:null, nextStatement:null, colour:P_COLOR
}]);

Blockly.defineBlocksWithJsonArray([{
  type:'aqui_prop_bool',
  message0:'%1 %2',
  args0:[
    {type:'field_input',  name:'KEY', text:'fill'},
    {type:'field_checkbox', name:'VAL', checked:true}
  ],
  previousStatement:null, nextStatement:null, colour:P_COLOR
}]);
Blockly.JavaScript['aqui_prop_bool']=b=>
  `${b.getFieldValue('KEY').trim()}: ${b.getFieldValue('VAL')==='TRUE'}`;

Blockly.defineBlocksWithJsonArray([{
  type:'aqui_ref',
  message0:'%1 %2',
  args0:[
    {type:'field_dropdown',name:'OP',
      options:[['add','add'],['subtract','subtract']]},
    {type:'field_input',name:'TARGET',text:'c1'}
  ],
  previousStatement:null,nextStatement:null,colour:R_COLOR
}]);
Blockly.JavaScript['aqui_ref']=b=>
  `${b.getFieldValue('OP')} ${b.getFieldValue('TARGET')}`;


['circle','rectangle','triangle','polygon','star','text', 'ellipse','arc','roundedrectangle','arrow','donut','gear', 'cross'].forEach(type=>{
  Blockly.defineBlocksWithJsonArray([{
    type   : `aqui_shape_${type}`,
    message0:`shape ${type} %1`,
    args0  : [{ type:'field_input', name:'NAME', text:`${type[0]}1` }],
    message1:'%1',
    args1  : [{ type:'input_statement', name:'PROPS' }],
    previousStatement:null, nextStatement:null, colour:S_COLOR
  }]);

  Blockly.JavaScript[`aqui_shape_${type}`] = blk => {
    const nm   = blk.getFieldValue('NAME').trim();
    const body = collectLinesUnique_(blk, 'PROPS');
    return `shape ${type} ${nm} {\n${body}\n}\n`;
  };
});

['union','intersection','difference'].forEach(kw=>{
  Blockly.defineBlocksWithJsonArray([{
    type:`aqui_${kw}`,
    message0:`${kw} %1`,
    args0:[{ type:'field_input', name:'NAME', text:`${kw}1` }],
    message1:'%1',
    args1:[{ type:'input_statement', name:'STACK' }],
    previousStatement:null, nextStatement:null, colour:B_COLOR
  }]);

  Blockly.JavaScript[`aqui_${kw}`] = blk =>
    `${kw} ${blk.getFieldValue('NAME').trim()} {\n` +
    `${collectLinesUnique_(blk,'STACK')}\n}\n`;
});

Blockly.defineBlocksWithJsonArray([{
  type      : 'aqui_draw',
  message0  : 'draw %1',
  args0     : [{ type:'field_input', name:'NAME', text:'square' }],
  message1  : '%1',
  args1     : [{ type:'input_statement', name:'STACK' }],
  previousStatement : null,
  nextStatement     : null,
  colour            : T_COLOR
}]);

Blockly.JavaScript['aqui_draw'] = blk =>
  `draw ${blk.getFieldValue('NAME').trim()} {\n` +
  `${collectLinesUnique_(blk,'STACK')}\n}\n`;


Blockly.defineBlocksWithJsonArray([
  {type:'aqui_forward', message0:'forward %1',
   args0:[{type:'input_value',name:'D',check:'Number'}],
   previousStatement:null,nextStatement:null,colour:T_COLOR},
  {type:'aqui_backward',message0:'backward %1',
   args0:[{type:'input_value',name:'D',check:'Number'}],
   previousStatement:null,nextStatement:null,colour:T_COLOR},

  {type:'aqui_right',message0:'right %1',
   args0:[{type:'input_value',name:'A',check:'Number'}],
   previousStatement:null,nextStatement:null,colour:T_COLOR},
  {type:'aqui_left',message0:'left %1',
   args0:[{type:'input_value',name:'A',check:'Number'}],
   previousStatement:null,nextStatement:null,colour:T_COLOR},

  {type:'aqui_goto',message0:'goto %1',
   args0:[{type:'input_value',name:'P',check:'Array'}],
   previousStatement:null,nextStatement:null,colour:T_COLOR},

  {type:'aqui_penup',  message0:'pen up',   previousStatement:null,
   nextStatement:null, colour:T_COLOR},
  {type:'aqui_pendown',message0:'pen down', previousStatement:null,
   nextStatement:null, colour:T_COLOR},
]);

Blockly.JavaScript['aqui_forward']  = b=>`forward ${Blockly.JavaScript.valueToCode(b,'D',0)||0}`;
Blockly.JavaScript['aqui_backward'] = b=>`backward ${Blockly.JavaScript.valueToCode(b,'D',0)||0}`;
Blockly.JavaScript['aqui_right']    = b=>`right ${Blockly.JavaScript.valueToCode(b,'A',0)||0}`;
Blockly.JavaScript['aqui_left']     = b=>`left ${Blockly.JavaScript.valueToCode(b,'A',0)||0}`;
Blockly.JavaScript['aqui_goto']     = b=>`goto ${Blockly.JavaScript.valueToCode(b,'P',0)||'[0,0]'}`;
Blockly.JavaScript['aqui_penup']    = ()=>`penup`;
Blockly.JavaScript['aqui_pendown']  = ()=>`pendown`;

Blockly.defineBlocksWithJsonArray([{
  type: 'aqui_param',
  message0: 'param %1 %2',
  args0: [
    { type:'field_input', name:'NAME',  text:'size' },
    { type:'input_value', name:'VALUE' }
  ],
  previousStatement: null,
  nextStatement:     null,
  colour: 160        
}]);

Blockly.JavaScript['aqui_param'] = blk => {
  const n = blk.getFieldValue('NAME').trim();
  const v = Blockly.JavaScript.valueToCode(blk,'VALUE',0) || '0';
  return `param ${n} ${v}\n`;
};
Blockly.defineBlocksWithJsonArray([{
  type     : 'aqui_param_get',
  message0 : 'param %1',
  args0    : [{ type:'field_input', name:'NAME', text:'size' }],
  output   : null,
  colour   : 160
}]);

Blockly.JavaScript['aqui_param_get'] = blk => [
  blk.getFieldValue('NAME').trim(),        
  Blockly.JavaScript.ORDER_ATOMIC        
];

Blockly.JavaScript['aqui_prop_expr'] = blk => {
  const k = blk.getFieldValue('KEY').trim();
  let   v = Blockly.JavaScript.valueToCode(blk,'VAL',0) || '""';

  if (/(color|colour)$/i.test(k)) {         
    v = v.replace(/^['"]|['"]$/g,'');        
  } else if (k.toLowerCase() === 'text') {   
    if (/^'.*'$/.test(v)) {
      v = '"' + v.slice(1,-1).replace(/"/g,'\\"') + '"';
    } else if (!/^".*"$/.test(v)) {
      v = `"${v.replace(/"/g,'\\"')}"`;
    }
  }
  return `${k}: ${v}`;
};

Blockly.JavaScript['logic_operation'] = function(b) {
  const opMap = { 'AND':'and', 'OR':'or' };
  const order = (b.getFieldValue('OP') === 'AND')
                  ? Blockly.JavaScript.ORDER_LOGICAL_AND
                  : Blockly.JavaScript.ORDER_LOGICAL_OR;
  const A = Blockly.JavaScript.valueToCode(b, 'A', order) || 'false';
  const B = Blockly.JavaScript.valueToCode(b, 'B', order) || 'false';
  return [ `${A} ${opMap[b.getFieldValue('OP')]} ${B}`, order ];
};

Blockly.JavaScript['logic_negate'] = function (blk) {
  const inner = Blockly.JavaScript.valueToCode(
                 blk, 'BOOL', Blockly.JavaScript.ORDER_NONE) || 'false';
  return [ `not (${inner})`, Blockly.JavaScript.ORDER_UNARY_PREFIX ];
};

Blockly.JavaScript['logic_compare'] = function (b) {
  const opMap = { 'EQ':'==', 'NEQ':'!=', 'LT':'<', 'LTE':'<=', 'GT':'>', 'GTE':'>=' };
  const order = Blockly.JavaScript.ORDER_RELATIONAL;
  const A = Blockly.JavaScript.valueToCode(b, 'A', order) || '0';
  const B = Blockly.JavaScript.valueToCode(b, 'B', order) || '0';
  return [ `${A} ${opMap[b.getFieldValue('OP')]} ${B}`, order ];
};

if (!Blockly.JavaScript.forBlock) Blockly.JavaScript.forBlock = Object.create(null);
for (const k in Blockly.JavaScript) {
  if (k.startsWith('aqui_')) Blockly.JavaScript.forBlock[k] = Blockly.JavaScript[k];
}
console.log(
  'AQUI generators registered:',
  Object.keys(Blockly.JavaScript.forBlock).filter(k=>k.startsWith('aqui_'))
);

