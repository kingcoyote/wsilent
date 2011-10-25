/**
 *  Class Player
 *  Represents a Player in the game world.
 */
Player = function Player(initial) {
  this.on_before_init.apply(this, Array.prototype.slice.call(arguments));
  this.id             = initial.id || -1;
  this.name           = initial.name || 'Unknown';
  this.joined         = initial.joined || new Date().getTime();
  this.ping           = initial.ping || 0;
  this.time           = initial.time || 0;
  this.ship           = initial.ship || null; // renaming entity to ship
  this.ready          = initial.ready || false;
  this.score          = initial.score || 0;
  this.kills          = initial.kills || 0;
  this.deaths         = initial.deaths || 0;
  this.suicides       = initial.suicides || 0;
  this.action         = initial.action || 0;
  this.respawn_time   = initial.respawn_time || 0;
  this.dead           = initial.dead || true;
  this.color_id       = initial.color_id;
  this.on_after_init();
};

/**
 *  Playerholder for the Player on_before_init event
 */
Player.prototype.on_before_init = function() { };

/**
 *  Playerholder for the Player on_after_init event
 */
Player.prototype.on_after_init = function() { };

Player.prototype.is = function(flag) {
  return (this.action & flag) == flag;
};

Player.prototype.set = function(flag) {
  return this.action |= flag;
};

/**
 *  Gets an representation of this object
 */
Player.prototype.get_repr = function() {
  var repr = {
    id: this.id,
    name: this.name,
    joined: this.joined,
    ping: this.ping,
    time: this.time,
    ready: this.ready,
    score: this.score,
    kills: this.kills,
    deaths: this.deaths,
    suicides: this.suicides,
    action: this.action,
    ready: this.ready,
    dead: this.dead,
    color_id: this.color_id
  };

  if (!this.dead) {
    repr.pos = this.ship.pos;
    repr.vel = this.ship.vel;
    repr.angle = this.ship.angle;
  }

  return repr;
};

/**
 *  Returns a string representation of the Player instance.
 *  @return {String} A String represetating the Player.
 */
Player.prototype.toString = function() {
  return 'Player ' + this.name + ' (' + this.id + ')';
};