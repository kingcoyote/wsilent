//
//  wpilots.js
//  WPilot server
//
//  Read README for instructions and LICENSE license.
//
//  Copyright (c) 2010 Johan Dahlberg
//

require('./lib/constants');

require('./lib/entitybase');
require('./lib/gameloop');
require('./lib/world');
require('./lib/player');
require('./lib/ship');
require('./lib/wall');
require('./lib/block');
require('./lib/powerup');
require('./lib/upgrade');
require('./lib/bullet');
require('./lib/weapon');

var sys       = require('sys'),
    path      = require('path'),
    fs        = require('fs'),
    httpserver= require('./lib/httpserver'),
    gameserver= require('./lib/gameserver'),
    optparse  = require('./lib/optparse'),
    match     = require('./lib/match').Match,
    go        = require('./lib/gameobjects'),
    io        = require('socket.io');

// Define aliases
var _  = match.incl;

const SERVER_VERSION       = '1.0';

// Message priorities. High priority messages are sent to client no mather
// what. Low priority messages are sent only if client can afford them.
const PRIO_PASS     = 0,
      PRIO_LOW      = 'low',
      PRIO_HIGH     = 'high';

// Player Connection states
const DISCONNECTED  = -1;
      IDLE          = 0,
      CONNECTED     = 1;
      HANDSHAKING   = 3,
      JOINED        = 4;

// Default map. This map is used if no other map i specified.
const DEFAULT_MAP   = {
	name: 'Battle Royale',
	author: 'Johan Dahlberg',
	recommended_players: 8,

	data: [
		[51,  0,  0, 51,  0,  0, 51],
		[ 0, 11, 11,  0, 11, 11,  0],
		[ 0, 11, 52,  0, 52, 11,  0],
		[51,  0,  0, 12,  0,  0, 51],
		[ 0, 11, 52,  0, 52, 11,  0],
		[ 0, 11, 11,  0, 11, 11,  0],
		[51,  0,  0, 51,  0,  0, 51]
	]
};

// Command line option parser switches
const SWITCHES = [
  ['-d', '--debug',               'Enables debug mode (Default: false)'],
  ['-H', '--help',                'Shows this help section'],
  ['--name NAME',                 'The name of the server.'],
  ['--host HOST',                 'The host adress (default: 127.0.0.1).'],
  ['--region REGION',             'Set region of this server. This info is displayed in the global server list (default: n/a).'],
  ['--admin_password PASSWORD',   'Admin password (default: "none").'],
  ['--map PATH',                  'Path to world map (default: built-in map).'],
  ['--pub_host HOST',             'Set if the public host differs from the local one'],
  ['--http_port PORT',            'Port number for the HTTP server. Disable with 0 (default: 8000)'],
  ['--ws_port PORT',              'Port number for the WebSocket server (default: 6114)'],
  ['--pub_ws_port PORT',          'Set if the public WebSocket port differs from the local one'],
  ['--max_rate NUMBER',           'The maximum rate per client and second (default: 1000)'],
  ['--max_connections NUMBER',    'Max connections, including players (default: 60)'],
  ['--max_players NUMBER',        'Max connected players allowed in server simultaneously (default: 8)'],
  ['--r_ready_ratio NUMBER',      'Rule: Player ready ratio before a round start. (Default: 0.6)'],
  ['--r_respawn_time NUMBER',     'Rule: Player respawn time after death. (Default: 500)'],
  ['--r_reload_time NUMBER',      'Rule: The reload time after fire. (Default: 15)'],
  ['--r_shoot_cost NUMBER',       'Rule: Energy cost of shooting a bullet. (Default: 800)'],
  ['--r_shield_cost NUMBER',      'Rule: Energy cost of using the shield. (Default: 70)'],
  ['--r_energy_recovery NUMBER',  'Rule: Energy recovery unit (Default: 40)'],
  ['--r_round_limit NUMBER',      'Rule: Round score limit (Default: 10)'],
  ['--r_suicide_penelty NUMBER',  'Rule: The cost for suicides (Default: 1)'],
  ['--r_kill_score NUMBER',       'Rule: The price of a kill (Default: 1)'],
  ['--r_powerup_max NUMBER',      'Rule: Max no of powerups to spawn (Default: 3)'],
  ['--r_powerup_respawn NUMBER',  'Rule: Time between powerup respawns (Default: 1200)'],
  ['--r_powerup_spread_t NUMBER', 'Rule: Time before the spread powerup decline (Default: 700)'],
  ['--r_powerup_rapid_t NUMBER',  'Rule: Time before the rapid fire powerup decline (Default: 600)'],
  ['--r_powerup_rico_t NUMBER',   'Rule: Time before the ricoshet powerup decline (Default: 800)']
];

