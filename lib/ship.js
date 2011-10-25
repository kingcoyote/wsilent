/**
 *  Class Ship
 *  Represents a Ship entity.
 */
Ship = function Ship(initial) {
  this.on_before_init();
  this.EntityBase_init('ship');
  this.id             = initial.id || -1;
  this.pid            = initial.pid || -1;
  this.pos            = initial.pos || [0, 0];
  this.vel            = initial.vel || [0, 0];
  this.angle          = initial.angle || 0;
  this.player         = initial.player || null;
  this.is_me          = initial.player.is_me;
  this.size           = [SHIP_WIDTH, SHIP_HEIGHT];
  this.action        = 0;
  this.powerup        = initial.powerup || 0; //POWERUP 
  this.energy         = initial.energy || 100;
  this.reload_time    = initial.reload_time || 0;
  this.powerup_timers = initial.powerup_times || { 1: null, 2: null, 4: null}; 
  this.death_cause    = -1;
  this.destroyed_by   = -1;
  this.points         =[[0,-SHIP_HEIGHT/2],[SHIP_WIDTH/2,SHIP_HEIGHT/2],[-SHIP_WIDTH/2,SHIP_HEIGHT/2]];
  this.on_after_init();
  this.weapon         = Weapon.factory('CannonWeapon', this);
};

Ship.prototype = new EntityBase();

/**
 *  Destroys the Ship in end of world update.
 *  @param {DEATH_CAUSE_*} death_cause The cause of death
 *  @param {Player} killed_by The killer if not suicide.
 *  @return {undefined} Nothing.
 */
Ship.prototype.destroy = function(death_cause, killer_id) {
  this.destroyed = true;
  this.death_cause = death_cause;
  this.destroyed_by = killer_id;
};

/**
 *  Moves the Ship in the world
 *  @param {Number} t Current world time.
 *  @param {Number} dt Current delta time,
 *  @return {undefined} Nothing.
 */
Ship.prototype.move = function(t, dt) {
  if (this.dead) return;
  var angle = this.angle;
  var max_speed = SHIP_MAX_SPEED;
  var acc_speed = SHIP_ACCELERATION_SPEED;

  var acc = this.is(THRUST) ? dt * acc_speed : 0 ;
  var speedx = this.vel[0] + acc * Math.sin(angle);
  var speedy = this.vel[1] - acc * Math.cos(angle);
  var speed = Math.sqrt(Math.pow(speedx,2) + Math.pow(speedy,2));

  if (speed > max_speed) {
    speedx = speedx / speed * max_speed;
    speedy = speedy / speed * max_speed;
  }

  this.vel = [speedx, speedy];
  this.pos = [this.pos[0] + speedx * dt,  this.pos[1] + speedy * dt];

  this.angle = angle;
};

Ship.prototype.is = function(flag) {
  return (this.action & flag) == flag;
};

Ship.prototype.toggle = function(flag) {
  if (this.action & flag == flag)  {
    this.action = this.action & ~flag;
  } else {
    this.action |= flag;
  }
};

Ship.prototype.set = function(flag, value) {
  this.action = value ? this.action | flag : this.action & ~flag;
};

Ship.prototype.has_powerup = function(flag) {
  return (this.powerup & flag) == flag; 
};

Ship.prototype.set_powerup = function(flag, start_time, end_time) {
  this.powerup_timers[flag] = {start: start_time, end: end_time}; // POWERUP
  switch(flag) {
    case POWERUP_SPREAD:
      this.weapon = new SpreadShotUpgrade(this.weapon);
      break;
    case POWERUP_RAPID:
      this.weapon = new RapidFireUpgrade(this.weapon);
      break;
    case POWERUP_RICO:
      this.weapon = new RicoUpgrade(this.weapon);
      break;
  };
  return this.powerup |= flag; 
};

Ship.prototype.remove_powerup = function(flag) {
  this.powerup_timers[flag] = null; //POWERUP
  this.weapon.remove_upgrade(flag, this);
  return this.powerup &= ~flag; 
};

/**
 *  Returns bounding box of the Ship
 *  @return {x, y, w, h} The bounds of the Ship.
 */
Ship.prototype.get_bounds = function() {
  return {
      x: (this.pos[0] - 20),
      y: (this.pos[1] - 20),
      w: 40,
      h: 40
  };
};

Ship.prototype.can_fire = function(World) {
  return !this.reload_time && this.energy >= (this.weapon.get_energy_cost() * World.delta);
};

Ship.prototype.fire = function(World) {
  // powerup should be moved to ship for now
  var weapon      = this.weapon,
    bullets     = weapon.get_bullets(World),
    i = 0;
  
  for (i in bullets) {
    World.add_entity(bullets[i]);
  }
  
  this.energy      -= weapon.get_energy_cost() * World.delta;
  this.reload_time  = World.tick + weapon.get_reload_time() * World.delta;
  return bullets;
};