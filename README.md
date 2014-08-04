VoteServ
========

_standalone irc vote bot written in node.js_


Requirements
------------

You need to have node.js and npm installed.


Installation
------------

Download VoteServ from github: `git clone https://github.com/omnidan/VoteServ`.

Install dependencies: Run `npm install` in the VoteServ directory.


Configuration
-------------

Now create a `config.json` file in the VoteServ directory. It should look like
the example below. More networks can be added. (Config is JSON format)
```
{
  "network": {
    "address": "localhost",
    "port": 6667,
    "channels": ["#lounge"],
    "nick": "VoteServ",
    "admin": "dan"
  }
}
```


Running
-------

Simply run `node main.js` and the bot should connect to the configured networks.
