//
//  gameobjects.js
//  Game objects for WPilot
//
//  Read README for instructions and LICENSE license.
//
//  Copyright (c) 2010 Johan Dahlberg
//

try {
  // server import of match
  if (require) {
    var match = require('./match').Match;
  }
} catch (_ex) {
  // client import of match
  var match = Match;
  var _ = match.incl;
}

/**
 *  Resolvs collision between two entities
 */
var collision_resolver = match (

  /**
   *  Check collission between Ship and Bullet
   */
  [Ship, Bullet, Boolean], function(ship, bullet, server_mode) {
    if (!ship.is(SHIELD) && (ship.player != bullet.player)) {
      // Only kill ship if world is running server. Clients should wait for
      // the message PLAYER + DIE
      var a = vector_rotate.apply(null, [ship.angle].concat(ship.points));

      //add points & pos
      a=[vector_add(ship.pos, a[0]),
        vector_add(ship.pos, a[1]),
        vector_add(ship.pos, a[2])
        ];
      //points for the bullet
      var b=[[bullet.pos[0],bullet.pos[1]],
          [bullet.pos[0],bullet.pos[1]+bullet.size[1]],
          [bullet.pos[0]+bullet.size[0],bullet.pos[1]+bullet.size[1]],
          [bullet.pos[0]+bullet.size[0],bullet.pos[1]]
          ];

      if (poly_check_col(a, b)) {
        if (server_mode) {
          ship.destroy(DEATH_CAUSE_KILLED, bullet.player.id);
        }
      }
    }
  },
  [Bullet, Ship, Boolean], function(bullet, ship, server_mode) {
    return collision_resolver([ship, bullet, server_mode]);
  },

  /**
   * Check collission between Ship and Wall
   */
  [Ship, Wall, Boolean], function(ship, wall, server_mode) {
    if (ship.is(SHIELD)) {

      //distance between object centers
      var distance = sphere_poly_check_col(ship, wall);

      if (distance) {
        var dt = (vector_len(distance) + 1) / vector_len(ship.vel);
        if (dt>0.2 && server_mode){
          ship.destroy(DEATH_CAUSE_SUICDE);
        }else{
          var distance_vector = [-ship.vel[0] * dt, -ship.vel[1] * dt];

          ship.pos[0] += distance_vector[0];
          ship.pos[1] += distance_vector[1];

          if (!server_mode) {
            ship.pos_sv = ship.pos;
          }

          if(distance[0]!=0) {
            ship.vel[0] = -ship.vel[0];
          } else {
            ship.vel[1] =- ship.vel[1];
          }
        }
      }

    } else if(server_mode) {
      var a = vector_rotate.apply(null, [ship.angle].concat(ship.points));

      //add points & pos
      a = [vector_add(ship.pos, a[0]),
           vector_add(ship.pos, a[1]),
           vector_add(ship.pos, a[2])];

      //points for the block
      var b = [[wall.pos[0],wall.pos[1]],
               [wall.pos[0],wall.pos[1]+wall.size[1]],
               [wall.pos[0]+wall.size[0],wall.pos[1]+wall.size[1]],
               [wall.pos[0]+wall.size[0],wall.pos[1]]];

      if (poly_check_col(a, b)) {
        ship.destroy(DEATH_CAUSE_SUICDE);
      }
    }
  },

  /**
   * Check collission between Ship and Wall
   */
  [Ship, Block, Boolean], function(ship, block, server_mode) {
    if (ship.is(SHIELD)) {

      //distance between object centers
      var distance = sphere_poly_check_col(ship, block);

      if (distance) {
        var dt = (vector_len(distance) + 1) / vector_len(ship.vel);
        if (dt>0.2 && server_mode){
          ship.destroy(DEATH_CAUSE_SUICDE);
        }else{
          var distance_vector = [-ship.vel[0] * dt, -ship.vel[1] * dt];

          ship.pos[0] += distance_vector[0];
          ship.pos[1] += distance_vector[1];

          if (!server_mode) {
            ship.pos_sv = ship.pos;
          }

          if(distance[0]!=0) {
            ship.vel[0] = -ship.vel[0];
          } else {
            ship.vel[1] =- ship.vel[1];
          }
        }
      }

    } else if(server_mode) {
      var a = vector_rotate.apply(null, [ship.angle].concat(ship.points));

      //add points & pos
      a = [vector_add(ship.pos, a[0]),
           vector_add(ship.pos, a[1]),
           vector_add(ship.pos, a[2])];

      //points for the block
      var b = [[block.pos[0],block.pos[1]],
               [block.pos[0],block.pos[1]+block.size[1]],
               [block.pos[0]+block.size[0],block.pos[1]+block.size[1]],
               [block.pos[0]+block.size[0],block.pos[1]]];

      if (poly_check_col(a, b)) {
        ship.destroy(DEATH_CAUSE_SUICDE);
      }
    }
  },

  /**
   * Check collission between Bullet and Wall
   */
  [Bullet, Wall, Boolean], function(bullet, wall, server_mode) {
    if (bullet.rico) {
      var x0 = Math.max(bullet.pos[0], wall.pos[0]);
      var x1 = Math.min(bullet.pos[0] + bullet.size[0], wall.pos[0] +
                                                              wall.size[0]);

       if (x0 <= x1) {
         bullet.vel = [bullet.vel[0], -bullet.vel[1]];
       } else {
         bullet.vel = [-bullet.vel[0], bullet.vel[1]];
       }
   	} else {
      bullet.destroy();
    }
  },

  /**
   * Check collission between Bullet and Wall
   */
  [Bullet, Block, Boolean], function(bullet, block, server_mode) {
    if (bullet.rico) {
      var x0 = Math.max(bullet.pos[0], block.pos[0]);
      var x1 = Math.min(bullet.pos[0] + bullet.size[0], block.pos[0] +
                                                              block.size[0]);

       if (x0 <= x1) {
         bullet.vel = [bullet.vel[0], -bullet.vel[1]];
       } else {
         bullet.vel = [-bullet.vel[0], bullet.vel[1]];
       }
   	} else {
      bullet.destroy();
    }
  },

  /**
   * Check collission between Ship and Ship
   */
  [Ship, Ship, Boolean], function(ship_a, ship_b, server_mode) {
    // Client waits for PLAYER + DIE message, so ignore all collision
    // between players, if not in server mode, and one shield is off.
    if(ship_a.is(SHIELD) && ship_b.is(SHIELD)) {
      //make a collsiontest for circles
      var dx = ship_b.pos[0] - ship_a.pos[0];
      var dy = ship_b.pos[1] - ship_a.pos[1];
      var d = Math.sqrt(dx * dx + dy * dy);

      if(d<=40){
        //retrace time until real collision occured
        vp1=ship_a.vel[0]*dx/d+ship_a.vel[1]*dy/d;
        vp2=ship_b.vel[0]*dx/d+ship_b.vel[1]*dy/d;
        dt=(40-d)/(vp1-vp2);

        //move back in time
        ship_a.pos[0]-=ship_a.vel[0]*dt;
        ship_a.pos[1]-=ship_a.vel[1]*dt;
        ship_b.pos[0]-=ship_b.vel[0]*dt;
        ship_b.pos[1]-=ship_b.vel[1]*dt;

        dx=ship_b.pos[0]-ship_a.pos[0];
        dy=ship_b.pos[1]-ship_a.pos[1];
        d=40;

        var ax = dx/d;
        var ay = dy/d;

        //Projections
        var va1 = ship_a.vel[0]*ax+ship_a.vel[1]*ay;
        var va2 = ship_b.vel[0]*ax+ship_b.vel[1]*ay;
        var vb1 = -ship_a.vel[0]*ay+ship_a.vel[1]*ax;
        var vb2 = -ship_b.vel[0]*ay+ship_b.vel[1]*ax;

        //Velocity
        var vaP1 = va1 + (1+1)*(va2-va1)/(1+1/1);
        var vaP2 = va2 + (1+1)*(va1-va2)/(1+1/1);

        ship_a.vel[0] = vaP1 * ax + vb1 * ay;
        ship_a.vel[1] = vaP1 * ay + vb1 * ax;
        ship_b.vel[0] = vaP2 * ax + vb2 * ay;
        ship_b.vel[1] = vaP2 * ay + vb2 * ax;

        //Fast forward time to catch up
        ship_a.pos[0] += ship_a.vel[0] * dt;
        ship_a.pos[1] += ship_a.vel[1] * dt;
        ship_b.pos[0] += ship_b.vel[0] * dt;
        ship_b.pos[1] += ship_b.vel[1] * dt;

        if (!server_mode) {
          ship_a.pos_sv = ship_a.pos;
          ship_b.pos_sv = ship_b.pos;
        }

      }

    } else if (server_mode && !ship_a.is(SHIELD) && !ship_b.is(SHIELD)) {

      //collision test triangle vs triangle
      var a = vector_rotate.apply(null, [ship_a.angle].concat(ship_a.points));

      //add points & pos
      a = [vector_add(ship_a.pos, a[0]),
           vector_add(ship_a.pos, a[1]),
           vector_add(ship_a.pos, a[2])];

      var b = vector_rotate.apply(null, [ship_b.angle].concat(ship_b.points));

      //add points & pos
      b = [vector_add(ship_b.pos, b[0]),
           vector_add(ship_b.pos, b[1]),
           vector_add(ship_b.pos, b[2])];

      if (poly_check_col(a, b)) {
        ship_a.destroy(DEATH_CAUSE_SUICDE);
        ship_b.destroy(DEATH_CAUSE_SUICDE);
      }
    } else if (server_mode) {
      if (!ship_a.is(SHIELD)) {
        ship_a.destroy(DEATH_CAUSE_KILLED, ship_b.player.id);
      }
      if (!ship_b.is(SHIELD)) {
        ship_b.destroy(DEATH_CAUSE_KILLED, ship_a.player.id);
      }
    }
  },

  /**
   * Check collission between Ship and Powerup
   */
  [Ship, Powerup, true], function(ship, powerup) {
    powerup.destroy(ship.player);
  }
);

