const S_COLOR = '#5CA65C';

function makeShape(type, fields) {
  Blockly.Blocks[`aqui_${type}`] = {
    init() {
      fields.forEach(([name, check, def]) => {
        this.appendValueInput(name)
            .setCheck(check)
            .appendField(name.toLowerCase());
        if (def !== undefined) {
          this.getInput(name)
              .appendField(new Blockly.FieldNumber(def), name);
        }
      });
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(S_COLOR);
      this.setTooltip(`${type}`);
    }
  };
  Blockly.JavaScript[`aqui_${type}`] = block => {
    const args = fields.map(([name]) =>
      Blockly.JavaScript.valueToCode(block, name, Blockly.JavaScript.ORDER_NONE) || '0'
    );
    return `${type}(${args.join(',')});\n`;
  };
}

makeShape('circle',   [['RADIUS','Number',50], ['X','Number',0], ['Y','Number',0]]);
makeShape('rectangle',[['WIDTH','Number',100], ['HEIGHT','Number',60], ['X','Number',0], ['Y','Number',0]]);
makeShape('triangle', [['BASE','Number',60], ['HEIGHT','Number',80], ['X','Number',0], ['Y','Number',0]]);
makeShape('polygon',  [['SIDES','Number',6], ['RADIUS','Number',50], ['X','Number',0], ['Y','Number',0]]);
makeShape('star',     [['POINTS','Number',5], ['OUTER','Number',50], ['INNER','Number',20], ['X','Number',0], ['Y','Number',0]]);
makeShape('text',     [['TEXT','String','Hello'], ['X','Number',0], ['Y','Number',0], ['SIZE','Number',16]]);
