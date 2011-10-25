/**
 *  Class Bullet
 *  Represents a Bullet Entity
 */
Bullet = function Bullet(initial) { // WEAPON
  this.on_before_init();
  this.EntityBase_init('bullet');
  this.id     = initial.id || -1;
  this.oid    = initial.oid || -1;
  this.pos    = initial.pos || [0, 0];
  this.vel    = initial.vel || [0, 0];
  this.angle  = initial.angle || 0;
  this.rico   = initial.rico || 0;
  this.player = initial.player || null;
  this.size   = [1, 2];
  this.lifetime = initial.lifetime || 0;
  this.on_after_init();
};

Bullet.prototype = new EntityBase();

/**
 *  Moves the Bullet in the world
 *  @param {Number} t Current world time.
 *  @param {Number} dt Current delta time,
 *  @return {undefined} Nothing.
 */
Bullet.prototype.move = function(t, dt) { // WEAPON
  if (this.lifetime <= t) {
    this.destroy();
  } else {
    this.pos = vector_add(this.pos, vector_mul(this.vel, dt));
  }
};

/**
 *  Returns bounding box of the Bullet
 *  @return {x, y, w, h} The bounds of the Bullet.
 */
Bullet.prototype.get_bounds = function() { 
  return {
    x: this.pos[0] - 5,
    y: this.pos[1] - 5,
    w: 10,
    h: 10
  };
};