// Default server options
const DEFAULT_OPTIONS = {
  debug:                true,
  name:                 'WPilot Server',
  host:                 '127.0.0.1',
  region:               'n/a',
  admin_password:       null,
  map:                  null,
  pub_host:             null,
  http_port:            8000,
  ws_port:              6114,
  pub_ws_port:          null,
  max_connections:      60,
  max_players:          8,
  max_rate:             5000,
  r_ready_ratio:        0.6,
  r_respawn_time:       400,
  r_shield_cost:        30,
  r_energy_recovery:    30,
  r_round_limit:        10,
  r_suicide_penelty:    1,
  r_kill_score:         1,
  r_powerup_max:        2,
  r_powerup_respawn:    600,
  r_powerup_spread_t:   700,
  r_powerup_rapid_t:    600,
  r_powerup_rico_t:     600,
  dirname:              __dirname,
  default_page:         '/index.html'
};

// Paths to all files that should be server to client.
const CLIENT_DATA = [
  'client/index.html', '',
  'client/style.css', '',
  'client/logo.png', '',
  'client/space.jpg', '',
  'client/wpilot.js', '',
  'client/devices.js', '',
  'lib/gameobjects.js', '',
  'lib/match.js', 'lib/',
  'client/sound/background.m4a', 'sound/',
  'client/sound/ship_spawn.m4a','sound/',
  'client/sound/ship_die.m4a', 'sound/',
  'client/sound/ship_thrust.m4a', 'sound/',
  'client/sound/ship_fire_1.m4a', 'sound/',
  'client/sound/ship_fire_2.m4a', 'sound/',
  'client/sound/ship_fire_3.m4a', 'sound/',
  'client/sound/powerup_spawn.m4a', 'sound/',
  'client/sound/powerup_1_die.m4a', 'sound/',
  'client/sound/powerup_2_die.m4a', 'sound/',
  'client/sound/powerup_3_die.m4a', 'sound/',
  'client/sound/background.ogg', 'sound/',
  'client/sound/ship_spawn.ogg', 'sound/',
  'client/sound/ship_die.ogg', 'sound/',
  'client/sound/ship_thrust.ogg', 'sound/',
  'client/sound/ship_fire_1.ogg', 'sound/',
  'client/sound/ship_fire_2.ogg', 'sound/',
  'client/sound/ship_fire_3.ogg', 'sound/',
  'client/sound/powerup_spawn.ogg', 'sound/',
  'client/sound/powerup_1_die.ogg', 'sound/',
  'client/sound/powerup_2_die.ogg', 'sound/',
  'client/sound/powerup_3_die.ogg', 'sound/',
  'client/web_socket.js', 'lib/',
  'client/swfobject.js', 'lib/',
  'client/FABridge.js', 'lib/',
  'client/particle.js', 'lib/',
  'client/WebSocketMain.swf', 'lib/',
  'client/crossdomain.xml', 'lib/'
];

/**
 *  Entry point for server.
 *  @returns {undefined} Nothing.
 */