vector_add = function vector_add(a, b) {
  return [a[0] + b[0], a[1] + b[1]];
};

vector_sub = function vector_sub(a, b) {
  return [a[0] - b[0], a[1] - b[1]];
};

vector_mul = function vector_mul(a, v) {
  return [a[0] * v, a[1] * v];
};

vector_div = function vector_div(a, v) {
  return [a[0] / v, a[1] / v];
};

vector_pow = function vector_pow(a, exponent) {
  return [Math.pow(a[0], exponent), Math.pow(a[1], exponent)];
};

vector_abs = function vector_abs(v) {
  return [Math.abs(v[0]), Math.abs(v[1])];
};

/**
 *  Get unit vector
 */
vector_unit = function vector_unit(a){
  var l = vector_len(a);
  return [a[0]/l, a[1]/l];
};

/**
 *  Get dot product from two vectors
 */
vector_dot = function vector_dot(a, b) {
  return (a[0]*b[0])+(a[1]*b[1]);
};

/**
 *  Vector length
 */
vector_len = function vector_len(a) {
  return Math.sqrt(a[0]*a[0]+a[1]*a[1]);
};

/**
 *  Vector square length
 */
vector_lens = function vector_lens(a) {
  return a[0]*a[0]+a[1]*a[1];
};

/**
 * Projects vector a onto vector b
 */
