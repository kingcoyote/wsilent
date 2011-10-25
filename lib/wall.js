/**
 *  Represents a static Wall instance
 */
Wall = function Wall(initial) {
  this.on_before_init();
  this.EntityBase_init('wall');
  this.id       = initial.id || -1;
  this.pos      = initial.pos || [0, 0];
  this.size     = initial.size || [0, 0];
  this.o        = initial.o || 'n';
  this.obstacle = true;
  this.on_after_init();
};

Wall.prototype = new EntityBase();

/**
 *  Returns bounding box of the Wall
 *  @param {Number} expand (Optional) A value to expand the bounding box with.
 *  @return {x, y, w, h} The bounds of the Ship.
 */
Wall.prototype.get_bounds = function(expand) {
  return {
    x: this.pos[0],
    y: this.pos[1],
    w: this.size[0],
    h: this.size[1]
  };
};