function main() {
  var options         = parse_options(),
      shared          = { get_state: function() {} },
      policy_server   = null,
      maps            = null,
      world,
      sockets         = {},
      socket_id       = 0,
      color_id        = 0,
      no_connections  = 0,
      gameloop        = null,
      world           = null,
      server          = null,
      update_tick     = 1,
      next_map_index  = 0;

  if (!options) return;

  sys.puts('WPilot server ' + SERVER_VERSION);

  maps = options.maps;

  if (options.http_port != 0) {
    webserver = httpserver.init(options);
  }
  
  gameserver = io.listen(webserver);
  
  gameserver.sockets.on('connection', function(socket) {
    socket.emit('return_server_info', shared.get_state());
    
    // set up all that extra shit
    // need to get player and world in scope for some callbacks
    socket.set_state = function(new_state) {
      switch (new_state) {
  
        case CONNECTED:
          if (no_connections++ > options.max_connections) {
            socket.close('Server busy');
            return;
          }
  
          while (sockets[socket.id]);
          
          socket.color_id = ++color_id;
          socket.player = null;
          socket.player_name = null;
          socket.is_admin = false;
          socket.rate = options.max_rate;
          socket.update_rate = 2;
          socket.max_rate = options.max_rate;
          socket.last_rate_check = get_time();
          socket.last_ping = 0;
          socket.ping = 0;
          socket.data_sent = 0;
          socket.dimensions = [640, 480];
          socket.state = IDLE;
          socket.debug = options.debug;
  
          sockets[socket.id] = socket;
  
          break;
  
        case HANDSHAKING:
          if (!gameloop) {
            start_gameloop();
          }
          
          if (world.no_players >= world.max_players) {
            socket.close('Server is full');
          } else {
            socket.emit('set_world_data', {"map_data":world.map_data, "rules":world.rules});
          }
          break;
  
        case JOINED:
          var playeridincr = 0;
  
          while (world.players[socket.id]);
  
          socket.player = world.add_player(socket.id, socket.player_name);
          socket.player.color_id = this.color_id;
          
          info = {"id":socket.player.id};
          repr = world.get_repr();
          
          for(i in repr) {
            info[i] = repr[i];
          }
          
          socket.emit('set_world_state', info);
          
          log(socket + ' (' + socket.player_name + ') joined the game.');
          break;
  
        case DISCONNECTED:
          if (socket.id && sockets[socket.id]) {
            delete sockets[socket.id];
  
            no_connections--;
  
            if (socket.player) {
              world.remove_player(socket.player.id, socket.disconnect_reason);
              socket.player = null;
              log(socket + ' left the game (Reason: ' + socket.disconnect_reason + ')');
            }
  
            if (world.no_players == 0) {
              stop_gameloop();
            }
          }
          break;
      }
  
      socket.state = new_state;
    };
    
    socket.set_state(CONNECTED);
    
    socket.close = function(reason){
      socket.disconnect_reason = reason;
      socket.set_state(DISCONNECTED);
    };
    
    socket.set_client_info = function(info) {
      socket.rate = Math.min(info.rate, options.max_rate);
      socket.player_name = info.name;
      socket.dimensions = info.dimensions;
    }
    
    socket.chat = function(message) {
      gameserver.sockets.emit('player_say', {"player_id":socket.player.id, "message":message});
      log('Chat ' + socket.player.id + ': ' + message);
    };
    
    socket.exec = function() {};
    
    socket.on('handshake', function(data){
      if(data.version != SERVER_VERSION) {
        socket.close('Wrong version');
      } else {
        socket.set_state(HANDSHAKING);
      }
    });
    
    socket.toString = function() {
      return this.id;
    };
    
    socket.on('request_server_info', function(){
      socket.emit('return_server_info', shared.get_state());
    });
    
    socket.on('join', function(data){
      socket.set_client_info(data);
      socket.set_state(JOINED);
    });
    
    socket.on('chat', function(data) {
      if(data.message.length < 200) {
        socket.chat(data.message);
      }
    });
    
    socket.on('set_rate', function(data){
      socket.rate = Math.min(data.rate, socket.max_rate);
    });
    
    socket.on('set_ready', function(data) {
      world.set_player_ready(socket.player.id);
    });
    
    socket.on('set_name', function(data){
      world.set_player_name(socket.player.id, data.name);
    });
    
    socket.on('command_state_change', function(data){
      socket.player.action = data.action;
      if (!socket.player.dead) {
        socket.player.ship.angle = data.angle;
      }
    });
    
    socket.on('exec', function(data){
      var resp;
      switch(data[0]) {
        case 'sv_kick':
          world.forEachPlayer(function(player) {
            if (player.name == data[1]) {
              var player_socket = connection_for_player(player);
              player_socket.close(data[2]);
              resp = "Player kicked";
            }
          });
          break;
        case 'sv_map':
          load_map(data[1], false, function(err) {
            if (err) {
              //conn.post([OP_SERVER_EXEC_RESP, err]);
              socket.write('server_message', {"message":err});
            } else {
              gameserver.sockets.emit('set_state', {"state":OP_WORLD_RECONNECT});
            }
          });
          resp = 'Loading map';
          break;
        case 'sv_warmup':
          switch (world.r_state) {
            case ROUND_WARMUP:
              resp = 'Already in warmup mode';
            case ROUND_RUNNING:
            case ROUND_STARTING:
              world.set_round_state(ROUND_WARMUP);
              resp = 'Changed';
              break;
            case ROUND_FINISHED:
              resp = 'Game has already finished';
              break;
          }
          break;
        case 'sv_start':
          switch (world.r_state) {
            case ROUND_WARMUP:
              world.set_round_state(ROUND_STARTING);
              resp = "Changed";
              break;
            case ROUND_STARTING:
              world.set_round_state(ROUND_RUNNING);
              resp = "Changed";
              break;
            case ROUND_RUNNING:
              resp = 'Game is already started. Type sv_restart to restart';
            case ROUND_FINISHED:
              resp = 'Game has already finished';
          }
          break;
        case 'sv_restart':
          switch (world.r_state) {
            case ROUND_WARMUP:
            case ROUND_STARTING:
              resp = 'Cannot restart warmup round';
            case ROUND_RUNNING:
              world.set_round_state(ROUND_STARTING);
              break;
              resp = 'Changed';
            case ROUND_FINISHED:
              world.set_round_state(ROUND_STARTING);
              break;
              resp = 'Changed';
          }
          break;
      }
      socket.emit('exec_resp', {"resp":resp});
    });
    
    socket.on('disconnect', function() {
      socket.close();
    });
  });

  // Is called by the web instance to get current state
  shared.get_state = function() {
    return {
      server_name:      options.name,
      region:           options.region,
      version:          SERVER_VERSION,
      game_server_url:  'ws://' + (options.pub_host || options.host) + ':' +
                                (options.pub_ws_port || options.ws_port) + '/',
      map_name:         world.map_name,
      max_players:      options.max_players,
      no_players:       world.no_players,
      no_ready_players: world.no_ready_players,
      rules:            world.rules
    };
  }

  /**
   *  The acutal game loop.
   *  @param {Number} t Current world time.
   *  @param {Number} dt Current delta time,
   *  @return {undefined} Nothing
   */
  function gameloop_tick(t, dt) {
    world.update(t, dt);
    check_rules(t, dt);
    post_update();
  }

  function connection_for_player(player) {
    for (var connid in sockets) {
      var conn = sockets[connid];
      if (conn.player && conn.player.id == player.id) {
        return conn;
      }
    }
    return null;
  }

  // Create the world instance
  world = new World(true);
  world.max_players = options.max_players,

  // Listen for round state changes
  world.on_round_state_changed = function(state, winners) {
    gameserver.sockets.emit('round_state_change', { "state":state,"winners":winners });
  }

  // Listen for events on player
  world.on_player_join = function(player) {
    player.name = get_unique_name(world.players, player.id, player.name);
    gameserver.sockets.emit('player_connect', { "id":player.id, "name":player.name });
  }

  world.on_player_spawn = function(player, pos) {
    gameserver.sockets.emit('player_spawn', { "id":player.id, "pos":pos });
  }

  world.on_player_died = function(player, old_entity, death_cause, killer) {
    gameserver.sockets.emit('player_die', {"id":player.id, "death_cause":death_cause, "killer":killer ? killer.id : -1});
  }

  world.on_player_ready = function(player) {
    gameserver.sockets.emit('player_info_change', {"id":player.id, "ready":true}); //FIX
  }

  world.on_player_name_changed = function(player, new_name, old_name) {
    player.name = get_unique_name(world.players, player.id, new_name);
    gameserver.sockets.emit('player_info_change', {"id":player.id, "name":player.name}); //FIX
  }

  world.on_player_fire = function(player, angle, pos, vel, powerup) {
   gameserver.sockets.emit('player_fire', {"player":player.id});
  }

  world.on_player_leave = function(player, reason) {
    gameserver.sockets.emit('player_disconnect', {"id":player.id, "reason":reason});
  }

  world.on_powerup_spawn = function(powerup) {
    gameserver.sockets.emit(
      'powerup_spawn', 
      {
        "id":powerup.powerup_id, 
        "type":powerup.powerup_type, 
        "pos":powerup.pos
      }
    );
  }

  world.on_powerup_die = function(powerup, player) {
    gameserver.sockets.emit('powerup_die', {"powerup_id":powerup.powerup_id, "player_id":player.id});
  }

  /**
   *  Starts the game loop.
   *  @return {undefined} Nothing
   */
  function start_gameloop() {

    // Reset game world
    world.build(world.map_data, world.rules);

    gameloop = new GameLoop();
    gameloop.ontick = gameloop_tick;

    log('Starting game loop...');
    gameloop.start();
  }

  /**
   *  Stops the game loop, disconnects all connections and resets the world.
   *  @param {String} reason A reason why the game loop stopped. Is sent to all
   *                         current connections.
   *  @return {undefined} Nothing
   */
  function stop_gameloop(reason) {
    for (var id in sockets) {
      sockets[id].close();
    }

    if (gameloop) {
      gameloop.ontick = null;
      gameloop.kill();
      gameloop = null;
    }
  }

  function post_update() {
    update_tick++;
    for (var id in sockets) {
      
      var time = get_time();
      var socket = sockets[id];

      if (socket.state != JOINED) {
        continue;
      }

      /*if (connection.last_ping + 2000 < time) {
        connection.last_ping = time;
        connection.write(JSON.stringify([PING_PACKET]));
      }*/
      if (update_tick % socket.update_rate != 0) {
        continue;
      }
      for (var id in world.players) {
        var player = world.players[id];
        if (player.ship) {
          socket.emit('player_state_change', {
            "id":id,
            vector:pack_vector(player.ship.pos), 
            angle:player.ship.angle, 
            action:player.ship.action 
          }); 
        }
        if (update_tick % 200 == 0) {
          var player_connection = connection_for_player(player);
          socket.emit('player_info_change', {"id":player.id, "ping":0 });
        }

      }
    }
  }

  /**
   *  Check game rules
   *  @param {Number} t Current world time.
   *  @param {Number} dt Current delta time,
   *  @return {undefined} Nothing
   */
  function check_rules(t, dt) {
    switch (world.r_state) {

      // The world is waiting for players to be "ready". The game starts when
      // 60% of the players are ready.
      case ROUND_WARMUP:
        if (world.no_players > 1 && world.no_ready_players >= (world.no_players * world.rules.ready_ratio)) {
          world.set_round_state(ROUND_STARTING);
        }
        break;

      // Round is starting. Server aborts if a player leaves the game.
      case ROUND_STARTING:
        // if (world.no_ready_players < (world.no_players * 0.6)) {
        //   world.set_round_state(ROUND_WARMUP);
        //   return;
        // }
        if (t >= world.r_timer) {
          world.set_round_state(ROUND_RUNNING);
        }
        break;

      // The round is running. Wait for a winner.
      case ROUND_RUNNING:
        var winners = [];
        world.forEachPlayer(function(player) {
          if (player.score == world.rules.round_limit) {
            winners.push(player.id);
          }
        });
        if (winners.length) {
          world.set_round_state(ROUND_FINISHED, winners);
        }
        break;

      // The round is finished. Wait for restart
      case ROUND_FINISHED:
        if (t >= world.r_timer) {
          gameloop.ontick = null;
          gameloop.kill();
          load_map(null, true, function() {
            var t = 0;
            for(var id in sockets) {
              var conn = sockets[id];
              if (conn.state == JOINED) {
                conn.emit('world_reconnect'); // FIX
                conn.set_state(HANDSHAKING);
              }
            }
          });
        }
        break;
    }
  }

  /**
   *  Broadcasts a game message to all current connections. Broadcast always
   *  set's message priority to HIGH.
   *  @param {String} msg The message to broadcast.
   *  @return {undefined} Nothing
   */
  /*function broadcast() {
    var msg = Array.prototype.slice.call(arguments);
    for(var id in connections) {
      connections[id].queue(msg);
    }
  }*/

  /**
   *  Broadcast, but calls specified callback for each connection
   *  @param {Array} msg The message to broadcast.
   *  @param {Function} callback A callback function to call for each connection
   *  @return {undefined} Nothing
   */
  /*function broadcast_each(msg, callback) {
    for(var id in connections) {
      var conn = connections[id];
      if (conn.state == JOINED) {
        var prio = callback(msg, conn);
        if (prio) conn.queue(msg);
      }
    }
  }*/

  /**
   *  pad single digit numbers with leading zero
   *  @param {Integer} Number
   *  @return {String} padded number
   */
  function pad0 (num) {
    return (num < 10)
      ? '0'+num
      : num;
  }

  /**
   *  Prints a system message on the console.
   *  @param {String} msg The message to print .
   *  @return {undefined} Nothing
   */
  function log(msg) {
    var now = new Date();
    sys.puts(pad0(now.getHours()) + ':' + pad0(now.getMinutes()) + ':' +
             pad0(now.getSeconds()) + ' ' + options.name + ': ' + msg);
  }

  /**
   *  Load a map
   *  @param path {String} path to map.
   *  @param default_on_fail {Boolean} loads the default map if the specified
   *                                   map failed to load.
   *  @return {undefined} Nothing
   */
  function load_map(path, default_on_fail, callback) {
    var map_path = path;

    function done(err, map_data) {
      if (!map_data && default_on_fail) {
        map_data = DEFAULT_MAP;
      }

      if (map_data) {

        if (gameloop) {
          gameloop.ontick = null;
          gameloop.kill();
        }

        world.build(map_data, get_rules(DEFAULT_OPTIONS, map_data.rules || {},
                                                                options.rules));

        if (gameloop) {
          gameloop = new GameLoop();
          gameloop.ontick = gameloop_tick;
          gameloop.start();
        }

      }
      callback(err);
    }

    if (!map_path) {
      if (maps.length == 0) {
        done(null, DEFAULT_MAP);
        return;
      } else {
        if (next_map_index >= maps.length) {
          next_map_index = 0;
        }
        map_path = maps[next_map_index];
        next_map_index++;
      }
    }

    fs.readFile(map_path, function (err, data) {
      if (err) {
        done('Failed to read map: ' + err);
        return;
      }
      try {
        done(null, JSON.parse(data));
      } catch(e) {
        done('Map file is invalid, bad format');
        return;
      }
    });
  }

  load_map(null, true, function(err) {
    sys.puts('Starting Game Server server at ' + shared.get_state().game_server_url);
  });

  return world;
}

