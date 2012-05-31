/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Original code via mozilla/browserid/test/lib/start-stop.js

const
assert = require('assert'),
config = require('../../lib/configuration.js'),
events = require('events'),
fs = require('fs'),
path = require('path'),
request = require('request'),
spawn = require('child_process').spawn,
util = require('util');

var proc;

process.on('exit', function () {
  if (proc) { proc.kill(); }
});

exports.browserid = new events.EventEmitter();

function setupProc(proc) {
  var m, sentReady = false;

  proc.stdout.on('data', function(buf) {
    buf.toString().split('\n').forEach(function(x) {
      if (process.env.LOG_TO_CONSOLE || /^.*error.*:/.test(x)) {
        var line = x.toString().trim();
        if (line.length) {
          console.log(x);
        }
      }
      if (!sentReady && /Everyone is welcome in the Persona ID Big Tent/g.test(x)) {
        exports.browserid.emit('ready');
        sentReady = true;
      }
    });
  });
  proc.stderr.on('data', function(x) {
    if (process.env.LOG_TO_CONSOLE) { console.log(x.toString()); }
  });
}

// TODO search available range
var port = exports.port = 3031;
var base_url = exports.base_url = util.format('http://127.0.0.1:%d', port);

process.env.PORT = port;
process.env.CONFIG_FILES = 'config/test.json';

var _startupBatch = {
  "run the server": {
    topic: function() {
      var pathToHarness = path.join(__dirname, '..', '..', 'bin', 'bigtent');
      proc = spawn('node', [ pathToHarness ]);
      setupProc(proc);
      exports.browserid.on('ready', this.callback);
    },
    "server should be running": {
      topic: function () {
        console.log('callback, hitting it');
        request(base_url + '/__heartbeat__', this.callback);
      },
      "Server has a hearthbeat": function (err, r, body) {
        assert.isNull(err);
        assert.isNotNull(r);
        assert.equal(r.statusCode, 200);
        assert.equal(r.body, 'ok');
      }
    }
  }
};

exports.addStartupBatches = function(suite) {
  // disable vows (often flakey?) async error behavior
  suite.options.error = false;

  suite.addBatch(_startupBatch);
};

exports.addRestartBatch = function(suite) {
  // stop the server
  suite.addBatch({
    "stop the server": {
      topic: function() {
        var cb = this.callback;
        proc.kill('SIGINT');
        proc.on('exit', this.callback);
      },
      "stopped": function(x) {
        // Currently we don't catch a SIGINT and exist gracefully
        assert.strictEqual(x, 1);
      }
    }
  });
  suite.addBatch(_startupBatch);
};

exports.addShutdownBatches = function(suite) {
  // stop the server
  suite.addBatch({
    "stop the server": {
      topic: function() {
        var cb = this.callback;
        proc.kill('SIGINT');
        proc.on('exit', this.callback);
      },
      "stopped": function(x) {
        assert.strictEqual(x, 1);
      }
    }
  });
};
