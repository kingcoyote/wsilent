/**
 *  Class World
 *  Represents a world object base. The world object is shared between server
 *  and client.
 */
World = function World(server_mode) {
  this.on_before_init();
  this.max_players = 0;
  this.no_players = 0;
  this.no_ready_players = 0;
  this.entity_count = 1;
  this.entities = {};
  this.players = {};
  this._entities = [];
  this.server_mode = server_mode || false;
  this.powerups = {}; //POWERUP
  this.powerup_count = 0;
  this.powerup_next_spawn = 0;
  this.powerup_id_incr = 0;
  this.map_data = null;
  this.map_name = '';
  this.player_spawn_points = [];
  this.powerup_spawn_points = [];
  this.on_after_init();
};

/**
 *  Placeholder for on_update event
 */
 World.prototype.on_update = function(t, dt) { };
/**
 *  Placeholder for player_died event
 */
World.prototype.on_player_died = function(player, old_entity, death_cause, killer) { };

/**
 *  Placeholder for entity_delete event
 */
World.prototype.on_round_state_changed = function(state, winners) { };

/**
 *  Playerholder for on_before_init event
 */
World.prototype.on_before_init = function() { };

/**
 *  Playerholder for the Player on_after_init event
 */
World.prototype.on_after_init = function() { };

/**
 *  Playerholder for the on_after_state_set event
 */
World.prototype.on_after_state_set = function() { };

/**
 *  Playerholder for on_player_join event
 */
World.prototype.on_player_join = function(player) { };

/**
 *  Playerholder for on_player_leave event
 */
World.prototype.on_player_leave = function(player, reason) { };

/**
 *  Playerholder for on_player_ready event
 */
World.prototype.on_player_ready = function(player) { };

/**
 *  Playerholder for on_player_name_changed event
 */
World.prototype.on_player_name_changed = function(player, new_name, old_name) { };

/**
 *  Playerholder for on_player_action event
 */
World.prototype.on_player_action = function(player, action) { };

/**
 *  Playerholder for on_player_fire event
 */
World.prototype.on_player_fire = function(player, angle) {};

/**
 *  Playerholder for on_powerup_spawn event
 */
World.prototype.on_powerup_spawn = function(powerup) { };

/**
 *  Playerholder for on_powerup_die event
 */
World.prototype.on_powerup_die = function(powerup, player) { };

World.prototype.set_state = function(state, players, powerups) {
  this.tick = state.tick || 0;
  this.delta = state.delta || 0;
  this.max_players = state.max_players || 0;
  this.no_players = state.no_players || 0;
  this.no_ready_players = state.no_ready_players || 0;
  this.start_time = state.start_time || new Date().getTime();
  this.r_state = state.r_state || ROUND_WARMUP;
  this.r_timer = state.r_timer || 0;
  this.r_winners = state.r_winners || [];

  for (var i = 0; i < players.length; i++) {
    var player_repr = players[i];
    var player = new Player(player_repr);
    this.players[player.id] = player;
    if (!player_repr.dead) {
      var ship = new Ship({
        pos:    player_repr.pos,
        vel:    player_repr.vel,
        angle:  player_repr.angle,
        player: player
      });
      ship.visible = true;
      this.add_entity(ship);
      player.ship = ship;
    }
  }

  for (var i = 0; i < powerups.length; i++) {
    var powerup_repr = powerups[i];
    var powerup = new Powerup(powerup_repr);
    this.powerups[powerup.powerup_id] = powerup;
    this.add_entity(powerup);
  }

  this.on_after_state_set();
};

/**
 *  Builds the world
 *  @return {undefined} Nothing
 */
