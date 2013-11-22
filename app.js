var Imap = require('imap'),
  inspect = require('util').inspect,
  connect = require('connect'),
  io = require('socket.io').listen(3001),
  port = 3000;
var fs = require('fs'),
  util = require('util'),
  fileStream;

var app = connect.createServer(
  connect.static(__dirname + '/public')
).listen(port);
console.log('the server is running on port ' + port);
var imap = new Imap({
  user: '',
  password: '',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: false
  }
});

var data = [];

// io.set('log level', 2);
// io.sockets.on('connection', function(socket) {
//     imap.connect();
//     console.log('sending data to user');
// });

io.set('log level', 2);
io.sockets.on('connection', function(socket) {
  imap.connect();
  util.log('Ooooooh, someone just poked me :)');
});

function openInbox(cb) {
  imap.openBox('INBOX', false, cb);
}

imap.once('ready', function() {
  openInbox(function(err, box) {
    if (err) throw err;
    imap.search([
      ['HEADER', 'SUBJECT', '[event]'],
      ['SINCE', 'May 20, 2013']
    ], function(err, results) { // results are mail ID
      if (err) {
        console.log('you are already up to date');
      }
      var f = imap.fetch(results, {
        bodies: 'HEADER.FIELDS (SUBJECT DATE TEXT)',
        struct: true
      });
      f.on('message', function(msg, seqno) {
        // console.log('Message #%d', seqno);
        var prefix = '(#' + seqno + ') ';
        msg.on('body', function(stream, info) {
          var buffer = '';
          stream.on('data', function(chunk) {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', function() {
            var shit = inspect(Imap.parseHeader(buffer));
            // console.log(inspect(Imap.parseHeader(buffer)));
            // console.log('one down');
            // data.push(shit);
            // console.log(data);
            io.sockets.emit('data', inspect(Imap.parseHeader(buffer)));
          });
        });
        // msg.once('attributes', function(attrs) {
        //   console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
        // });
        msg.once('end', function() {
          // console.log(prefix + 'Finished');
        });
      });
      f.once('error', function(err) {
        // console.log('Fetch error: ' + err);
      });
      f.once('end', function() {
        console.log('Done fetching all messages!');
        imap.end();
      });
    });
  });

  imap.once('error', function(err) {
    console.log(err);
  });

  imap.once('end', function() {
    console.log('Connection ended');
  });
});

// imap.connect();