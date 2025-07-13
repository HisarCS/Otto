const B_COLOR = '#5C81A6';
[['union','SHAPE1','SHAPE2'], ['difference','SHAPE1','SHAPE2'], ['intersection','SHAPE1','SHAPE2']]
  .forEach(([op, a, b]) => {
    Blockly.Blocks[`aqui_${op}`] = {
      init() {
        this.appendValueInput(a).setCheck('String').appendField(op);
        this.appendValueInput(b).setCheck('String');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour(B_COLOR);
        this.setTooltip(op);
      }
    };
    Blockly.JavaScript[`aqui_${op}`] = block => {
      const v1 = Blockly.JavaScript.valueToCode(block, a, Blockly.JavaScript.ORDER_NONE) || "''";
      const v2 = Blockly.JavaScript.valueToCode(block, b, Blockly.JavaScript.ORDER_NONE) || "''";
      return `${op}(${v1},${v2});\n`;
    };
  });