World.prototype.build = function(map_data, rules) {
  var data = map_data.data,
      world_width = data[0].length * GRID_CELL_SIZE,
      world_height = data.length * GRID_CELL_SIZE;

  // Reset variables
  this.entity_count = 1;
  this.no_players = 0;
  this.no_ready_players = 0;
  this.r_state = ROUND_WARMUP;
  this.r_timer = 0;
  this.r_winners = [];
  this.powerups = {};
  this.powerup_count = 0;
  this.powerup_next_spawn = 0;
  this.powerup_id_incr = 0;
  this.entities = {};
  this.players = {};
  this._entities = [];
  this.player_spawn_points = [];
  this.powerup_spawn_points = [];
  this.tick = 0;
  this.delta = 0;

  this.rules = rules;

  this.size = [world_width, world_height];
  this.map_name = map_data.name;
  this.map_data = map_data;

  this.add_entity(new Wall({
    pos: [-10, -10],
    size: [world_width + 20, 10],
    o: 'n'
  }));

  this.add_entity(new Wall({
    pos: [world_width, -10],
    size: [10, world_height + 20],
    o: 'e'
  }));

  this.add_entity(new Wall({
    pos: [-10, world_height],
    size: [world_width + 20, 10],
    o: 's'
  }));

  this.add_entity(new Wall({
    pos: [-10, -10],
    size: [10, world_height + 20],
    o: 'w'
  }));

  function get_connectors(data, x, y) {
    var connectors = 0;

    if (data[y - 1] === undefined || data[y - 1][x] === TILE_CBLOCK) {
      connectors |= BLOCK_CONNECTOR_NORTH;
    }

    if (data[y][x + 1] === undefined || data[y][x + 1] === TILE_CBLOCK) {
      connectors |= BLOCK_CONNECTOR_EAST;
    }

    if (!data[y + 1] || data[y + 1][x] === TILE_CBLOCK) {
      connectors |= BLOCK_CONNECTOR_SOUTH;
    }

    if (data[y][x - 1] === undefined || data[y][x - 1] === TILE_CBLOCK) {
      connectors |= BLOCK_CONNECTOR_WEST;
    }

    return connectors;
  }

  for (var row = 0; row < data.length; row++) {
    for (var col = 0; col < data[row].length; col++) {
      var tile = data[row][col];
      switch (tile) {

        case TILE_CBLOCK:
          this.add_entity(new Block({
            pos: [col * GRID_CELL_SIZE + BLOCK_SPACING,
                  row * GRID_CELL_SIZE + BLOCK_SPACING],
            connectors: get_connectors(data, col, row)
          }));
          break;

        case TILE_BLOCK:
          this.add_entity(new Block({
            pos: [col * GRID_CELL_SIZE + BLOCK_SPACING,
                  row * GRID_CELL_SIZE + BLOCK_SPACING],
            connectors: 0
          }));
          break;

        case TILE_PLAYER_SPAWN:
          this.player_spawn_points.push({
            x: col * GRID_CELL_SIZE,
            y: row * GRID_CELL_SIZE,
            w: GRID_CELL_SIZE,
            h: GRID_CELL_SIZE
          });
          break;

        case TILE_POWERUP_SPAWN:
          this.powerup_spawn_points.push({
            x: col * GRID_CELL_SIZE,
            y: row * GRID_CELL_SIZE,
            w: GRID_CELL_SIZE,
            h: GRID_CELL_SIZE
          });
          break;

      }
    }
  }
};

/**
 *  Adds a player to the game world.
 *  @param player {Player} the player to add
 *  @return {undefined} Nothing
 */
World.prototype.add_player = function(player_id, player_name) {
  var player = new Player({ id: player_id, name: player_name});
  player.world = this;
  switch (this.r_state) {

    // Let the player spawn directly
    case ROUND_WARMUP:
      player.respawn_time = this.tick + ROUND_WARMUP_RESPAWN_DELAY * this.delta;
      break;

    // Add a delay to the spawn
    case ROUND_RUNNING:
      player.time = this.tick;
      player.respawn_time = this.tick + this.rules.respawn_time * this.delta;
      break;

    // No spawn if we are waiting for a new state
    case ROUND_STARTING:
    case ROUND_FINISHED:
      break;
  }

  this.no_players++;
  this.players[player_id] = player;
  this.on_player_join(player);

  return player;
};

/**
 *  Removes a player from the game world.
 *  @param player {Player} the player to add
 *  @return {undefined} Nothing
 */
World.prototype.remove_player = function(player_id, reason) {
  var player = this.players[player_id];
  if (!player) return;
  if (this.r_state == ROUND_WARMUP && player.ready) {
    this.no_ready_players--;
  }
  if (player.ship) {
    this.remove_entity(player.ship.id);
  }
  // remove all bullets produced by player
  var entities = this._entities, l = entities.length;
  while (l--) {
    var bullet = entities[l];
    if (bullet.type == "bullet" && bullet.player.id == player_id) {
      this.remove_entity(bullet.id);
    }
  }

  delete this.players[player.id];
  this.no_players--;
  this.on_player_leave(player, reason);
};