vector_proj = function vector_proj(a, b) {
  bls = vector_lens(b);
  if (bls!=0) return vector_mul(b,vector_dot(a,b)/bls);
  else return [0,0];
};

/**
 * Rotates one or more vectors
 */
vector_rotate = function vector_rotate() {
  var args = Array.prototype.slice.call(arguments);
  var angle = args.shift();
  var result = [];
  var sin=Math.sin(angle);
  var cos=Math.cos(angle);
  var vector;

  while (vector = args.shift()) {
    result.push([vector[0] * cos - vector[1] * sin,
                 vector[0] * sin + vector[1] * cos]);
  }

  return result.length == 1 ? result[0] : result;
};

distance_between = function distance_between(a, b) {
  var x = a[0] - b[0];
  var y = a[1] - b[1];
  return Math.sqrt(x * x + y * y);
};

get_random_powerup_type = function get_random_powerup_type() { 
  var no = Math.floor(Math.random() * 3);
  switch (no) {
    case 0:
      return POWERUP_SPREAD;
    case 1:
      return POWERUP_RAPID;
    case 2:
      return POWERUP_RICO;
  }
};

get_powerup_decline_time = function get_powerup_decline_time(rules, powerup) { 
  switch (powerup.powerup_type) {
    case POWERUP_SPREAD:
      return rules.powerup_spread_t;

    case POWERUP_RAPID:
      return rules.powerup_rapid_t;

    case POWERUP_RICO:
      return rules.powerup_rico_t;
  }
};