/**
 *  Filters all rules from a options dict
 *  @param {Object} options A option set
 *  @return {Object} All rules that was found in the specifed option set.
 */
function get_rules(default_rules, map_rules, user_rules) {
  var rules = {};
  for (var option in default_rules) {
    var match = option.match(/^r_([a-z_]+)/);
    if (match) {
      rules[match[1]] = default_rules[option];
    }
  }
  return mixin(rules, mixin(map_rules, user_rules));
}


/**
 *  Parses and returns server options from ARGV.
 *  @returns {Options} Server options.
 */
function parse_options() {
  var parser  = new optparse.OptionParser(SWITCHES),
      result = { rules: {}, maps: []};
  parser.banner = 'Usage: wpilots.js [options]';

  parser.on('help', function() {
    sys.puts(parser.toString());
    parser.halt();
  });

  parser.on('map', function(prop, value) {
    result.maps.push(value);
  });

  parser.on('*', function(opt, value) {
    var match = opt.match(/^r_([a-z_]+)/);
    if (match) {
      result.rules[match[1]] = value;
    }
    result[opt] = value || true;
  });

  parser.parse(process.ARGV);
  return parser._halt ? null : mixin(DEFAULT_OPTIONS, result);
}

function get_unique_name(players, player_id, name) {
  var count = 0;
  var unique_name = name;
  while (true) {
    for (var id in players) {
      if (player_id == id) {
        continue;
      }
      if (players[id].name != unique_name) {
        return unique_name;
      }
      count++;
    }
    if (count == 0) {
      return name;
    }
    unique_name += '_';
  }
}

/**
 *  Returns a packet vector
 */
function pack_vector(v) {
  return [round_number(v[0], 2), round_number(v[1], 2)];
}

/**
 *  Returns current time stamp
 */
function get_time() {
  return new Date().getTime();
}

/**
 *  Quick'n'dirty mixin replacement
 */
function mixin(a, b) {
  var result = {}

  for (var prop in a) {
    result[prop] = a[prop];
  }

  for (var prop in b) {
    result[prop] = b[prop];
  }

  return result;
}

function log(msg) {
  var now = new Date();
  sys.puts(pad0(now.getHours()) + ':' + pad0(now.getMinutes()) + ':' +
           pad0(now.getSeconds()) + ' ' + msg);
}

function pad0 (num) {
  return (num < 10)
    ? '0'+num
    : num;
}

// Call programs entry point
main();
