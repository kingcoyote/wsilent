// Power up codes
POWERUP_SPREAD  = 1, //POWERUP
POWERUP_RAPID   = 2,
POWERUP_RICO    = 4;

OP_PLAYER_SPAWN       = 1;
OP_PLAYER_DIE         = 2;
OP_PLAYER_STATE       = 3;
OP_PLAYER_INFO        = 4;
OP_PLAYER_FIRE        = 5;
OP_PLAYER_CONNECT     = 6;
OP_PLAYER_DISCONNECT  = 7;
OP_POWERUP_SPAWN      = 8;
OP_POWERUP_DIE        = 9;
OP_ROUND_STATE        = 10;
OP_PLAYER_SAY         = 11;

OP_REQ_SERVER_INFO    = 10;
OP_SERVER_INFO        = 11;
OP_SERVER_EXEC_RESP   = 12;
OP_DISCONNECT_REASON  = 13;
OP_WORLD_DATA         = 14;
OP_WORLD_STATE        = 15;
OP_WORLD_RECONNECT    = 16;
OP_CLIENT_CONNECT     = 17;
OP_CLIENT_JOIN        = 18;
OP_CLIENT_STATE       = 19;
OP_CLIENT_SET         = 20;
OP_CLIENT_EXEC        = 21;
OP_CLIENT_SAY         = 22;

// Packet types
GAME_PACKET     = 2;
PING_PACKET     = 1;

// Player action
THRUST      = 1,
    SHOOT       = 2,
    SHIELD      = 4;

// World round states
ROUND_WARMUP  = 1,
    ROUND_STARTING = 2,
    ROUND_RUNNING  = 3,
    ROUND_FINISHED = 4;

ROUND_START_DELAY = 400,
    ROUND_NEXT_MAP_DELAY = 800,
    ROUND_WARMUP_RESPAWN_DELAY = 300;

// World timer related constants
DT = 0.017,
    MILLI_STEP = 16,
    TIME_STEP = MILLI_STEP / 1000,
    ITERATIONS = 10;

GRID_CELL_SIZE = 250;

BLOCK_SPACING = 50,
    BLOCK_WIDTH   = GRID_CELL_SIZE - (BLOCK_SPACING * 2),
    BLOCK_HEIGHT  = GRID_CELL_SIZE - (BLOCK_SPACING * 2);

BLOCK_CONNECTOR_NORTH = 0x01,
    BLOCK_CONNECTOR_EAST  = 0x02,
    BLOCK_CONNECTOR_SOUTH = 0x04,
    BLOCK_CONNECTOR_WEST  = 0x08;

SHIP_WIDTH = 9,
    SHIP_HEIGHT = 20,
    SHIP_ROTATION_SPEED = 4,
    SHIP_RELOAD_SPEED = 50,
    SHIP_MAX_SPEED = 200,
    SHIP_ACCELERATION_SPEED = 300,
    RBULLET_LIFETIME = 250;

DEATH_CAUSE_KILLED = 1,
    DEATH_CAUSE_SUICDE = 2;

TILE_CBLOCK         = 11,
    TILE_BLOCK          = 12,
    TILE_PLAYER_SPAWN   = 51,
    TILE_POWERUP_SPAWN  = 52;

CC = 1;