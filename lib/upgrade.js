Upgrade = function Upgrade(weapon) {
  this.weapon = weapon;
};

Upgrade.prototype.get_bullets     = function(World) { return this.weapon.get_bullets(World); };
Upgrade.prototype.get_reload_time = function() { return this.weapon.get_reload_time(); };
Upgrade.prototype.get_energy_cost = function() { return this.weapon.get_energy_cost(); };
Upgrade.prototype.get_sound       = function() { return this.weapon.get_sound(); };
Upgrade.prototype.remove_upgrade = function(type, parent) {
  if(this.type == type) {
    parent.weapon = this.weapon;
  }
  if(this.weapon.remove_upgrade) {
    this.weapon.remove_upgrade(type, this);
  }
};

RapidFireUpgrade = function(weapon) {
  this.weapon = weapon;
};
RapidFireUpgrade.prototype = new Upgrade();
RapidFireUpgrade.prototype.type = POWERUP_RAPID;
RapidFireUpgrade.prototype.get_reload_time = function() {
  return this.weapon.get_reload_time() / 2;
};

RapidFireUpgrade.prototype.get_energy_cost = function() {
  return this.weapon.get_energy_cost() / 3; 
};

SpreadShotUpgrade = function(weapon) {
  this.weapon = weapon;
};
SpreadShotUpgrade.prototype = new Upgrade();
SpreadShotUpgrade.prototype.type = POWERUP_SPREAD;
SpreadShotUpgrade.prototype.get_bullets = function(world) {
  bullets = this.weapon.get_bullets(world);
  
  bullets.push(new Bullet({
    rico: bullets[0].rico,
    lifetime: bullets[0].lifetime,
    pos: bullets[0].pos,
    vel: vector_rotate.apply(null, [(-Math.PI / 8), bullets[0].vel]),
    angle: bullets[0].angle,
    player: bullets[0].player
  }));
  
  bullets.push(new Bullet({
    rico: bullets[0].rico,
    lifetime: bullets[0].lifetime,
    pos: bullets[0].pos,
    vel: vector_rotate.apply(null, [(Math.PI / 8), bullets[0].vel]),
    angle: bullets[0].angle,
    player: bullets[0].player
  }));
  
  return bullets;
};

RicoUpgrade = function(weapon) {
  this.weapon = weapon;
  this.lifetime = 1.33;
};
RicoUpgrade.prototype = new Upgrade();
RicoUpgrade.prototype.type = POWERUP_RICO;
RicoUpgrade.prototype.get_bullets = function(world) {
  bullets = this.weapon.get_bullets(world);
  for(var i in bullets) {
    bullets[i].rico = true;
    //bullets[i].lifetime = bullets[i].lifetime + this.lifetime;
  }
  return bullets;
};