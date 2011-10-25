/**
 *  Class GameLoop
 */
GameLoop = function Gameloop(tick) {
  this.ontick = function() {};
  this.ondone = function() {};
  this._pid = null;
  this._kill = false;
  this._oneach = [];
  this.tick = tick || 0;
};

/**
 *  Starts the game loop.
 */
GameLoop.prototype.start = function() {
  var self = this,
      ontick = self.ontick,
      ondone = self.ondone,
      accumulator = 0,
      dt = DT,
      current_time = new Date().getTime();

  this._kill = false;

  function gameloop() {
    var new_time = new Date().getTime();
    var delta = (new_time - current_time) / 1000;
    current_time = new_time;

    if (delta > 0.25) delta = 0.25;

    accumulator += delta;

    while (accumulator >= dt) {
      accumulator -= dt;
      ontick(self.tick, dt);
      self.tick += dt;
    }

    ondone(self.tick, dt, accumulator / dt);
  };

  self._pid = setInterval(gameloop, 10);
  //gameloop();
};

//
//  method GameLoop.prototype.kill
//  Kills a running instance.
//
GameLoop.prototype.kill = function() {
  this._kill = true;
  if (this._pid) {
    clearInterval(this._pid);
  }
};