/**
 *  Sets the ready state of a player to true.
 *  @param player_id {Number} the specified player
 *  @return {undefined} Nothing
 */
World.prototype.set_player_ready = function(player_id) {
  var player = this.players[player_id];
  // race condition - player can be undefined
  if (player && this.r_state == ROUND_WARMUP && !player.ready) {
    player.ready = true;
    this.no_ready_players++;
    this.on_player_ready(player);
  }
};

/**
 *  Sets player name
 *  @param player_id {Number} the specified player
 *  @param new_name {String} the new name
 *  @return {undefined} Nothing
 */
World.prototype.set_player_name = function(player_id, new_name) {
  var player = this.players[player_id],
      old_name = player.name;
  if (old_name != new_name) {
    player.name = new_name;
    this.on_player_name_changed(player, new_name, old_name);
  }
};

/**
 *  Sets the action of a player.
 *  @param player {Player} the specified player
 *  @return {undefined} Nothing
 */
World.prototype.set_player_action = function(player_id, action) {
  var player = this.players[player_id];
  if (player.action != action &&
      !player.dead &&
     (this.r_state == ROUND_WARMUP || this.r_state == ROUND_RUNNING)) {
    player.action = action;
    this.on_player_action(player, action);
  }
};

/**
 *  Adds an Entity instance to the World.
 *  @param {Entity} entity The Entity instance to add.
 *  @returns {undefined} Nothing
 */
World.prototype.add_entity = function(entity) {
  var entity_id = this.entity_count++;
  entity.id = entity_id;
  this.entities[entity_id] = entity;
  this._entities.push(entity);
};

/**
 *  Deletes an Entity instance by its ID.
 *  @param {Number} id The ID of the entity.
 *  @returns {undefined} Nothing
 */
World.prototype.remove_entity = function(id) {
  var entities = this._entities, l = entities.length, i = -1;
  while (l--) {
    if (entities[l].id == id) { i = l; break; }
  }
  if (i != -1){
    entities.splice(i, 1);
    delete this.entities[id];
  }
};

/**
 *  Executes a callback on each player in the game world
 *  @param callback {Function} the callback to be executed.
 *  @returns {undefined} Nothing
 */
World.prototype.forEachPlayer = function(callback) {
  for (var id in this.players) {
    callback(this.players[id]);
  }
};

/**
 *  Executes a callback on each powerup in the game world
 *  @param callback {Function} the callback to be executed.
 *  @returns {undefined} Nothing
 */
World.prototype.forEachPowerup = function(callback) { //POWERUP
  for (var id in this.powerups) {
    callback(this.powerups[id]);
  }
};

/**
 *  Kills a player
 *  @param {Player} the player that should be killed.
 *  @param {DEATH_CAUSE_*} death_cause The cause of death
 *  @param {Player} killed_by The killer if not suicide.
 *  @return {undefined} Nothing
 */
World.prototype.kill_player = function(player_id, death_cause, killed_by_id) {
  var player      = this.players[player_id];
      killer      = this.players[killed_by_id] || null,
      old_entity  = player.ship;

  switch (death_cause) {

    case DEATH_CAUSE_SUICDE:
      player.suicides++;
      player.score = (player.score - this.rules.suicide_penelty) < 0 ? 0 : player.score - this.rules.suicide_penelty;
      break;

    case DEATH_CAUSE_KILLED:
      killer.kills++;
      killer.score += this.rules.kill_score;
      break;

  }

  player.deaths++;

  this.remove_entity(player.ship.id);

  player.action = 0;
  player.dead = true;
  player.ship = null;

  this.on_player_died(player, old_entity, death_cause, killer);
};

/**
 *  Spawns a new player ship at a random location.
 *  @param player_id {Number} the id of the player to spawn
 *  @param pos {x, y} (optional) the spawn position.
 *  @return {gameobjects.Ship} The newly created Ship instance.
 */
