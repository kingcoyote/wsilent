var http = require('http'),
  url = require('url'),
  sys = require('sys'),
  fs  = require('fs');

var httpserver = exports;

httpserver.init = function(options) {
  var server;
  httpserver.options = options;
  sys.puts('Starting HTTP Server at http://' + options.host + ':' + options.http_port);
  server = http.createServer(httpserver.handler);
  server.listen(parseInt(options.http_port), options.host);
  return server;
};

httpserver.handler = function(req, res) {
  var pathname, mime, encoding,
    mime_types = { 
      "plain" : "text/plain",
      ".ogg"  : "application/ogg",
      ".js"   : "application/javascript",
      ".xml"  : "application/xml",
      ".html" : "text/html",
      ".png"  : "image/png",
      ".css"  : "text/css",
      ".swf"  : "application/x-shockwave-flash"
    };
  
  if(req.method === "GET" || req.method == "HEAD") {
    
    pathname = url.parse(req.url).pathname;
    if(pathname == '/') {
      pathname = httpserver.options.default_page; 
    }
    
    mime = mime_types[/\.[-a-zA-Z0-9]+$/.exec(pathname)[0]];
    
    if( ! mime) {
      mime = mime_types.plain;
    }
    
    encoding = mime.slice(0,4) === 'text' ? 'utf8' : 'binary';
    
    fs.readFile(
      httpserver.options.dirname + pathname,
      encoding,
      function(err, data) {
        var headers = [];
        if(err) {
          res.writeHead(500);
          return res.end('Error loading ' + pathname);
        }
        
        headers.push(['Content-Type', mime]);
        headers.push(['Content-Length', data.length]);
        
        res.writeHead(200, headers);
        res.write(data, encoding);
        res.end();
      }
    );
  }
};