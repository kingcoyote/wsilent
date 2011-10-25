/**
 *  Class Powerup
 *  Represents a Powerup Entity
 */
Powerup = function Powerup(initial) {
  this.on_before_init();
  this.EntityBase_init('powerup');
  this.id           = initial.id || -1;
  this.pos          = initial.pos || [0, 0];
  this.powerup_id   = initial.powerup_id;
  this.powerup_type = initial.powerup_type;
  this.size         = [10, 10];
  this.obstacle = true;
  this.destroyed_by = null;
  this.on_after_init();
};

Powerup.prototype = new EntityBase();


/**
 *  Destroys the Powerup instance
 *  @param destroyed_by {Player} the player who destroyed the powerup
 *  @return {undefined} Nothing.
 */
Powerup.prototype.destroy = function(destroyed_by) { 
  this.destroyed = true;
  this.destroyed_by = destroyed_by;
};

/**
 *  Returns bounding box of the Wall
 *  @return {x, y, w, h} The bounds of the Ship.
 */
Powerup.prototype.get_bounds = function(expand) { 
  return {
    x: this.pos[0] - 5,
    y: this.pos[1] - 5,
    w: 5,
    h: 5
  };
};

/**
 *  Gets an representation of this object
 */
Powerup.prototype.get_repr = function() {
  return {
    pos: this.pos,
    powerup_id: this.powerup_id,
    powerup_type: this.powerup_type
  };
};