World.prototype.spawn_player = function(player_id, pos) {
  var player = this.players[player_id];
  var spawn_pos = pos;

  if (!spawn_pos) {
    var spawn_points = this.player_spawn_points;
    var index = spawn_points.length;
    var indecies = get_random_indicies(spawn_points);

    while (index--) {
      var spawn_point = spawn_points[indecies[index]];
      if (!this.bounds_intersects(spawn_point, 'ship')) {
        spawn_pos = [spawn_point.x + (GRID_CELL_SIZE / 2),
                     spawn_point.y + (GRID_CELL_SIZE / 2)];

        break;
      }
    }

    if (!spawn_pos) {
      spawn_pos = this.get_random_respawn_pos();
    }
  }

  var ship = new Ship({
    pos:    spawn_pos,
    player: player,
    powerup: 0, //POWERUP
    energy: 100
  });
  this.add_entity(ship);

  player.action = 0;
  player.ship = ship;
  player.dead = false;
  player.respawn_time = 0;

  this.on_player_spawn(player, ship.pos);

  return ship;
};

World.prototype.fire_player_cannon = function(player) {
  this.players[player].ship.fire(this);
  this.on_player_fire(this.players[player]);
};

/**
 *  Finds a position to respawn on.
 *  @return {x, y} A point to a location where it's safe to spawn.
 */
World.prototype.get_random_respawn_pos = function() {
  var bounds = { x: 0, y: 0, w: GRID_CELL_SIZE - 2, h: GRID_CELL_SIZE - 2};
      pos    = null;

  while (pos == null) {
    bounds.x = 50 + (Math.random() * (this.size[0] - 100));
    bounds.y = 50 + (Math.random() * (this.size[1] - 100));
    if (!this.bounds_intersects(bounds)) {
      pos = [bounds.x + 30, bounds.y + 30];
    }
  }

  return pos;
};

/**
 *  Set round state
 *  @param {Number} t Current world frame
 *  @param {Number} dt Current delta time
 *  @returns {undefined} Nothing
 */
World.prototype.set_round_state = function(state, winners) {
  var self = this;
  switch (state) {

    // Sets round state to waiting. Remove all existing entities and
    // spawn new ships.
    case ROUND_WARMUP:
      this.no_ready_players = 0;
      this.r_timer = 0;
      this.r_winners = [];
      this.forEachPlayer(function(player) {
        player.ready = false;
        player.score = 0;
        player.kills = 0;
        player.deaths = 0;
        player.suicides = 0;
        if (self.server_mode) {
          self.spawn_player(player.id);
        }
      });
      this.forEachPowerup(function(powerup) {
        self.remove_entity(powerup.id);
      });
      break;

    // The round is starting. Remove all entities from the world and prepare
    // players for fight!
    case ROUND_STARTING:
      this.r_timer = this.tick + ROUND_START_DELAY * this.delta;
      this.forEachPlayer(function(player) {
        player.respawn_time = 0;
        player.dead = true;
        if (player.ship) {
          self.remove_entity(player.ship.id);
        }
      });
      break;

    // The round is now started.
    case ROUND_RUNNING:
      this.r_timer = 0;
      this.forEachPlayer(
        function(player) {
          player.time = self.tick;
          player.ready = false;
          player.score = 0;
          player.kills = 0;
          player.deaths = 0;
          player.suicides = 0;
          if (self.server_mode) {
            self.spawn_player(player.id);
          }
        }
      );
      break;

    case ROUND_FINISHED:
      this.forEachPlayer(
        function(player) {
          if (player.ship) {
            self.remove_entity(player.ship.id);
          }
          player.dead = true;
          player.respawn_time = 0;
        }
      );
      this.r_timer = this.tick + ROUND_NEXT_MAP_DELAY * this.delta;
      this.r_winners = winners;
      break;
  }

  this.r_state = state;
  this.on_round_state_changed(this.r_state, this.r_winners);
};

/**
 *  Moves all alive entities in the world.
 */
World.prototype.update_entities = function(t, dt) {
  var entities = this.entities;
  for (var id in entities) {
    var entity = entities[id], res = false;
    entity.world_update(t, dt);
  }
};

/**
 *  Update game world states
 *  @param {Number} t Current world time.
 *  @param {Number} dt Current delta time,
 *  @return {undefined} Nothing
 */
