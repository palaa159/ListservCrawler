var connect = require('connect'),
	fs = require('fs'),
	util = require('util'),
	io = require('socket.io').listen(9001), // WS port
	port = 9000;

	var Imap = require('imap'),
    inspect = require('util').inspect;

var data = [];
// SET COLOR THEMES –––––––––––––––––––––––––––––––––––––––––––––––


// END OF COLOR THEMES –––––––––––––––––––––––––––––––––––––––––––––––

// SETTING UP WEB SERVER –––––––––––––––––––––––––––––––––––––––––––––

connect.createServer(
	connect.static(__dirname + '/public') // two underscores
).listen(port);
util.log('the server is running on port: ' + port);

// END OF WEB SERVER –––––––––––––––––––––––––––––––––––––––––––––––
var imap = new Imap({
  user: 'palaa159@newschool.edu',
  password: 'Q!w2e3r4t5',
  host: 'imap.gmail.com',
  port: 993,
  tls: true
});

var fs = require('fs'),
  fileStream;

function openInbox(cb) {
  imap.openBox('INBOX', false, cb);
}

imap.once('ready', function() {
  openInbox(function(err, box) {
    if (err) throw err;
    imap.search([
      ['HEADER', 'SUBJECT', '[event]'],['SINCE', 'May 20, 2013']
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
            console.log(inspect(Imap.parseHeader(buffer)));
            console.log('one down');
            data.push(inspect(Imap.parseHeader(buffer)));
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

imap.connect();

// SOCKET.IO –––––––––––––––––––––––––––––––––––––––––––––––
io.set('log level', 2);
io.sockets.on('connection', function(socket) {
  util.log('Ooooooh, someone just poked me :)');
  socket.emit('data', data);
});

// END OF S.IO –––––––––––––––––––––––––––––––––––––––––––––––
