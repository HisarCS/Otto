const T_COLOR = '#D65C5C';

[['forward', 'DISTANCE'], ['backward', 'DISTANCE']].forEach(([cmd, field]) => {
  Blockly.Blocks[`aqui_${cmd}`] = {
    init() {
      this.appendValueInput(field)
          .setCheck('Number')
          .appendField(cmd);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(T_COLOR);
      this.setTooltip(`Turtle ${cmd}`);
    }
  };
  Blockly.JavaScript[`aqui_${cmd}`] = block => {
    const val = Blockly.JavaScript.valueToCode(block, field, Blockly.JavaScript.ORDER_NONE) || '0';
    return `${cmd}(${val});\n`;
  };
});

[['right', 'ANGLE'], ['left', 'ANGLE']].forEach(([cmd, field]) => {
  Blockly.Blocks[`aqui_${cmd}`] = {
    init() {
      this.appendValueInput(field)
          .setCheck('Number')
          .appendField(cmd);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(T_COLOR);
      this.setTooltip(`Turtle ${cmd}`);
    }
  };
  Blockly.JavaScript[`aqui_${cmd}`] = block => {
    const val = Blockly.JavaScript.valueToCode(block, field, Blockly.JavaScript.ORDER_NONE) || '0';
    return `${cmd}(${val});\n`;
  };
});

Blockly.Blocks['aqui_goto'] = {
  init() {
    this.appendValueInput('POSITION')
        .setCheck('Array')
        .appendField('goto');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(T_COLOR);
    this.setTooltip('Turtle goto [x,y]');
  }
};
Blockly.JavaScript['aqui_goto'] = block => {
  const pos = Blockly.JavaScript.valueToCode(block, 'POSITION', Blockly.JavaScript.ORDER_NONE) || '[0,0]';
  return `goto(${pos});\n`;
};

['penup','pendown'].forEach(cmd => {
  Blockly.Blocks[`aqui_${cmd}`] = {
    init() {
      this.appendDummyInput()
          .appendField(cmd);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(T_COLOR);
      this.setTooltip(`Turtle ${cmd}`);
    }
  };
  Blockly.JavaScript[`aqui_${cmd}`] = () => `${cmd}();\n`;
});