World.prototype.update_state = function(t, dt) {
  var players   = this.players,
      rules     = this.rules,
      respawn_t = rules.respawn_time;

  // Update round timer if running
  if (this.r_state == ROUND_RUNNING) {
    this.r_timer += dt;
  }

  for (var player_id in players) {
    var player = players[player_id];


    // It's the server's job to spawn players.
    if (this.server_mode && player.respawn_time && t >= player.respawn_time) {
      this.spawn_player(player_id);
    }

    switch (this.r_state) {
      case ROUND_WARMUP:
        respawn_t = ROUND_WARMUP_RESPAWN_DELAY;
      case ROUND_RUNNING:
        if (player.dead && !player.respawn_time) {
          player.respawn_time = t + respawn_t * dt;
        }
        break;
    }

    if (!player.dead) {
      var ship = player.ship;

      ship.set(THRUST, player.is(THRUST));

      if (player.is(SHIELD) && ship.energy >= rules.shield_cost * dt) {
        ship.energy -= rules.shield_cost * dt;
        ship.set(SHIELD, true);
      } else {
        ship.set(SHIELD, false);
      }
      
      if (ship.reload_time && t >= ship.reload_time) { 
        ship.reload_time = 0;
      }
      
      if (!player.is(SHIELD) && player.is(SHOOT) && ship.can_fire(this)) {
        ship.set(SHOOT, true);

        // Again, to keep things synchronized, we let the server handle firing
        if (this.server_mode) {
          this.fire_player_cannon(ship.player.id);
        }

      } else {
        ship.set(SHOOT, false); // WEAPON
      }

      if (ship.energy < 100 && !player.is(SHIELD) && !player.is(SHOOT)) {
        ship.energy += rules.energy_recovery * dt;
        if (ship.energy > 100) {
          ship.energy = 100;
        }
      }

      if (ship.powerup > 0) {
        for (var powerup_type in ship.powerup_timers) {
          if (ship.powerup_timers[powerup_type] &&
              ship.powerup_timers[powerup_type].end < t) {
            ship.remove_powerup(powerup_type);
          }
        }
      }
    }
  }

  if (this.server_mode && this.r_state == ROUND_RUNNING) {
    if (this.powerup_next_spawn == 0) {

      // spawn first powerups a little faster
      this.powerup_next_spawn = t + (rules.powerup_respawn / 4) * dt;

    } else if (this.powerup_next_spawn < t) {

      if (this.powerup_count < rules.powerup_max)  {
        // We can spawn more powerups. Take a random no how many that should be
        // spawned.
        var rnd = Math.round(Math.random() * (rules.powerup_max -
                                            this.powerup_count));

        while (rnd--) {
          this.spawn_powerup();
        }

      }

      this.powerup_next_spawn = t + rules.powerup_respawn * dt;
    }
  }
};

/**
 *  Spawns a new powerup at a random location.
 *  @param powerup_id {Number} the id of the powerup
 *  @param type {Number} the type of power-up
 *  @param pos {x, y} (optional) the spawn position.
 *  @return {gameobjects.Ship} The newly created Ship instance.
 */
World.prototype.spawn_powerup = function(powerup_id, type, pos) {
  var spawn_pos = pos;

  if (!spawn_pos) {
    var spawn_points = this.powerup_spawn_points;

    if (!spawn_points.length) {
      spawn_pos = this.get_random_respawn_pos();
    } else {
      var index = spawn_points.length;
      var indecies = get_random_indicies(spawn_points);

      while (index--) {
        var spawn_point = spawn_points[indecies[index]];
        if (!this.bounds_intersects(spawn_point, 'powerup')) {
          spawn_pos = [spawn_point.x + (GRID_CELL_SIZE / 2),
                       spawn_point.y + (GRID_CELL_SIZE / 2)];
          break;
        }
      }

      if (!spawn_pos) {

        // No position available
        return;
      }

    }

  }

  var entity = new Powerup({
    powerup_id:   powerup_id || this.powerup_id_incr++,
    powerup_type: type || get_random_powerup_type(),
    pos:          spawn_pos
  });
  this.powerup_count++;
  this.add_entity(entity);
  this.powerups[entity.powerup_id] = entity;
  this.on_powerup_spawn(entity);
  return entity;
};

/**
 *  Kill powerup
 *  @param powerup_id {Number} the id of the powerup
 *  @param destroyed_by_id {Number} id of player who destroyed the powerup
 *  @return {undefined} nothing
 */