aabb_distance_sphere = function aabb_distance_sphere(sphere, box) {
  var distance = 0;
  var diff=0;
  // process X
  if (sphere[0] < box[0][0]) {
    var diff = sphere[0] - box[0][0];
    distance += diff;
  } else if (sphere[0] >  box[2][0]) {
    diff = sphere[0] - box[2][0];
    distance += diff;
  }

  // process Y
  if (sphere[1] < box[0][1]) {
    diff = sphere[1] - box[0][1];
    distance += diff;
  } else if (sphere[1] > box[2][1]) {
    diff = sphere[1] - box[2][1];
    distance += diff;
  }

  return distance;
};

aabb_distance_vector_sphere = function aabb_distance_vector_sphere(sphere, radius, box) {
  var distx = 0;
  var disty = 0;
  var diff=0;
  // process X
  if (sphere[0] < box[0][0]) {
    diff = sphere[0] + radius - box[0][0];
    distx -= diff;
  }

  else if (sphere[0] > box[2][0]) {
    diff = sphere[0] - radius - box[2][0];
    distx += diff;
  }

  // process Y
  if (sphere[1] < box[0][1]) {
    diff = sphere[1] + radius - box[0][1];
    disty -= diff;
  }

  else if (sphere[1] > box[2][1]) {
    diff = sphere[1] - radius - box[2][1];
    disty += diff;
  }

  return [-distx, -disty];
};

poly_check_col = function poly_check_col(a, b) {
  var col = private_poly_check_col(a, b);
  if (col) return private_poly_check_col(b, a);
  return false;
};

sphere_poly_check_col = function sphere_poly_check_col(s, p){

    //get locations
    var p = [[p.pos[0], p.pos[1]],
            [p.pos[0], p.pos[1]+p.size[1]],
            [p.pos[0]+p.size[0], p.pos[1]+p.size[1]],
            [p.pos[0]+p.size[0], p.pos[1]]];

    var dis = 0;
    var r = 20;

    dis=Math.abs(aabb_distance_sphere(s.pos, p));

    if (dis < r){
      return aabb_distance_vector_sphere(s.pos, r, p);;
    }else {
      return false;
    }
};

private_poly_check_col = function private_poly_check_col(a, b) {
  var vbr=[];

  for(var i=0; i<a.length-1;i++){
    vbr.push([a[i][0]-a[i+1][0], a[i][1]-a[i+1][1]]);
  }

  vbr.push([a[a.length-1][0]-a[0][0], a[a.length-1][1]-a[0][1]]);

  var i;
  var smaxv, sminv, bmaxv, bminv, sv;
  for (i=0;i<vbr.length;i++) {

    //make a right hand normal, to project upon
    rnv= [-vbr[i][1],vbr[i][0]];

    //Start projecting points
    //smaxv=v_proj(sp[0],rnv)
    smaxv=vector_dot(a[0],rnv);
    sminv=smaxv;
    sv=0;
    for (var j=1;j<a.length;j++) {
      sv=vector_dot(a[j],rnv);
      smaxv = sv > smaxv ? sv : smaxv;
      sminv = sv < sminv ? sv : sminv;
    }

    bmaxv=vector_dot(b[0],rnv);
    bminv=bmaxv;
    for (var g=1;g<b.length;g++) {
      sv=vector_dot(b[g],rnv);
      bmaxv = sv > bmaxv ? sv : bmaxv;
      bminv = sv < bminv ? sv : bminv;
    }

    //so.. do we intersect?
    if((smaxv<bminv)||(sminv>bmaxv)){

      //found a space between objects, lets move on
      //internal_log('space i:'+i + 'smin'+sminv+'smax'+smaxv+'bminv'+bminv+'bmaxv'+bmaxv+' sp'+a[0]);
      return false;
    }
  }

  return true;
};

/**
 * Returns whether two rectangles intersect. Two rectangles intersect if they
 * touch at all, for example, two zero width and height rectangles would
 * intersect if they had the same top and left.
 *
 * Note: Stolen from google closure library
 *
 * @param {goog.math.Rect} a A Rectangle.
 * @param {goog.math.Rect} b A Rectangle.
 * @return {boolean} Whether a and b intersect.
 */
intersects = function intersects(a, b) {
  var x0 = Math.max(a.x, b.x);
  var x1 = Math.min(a.x + a.w, b.x + b.w);

  if (x0 <= x1) {
    var y0 = Math.max(a.y, b.y);
    var y1 = Math.min(a.y + a.h, b.y + b.h);

    if (y0 <= y1) {
      return true;
    }
  }
  return false;
};

