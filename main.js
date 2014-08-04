// VoteServ - standalone irc vote bot written in node.js
var log = require('log-simple')({init: false});

var VERSION = '0.2.0';

log.info('VoteServ v' + VERSION + ' starting...');
log.info('Written with lots of <3 for brenden');

// parse config
var config = require('./config.json');
if (config && config.network
  && config.network.address && config.network.port && config.network.channels
  && config.network.nick) {
    log.info('Loaded config from config.json -', JSON.stringify(config));
} else {
  log.error('Invalid config, see README.md');
  process.exit(1);
}

// irc library
var coffea = require('coffea'),
    net    = require('net');

// connect to server
var stream = net.connect({
  port: config.network.port,
  host: config.network.address
});
var client = coffea(stream);

// set nick and user information
client.nick(config.network.nick);
client.user(config.network.nick, config.network.nick);

// bot is connected to network, (identify and) join channels
client.on('motd', function (motd) {
  if (config.network.nickserv) {
    client.send('NickServ', 'IDENTIFY ' + config.network.nickserv);
  }

  client.join(config.network.channels);
});

// bot begins here

var votes = {};

// parse "!voteACTION USER" and "!vote ACTION USER" commands
// e.g. !voteban brenden
function parseVote(event, cmd, args) {
  if (!cmd) cmd = args.shift();
  if (args.length > 0) {
    var votefor = cmd + '_' + args[0];
    var user = event.user.getNick(); // TODO: get NickServ account
    votes[votefor] = votes[votefor] || [];

    if (votes[votefor].indexOf(user) > -1) {
      client.send(event.channel ? event.channel : event.user,
        'You already voted to \x02' + cmd + '\x02 \x02' + args[0] +
        '\x02. (Votes: \x02' + votes[votefor].length + '\x02)');
      return;
    }

    log.debug(user, 'voted to', cmd, args[0]);
    votes[votefor].push(user);

    client.send(event.channel ? event.channel : event.user,
      user + ' voted to \x02' + cmd + '\x02 \x02' + args[0] +
      '\x02. (Votes: \x02' + votes[votefor].length + '\x02)');
  } else {
    client.send(event.channel ? event.channel : event.user,
      'Not enough arguments.');
  }

  // TODO: special votes, like voteban/votekline
  switch (cmd) {
    //case 'kline':
    //  if (args.length >= 1) {
    //    log.debug(event.user.getNick(), 'voted to kline', args[0]);
    //  } else {
    //    client.send(event.channel ? event.channel : event.user,
    //        'Not enough arguments.');
    //  }
    //break;
  }

  return;
}

function parseCommand(event, cmd, args) {
  if (cmd.substr(0, 4) == "vote") return parseVote(event, cmd.substr(4), args);
  else {
    switch (cmd) {
      case 'who':
      case 'whovoted':
        if (args.length > 1) {
          // !who (voted) (to) ACTION USER
          if ((args.length > 2) && (args[0] == 'voted')) args.shift();
          // !whovoted (to) ACTION USER
          if ((args.length > 2) && (args[0] == 'to')) args.shift();

          // store vote with key ACTION_USER
          var votefor = args[0] + '_' + args[1];
          if (votes[votefor]) {
            var whovoted = votes[votefor].join(', ');
            client.send(event.user,
              'The following people voted to \x02' + args[0] + '\x02 \x02' +
              args[1] + '\x02: ' + whovoted +
              '. (Votes: \x02' + votes[votefor].length + '\x02)');
          } else client.send(event.channel ? event.channel : event.user,
            'No votes to \x02' + args[0] + '\x02 \x02' + args[1] + '\x02.');
        } else {
          client.send(event.channel ? event.channel : event.user,
            'Not enough arguments.');
        }
      break;
    }
    return;
  }
}

// parse channel messages
client.on('message', function(event) {
  if (event.message.substr(0, 1) == '!') { // prefix parsing
    var args = event.message.substr(1).split(' ');
    var cmd = args.shift();
    return parseCommand(event, cmd, args.length > 0 ? args : []);
  }
});

// parse private messages
client.on('privatemessage', function(event) {
  var args = event.message.split(' ');
  var cmd = args.shift();
  return parseCommand(event, cmd, args.length > 0 ? args : []);
});
