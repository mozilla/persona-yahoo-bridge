/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint esnext:true */

/* This file is the "heartbeat" activity, which simulates the process of a
 * our monitoring system checking for a heartbeat */

const
client = require('../client'),
request = require('request'),
winston = require('winston');

// Once ever 5 minutes
exports.probability = (30 / 40.0);

var debug = false;

exports.startFunc = function (cfg, cb) {

  var the_url = client.url('/__heartbeat__', cfg);
  request.get({
    url: the_url
  }, function (err, r, body) {
    if (err) {
        cb(err);
    } else if (r.statusCode !== 200) {
        cb("Non 200 status code " + r.statusCode);
    } else if ('ok' !== body.trim()) {
      cb('Unexpected output [' + body + ']');
    } else {
        cb(null);
    }
  });
};

if (require.main === module) {
  debug = true;

  exports.startFunc({base: 'https://127.0.0.1'}, function (err) {
    if (err) {
      console.log('Finished with ERROR');
      console.error(err);
    } else {
      console.log('Finished OK');
    }
  });
}