get_args = function get_args(a) {
  return Array.prototype.slice.call(a);
};

get_random_indicies = function get_random_indicies(list) {
  var result = [],
      count = list.length,
      index = -1;
  while (count--) {
    while (index == -1 || result.indexOf(index) != -1) {
      index = Math.floor(Math.random() * list.length);
    }
    result.push(index);
  }
  return result;
};

/**
 *  Returns a number with specified decimals
 *  @param {Number} value The number to round
 *  @param {Number} decimals The no of deciamls.
 *  @return {Number} A rounded number.
 */
round_number = function round_number(value, decimals) {
	return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

internal_log = function internal_log(msg) {
  try {
    typeof console !== "undefined" && console.log(msg);
  } catch (e) {
    require('sys').puts(msg);
  }
};

// Export for CommonJS (in this case node.js)
try { 

  global.World = World;
  global.GameLoop = GameLoop;
  global.Player = Player;
  global.Ship = Ship;
  global.Wall = Wall;
  global.Bullet = Bullet;

  global.DT = DT;

  global.GAME_PACKET = GAME_PACKET;
  global.PING_PACKET = PING_PACKET;

  global.OP_PLAYER_SPAWN       = OP_PLAYER_SPAWN;
  global.OP_PLAYER_DIE         = OP_PLAYER_DIE;
  global.OP_PLAYER_STATE       = OP_PLAYER_STATE;
  global.OP_PLAYER_INFO        = OP_PLAYER_INFO;
  global.OP_PLAYER_FIRE        = OP_PLAYER_FIRE;
  global.OP_PLAYER_CONNECT     = OP_PLAYER_CONNECT;
  global.OP_PLAYER_DISCONNECT  = OP_PLAYER_DISCONNECT;
  global.OP_POWERUP_SPAWN      = OP_POWERUP_SPAWN;
  global.OP_POWERUP_DIE        = OP_POWERUP_DIE;
  global.OP_ROUND_STATE        = OP_ROUND_STATE;
  global.OP_PLAYER_SAY         = OP_PLAYER_SAY;

  global.OP_REQ_SERVER_INFO    = OP_REQ_SERVER_INFO;
  global.OP_SERVER_INFO        = OP_SERVER_INFO;
  global.OP_SERVER_EXEC_RESP   = OP_SERVER_EXEC_RESP;
  global.OP_DISCONNECT_REASON  = OP_DISCONNECT_REASON;
  global.OP_WORLD_DATA         = OP_WORLD_DATA;
  global.OP_WORLD_STATE        = OP_WORLD_STATE;
  global.OP_WORLD_RECONNECT    = OP_WORLD_RECONNECT;
  global.OP_CLIENT_CONNECT     = OP_CLIENT_CONNECT;
  global.OP_CLIENT_JOIN        = OP_CLIENT_JOIN;
  global.OP_CLIENT_SET         = OP_CLIENT_SET;
  global.OP_CLIENT_STATE       = OP_CLIENT_STATE;
  global.OP_CLIENT_EXEC        = OP_CLIENT_EXEC;
  global.OP_CLIENT_SAY         = OP_CLIENT_SAY;

  global.ROUND_WARMUP  = ROUND_WARMUP,
  global.ROUND_STARTING = ROUND_STARTING,
  global.ROUND_RUNNING  = ROUND_RUNNING,
  global.ROUND_FINISHED = ROUND_FINISHED;

  global.POWERUP_RAPID = POWERUP_RAPID;
  global.POWERUP_RICO = POWERUP_RICO;
  global.POWERUP_SPREAD = POWERUP_SPREAD;

  global.THRUST = THRUST;
  global.SHOOT = SHOOT;
  global.SHIELD = SHIELD;

  global.DEATH_CAUSE_KILLED = DEATH_CAUSE_KILLED;
  global.DEATH_CAUSE_SUICDE = DEATH_CAUSE_SUICDE;

  global.vector_add = vector_add;
  global.vector_sub = vector_sub;
  global.vector_mul = vector_mul;
  global.vector_div = vector_div;
  global.vector_pow = vector_pow;
  global.vector_abs = vector_abs;

  global.intersects = intersects;
  global.round_number = round_number;

} catch (e) { }
