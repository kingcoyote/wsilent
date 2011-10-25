/**
 *  Represents a static Block instance
 */
Block = function Block(initial) {
  this.on_before_init();
  this.EntityBase_init('block');
  var x = initial.pos[0];
  var y = initial.pos[1];
  var width = BLOCK_WIDTH;
  var height = BLOCK_HEIGHT;
  var connectors = initial.connectors;

  if ((connectors & BLOCK_CONNECTOR_NORTH) == BLOCK_CONNECTOR_NORTH) {
    y -= BLOCK_SPACING;
    height += BLOCK_SPACING;
  }

  if ((connectors & BLOCK_CONNECTOR_EAST) == BLOCK_CONNECTOR_EAST) {
    width += BLOCK_SPACING;
  }

  if ((connectors & BLOCK_CONNECTOR_SOUTH) == BLOCK_CONNECTOR_SOUTH) {
    height += BLOCK_SPACING;
  }

  if ((connectors & BLOCK_CONNECTOR_WEST) == BLOCK_CONNECTOR_WEST) {
    x -= BLOCK_SPACING;
    width += BLOCK_SPACING;
  }

  this.id       = initial.id || -1;
  this.pos      = [x, y];
  this.size     = [width, height];
  this.connectors = connectors;
  this.obstacle = true;
  this.on_after_init();
};

Block.prototype = new EntityBase();

/**
 *  Returns bounding box of the Block
 *  @return {x, y, w, h} The bounds of the Ship.
 */
Block.prototype.get_bounds = function() {
  return {
    x: this.pos[0],
    y: this.pos[1],
    w: this.size[0],
    h: this.size[1]
  };
};