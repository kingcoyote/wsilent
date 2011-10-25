
/**
 * abstract Weapon template, to be extended into concrete weapon classes
 * 
 * @param ship
 * @return
 */
Weapon = function Weapon(ship) {
  this.ship = ship;
};
Weapon.factory = function(type, ship) {
  switch(type) {
    case 'CannonWeapon':
      return new Weapon.types.CannonWeapon(ship);
  }
};

Weapon.prototype.can_fire = function() { };
Weapon.prototype.fire = function() {  };
Weapon.prototype.get_bullets = function() { return []; };
Weapon.prototype.get_energy_cost = function() { return 0; };
Weapon.prototype.get_reload_time = function() { return 0; };
Weapon.prototype.get_sound = function() { return null; };

Weapon.types = {};

/**
 * concrete CannonWeapon, the most basic weapon in the game
 * 
 * @param ship
 */

Weapon.types.CannonWeapon = function (ship) {
  this.ship = ship;
};
Weapon.types.CannonWeapon.prototype = new Weapon();
Weapon.types.CannonWeapon.prototype.bullet_acceleration_speed = 1;
Weapon.types.CannonWeapon.prototype.bullet_max_speed          = 250;
Weapon.types.CannonWeapon.prototype.bullet_lifetime           = 300;
Weapon.types.CannonWeapon.prototype.reload_time               = 15; 
Weapon.types.CannonWeapon.prototype.shoot_cost                = 300;
Weapon.types.CannonWeapon.prototype.sound                     = 'bullet_spawn';

Weapon.types.CannonWeapon.prototype.get_bullets = function(World) {
  var ship = this.ship,
      powerup = ship.powerup, //POWERUP
      vel = [0,0],
      pos = [0,0],
      lifetime = 0,
      velocities = [],
      bullets = [];
  
  lifetime = (powerup & POWERUP_RICO) == POWERUP_RICO ?
      World.tick + (RBULLET_LIFETIME *  World.delta) :
      World.tick + (this.bullet_lifetime *  World.delta);
  
  pos = [
    ship.pos[0] + Math.cos(ship.angle - Math.PI / 2) * ship.size[0] * 2,
    ship.pos[1] + Math.sin(ship.angle - Math.PI / 2) * ship.size[0] * 2
  ];
  
  vel = [
    Math.cos(ship.angle - Math.PI / 2) * (this.bullet_max_speed) + ship.vel[0],
    Math.sin(ship.angle - Math.PI / 2) * (this.bullet_max_speed) + ship.vel[1] 
  ];

  velocities.push(vel);

  for (var i in velocities) {
    bullets.push(new Bullet({
    rico: (powerup & POWERUP_RICO) == POWERUP_RICO,
    lifetime: lifetime,
    pos: pos,
    vel: velocities[i],
    angle: ship.angle,
    player: ship.player
  }));
  }
  
  return bullets;
};

Weapon.types.CannonWeapon.prototype.get_energy_cost = function() {
  return this.shoot_cost;
};

Weapon.types.CannonWeapon.prototype.get_reload_time = function(World) { 
  return this.reload_time;
};

Weapon.types.CannonWeapon.prototype.get_sound = function() {
  return this.sound;
};