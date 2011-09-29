var io = require('socket.io');

var gameserver = exports;

gameserver.init = function(webserver) {
  io = io.listen(webserver);
  return io;
};