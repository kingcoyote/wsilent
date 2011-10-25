var io = require('socket.io');

var gameserver = exports;

gameserver.init = function(webserver) {
  io = io.listen(webserver);
  
  io.configure(function(){
    io.set('log level', 1);
  });
  
  return io;
};