World.prototype.kill_powerup = function(powerup_id, destroyed_by_id) {
  var powerup       = this.powerups[powerup_id],
      player        = this.players[destroyed_by_id];

  if (powerup) {
    var powerup_t = get_powerup_decline_time(this.rules, powerup);
    player.ship.set_powerup(powerup.powerup_type, this.tick,
                       this.tick + powerup_t * this.delta);

    this.powerup_count--;
    this.remove_entity(powerup.id);
    delete this.powerups[powerup_id];
    this.on_powerup_die(powerup, player);
  }
};

/**
 *  Moves the game world one tick ahead.
 *  @param {Number} t Current world frame
 *  @param {Number} dt Current delta time
 *  @returns {undefined} Nothing
 */
World.prototype.update = function(t, dt) {
  var entities  = this.entities,
      target    = null;
  this.tick = t;
  this.delta = dt;
  this.update_entities(t, dt);
  this.handle_collisions(t, dt);
  this.update_state(t, dt);
  this.on_update(t, dt);
  this.remove_destroyed_entities();
};

/**
 *  Returns a list of current entity interesections.
 *  @returns {Array} A list of entity interesections.
 */
World.prototype.get_intersections = function() {
  var entities      = this._entities.slice(0);
      index         = entities.length,
      index2        = 0,
      intersections = [],
      entity        = null,
      target        = null;

  while (index--) {
    entity = entities[index];

    if (entity.obstacle) {
      continue;
    }

    index2 = entities.length;

    while (index2--) {
      target = entities[index2];
      if (target != entity && intersects(entity.get_bounds(), target.get_bounds())) {
        intersections.push({entity: entity, target: target});
        break;
      }
    }

    entities.splice(index, 1);
  }

  return intersections;
};

/**
 *  Returns whatever the specified Bounding box intersects with an Entity
 *  in the world.
 *  @param {x,y,w,h} box The bounding box
 *  @returns {Boolean} Returns True if the bounding box intersects else False.
 */
World.prototype.bounds_intersects = function(box, type) {
  var entities      = this._entities;
      index         = entities.length;

  while (index--) {
    entity = entities[index];
    if ((!type || entity.type == type) && intersects(box, entity.get_bounds())) {
      return true;
    }
  }

  return false;
};

/**
 *  Checks and resolves collisions between entities.
 *  @param {Number} t Current world time.
 *  @param {Number} dt Current delta time,
 *  @return {undefined} Nothing
 */
World.prototype.handle_collisions = function(t, dt) {
  var intersections = this.get_intersections(),
      index = intersections.length,
      trash = [];

  while (index--) {
    var intersection = intersections[index];
    collision_resolver([intersection.entity, intersection.target, this.server_mode]);
  }
};

/**
 *  Remove all destroyed entities
 */
World.prototype.remove_destroyed_entities = function(t, dt) {
  var index = this._entities.length;
  while (index--) {
    var entity = this._entities[index];
    if (entity.destroyed) {
      switch (entity.type) {
        case 'ship':
          this.kill_player(entity.player.id, entity.death_cause, entity.destroyed_by);
          break;

        case 'powerup':
          this.kill_powerup(entity.powerup_id, entity.destroyed_by.id);
          break;

        default:
          this.remove_entity(entity.id);
          break;
      }
    }
  }
};

/**
 *  Finds an Entity by id
 */
World.prototype.find = function(id_to_find) {
  for (var id in this.entities) {
    if (id == id_to_find) return this.entities[id];
  }
  return null;
};

/**
 *  Gets an representation of this object
 */
World.prototype.get_repr = function() {
  var players = [],
      powerups = [];

  for (var id in this.players) {
    players.push(this.players[id].get_repr());
  }

  for (var id in this.powerups) {
    powerups.push(this.powerups[id].get_repr());
  }

  return [
    {
      tick:               this.tick,
      delta:              this.delta,
      max_players:        this.max_players,
      no_players:         this.no_players,
      no_ready_players:   this.no_ready_players,
      start_time:         this.start_time,
      r_state:            this.r_state,
      r_timer:            this.r_timer,
      r_winners:          this.r_winners
    },
    players,
    powerups
  ];
};